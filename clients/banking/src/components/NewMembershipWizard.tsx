import { Array, Option } from "@swan-io/boxed";
import { useMutation } from "@swan-io/graphql-client";
import { Box } from "@swan-io/lake/src/components/Box";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeLabelledCheckbox } from "@swan-io/lake/src/components/LakeCheckbox";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { breakpoints, colors, spacings } from "@swan-io/lake/src/constants/design";
import { showToast } from "@swan-io/lake/src/state/toasts";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { emptyToUndefined, isNullishOrEmpty } from "@swan-io/lake/src/utils/nullish";
import { Request, badStatusToError } from "@swan-io/request";
import { CountryPicker } from "@swan-io/shared-business/src/components/CountryPicker";
import { PlacekitAddressSearchInput } from "@swan-io/shared-business/src/components/PlacekitAddressSearchInput";
import { TaxIdentificationNumberInput } from "@swan-io/shared-business/src/components/TaxIdentificationNumberInput";
import { CountryCCA3, allCountries } from "@swan-io/shared-business/src/constants/countries";
import { translateError } from "@swan-io/shared-business/src/utils/i18n";
import { validateIndividualTaxNumber } from "@swan-io/shared-business/src/utils/validation";
import { OptionRecord, combineValidators, useForm } from "@swan-io/use-form";
import dayjs from "dayjs";
import { parsePhoneNumber } from "libphonenumber-js";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Rifm } from "rifm";
import { P, match } from "ts-pattern";
import {
  AccountCountry,
  AccountMembershipFragment,
  AddAccountMembershipDocument,
} from "../graphql/partner";
import { locale, rifmDateProps, t } from "../utils/i18n";
import { projectConfiguration } from "../utils/projectId";
import { Router } from "../utils/routes";
import {
  validateAddressLine,
  validateBirthdate,
  validateEmail,
  validateName,
  validateRequired,
} from "../utils/validations";

const styles = StyleSheet.create({
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.gray[200],
    marginHorizontal: spacings[4],
  },
  paginationDotActive: {
    backgroundColor: colors.gray[500],
  },
  fieldLarge: {
    flexBasis: "50%",
    flexShrink: 1,
    alignSelf: "stretch",
  },
  field: {
    alignSelf: "stretch",
  },
  checkboxLarge: {
    flexBasis: "50%",
    alignSelf: "stretch",
    paddingVertical: spacings[4],
  },
  checkbox: {
    alignSelf: "stretch",
    paddingVertical: spacings[4],
  },
});

const validatePhoneNumber = (value: string) => {
  try {
    // parsePhoneNumber can throw an error
    if (!parsePhoneNumber(value).isValid()) {
      return t("common.form.invalidPhoneNumber");
    }
  } catch {
    return t("common.form.invalidPhoneNumber");
  }
};

type Props = {
  accountId: string;
  accountMembershipId: string;
  accountCountry: AccountCountry;
  currentUserAccountMembership: AccountMembershipFragment;
  onSuccess: (accountMembershipId: string) => void;
  onPressCancel: () => void;
};

type Step = "Informations" | "Address";

type FormState = {
  phoneNumber: string;
  email: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  canViewAccount: boolean;
  canInitiatePayments: boolean;
  canManageBeneficiaries: boolean;
  canManageAccountMembership: boolean;
  canManageCards: boolean;
  addressLine1: string;
  postalCode: string;
  city: string;
  country: CountryCCA3;
  taxIdentificationNumber: string;
};

const hasDefinedKeys = <T extends Record<string, unknown>, K extends keyof T = keyof T>(
  object: T,
  keys: K[],
): object is T & {
  [K1 in K]-?: Exclude<T[K1], undefined>;
} => keys.every(key => typeof object[key] !== "undefined");

const MANDATORY_FIELDS = [
  "phoneNumber" as const,
  "email" as const,
  "firstName" as const,
  "lastName" as const,
  "canViewAccount" as const,
  "canInitiatePayments" as const,
  "canManageBeneficiaries" as const,
  "canManageAccountMembership" as const,
];

export const NewMembershipWizard = ({
  accountId,
  accountMembershipId,
  accountCountry,
  currentUserAccountMembership,
  onSuccess,
  onPressCancel,
}: Props) => {
  const [step, setStep] = useState<Step>("Informations");
  const [partiallySavedValues, setPartiallySavedValues] = useState<Partial<FormState> | null>(null);

  const [addMember, memberAddition] = useMutation(AddAccountMembershipDocument);

  const steps: Step[] = match(accountCountry)
    .with("DEU", "NLD", () => ["Informations" as const, "Address" as const])
    .otherwise(() => ["Informations" as const]);

  const { Field, FieldsListener, setFieldValue, submitForm } = useForm<FormState>({
    phoneNumber: {
      initialValue: partiallySavedValues?.phoneNumber ?? "",
      strategy: "onSuccessOrBlur",
      sanitize: value => value.trim(),
      validate: combineValidators(validateRequired, validatePhoneNumber),
    },
    email: {
      initialValue: partiallySavedValues?.email ?? "",
      strategy: "onSuccessOrBlur",
      validate: combineValidators(validateRequired, validateEmail),
      sanitize: value => value.trim(),
    },
    firstName: {
      initialValue: partiallySavedValues?.firstName ?? "",
      strategy: "onBlur",
      validate: validateName,
      sanitize: value => value.trim(),
    },
    lastName: {
      initialValue: partiallySavedValues?.lastName ?? "",
      strategy: "onBlur",
      validate: validateName,
      sanitize: value => value.trim(),
    },
    birthDate: {
      initialValue: partiallySavedValues?.birthDate ?? "",
      strategy: "onSuccessOrBlur",
      validate: (value, { getFieldValue }) => {
        return match({
          canManageCards: getFieldValue("canManageCards"),
          canInitiatePayments: getFieldValue("canInitiatePayments"),
          canManageBeneficiaries: getFieldValue("canManageBeneficiaries"),
          canManageAccountMembership: getFieldValue("canManageAccountMembership"),
        })
          .with(
            { canInitiatePayments: true },
            { canManageBeneficiaries: true },
            { canManageAccountMembership: true },
            { canManageCards: true },
            () => {
              const validate = combineValidators(validateRequired, validateBirthdate);
              return validate(value);
            },
          )
          .otherwise(() => {
            if (value !== "") {
              return validateBirthdate(value);
            }
          });
      },
    },
    canViewAccount: {
      initialValue: partiallySavedValues?.canViewAccount ?? false,
    },
    canInitiatePayments: {
      initialValue: partiallySavedValues?.canInitiatePayments ?? false,
    },
    canManageBeneficiaries: {
      initialValue: partiallySavedValues?.canManageBeneficiaries ?? false,
    },
    canManageAccountMembership: {
      initialValue: partiallySavedValues?.canManageAccountMembership ?? false,
    },
    canManageCards: {
      initialValue: partiallySavedValues?.canManageCards ?? false,
    },
    // German account specific fields
    addressLine1: {
      initialValue: partiallySavedValues?.addressLine1 ?? "",
      validate: (value, { getFieldValue }) => {
        return match({
          accountCountry,
          canViewAccount: getFieldValue("canViewAccount"),
          canInitiatePayments: getFieldValue("canInitiatePayments"),
        })
          .with(
            P.intersection(
              { accountCountry: "NLD" },
              P.union({ canViewAccount: true }, { canInitiatePayments: true }),
            ),
            () => {
              const validate = combineValidators(validateRequired, validateAddressLine);
              return validate(value);
            },
          )
          .otherwise(() => {
            return validateAddressLine(value);
          });
      },
    },
    postalCode: {
      initialValue: partiallySavedValues?.postalCode ?? "",
      validate: (value, { getFieldValue }) => {
        return match({
          accountCountry,
          canViewAccount: getFieldValue("canViewAccount"),
          canInitiatePayments: getFieldValue("canInitiatePayments"),
        })
          .with(
            P.intersection(
              { accountCountry: "NLD" },
              P.union({ canViewAccount: true }, { canInitiatePayments: true }),
            ),
            () => {
              return validateRequired(value);
            },
          )
          .otherwise(() => undefined);
      },
    },
    city: {
      initialValue: partiallySavedValues?.city ?? "",
      validate: (value, { getFieldValue }) => {
        return match({
          accountCountry,
          canViewAccount: getFieldValue("canViewAccount"),
          canInitiatePayments: getFieldValue("canInitiatePayments"),
        })
          .with(
            P.intersection(
              { accountCountry: "NLD" },
              P.union({ canViewAccount: true }, { canInitiatePayments: true }),
            ),
            () => {
              return validateRequired(value);
            },
          )
          .otherwise(() => undefined);
      },
    },
    country: {
      initialValue: partiallySavedValues?.country ?? accountCountry ?? "FRA",
      validate: (value, { getFieldValue }) => {
        return match({
          accountCountry,
          canViewAccount: getFieldValue("canViewAccount"),
          canInitiatePayments: getFieldValue("canInitiatePayments"),
        })
          .with(
            P.intersection(
              { accountCountry: "NLD" },
              P.union({ canViewAccount: true }, { canInitiatePayments: true }),
            ),
            () => {
              return validateRequired(value);
            },
          )
          .otherwise(() => undefined);
      },
    },
    taxIdentificationNumber: {
      initialValue: partiallySavedValues?.taxIdentificationNumber ?? "",
      strategy: "onBlur",
      validate: (value, { getFieldValue }) => {
        return match({
          accountCountry,
          residencyAddressCountry: getFieldValue("country"),
          canViewAccount: getFieldValue("canViewAccount"),
          canInitiatePayments: getFieldValue("canInitiatePayments"),
        })
          .with(
            P.intersection(
              P.union({ accountCountry: "DEU", residencyAddressCountry: "DEU" }),
              P.union({ canViewAccount: true }, { canInitiatePayments: true }),
            ),
            () =>
              combineValidators(
                validateRequired,
                validateIndividualTaxNumber(accountCountry),
              )(value),
          )
          .with(
            {
              accountCountry: "DEU",
              residencyAddressCountry: "DEU",
            },
            () => validateIndividualTaxNumber(accountCountry)(value),
          )
          .otherwise(() => undefined);
      },
      sanitize: value => value.trim().replace(/\//g, ""),
    },
  });

  const onPressBack = () => {
    const currentStepIndex = steps.indexOf(step);
    const nextStep = steps[currentStepIndex - 1];
    if (nextStep != null) {
      setStep(nextStep);
    }
  };

  const filterDefinedValues = (
    values: OptionRecord<FormState>,
  ): {
    [K in keyof FormState]?: FormState[K];
  } => ({
    ...(values.addressLine1.isSome() ? { addressLine1: values.addressLine1.get() } : null),
    ...(values.birthDate.isSome() ? { birthDate: values.birthDate.get() } : null),
    ...(values.canInitiatePayments.isSome()
      ? { canInitiatePayments: values.canInitiatePayments.get() }
      : null),
    ...(values.canManageAccountMembership.isSome()
      ? { canManageAccountMembership: values.canManageAccountMembership.get() }
      : null),
    ...(values.canManageBeneficiaries.isSome()
      ? { canManageBeneficiaries: values.canManageBeneficiaries.get() }
      : null),
    ...(values.canManageCards.isSome() ? { canManageCards: values.canManageCards.get() } : null),
    ...(values.canViewAccount.isSome() ? { canViewAccount: values.canViewAccount.get() } : null),
    ...(values.city.isSome() ? { city: values.city.get() } : null),
    ...(values.country.isSome() ? { country: values.country.get() } : null),
    ...(values.email.isSome() ? { email: values.email.get() } : null),
    ...(values.firstName.isSome() ? { firstName: values.firstName.get() } : null),
    ...(values.lastName.isSome() ? { lastName: values.lastName.get() } : null),
    ...(values.phoneNumber.isSome() ? { phoneNumber: values.phoneNumber.get() } : null),
    ...(values.postalCode.isSome() ? { postalCode: values.postalCode.get() } : null),
    ...(values.taxIdentificationNumber.isSome()
      ? { taxIdentificationNumber: values.taxIdentificationNumber.get() }
      : null),
  });

  const onPressNext = () => {
    submitForm({
      onSuccess: values => {
        setPartiallySavedValues(previousValues => ({
          ...previousValues,
          ...filterDefinedValues(values),
        }));

        const currentStepIndex = steps.indexOf(step);
        const nextStep = steps[currentStepIndex + 1];

        if (nextStep != null) {
          setStep(nextStep);
        }
      },
    });
  };

  const sendInvitation = ({
    editingAccountMembershipId,
  }: {
    editingAccountMembershipId: string;
  }) => {
    const query = new URLSearchParams();
    query.append("inviterAccountMembershipId", currentUserAccountMembership.id);
    query.append("lang", locale.language);

    const url = match(projectConfiguration)
      .with(
        Option.P.Some({ projectId: P.select(), mode: "MultiProject" }),
        projectId =>
          `/api/projects/${projectId}/invitation/${editingAccountMembershipId}/send?${query.toString()}`,
      )
      .otherwise(() => `/api/invitation/${editingAccountMembershipId}/send?${query.toString()}`);

    return Request.make({
      url,
      method: "POST",
      withCredentials: true,
      responseType: "json",
      body: JSON.stringify({
        inviteeAccountMembershipId: editingAccountMembershipId,
        inviterAccountMembershipId: currentUserAccountMembership.id,
      }),
    })
      .mapOkToResult(badStatusToError)
      .mapOk(() => undefined)
      .mapError(() => undefined)
      .tapError(error => {
        showToast({ variant: "error", error, title: t("error.generic") });
      });
  };

  const onPressSubmit = () => {
    submitForm({
      onSuccess: values => {
        const computedValues = {
          ...partiallySavedValues,
          ...filterDefinedValues(values),
        };

        if (hasDefinedKeys(computedValues, MANDATORY_FIELDS)) {
          const { addressLine1, city, postalCode, country } = computedValues;
          const isAddressIncomplete = [addressLine1, city, postalCode, country].some(
            isNullishOrEmpty,
          );

          const residencyAddress = isAddressIncomplete
            ? undefined
            : {
                addressLine1,
                city,
                postalCode,
                country,
              };

          addMember({
            input: {
              accountId,
              canInitiatePayments: computedValues.canInitiatePayments,
              canManageAccountMembership: computedValues.canManageAccountMembership,
              canManageBeneficiaries: computedValues.canManageBeneficiaries,
              canViewAccount: computedValues.canViewAccount,
              canManageCards: computedValues.canManageCards,
              consentRedirectUrl:
                window.origin + Router.AccountMembersList({ accountMembershipId }),
              email: computedValues.email,
              residencyAddress,
              restrictedTo: {
                firstName: computedValues.firstName,
                lastName: computedValues.lastName,
                phoneNumber: computedValues.phoneNumber,
                birthDate:
                  computedValues.birthDate !== ""
                    ? dayjs(computedValues.birthDate, locale.dateFormat, true).format("YYYY-MM-DD")
                    : undefined,
              },
              taxIdentificationNumber: emptyToUndefined(
                computedValues.taxIdentificationNumber ?? "",
              ),
            },
          })
            .mapOk(data => data.addAccountMembership)
            .mapOkToResult(filterRejectionsToResult)
            .mapOk(data => data.accountMembership)
            .mapOk(data =>
              match(data)
                .with(
                  { statusInfo: { __typename: "AccountMembershipConsentPendingStatusInfo" } },
                  ({ statusInfo: { consent } }) => Option.Some(consent.consentUrl),
                )
                .otherwise(data => {
                  match(__env.ACCOUNT_MEMBERSHIP_INVITATION_MODE)
                    .with("EMAIL", () => {
                      sendInvitation({ editingAccountMembershipId: data.id });
                    })
                    .otherwise(() => {});
                  onSuccess(data.id);
                  return Option.None();
                }),
            )
            .tapOk(consentUrl =>
              consentUrl.match({
                Some: consentUrl => window.location.replace(consentUrl),
                None: () => {},
              }),
            )
            .tapError(error => {
              showToast({ variant: "error", error, title: translateError(error) });
            });
        }
      },
    });
  };

  return (
    <ResponsiveContainer breakpoint={breakpoints.small}>
      {({ large }) => (
        <>
          {match(step)
            .with("Informations", () => {
              return (
                <>
                  <Box direction={large ? "row" : "column"} alignItems="start">
                    <View style={large ? styles.fieldLarge : styles.field}>
                      <Field name="firstName">
                        {({ value, valid, error, onChange, ref }) => (
                          <LakeLabel
                            label={t("membershipDetail.edit.firstName")}
                            render={id => (
                              <LakeTextInput
                                id={id}
                                ref={ref}
                                value={value}
                                valid={valid}
                                error={error}
                                onChangeText={onChange}
                              />
                            )}
                          />
                        )}
                      </Field>
                    </View>

                    <Space width={16} />

                    <View style={large ? styles.fieldLarge : styles.field}>
                      <Field name="lastName">
                        {({ value, valid, error, onChange, ref }) => (
                          <LakeLabel
                            label={t("membershipDetail.edit.lastName")}
                            render={id => (
                              <LakeTextInput
                                id={id}
                                ref={ref}
                                value={value}
                                valid={valid}
                                error={error}
                                onChangeText={onChange}
                              />
                            )}
                          />
                        )}
                      </Field>
                    </View>
                  </Box>

                  <Box direction={large ? "row" : "column"} alignItems="start">
                    <View style={large ? styles.fieldLarge : styles.field}>
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
                                onChangeText={onChange}
                                inputMode="tel"
                              />
                            )}
                          />
                        )}
                      </Field>
                    </View>

                    <Space width={16} />

                    <View style={large ? styles.fieldLarge : styles.field}>
                      <Field name="birthDate">
                        {({ value, valid, error, onChange, ref }) => (
                          <Rifm value={value} onChange={onChange} {...rifmDateProps}>
                            {({ value, onChange }) => (
                              <LakeLabel
                                label={t("membershipDetail.edit.birthDate")}
                                render={id => (
                                  <LakeTextInput
                                    id={id}
                                    ref={ref}
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
                    </View>
                  </Box>

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
                            onChangeText={onChange}
                          />
                        )}
                      />
                    )}
                  </Field>

                  <LakeLabel
                    label={t("membershipDetail.edit.rights")}
                    render={() => (
                      <>
                        <Box direction={large ? "row" : "column"} alignItems="start">
                          <View style={large ? styles.checkboxLarge : styles.checkbox}>
                            <Field name="canViewAccount">
                              {({ value, onChange }) => (
                                <LakeLabelledCheckbox
                                  disabled={!currentUserAccountMembership.canViewAccount}
                                  label={t("membershipDetail.edit.canViewAccount")}
                                  value={value}
                                  onValueChange={onChange}
                                />
                              )}
                            </Field>
                          </View>

                          <View style={large ? styles.checkboxLarge : styles.checkbox}>
                            <Field name="canInitiatePayments">
                              {({ value, onChange }) => (
                                <LakeLabelledCheckbox
                                  disabled={!currentUserAccountMembership.canInitiatePayments}
                                  label={t("membershipDetail.edit.canInitiatePayments")}
                                  value={value}
                                  onValueChange={onChange}
                                />
                              )}
                            </Field>
                          </View>
                        </Box>

                        <Box direction={large ? "row" : "column"} alignItems="start">
                          <View style={large ? styles.checkboxLarge : styles.checkbox}>
                            <Field name="canManageBeneficiaries">
                              {({ value, onChange }) => (
                                <LakeLabelledCheckbox
                                  disabled={!currentUserAccountMembership.canManageBeneficiaries}
                                  label={t("membershipDetail.edit.canManageBeneficiaries")}
                                  value={value}
                                  onValueChange={onChange}
                                />
                              )}
                            </Field>
                          </View>

                          <View style={large ? styles.checkboxLarge : styles.checkbox}>
                            <Field name="canManageAccountMembership">
                              {({ value, onChange }) => (
                                <LakeLabelledCheckbox
                                  disabled={
                                    !currentUserAccountMembership.canManageAccountMembership
                                  }
                                  label={t("membershipDetail.edit.canManageAccountMembership")}
                                  value={value}
                                  onValueChange={onChange}
                                />
                              )}
                            </Field>
                          </View>
                        </Box>

                        <Box direction={large ? "row" : "column"} alignItems="start">
                          <View style={large ? styles.checkboxLarge : styles.checkbox}>
                            <Field name="canManageCards">
                              {({ value, onChange }) => (
                                <LakeLabelledCheckbox
                                  disabled={!currentUserAccountMembership.canManageCards}
                                  label={t("membershipDetail.edit.canManageCards")}
                                  value={value}
                                  onValueChange={onChange}
                                />
                              )}
                            </Field>
                          </View>
                        </Box>

                        <Space height={16} />
                      </>
                    )}
                  />
                </>
              );
            })
            .with("Address", () => {
              return (
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

                  <Box direction={large ? "row" : "column"} alignItems="start">
                    <View style={large ? styles.fieldLarge : styles.field}>
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
                              />
                            )}
                          />
                        )}
                      </Field>
                    </View>

                    <Space width={16} />

                    <View style={large ? styles.fieldLarge : styles.field}>
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
                              />
                            )}
                          />
                        )}
                      </Field>
                    </View>
                  </Box>

                  <FieldsListener names={["country"]}>
                    {({ country }) =>
                      match({ accountCountry, country: country.value })
                        .with({ accountCountry: "DEU", country: "DEU" }, () => (
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
                                required={
                                  Boolean(partiallySavedValues?.canViewAccount) ||
                                  Boolean(partiallySavedValues?.canInitiatePayments)
                                }
                              />
                            )}
                          </Field>
                        ))
                        .otherwise(() => null)
                    }
                  </FieldsListener>
                </>
              );
            })
            .exhaustive()}

          {steps.length > 1 ? (
            <>
              <Space height={16} />

              <Box direction="row" alignItems="center" justifyContent="center">
                {Array.from(steps).map(item => (
                  <View
                    key={item}
                    style={[styles.paginationDot, item === step && styles.paginationDotActive]}
                  />
                ))}
              </Box>

              <Space height={16} />
            </>
          ) : null}

          {match({ step, steps })
            .with({ step: "Informations", steps: ["Informations"] }, () => (
              <LakeButtonGroup paddingBottom={0}>
                <LakeButton mode="secondary" grow={true} onPress={onPressCancel}>
                  {t("common.cancel")}
                </LakeButton>

                <LakeButton
                  color="current"
                  grow={true}
                  onPress={onPressSubmit}
                  loading={memberAddition.isLoading()}
                >
                  {t("membershipList.newMember.sendInvitation")}
                </LakeButton>
              </LakeButtonGroup>
            ))
            .with({ step: "Informations", steps: ["Informations", "Address"] }, () => (
              <LakeButtonGroup paddingBottom={0}>
                <LakeButton mode="secondary" grow={true} onPress={onPressCancel}>
                  {t("common.cancel")}
                </LakeButton>

                <LakeButton color="current" grow={true} onPress={onPressNext}>
                  {t("membershipList.newMember.next")}
                </LakeButton>
              </LakeButtonGroup>
            ))
            .with({ step: "Address", steps: ["Informations", "Address"] }, () => (
              <LakeButtonGroup paddingBottom={0}>
                <LakeButton mode="secondary" grow={true} onPress={onPressBack}>
                  {t("membershipList.newMember.back")}
                </LakeButton>

                <LakeButton
                  color="current"
                  grow={true}
                  onPress={onPressSubmit}
                  loading={memberAddition.isLoading()}
                >
                  {t("membershipList.newMember.sendInvitation")}
                </LakeButton>
              </LakeButtonGroup>
            ))
            .otherwise(() => null)}
        </>
      )}
    </ResponsiveContainer>
  );
};
