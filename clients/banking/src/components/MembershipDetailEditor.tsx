import { AsyncData, Future, Option, Result } from "@swan-io/boxed";
import { Box } from "@swan-io/lake/src/components/Box";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { Space } from "@swan-io/lake/src/components/Space";
import { backgroundColor } from "@swan-io/lake/src/constants/design";
import { useUrqlMutation } from "@swan-io/lake/src/hooks/useUrqlMutation";
import { showToast } from "@swan-io/lake/src/state/toasts";
import { CountryPicker } from "@swan-io/shared-business/src/components/CountryPicker";
import { GMapAddressSearchInput } from "@swan-io/shared-business/src/components/GMapAddressSearchInput";
import { CountryCCA3, countries } from "@swan-io/shared-business/src/constants/countries";
import dayjs from "dayjs";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { combineValidators, hasDefinedKeys, useForm } from "react-ux-form";
import { Rifm } from "rifm";
import { P, match } from "ts-pattern";
import {
  AccountMembershipFragment,
  ResumeAccountMembershipDocument,
  SuspendAccountMembershipDocument,
  UpdateAccountMembershipDocument,
} from "../graphql/partner";
import { locale, rifmDateProps, t } from "../utils/i18n";
import { projectConfiguration } from "../utils/projectId";
import { Router } from "../utils/routes";
import {
  validateAddressLine,
  validateRequired,
  validateTaxIdentificationNumber,
} from "../utils/validations";
import { MembershipCancelConfirmationModal } from "./MembershipCancelConfirmationModal";
import { MembershipInvitationLinkModal } from "./MembershipInvitationLinkModal";

const styles = StyleSheet.create({
  buttonGroup: {
    backgroundColor: backgroundColor.default,
    position: "sticky",
    bottom: 0,
  },
});

type AllowedStatuses =
  | "AccountMembershipConsentPendingStatusInfo"
  | "AccountMembershipDisabledStatusInfo"
  | "AccountMembershipEnabledStatusInfo"
  | "AccountMembershipInvitationSentStatusInfo"
  | "AccountMembershipSuspendedStatusInfo"
  | "AccountMembershipBindingUserErrorStatusInfo";

type Props = {
  accountCountry: CountryCCA3;
  editingAccountMembershipId: string;
  editingAccountMembership: AccountMembershipFragment & {
    statusInfo: {
      __typename: AllowedStatuses;
    };
  };
  currentUserAccountMembershipId: string;
  currentUserAccountMembership: AccountMembershipFragment;
  onRefreshRequest: () => void;
  showInvitationLink: boolean;
  large: boolean;
};

export const MembershipDetailEditor = ({
  editingAccountMembership,
  editingAccountMembershipId,
  currentUserAccountMembership,
  currentUserAccountMembershipId,
  accountCountry,
  onRefreshRequest,
  showInvitationLink,
  large,
}: Props) => {
  const [isCancelConfirmationModalOpen, setIsCancelConfirmationModalOpen] = useState(false);
  const [membershipUpdate, updateMembership] = useUrqlMutation(UpdateAccountMembershipDocument);
  const [membershipSuspension, suspendMembership] = useUrqlMutation(
    SuspendAccountMembershipDocument,
  );
  const [membershipUnsuspension, unsuspendMembership] = useUrqlMutation(
    ResumeAccountMembershipDocument,
  );

  const isEditingCurrentUserAccountMembership =
    currentUserAccountMembership.id === editingAccountMembership.id;

  const { Field, FieldsListener, setFieldValue, submitForm } = useForm({
    email: {
      initialValue: editingAccountMembership.email,
      validate: validateRequired,
    },
    lastName: {
      initialValue: match(editingAccountMembership)
        .with(
          {
            statusInfo: {
              __typename: P.union(
                "AccountMembershipInvitationSentStatusInfo",
                "AccountMembershipBindingUserErrorStatusInfo",
              ),
            },
          },
          accountMembership => accountMembership.statusInfo.restrictedTo.lastName,
        )
        .with({ user: { lastName: P.string } }, ({ user }) => user.lastName)
        .otherwise(() => ""),
      validate: validateRequired,
    },
    firstName: {
      initialValue: match(editingAccountMembership)
        .with(
          {
            statusInfo: {
              __typename: P.union(
                "AccountMembershipInvitationSentStatusInfo",
                "AccountMembershipBindingUserErrorStatusInfo",
              ),
            },
          },
          accountMembership => accountMembership.statusInfo.restrictedTo.firstName,
        )
        .with({ user: { firstName: P.string } }, ({ user }) => user.firstName)
        .otherwise(() => ""),
      validate: validateRequired,
    },
    birthDate: {
      initialValue: match(editingAccountMembership)
        .with(
          {
            statusInfo: {
              __typename: P.union(
                "AccountMembershipInvitationSentStatusInfo",
                "AccountMembershipBindingUserErrorStatusInfo",
              ),
            },
          },
          accountMembership =>
            dayjs(accountMembership.statusInfo.restrictedTo.birthDate).format(locale.dateFormat),
        )
        .with({ user: { birthDate: P.string } }, ({ user }) =>
          dayjs(user.birthDate).format(locale.dateFormat),
        )
        .otherwise(() => ""),
    },
    phoneNumber: {
      initialValue: match(editingAccountMembership)
        .with(
          {
            statusInfo: {
              __typename: P.union(
                "AccountMembershipInvitationSentStatusInfo",
                "AccountMembershipBindingUserErrorStatusInfo",
              ),
            },
          },
          accountMembership => accountMembership.statusInfo.restrictedTo.phoneNumber,
        )
        .with({ user: { mobilePhoneNumber: P.string } }, ({ user }) => user.mobilePhoneNumber)
        .otherwise(() => ""),
      validate: validateRequired,
    },
    // German account specific fields
    addressLine1: {
      initialValue: editingAccountMembership.residencyAddress?.addressLine1 ?? "",
      validate: combineValidators(validateRequired, validateAddressLine),
    },
    postalCode: {
      initialValue: editingAccountMembership.residencyAddress?.postalCode ?? "",
      validate: validateRequired,
    },
    city: {
      initialValue: editingAccountMembership.residencyAddress?.city ?? "",
      validate: validateRequired,
    },
    country: {
      initialValue:
        (editingAccountMembership.residencyAddress?.country as CountryCCA3 | null | undefined) ??
        accountCountry ??
        "FRA",
      validate: validateRequired,
    },
    taxIdentificationNumber: {
      initialValue: editingAccountMembership.taxIdentificationNumber ?? "",
      strategy: "onBlur",
      validate: (value, { getFieldState }) => {
        return match({ accountCountry, residencyAddressCountry: getFieldState("country").value })
          .with({ accountCountry: "DEU", residencyAddressCountry: "DEU" }, () =>
            validateTaxIdentificationNumber(value),
          )
          .otherwise(() => {});
      },
      sanitize: value => value.trim(),
    },
  });

  const onPressSave = () => {
    submitForm(values => {
      const restrictedTo = match({
        values,
        editingAccountMembership,
        isEditingCurrentUser: currentUserAccountMembership.id == editingAccountMembership.id,
      })
        .with(
          {
            values: P.union(
              { firstName: P.string },
              { lastName: P.string },
              { phoneNumber: P.string },
              { birthDate: P.string },
            ),
            editingAccountMembership: {
              statusInfo: {
                __typename: P.union(
                  "AccountMembershipInvitationSentStatusInfo",
                  "AccountMembershipBindingUserErrorStatusInfo",
                  "AccountMembershipEnabledStatusInfo",
                ),
              },
            },
            isEditingCurrentUser: false,
          },
          () => ({
            firstName: values.firstName,
            lastName: values.lastName,
            phoneNumber: values.phoneNumber,
            birthDate:
              values.birthDate != null
                ? dayjs(values.birthDate, locale.dateFormat, true).format("YYYY-MM-DD")
                : undefined,
          }),
        )
        .otherwise(() => undefined);

      updateMembership({
        input: {
          accountMembershipId: editingAccountMembershipId,
          consentRedirectUrl:
            window.location.origin +
            Router.AccountMembersDetailsRoot({
              accountMembershipId: currentUserAccountMembershipId,
              editingAccountMembershipId,
            }),
          email: values.email,
          residencyAddress: hasDefinedKeys(values, [
            "addressLine1",
            "city",
            "postalCode",
            "country",
          ])
            ? {
                addressLine1: values.addressLine1,
                city: values.city,
                postalCode: values.postalCode,
                country: values.country,
              }
            : undefined,
          restrictedTo,
          taxIdentificationNumber: values.taxIdentificationNumber,
        },
      })
        .mapOkToResult(({ updateAccountMembership }) => {
          return match(updateAccountMembership)
            .with(
              { __typename: "UpdateAccountMembershipSuccessPayload" },
              ({ consent: { consentUrl } }) => Result.Ok(consentUrl),
            )
            .otherwise(error => Result.Error(error));
        })
        .tapOk(consentUrl => {
          window.location.replace(consentUrl);
        })
        .tapError(() => {
          showToast({ variant: "error", title: t("error.generic") });
        });
    });
  };

  const onPressSuspend = () => {
    suspendMembership({
      input: {
        accountMembershipId: editingAccountMembershipId,
      },
    })
      .mapOkToResult(({ suspendAccountMembership }) => {
        return match(suspendAccountMembership)
          .with({ __typename: "SuspendAccountMembershipSuccessPayload" }, () =>
            Result.Ok(undefined),
          )
          .otherwise(error => Result.Error(error));
      })
      .tapOk(() => {
        onRefreshRequest();
      })
      .tapError(() => {
        showToast({ variant: "error", title: t("error.generic") });
      });
  };

  const onPressUnsuspend = () => {
    unsuspendMembership({
      input: {
        accountMembershipId: editingAccountMembershipId,
        consentRedirectUrl:
          window.location.origin +
          Router.AccountMembersDetailsRoot({
            accountMembershipId: currentUserAccountMembershipId,
            editingAccountMembershipId,
          }),
      },
    })
      .mapOkToResult(({ resumeAccountMembership }) => {
        return match(resumeAccountMembership)
          .with(
            { __typename: "ResumeAccountMembershipSuccessPayload" },
            ({ consent: { consentUrl } }) => Result.Ok(consentUrl),
          )
          .otherwise(error => Result.Error(error));
      })
      .tapOk(consentUrl => {
        window.location.replace(consentUrl);
      })
      .tapError(() => {
        showToast({ variant: "error", title: t("error.generic") });
      });
  };

  const [invitationSending, setInvitationSending] = useState<
    AsyncData<Result<undefined, undefined>>
  >(AsyncData.NotAsked());

  const sendInvitation = () => {
    setInvitationSending(AsyncData.Loading());
    const request = Future.make<Result<undefined, undefined>>(resolve => {
      const xhr = new XMLHttpRequest();
      // TODO: oauth2
      const query = new URLSearchParams();
      query.append("inviterAccountMembershipId", currentUserAccountMembershipId);
      xhr.open(
        "POST",
        match(projectConfiguration)
          .with(
            Option.P.Some({ projectId: P.select(), mode: "MultiProject" }),
            projectId =>
              `/api/projects/${projectId}/invitation/${editingAccountMembershipId}/send?${query.toString()}`,
          )
          .otherwise(
            () => `/api/invitation/${editingAccountMembershipId}/send?${query.toString()}`,
          ),
        true,
      );

      xhr.withCredentials = true;
      xhr.responseType = "json";
      xhr.addEventListener("load", () => {
        if ((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304) {
          resolve(Result.Ok(undefined));
        } else {
          resolve(Result.Error(undefined));
        }
      });
      xhr.send(
        JSON.stringify({
          inviteeAccountMembershipId: editingAccountMembershipId,
          inviterAccountMembershipId: currentUserAccountMembershipId,
        }),
      );
      return () => {
        xhr.abort();
      };
    });

    request
      .tapError(() => {
        showToast({ variant: "error", title: t("error.generic") });
      })
      .onResolve(value => {
        setInvitationSending(AsyncData.Done(value));
      });
  };

  return (
    <>
      <Space height={24} />

      {match(editingAccountMembership)
        // Personal information are not editable while active
        .with(
          {
            statusInfo: {
              __typename: P.union(
                "AccountMembershipEnabledStatusInfo",
                "AccountMembershipSuspendedStatusInfo",
              ),
            },
            user: P.not(P.nullish),
          },
          accountMembership => (
            <>
              <LakeLabel
                label={t("membershipDetail.edit.birthDate")}
                render={id => (
                  <Rifm
                    value={
                      accountMembership.user.birthDate != null
                        ? dayjs(accountMembership.user.birthDate).format(locale.dateFormat)
                        : ""
                    }
                    onChange={() => {}}
                    {...rifmDateProps}
                  >
                    {({ value }) => <LakeTextInput id={id} readOnly={true} value={value} />}
                  </Rifm>
                )}
              />

              <LakeLabel
                label={t("membershipDetail.edit.phoneNumber")}
                render={id => (
                  <LakeTextInput
                    id={id}
                    readOnly={true}
                    placeholder="+33600000000"
                    value={accountMembership.user.mobilePhoneNumber ?? ""}
                  />
                )}
              />

              <Field name="email">
                {({ value, valid, error, onChange }) => (
                  <LakeLabel
                    label={t("membershipDetail.edit.email")}
                    render={id => (
                      <LakeTextInput
                        id={id}
                        value={value}
                        valid={valid}
                        error={error}
                        onChangeText={onChange}
                        // `email` is editable when enabled
                        readOnly={match({
                          accountMembership,
                        })
                          .with(
                            {
                              accountMembership: {
                                statusInfo: {
                                  __typename: "AccountMembershipSuspendedStatusInfo",
                                },
                              },
                            },
                            () => true,
                          )
                          .with(
                            {
                              accountMembership: {
                                statusInfo: { __typename: "AccountMembershipEnabledStatusInfo" },
                              },
                            },
                            ({ accountMembership }) => {
                              // can't edit the legal rep when you're not the legal rep
                              if (accountMembership.id !== currentUserAccountMembership.id) {
                                return accountMembership.legalRepresentative;
                              }
                              return false;
                            },
                          )
                          .exhaustive()}
                      />
                    )}
                  />
                )}
              </Field>
            </>
          ),
        )
        .with(
          {
            statusInfo: {
              __typename: P.union(
                "AccountMembershipInvitationSentStatusInfo",
                "AccountMembershipBindingUserErrorStatusInfo",
              ),
            },
          },
          ({ statusInfo }) => (
            <>
              <Field name="email">
                {({ value, valid, error, onChange }) => (
                  <LakeLabel
                    label={t("membershipDetail.edit.email")}
                    render={id => (
                      <Box direction="row">
                        <LakeTextInput
                          id={id}
                          value={value}
                          valid={valid}
                          error={error}
                          onChangeText={onChange}
                        />

                        {statusInfo.__typename === "AccountMembershipInvitationSentStatusInfo" ? (
                          <>
                            <Space width={12} />

                            {match(__env.ACCOUNT_MEMBERSHIP_INVITATION_MODE)
                              .with("EMAIL", () => (
                                <LakeButton
                                  mode="secondary"
                                  size="small"
                                  onPress={sendInvitation}
                                  disabled={value !== editingAccountMembership.email}
                                  loading={invitationSending.isLoading()}
                                  ariaLabel={t("membershipDetail.edit.resendInvitation")}
                                  icon={large ? undefined : "send-regular"}
                                >
                                  {large ? t("membershipDetail.edit.resendInvitation") : null}
                                </LakeButton>
                              ))
                              .with("LINK", () => (
                                <LakeButton
                                  mode="secondary"
                                  size="small"
                                  onPress={() =>
                                    Router.push("AccountMembersDetailsRoot", {
                                      accountMembershipId: currentUserAccountMembershipId,
                                      editingAccountMembershipId,
                                      showInvitationLink: "true",
                                    })
                                  }
                                  disabled={value !== editingAccountMembership.email}
                                  loading={invitationSending.isLoading()}
                                  ariaLabel={t("membershipDetail.edit.showLink")}
                                  icon={large ? undefined : "link-filled"}
                                >
                                  {large ? t("membershipDetail.edit.showLink") : null}
                                </LakeButton>
                              ))
                              .exhaustive()}
                          </>
                        ) : null}
                      </Box>
                    )}
                  />
                )}
              </Field>

              <Field name="lastName">
                {({ value, valid, error, onChange }) => (
                  <LakeLabel
                    label={t("membershipDetail.edit.lastName")}
                    render={id => (
                      <LakeTextInput
                        id={id}
                        value={value}
                        valid={valid}
                        error={error}
                        onChangeText={onChange}
                      />
                    )}
                  />
                )}
              </Field>

              <Field name="firstName">
                {({ value, valid, error, onChange }) => (
                  <LakeLabel
                    label={t("membershipDetail.edit.firstName")}
                    render={id => (
                      <LakeTextInput
                        id={id}
                        value={value}
                        valid={valid}
                        error={error}
                        onChangeText={onChange}
                      />
                    )}
                  />
                )}
              </Field>

              <Field name="birthDate">
                {({ value, valid, error, onChange }) => (
                  <Rifm value={value ?? ""} onChange={onChange} {...rifmDateProps}>
                    {({ value, onChange }) => (
                      <LakeLabel
                        label={t("membershipDetail.edit.birthDate")}
                        render={id => (
                          <LakeTextInput
                            id={id}
                            placeholder={locale.datePlaceholder}
                            value={value ?? ""}
                            valid={valid}
                            error={error}
                            onChange={onChange}
                          />
                        )}
                      />
                    )}
                  </Rifm>
                )}
              </Field>

              <Field name="phoneNumber">
                {({ value, valid, error, onChange }) => (
                  <LakeLabel
                    label={t("membershipDetail.edit.phoneNumber")}
                    render={id => (
                      <LakeTextInput
                        id={id}
                        placeholder="+33600000000"
                        value={value ?? ""}
                        valid={valid}
                        error={error}
                        onChangeText={onChange}
                        inputMode="tel"
                      />
                    )}
                  />
                )}
              </Field>
            </>
          ),
        )
        .otherwise(() => null)}

      {match({ accountCountry, editingAccountMembership })
        .with({ accountCountry: "DEU" }, () => (
          <>
            <Field name="country">
              {({ value, error, onChange }) => (
                <LakeLabel
                  label={t("membershipDetail.edit.country")}
                  render={id => (
                    <CountryPicker
                      id={id}
                      items={countries}
                      value={value}
                      onValueChange={onChange}
                      error={error}
                    />
                  )}
                />
              )}
            </Field>

            <FieldsListener names={["country"]}>
              {({ country }) => {
                return (
                  <Field name="addressLine1">
                    {({ value, onChange, error }) => (
                      <LakeLabel
                        label={t("cardWizard.address.line1")}
                        render={id => (
                          <GMapAddressSearchInput
                            emptyResultText={t("common.noResults")}
                            apiKey={__env.CLIENT_GOOGLE_MAPS_API_KEY}
                            placeholder={t("addressInput.placeholder")}
                            language={locale.language}
                            id={id}
                            error={error}
                            country={country.value}
                            value={value}
                            onValueChange={onChange}
                            onSuggestion={suggestion => {
                              setFieldValue("addressLine1", suggestion.completeAddress);
                              setFieldValue("city", suggestion.city);
                              setFieldValue("country", suggestion.country as CountryCCA3);
                              setFieldValue("postalCode", suggestion.postalCode);
                            }}
                          />
                        )}
                      />
                    )}
                  </Field>
                );
              }}
            </FieldsListener>

            <Field name="postalCode">
              {({ value, valid, error, onChange }) => (
                <LakeLabel
                  label={t("membershipDetail.edit.postalCode")}
                  render={id => (
                    <LakeTextInput
                      id={id}
                      value={value}
                      valid={valid}
                      error={error}
                      onChangeText={onChange}
                    />
                  )}
                />
              )}
            </Field>

            <Field name="city">
              {({ value, valid, error, onChange }) => (
                <LakeLabel
                  label={t("membershipDetail.edit.city")}
                  render={id => (
                    <LakeTextInput
                      id={id}
                      value={value}
                      valid={valid}
                      error={error}
                      onChangeText={onChange}
                    />
                  )}
                />
              )}
            </Field>

            <FieldsListener names={["country"]}>
              {({ country }) =>
                match({ accountCountry, country: country.value })
                  .with({ accountCountry: "DEU", country: "DEU" }, () => (
                    <Field name="taxIdentificationNumber">
                      {({ value, valid, error, onChange }) => (
                        <LakeLabel
                          label={t("membershipDetail.edit.taxIdentificationNumber")}
                          render={id => (
                            <LakeTextInput
                              placeholder={locale.taxIdentificationNumberPlaceholder}
                              id={id}
                              value={value}
                              valid={valid}
                              error={error}
                              onChangeText={onChange}
                            />
                          )}
                        />
                      )}
                    </Field>
                  ))
                  .otherwise(() => null)
              }
            </FieldsListener>
          </>
        ))
        .otherwise(() => null)}

      <View style={styles.buttonGroup}>
        <LakeButtonGroup>
          {match(editingAccountMembership)
            .with(
              {
                statusInfo: {
                  __typename: P.union(
                    "AccountMembershipEnabledStatusInfo",
                    "AccountMembershipInvitationSentStatusInfo",
                    "AccountMembershipBindingUserErrorStatusInfo",
                  ),
                },
              },
              () => (
                <LakeButton
                  color="current"
                  loading={membershipUpdate.isLoading()}
                  disabled={
                    isEditingCurrentUserAccountMembership &&
                    !editingAccountMembership.legalRepresentative
                  }
                  onPress={onPressSave}
                >
                  {t("common.save")}
                </LakeButton>
              ),
            )
            .otherwise(() => null)}

          {match({ isEditingCurrentUserAccountMembership, editingAccountMembership })
            .with(
              // Can't suspend yourself
              { isEditingCurrentUserAccountMembership: true },
              // Can't suspend the account legal representative
              {
                editingAccountMembership: { legalRepresentative: true },
              },
              () => null,
            )
            .with(
              {
                editingAccountMembership: {
                  statusInfo: {
                    __typename: "AccountMembershipEnabledStatusInfo",
                  },
                },
              },
              () => (
                <LakeButton
                  mode="secondary"
                  icon="lock-closed-regular"
                  loading={membershipSuspension.isLoading()}
                  onPress={onPressSuspend}
                  ariaLabel={t("membershipDetail.suspend")}
                >
                  {large ? t("membershipDetail.suspend") : null}
                </LakeButton>
              ),
            )
            .with(
              {
                editingAccountMembership: {
                  statusInfo: { __typename: "AccountMembershipSuspendedStatusInfo" },
                },
              },
              () => (
                <LakeButton
                  mode="primary"
                  icon="lock-open-filled"
                  loading={membershipUnsuspension.isLoading()}
                  onPress={onPressUnsuspend}
                  color="warning"
                  ariaLabel={t("membershipDetail.unsuspend")}
                >
                  {large ? t("membershipDetail.unsuspend") : null}
                </LakeButton>
              ),
            )
            .otherwise(() => null)}

          {match({ isEditingCurrentUserAccountMembership, editingAccountMembership })
            .with(
              // Can't remove yourself
              { isEditingCurrentUserAccountMembership: true },
              // Can't remove the account legal representative
              {
                editingAccountMembership: { legalRepresentative: true },
              },
              () => null,
            )
            .otherwise(() => (
              <LakeButton
                mode="secondary"
                icon="subtract-circle-regular"
                color="negative"
                onPress={() => setIsCancelConfirmationModalOpen(true)}
                ariaLabel={t("membershipDetail.permanentlyBlock")}
              >
                {large ? t("membershipDetail.permanentlyBlock") : null}
              </LakeButton>
            ))}
        </LakeButtonGroup>
      </View>

      <MembershipCancelConfirmationModal
        visible={isCancelConfirmationModalOpen}
        onPressClose={() => setIsCancelConfirmationModalOpen(false)}
        accountMembershipId={editingAccountMembershipId}
        onSuccess={() => {
          Router.push("AccountMembersList", {
            accountMembershipId: currentUserAccountMembershipId,
          });
          onRefreshRequest();
        }}
      />

      <MembershipInvitationLinkModal
        accountMembershipId={showInvitationLink ? editingAccountMembershipId : undefined}
        onPressClose={() =>
          Router.push("AccountMembersDetailsRoot", {
            accountMembershipId: currentUserAccountMembershipId,
            editingAccountMembershipId,
            showInvitationLink: undefined,
          })
        }
      />
    </>
  );
};
