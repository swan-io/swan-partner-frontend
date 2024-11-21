import { AsyncData, Option, Result } from "@swan-io/boxed";
import { useMutation } from "@swan-io/graphql-client";
import { Box } from "@swan-io/lake/src/components/Box";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeSelect } from "@swan-io/lake/src/components/LakeSelect";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { Space } from "@swan-io/lake/src/components/Space";
import { backgroundColor } from "@swan-io/lake/src/constants/design";
import { identity } from "@swan-io/lake/src/utils/function";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { nullishOrEmptyToUndefined } from "@swan-io/lake/src/utils/nullish";
import { pick } from "@swan-io/lake/src/utils/object";
import { trim } from "@swan-io/lake/src/utils/string";
import { Request, badStatusToError } from "@swan-io/request";
import { BirthdatePicker } from "@swan-io/shared-business/src/components/BirthdatePicker";
import { CountryPicker } from "@swan-io/shared-business/src/components/CountryPicker";
import { PlacekitAddressSearchInput } from "@swan-io/shared-business/src/components/PlacekitAddressSearchInput";
import { TaxIdentificationNumberInput } from "@swan-io/shared-business/src/components/TaxIdentificationNumberInput";
import { CountryCCA3, allCountries } from "@swan-io/shared-business/src/constants/countries";
import { showToast } from "@swan-io/shared-business/src/state/toasts";
import { translateError } from "@swan-io/shared-business/src/utils/i18n";
import { validateIndividualTaxNumber } from "@swan-io/shared-business/src/utils/validation";
import { combineValidators, useForm } from "@swan-io/use-form";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { P, match } from "ts-pattern";
import {
  AccountLanguage,
  AccountMembershipFragment,
  ResumeAccountMembershipDocument,
  SuspendAccountMembershipDocument,
  UpdateAccountMembershipDocument,
} from "../graphql/partner";
import { usePermissions } from "../hooks/usePermissions";
import { accountLanguages, locale, t } from "../utils/i18n";
import { projectConfiguration } from "../utils/projectId";
import { Router } from "../utils/routes";
import { validateAddressLine, validateName, validateRequired } from "../utils/validations";
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
  | "AccountMembershipBindingUserErrorStatusInfo"
  | "AccountMembershipConsentPendingStatusInfo"
  | "AccountMembershipDisabledStatusInfo"
  | "AccountMembershipEnabledStatusInfo"
  | "AccountMembershipInvitationSentStatusInfo"
  | "AccountMembershipSuspendedStatusInfo";

type Props = {
  accountCountry: CountryCCA3;
  editingAccountMembershipId: string;
  editingAccountMembership: AccountMembershipFragment & {
    statusInfo: { __typename: AllowedStatuses };
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
  const { canUpdateAccountMembership } = usePermissions();
  const [isCancelConfirmationModalOpen, setIsCancelConfirmationModalOpen] = useState(false);

  const [updateMembership, membershipUpdate] = useMutation(UpdateAccountMembershipDocument);
  const [suspendMembership, membershipSuspension] = useMutation(SuspendAccountMembershipDocument);
  const [unsuspendMembership, membershipUnsuspension] = useMutation(
    ResumeAccountMembershipDocument,
  );

  const isEditingCurrentUserAccountMembership =
    currentUserAccountMembership.id === editingAccountMembership.id;

  const { Field, FieldsListener, getFieldValue, setFieldValue, submitForm } = useForm({
    email: {
      initialValue: editingAccountMembership.email,
      sanitize: trim,
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
          ({ statusInfo }) => statusInfo.restrictedTo.lastName,
        )
        .with({ user: { preferredLastName: P.string } }, ({ user }) => user.preferredLastName)
        .otherwise(() => ""),
      sanitize: trim,
      validate: validateName,
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
          ({ statusInfo }) => statusInfo.restrictedTo.firstName,
        )
        .with({ user: { firstName: P.string } }, ({ user }) => user.firstName)
        .otherwise(() => ""),
      sanitize: trim,
      validate: validateName,
    },
    language: {
      initialValue: match(editingAccountMembership.language)
        .returnType<AccountLanguage>()
        .with(accountLanguages.P, identity)
        .otherwise(() => "en"),
      strategy: "onChange",
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
          ({ statusInfo }) => statusInfo.restrictedTo.birthDate ?? undefined,
        )
        .with({ user: { birthDate: P.string } }, ({ user }) => user.birthDate)
        .otherwise(() => undefined),
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
              restrictedTo: { phoneNumber: P.string },
            },
          },
          ({ statusInfo }) => statusInfo.restrictedTo.phoneNumber,
        )
        .with({ user: { mobilePhoneNumber: P.string } }, ({ user }) => user.mobilePhoneNumber)
        .otherwise(() => ""),
      sanitize: trim,
      validate: value => {
        if (
          editingAccountMembership.canInitiatePayments ||
          editingAccountMembership.canManageAccountMembership ||
          editingAccountMembership.canManageBeneficiaries
        ) {
          return validateRequired(value);
        }
      },
    },
    // German account specific fields
    addressLine1: {
      initialValue: editingAccountMembership.residencyAddress?.addressLine1 ?? "",
      sanitize: trim,
      validate: combineValidators(validateRequired, validateAddressLine),
    },
    postalCode: {
      initialValue: editingAccountMembership.residencyAddress?.postalCode ?? "",
      sanitize: trim,
      validate: validateRequired,
    },
    city: {
      initialValue: editingAccountMembership.residencyAddress?.city ?? "",
      sanitize: trim,
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
      sanitize: trim,
      validate: (value, { getFieldValue }) => {
        return match({
          accountCountry,
          country: getFieldValue("country"),
          canViewAccount: editingAccountMembership.canViewAccount,
          canInitiatePayment: editingAccountMembership.canInitiatePayments,
        })
          .with(
            P.intersection(
              { accountCountry: "DEU", country: "DEU" },
              P.union({ canViewAccount: true }, { canInitiatePayment: true }),
            ),
            ({ accountCountry }) =>
              combineValidators(
                validateRequired,
                validateIndividualTaxNumber(accountCountry),
              )(value),
          )
          .with({ accountCountry: "DEU" }, ({ accountCountry }) =>
            validateIndividualTaxNumber(accountCountry)(value),
          )
          .with({ accountCountry: "ITA", country: "ITA" }, ({ accountCountry }) =>
            validateIndividualTaxNumber(accountCountry)(value),
          )
          .otherwise(() => {});
      },
    },
  });

  const onPressSave = () => {
    submitForm({
      onSuccess: values => {
        updateMembership({
          input: {
            accountMembershipId: editingAccountMembershipId,
            language: values.language.toUndefined(),
            email: values.email.toUndefined(),
            taxIdentificationNumber: values.taxIdentificationNumber.toUndefined(),

            restrictedTo: match({
              editingAccountMembership,
              isEditingCurrentUser: currentUserAccountMembership.id === editingAccountMembership.id,
              values: Option.allFromDict(pick(values, ["firstName", "lastName", "birthDate"])).map(
                mandatoryValues => ({
                  ...mandatoryValues,
                  phoneNumber: nullishOrEmptyToUndefined(values.phoneNumber.toUndefined()),
                }),
              ),
            })
              .with(
                {
                  values: Option.P.Some(P.select()),
                  isEditingCurrentUser: false,
                  editingAccountMembership: {
                    statusInfo: {
                      __typename: P.union(
                        "AccountMembershipBindingUserErrorStatusInfo",
                        "AccountMembershipEnabledStatusInfo",
                        "AccountMembershipInvitationSentStatusInfo",
                      ),
                    },
                  },
                },
                ({ firstName, lastName, phoneNumber, birthDate }) => ({
                  firstName,
                  lastName,
                  phoneNumber,
                  birthDate,
                }),
              )
              .otherwise(() => undefined),

            consentRedirectUrl:
              window.location.origin +
              Router.AccountMembersDetailsRoot({
                accountMembershipId: currentUserAccountMembershipId,
                editingAccountMembershipId,
              }),

            residencyAddress: Option.allFromDict(
              pick(values, ["addressLine1", "city", "postalCode", "country"]),
            ).toUndefined(),
          },
        })
          .mapOk(data => data.updateAccountMembership)
          .mapOkToResult(filterRejectionsToResult)
          .tapOk(({ consent: { consentUrl } }) => {
            window.location.replace(consentUrl);
          })
          .tapError(error => {
            showToast({ variant: "error", error, title: translateError(error) });
          });
      },
    });
  };

  const onPressSuspend = () => {
    suspendMembership({
      input: {
        accountMembershipId: editingAccountMembershipId,
      },
    })
      .mapOk(data => data.suspendAccountMembership)
      .mapOkToResult(filterRejectionsToResult)
      .tapOk(() => {
        onRefreshRequest();
      })
      .tapError(error => {
        showToast({ variant: "error", error, title: translateError(error) });
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
      .mapOk(data => data.resumeAccountMembership)
      .mapOkToResult(filterRejectionsToResult)
      .tapOk(({ consent: { consentUrl } }) => {
        window.location.replace(consentUrl);
      })
      .tapError(error => {
        showToast({ variant: "error", error, title: translateError(error) });
      });
  };

  const [invitationSending, setInvitationSending] = useState<
    AsyncData<Result<undefined, undefined>>
  >(AsyncData.NotAsked());

  const sendInvitation = () => {
    setInvitationSending(AsyncData.Loading());

    const query = new URLSearchParams();

    query.append("inviterAccountMembershipId", currentUserAccountMembershipId);
    query.append("lang", getFieldValue("language"));

    const url = match(projectConfiguration)
      .with(
        Option.P.Some({ projectId: P.select(), mode: "MultiProject" }),
        projectId =>
          `/api/projects/${projectId}/invitation/${editingAccountMembershipId}/send?${query.toString()}`,
      )
      .otherwise(() => `/api/invitation/${editingAccountMembershipId}/send?${query.toString()}`);

    const request = Request.make({
      url,
      method: "POST",
      withCredentials: true,
      responseType: "json",
      body: JSON.stringify({
        inviteeAccountMembershipId: editingAccountMembershipId,
        inviterAccountMembershipId: currentUserAccountMembershipId,
      }),
    })
      .mapOkToResult(badStatusToError)
      .mapOk(() => undefined)
      .mapError(() => undefined);

    request
      .tapError(error => {
        showToast({ variant: "error", error, title: t("error.generic") });
      })
      .onResolve(value => {
        showToast({
          variant: "success",
          title: t("membershipDetail.resendInvitationSuccessToast"),
        });
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
            user: P.nonNullable,
            statusInfo: {
              __typename: P.union(
                "AccountMembershipEnabledStatusInfo",
                "AccountMembershipSuspendedStatusInfo",
              ),
            },
          },
          accountMembership => {
            // `email` and `language` are editable when enabled
            const readOnly = match(accountMembership)
              .with(
                { statusInfo: { __typename: "AccountMembershipEnabledStatusInfo" } },
                ({ id }) =>
                  // can't edit the legal rep when you're not the legal rep
                  id === currentUserAccountMembership.id
                    ? false
                    : accountMembership.legalRepresentative,
              )
              .with(
                { statusInfo: { __typename: "AccountMembershipSuspendedStatusInfo" } },
                () => true,
              )
              .exhaustive();

            return (
              <>
                <BirthdatePicker
                  label={t("membershipDetail.edit.birthDate")}
                  value={accountMembership.user.birthDate ?? undefined}
                  readOnly={true}
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
                  {({ value, valid, error, onChange, ref }) => (
                    <LakeLabel
                      label={t("membershipDetail.edit.email")}
                      render={id => (
                        <LakeTextInput
                          id={id}
                          ref={ref}
                          value={value}
                          valid={valid}
                          error={error}
                          disabled={!canUpdateAccountMembership}
                          onChangeText={onChange}
                          readOnly={readOnly}
                        />
                      )}
                    />
                  )}
                </Field>

                <Field name="language">
                  {({ ref, value, onChange }) => (
                    <LakeLabel
                      label={t("membershipDetail.edit.preferredEmailLanguage")}
                      render={id => (
                        <LakeSelect
                          ref={ref}
                          id={id}
                          icon="local-language-filled"
                          items={accountLanguages.items}
                          value={value}
                          onValueChange={onChange}
                          disabled={!canUpdateAccountMembership}
                          readOnly={readOnly}
                        />
                      )}
                    />
                  )}
                </Field>
              </>
            );
          },
        )
        .with(
          {
            statusInfo: {
              __typename: P.union(
                "AccountMembershipBindingUserErrorStatusInfo",
                "AccountMembershipInvitationSentStatusInfo",
              ),
            },
          },
          ({ statusInfo }) => (
            <>
              <Field name="email">
                {({ value, valid, error, onChange, ref }) => (
                  <LakeLabel
                    label={t("membershipDetail.edit.email")}
                    render={id => (
                      <Box direction="row">
                        <LakeTextInput
                          id={id}
                          ref={ref}
                          value={value}
                          readOnly={!canUpdateAccountMembership}
                          valid={valid}
                          error={error}
                          onChangeText={onChange}
                        />

                        {statusInfo.__typename === "AccountMembershipInvitationSentStatusInfo" && (
                          <>
                            <Space width={12} />

                            {match(__env.ACCOUNT_MEMBERSHIP_INVITATION_MODE)
                              .with("EMAIL", () => (
                                <LakeButton
                                  mode="secondary"
                                  size="small"
                                  onPress={sendInvitation}
                                  disabled={
                                    value !== editingAccountMembership.email ||
                                    !canUpdateAccountMembership
                                  }
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
                                  disabled={
                                    value !== editingAccountMembership.email ||
                                    !canUpdateAccountMembership
                                  }
                                  loading={invitationSending.isLoading()}
                                  ariaLabel={t("membershipDetail.edit.showLink")}
                                  icon={large ? undefined : "link-filled"}
                                >
                                  {large ? t("membershipDetail.edit.showLink") : null}
                                </LakeButton>
                              ))
                              .exhaustive()}
                          </>
                        )}
                      </Box>
                    )}
                  />
                )}
              </Field>

              <Field name="lastName">
                {({ value, valid, error, onChange, ref }) => (
                  <LakeLabel
                    label={t("membershipDetail.edit.lastName")}
                    render={id => (
                      <LakeTextInput
                        id={id}
                        ref={ref}
                        value={value}
                        readOnly={!canUpdateAccountMembership}
                        valid={valid}
                        error={error}
                        onChangeText={onChange}
                      />
                    )}
                  />
                )}
              </Field>

              <Field name="firstName">
                {({ value, valid, error, onChange, ref }) => (
                  <LakeLabel
                    label={t("membershipDetail.edit.firstName")}
                    render={id => (
                      <LakeTextInput
                        id={id}
                        ref={ref}
                        value={value}
                        readOnly={!canUpdateAccountMembership}
                        valid={valid}
                        error={error}
                        onChangeText={onChange}
                      />
                    )}
                  />
                )}
              </Field>

              <Field name="birthDate">
                {({ value, error, onChange }) => (
                  <BirthdatePicker
                    label={t("membershipDetail.edit.birthDate")}
                    value={value}
                    error={error}
                    readOnly={!canUpdateAccountMembership}
                    onValueChange={onChange}
                  />
                )}
              </Field>

              <Field name="phoneNumber">
                {({ value, valid, error, onChange, ref }) => (
                  <LakeLabel
                    label={t("membershipDetail.edit.phoneNumber")}
                    render={id => (
                      <LakeTextInput
                        id={id}
                        ref={ref}
                        placeholder="+33600000000"
                        value={value ?? ""}
                        valid={valid}
                        error={error}
                        readOnly={!canUpdateAccountMembership}
                        onChangeText={onChange}
                        inputMode="tel"
                      />
                    )}
                  />
                )}
              </Field>

              {statusInfo.__typename === "AccountMembershipInvitationSentStatusInfo" && (
                <Field name="language">
                  {({ ref, value, onChange }) => (
                    <LakeLabel
                      label={t("membershipDetail.edit.preferredEmailLanguage")}
                      render={id => (
                        <LakeSelect
                          ref={ref}
                          id={id}
                          icon="local-language-filled"
                          items={accountLanguages.items}
                          value={value}
                          readOnly={!canUpdateAccountMembership}
                          onValueChange={onChange}
                        />
                      )}
                    />
                  )}
                </Field>
              )}
            </>
          ),
        )
        .otherwise(() => null)}

      {match(accountCountry)
        .with("DEU", "NLD", "ITA", () => (
          <>
            <Field name="country">
              {({ value, error, onChange, ref }) => (
                <LakeLabel
                  label={t("membershipDetail.edit.country")}
                  render={id => (
                    <CountryPicker
                      id={id}
                      ref={ref}
                      countries={allCountries}
                      readOnly={!canUpdateAccountMembership}
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
                          <PlacekitAddressSearchInput
                            apiKey={__env.CLIENT_PLACEKIT_API_KEY}
                            country={country.value}
                            value={value}
                            onValueChange={onChange}
                            disabled={!canUpdateAccountMembership}
                            onSuggestion={suggestion => {
                              setFieldValue("addressLine1", suggestion.completeAddress);
                              setFieldValue("city", suggestion.city);
                              setFieldValue("postalCode", suggestion.postalCode ?? "");
                            }}
                            language={locale.language}
                            placeholder={t("addressInput.placeholder")}
                            emptyResultText={t("common.noResults")}
                            error={error}
                            id={id}
                          />
                        )}
                      />
                    )}
                  </Field>
                );
              }}
            </FieldsListener>

            <Field name="postalCode">
              {({ value, valid, error, onChange, ref }) => (
                <LakeLabel
                  label={t("membershipDetail.edit.postalCode")}
                  render={id => (
                    <LakeTextInput
                      id={id}
                      ref={ref}
                      value={value}
                      valid={valid}
                      error={error}
                      onChangeText={onChange}
                      readOnly={!canUpdateAccountMembership}
                    />
                  )}
                />
              )}
            </Field>

            <Field name="city">
              {({ value, valid, error, onChange, ref }) => (
                <LakeLabel
                  label={t("membershipDetail.edit.city")}
                  render={id => (
                    <LakeTextInput
                      id={id}
                      ref={ref}
                      value={value}
                      valid={valid}
                      error={error}
                      onChangeText={onChange}
                      readOnly={!canUpdateAccountMembership}
                    />
                  )}
                />
              )}
            </Field>

            <FieldsListener names={["country"]}>
              {({ country }) =>
                match({ accountCountry, country: country.value })
                  .with(
                    { accountCountry: "DEU", country: "DEU" },
                    { accountCountry: "ITA", country: "ITA" },
                    ({ accountCountry, country }) => (
                      <Field name="taxIdentificationNumber">
                        {({ value, valid, error, onChange, ref }) => (
                          <TaxIdentificationNumberInput
                            ref={ref}
                            accountCountry={accountCountry}
                            isCompany={false}
                            value={value}
                            valid={valid}
                            error={error}
                            onChange={onChange}
                            disabled={!canUpdateAccountMembership}
                            required={match({
                              accountCountry,
                              country,
                              canViewAccount: editingAccountMembership.canViewAccount,
                              canInitiatePayment: editingAccountMembership.canInitiatePayments,
                            })
                              .with(
                                P.intersection(
                                  { accountCountry: "DEU", country: "DEU" },
                                  P.union({ canViewAccount: true }, { canInitiatePayment: true }),
                                ),
                                { accountCountry: "ITA", country: "ITA", canInitiatePayment: true },
                                () => true,
                              )
                              .otherwise(() => false)}
                          />
                        )}
                      </Field>
                    ),
                  )
                  .otherwise(() => null)
              }
            </FieldsListener>
          </>
        ))
        .otherwise(() => null)}

      <View style={styles.buttonGroup}>
        {canUpdateAccountMembership ? (
          <LakeButtonGroup paddingBottom={0}>
            {match(editingAccountMembership.statusInfo.__typename)
              .with(
                "AccountMembershipBindingUserErrorStatusInfo",
                "AccountMembershipEnabledStatusInfo",
                "AccountMembershipInvitationSentStatusInfo",
                () => (
                  <LakeButton
                    color="current"
                    loading={membershipUpdate.isLoading()}
                    onPress={onPressSave}
                    disabled={
                      isEditingCurrentUserAccountMembership &&
                      !editingAccountMembership.legalRepresentative
                    }
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
                { editingAccountMembership: { legalRepresentative: true } },
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
        ) : null}
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
