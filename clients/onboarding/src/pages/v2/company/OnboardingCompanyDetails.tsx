import { Option } from "@swan-io/boxed";
import { useMutation } from "@swan-io/graphql-client";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { breakpoints } from "@swan-io/lake/src/constants/design";
import { noop } from "@swan-io/lake/src/utils/function";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { trim } from "@swan-io/lake/src/utils/string";
import { combineValidators, useForm } from "@swan-io/use-form";
import { StyleSheet } from "react-native";
import { match, P } from "ts-pattern";
import { OnboardingFooter } from "../../../components/OnboardingFooter";
import { StepTitle } from "../../../components/StepTitle";
import {
  CompanyOnboardingFragment,
  UpdatePublicCompanyAccountHolderOnboardingDocument,
} from "../../../graphql/partner";
import { locale, t } from "../../../utils/i18n";
import {
  badUserInputErrorPattern,
  extractServerValidationFields,
  getValidationErrorMessage,
  ServerInvalidFieldCode,
} from "../../../utils/validation";

import { RadioGroup } from "@swan-io/lake/src/components/RadioGroup";
import { useFirstMountState } from "@swan-io/lake/src/hooks/useFirstMountState";
import { BirthdatePicker } from "@swan-io/shared-business/src/components/BirthdatePicker";
import { CountryPicker } from "@swan-io/shared-business/src/components/CountryPicker";
import { PlacekitAddressSearchInput } from "@swan-io/shared-business/src/components/PlacekitAddressSearchInput";
import {
  allCountries,
  companyCountries,
  CountryCCA3,
  isCountryCCA3,
} from "@swan-io/shared-business/src/constants/countries";
import { showToast } from "@swan-io/shared-business/src/state/toasts";
import {
  validateEmail,
  validateName,
  validateNullableRequired,
  validateRequired,
  validateUsaTaxNumber,
} from "@swan-io/shared-business/src/utils/validation";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { OnboardingCountryPicker } from "../../../components/CountryPicker";
import { Router } from "../../../utils/routes";
import { getUpdateOnboardingError } from "../../../utils/templateTranslations";

export type DetailsFieldApiRequired = "email";

type Props = {
  onboarding: NonNullable<CompanyOnboardingFragment>;
  serverValidationErrors: {
    fieldName: DetailsFieldApiRequired;
    code: ServerInvalidFieldCode;
  }[];
};

const styles = StyleSheet.create({
  gap: {
    gap: "32px",
  },
  grid: {
    gap: "8px",
  },
  gridDesktop: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px 32px",
  },
  inputFull: {
    gridColumnEnd: "span 2",
  },
});

export const OnboardingCompanyDetails = ({ onboarding, serverValidationErrors }: Props) => {
  const onboardingId = onboarding.id;
  const { accountAdmin, accountInfo } = onboarding;
  const isFirstMount = useFirstMountState();

  const [updateCompanyOnboarding, updateResult] = useMutation(
    UpdatePublicCompanyAccountHolderOnboardingDocument,
  );

  const [isAddressFromSuggestion, setIsAddressFromSuggestion] = useState(
    Boolean(
      accountAdmin?.address?.addressLine1 &&
      accountAdmin.address.city &&
      accountAdmin.address.postalCode,
    ),
  );

  const { Field, FieldsListener, setFieldValue, setFieldError, submitForm } = useForm({
    email: {
      initialValue: accountAdmin?.email ?? "",
      sanitize: trim,
      validate: combineValidators(validateRequired, validateEmail),
    },
    firstName: {
      initialValue: accountAdmin?.firstName ?? "",
      sanitize: trim,
      validate: validateName,
    },
    lastName: {
      initialValue: accountAdmin?.lastName ?? "",
      sanitize: trim,
      validate: validateName,
    },
    nationality: {
      initialValue: match([accountAdmin?.nationality, accountInfo?.country] as const)
        .returnType<CountryCCA3>()
        .with([P.when(isCountryCCA3), P._], ([nationality]) => nationality)
        .with([P._, P.when(isCountryCCA3)], ([_, country]) => country)
        .otherwise(() => "FRA"),
      validate: validateRequired,
    },
    birthDate: {
      initialValue: accountAdmin?.birthInfo?.birthDate ?? undefined,
      validate: validateNullableRequired,
    },
    birthCountry: {
      initialValue: match([accountAdmin?.birthInfo?.country, accountInfo?.country])
        .returnType<CountryCCA3>()
        .with([P.when(isCountryCCA3), P._], ([nationality]) => nationality)
        .with([P._, P.when(isCountryCCA3)], ([_, country]) => country)
        .otherwise(() => "FRA"),
      validate: validateRequired,
    },
    birthCity: {
      initialValue: accountAdmin?.birthInfo?.city ?? "",
      sanitize: trim,
      validate: validateRequired,
    },
    birthPostal: {
      initialValue: accountAdmin?.birthInfo?.postalCode ?? "",
      sanitize: trim,
      validate: validateRequired,
    },
    residenceCountry: {
      initialValue: match([accountAdmin?.address?.country, accountInfo?.country])
        .returnType<CountryCCA3>()
        .with([P.when(isCountryCCA3), P._], ([nationality]) => nationality)
        .with([P._, P.when(isCountryCCA3)], ([_, country]) => country)
        .otherwise(() => "FRA"),
      validate: validateRequired,
    },
    residenceAddress: {
      initialValue: accountAdmin?.address?.addressLine1 ?? "",
      sanitize: trim,
      validate: validateRequired,
    },
    residenceCity: {
      initialValue: accountAdmin?.address?.city ?? "",
      sanitize: trim,
      validate: validateRequired,
    },
    residencePostal: {
      initialValue: accountAdmin?.address?.postalCode ?? "",
      sanitize: trim,
      validate: validateRequired,
    },
    isUnitedStatesPerson: {
      initialValue: accountAdmin?.unitedStatesTaxInfo?.isUnitedStatesPerson ?? false,
    },
    unitedStatesTaxIdentificationNumber: {
      initialValue: accountAdmin?.unitedStatesTaxInfo?.unitedStatesTaxIdentificationNumber ?? "",
      sanitize: trim,
      validate: (value, { getFieldValue }) => {
        const isRequired = getFieldValue("isUnitedStatesPerson");
        if (isRequired) {
          return combineValidators(validateRequired, validateUsaTaxNumber)(value);
        }
      },
    },
  });

  useEffect(() => {
    if (isFirstMount) {
      serverValidationErrors.forEach(({ fieldName, code }) => {
        const message = getValidationErrorMessage(code);
        setFieldError(fieldName, message);
      });
    }
  }, [serverValidationErrors, isFirstMount, setFieldError]);

  const onPressPrevious = () => {
    Router.push("Root", { onboardingId });
  };

  const onPressNext = () => {
    submitForm({
      onSuccess: values => {
        const option = Option.allFromDict(values);
        if (option.isNone()) {
          return;
        }
        const currentValues = option.get();

        const {
          birthDate,
          birthCountry,
          birthCity,
          birthPostal,
          residenceCountry,
          residenceAddress,
          residenceCity,
          residencePostal,
          isUnitedStatesPerson,
          unitedStatesTaxIdentificationNumber,
          ...input
        } = currentValues;

        updateCompanyOnboarding({
          input: {
            onboardingId,
            accountAdmin: {
              ...input,
              birthInfo: {
                birthDate,
                country: birthCountry,
                city: birthCity,
                postalCode: birthPostal,
              },
              address: {
                addressLine1: residenceAddress,
                city: residenceCity,
                country: residenceCountry,
                postalCode: residencePostal,
              },
              unitedStatesTaxInfo: {
                isUnitedStatesPerson,
                unitedStatesTaxIdentificationNumber: isUnitedStatesPerson
                  ? unitedStatesTaxIdentificationNumber
                  : undefined,
              },
            },
          },
        })
          .mapOk(data => data.updatePublicCompanyAccountHolderOnboarding)
          .mapOkToResult(filterRejectionsToResult)
          .tapOk(() => Router.push("Organisation", { onboardingId }))
          .tapError(error => {
            match(error)
              .with(badUserInputErrorPattern, ({ fields }) => {
                const invalidFields = extractServerValidationFields(fields, path => {
                  return match(path)
                    .with(["accountAdmin", "email"], () => "email" as const)
                    .with(["accountAdmin", "firstName"], () => "firstName" as const)
                    .with(["accountAdmin", "lastName"], () => "lastName" as const)
                    .with(["accountAdmin", "nationality"], () => "nationality" as const)
                    .with(["accountAdmin", "birthInfo", "birthDate"], () => "birthDate" as const)
                    .with(["accountAdmin", "birthInfo", "country"], () => "birthCountry" as const)
                    .with(["accountAdmin", "birthInfo", "city"], () => "birthCity" as const)
                    .with(["accountAdmin", "birthInfo", "postalCode"], () => "birthPostal" as const)
                    .with(
                      ["accountAdmin", "address", "addressLine1"],
                      () => "residenceAddress" as const,
                    )
                    .with(["accountAdmin", "address", "country"], () => "residenceCountry" as const)
                    .with(["accountAdmin", "address", "city"], () => "residenceCity" as const)
                    .with(
                      ["accountAdmin", "address", "postalCode"],
                      () => "residencePostal" as const,
                    )
                    .with(
                      [
                        "accountAdmin",
                        "unitedStatesTaxInfo",
                        "unitedStatesTaxIdentificationNumber",
                      ],
                      () => "unitedStatesTaxIdentificationNumber" as const,
                    )
                    .otherwise(() => null);
                });
                invalidFields.forEach(({ fieldName, code }) => {
                  const message = getValidationErrorMessage(code, currentValues[fieldName]);
                  setFieldError(fieldName, message);
                });
              })
              .otherwise(noop);

            showToast({ variant: "error", error, ...getUpdateOnboardingError(error) });
          });
      },
    });
  };

  return (
    <>
      <ResponsiveContainer breakpoint={breakpoints.medium} style={styles.gap}>
        {({ large, small }) => (
          <>
            <Tile style={styles.gap}>
              <StepTitle isMobile={small}>{t("form.personalInformation.title")}</StepTitle>
              <View style={[styles.grid, large && styles.gridDesktop]}>
                <LakeLabel
                  label={t("common.fistname")}
                  render={id => (
                    <Field name="firstName">
                      {({ value, onBlur, onChange, error, ref }) => (
                        <LakeTextInput
                          id={id}
                          ref={ref}
                          value={value}
                          error={error}
                          onBlur={onBlur}
                          onChangeText={onChange}
                        />
                      )}
                    </Field>
                  )}
                />
                <LakeLabel
                  label={t("common.lastname")}
                  render={id => (
                    <Field name="lastName">
                      {({ value, onBlur, onChange, error, ref }) => (
                        <LakeTextInput
                          id={id}
                          ref={ref}
                          value={value}
                          error={error}
                          onBlur={onBlur}
                          onChangeText={onChange}
                        />
                      )}
                    </Field>
                  )}
                />

                <LakeLabel
                  label={t("common.email")}
                  style={styles.inputFull}
                  render={id => (
                    <Field name="email">
                      {({ value, onBlur, onChange, error, ref }) => (
                        <LakeTextInput
                          id={id}
                          ref={ref}
                          value={value}
                          error={error}
                          onBlur={onBlur}
                          onChangeText={onChange}
                          icon="mail-regular"
                        />
                      )}
                    </Field>
                  )}
                />

                <Field name="birthDate">
                  {({ value, onChange, error }) => (
                    <BirthdatePicker
                      label={t("common.birthdate")}
                      value={value}
                      onValueChange={onChange}
                      error={error}
                    />
                  )}
                </Field>

                <LakeLabel
                  label={t("common.nationality")}
                  render={id => (
                    <Field name="nationality">
                      {({ value, onChange, error, ref }) => (
                        <CountryPicker
                          id={id}
                          ref={ref}
                          countries={allCountries}
                          value={value}
                          error={error}
                          onValueChange={onChange}
                        />
                      )}
                    </Field>
                  )}
                />

                <LakeLabel
                  label={t("form.label.usaCitizen")}
                  render={() => (
                    <Field name="isUnitedStatesPerson">
                      {({ value, onChange }) => (
                        <RadioGroup
                          direction="row"
                          items={[
                            {
                              name: t("common.yes"),
                              value: true,
                            },
                            {
                              name: t("common.no"),
                              value: false,
                            },
                          ]}
                          value={value}
                          onValueChange={onChange}
                        />
                      )}
                    </Field>
                  )}
                />

                <FieldsListener names={["isUnitedStatesPerson"]}>
                  {({ isUnitedStatesPerson }) => (
                    <Field name="unitedStatesTaxIdentificationNumber">
                      {({ value, onBlur, onChange, error, ref }) =>
                        isUnitedStatesPerson.value ? (
                          <LakeLabel
                            label={t("form.label.usaTax")}
                            render={id => (
                              <LakeTextInput
                                id={id}
                                ref={ref}
                                value={value}
                                error={error}
                                onBlur={onBlur}
                                onChangeText={onChange}
                                placeholder={t("form.label.usaTax.placeholder")}
                                help={t("form.label.usaTax.help")}
                              />
                            )}
                          />
                        ) : null
                      }
                    </Field>
                  )}
                </FieldsListener>
              </View>
            </Tile>

            <Tile style={styles.gap}>
              <StepTitle isMobile={small}>{t("form.placeOfBirth.title")}</StepTitle>
              <View style={[styles.grid, large && styles.gridDesktop]}>
                <LakeLabel
                  label={t("form.label.birthCountry")}
                  render={id => (
                    <Field name="birthCountry">
                      {({ value, onChange, error, ref }) => (
                        <CountryPicker
                          id={id}
                          ref={ref}
                          countries={allCountries}
                          value={value}
                          error={error}
                          onValueChange={onChange}
                        />
                      )}
                    </Field>
                  )}
                />

                <Field name="birthCity">
                  {({ value, valid, error, onChange, ref }) => (
                    <LakeLabel
                      label={t("form.label.birthCity")}
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

                <Field name="birthPostal">
                  {({ value, valid, error, onChange, ref }) => (
                    <LakeLabel
                      label={t("form.label.birthPostal")}
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
            </Tile>

            <Tile style={styles.gap}>
              <StepTitle isMobile={small}>{t("form.residence.title")}</StepTitle>
              <View style={[styles.grid, large && styles.gridDesktop]}>
                <Field name="residenceCountry">
                  {({ value, onChange }) => (
                    <OnboardingCountryPicker
                      label={t("form.label.residenceCountry")}
                      value={value}
                      countries={companyCountries}
                      holderType="company"
                      onlyIconHelp={small}
                      onValueChange={onChange}
                      style={styles.inputFull}
                    />
                  )}
                </Field>

                <FieldsListener names={["residenceCountry"]}>
                  {({ residenceCountry }) => (
                    <Field name="residenceAddress">
                      {({ value, onChange, error }) => (
                        <LakeLabel
                          style={styles.inputFull}
                          label={t("common.address")}
                          render={id => (
                            <PlacekitAddressSearchInput
                              id={id}
                              apiKey={__env.CLIENT_PLACEKIT_API_KEY}
                              country={residenceCountry.value}
                              value={value}
                              onValueChange={value => {
                                onChange(value);
                                if (value === "") {
                                  setIsAddressFromSuggestion(false);
                                }
                              }}
                              onSuggestion={suggestion => {
                                setFieldValue("residenceAddress", suggestion.completeAddress);
                                setFieldValue("residenceCity", suggestion.city);
                                setFieldValue("residencePostal", suggestion.postalCode ?? "");
                                setIsAddressFromSuggestion(true);
                              }}
                              language={locale.language}
                              placeholder={t("addressInput.placeholder")}
                              emptyResult={t("common.noResult")}
                              error={error}
                            />
                          )}
                        />
                      )}
                    </Field>
                  )}
                </FieldsListener>

                <Field name="residenceCity">
                  {({ value, valid, error, onChange, ref }) => (
                    <LakeLabel
                      label={t("common.city")}
                      render={id => (
                        <LakeTextInput
                          id={id}
                          ref={ref}
                          value={value}
                          valid={valid}
                          error={error}
                          onChangeText={onChange}
                          readOnly={isAddressFromSuggestion}
                        />
                      )}
                    />
                  )}
                </Field>

                <Field name="residencePostal">
                  {({ value, valid, error, onChange, ref }) => (
                    <LakeLabel
                      label={t("common.postalCode")}
                      render={id => (
                        <LakeTextInput
                          id={id}
                          ref={ref}
                          value={value}
                          valid={valid}
                          error={error}
                          onChangeText={onChange}
                          readOnly={isAddressFromSuggestion}
                        />
                      )}
                    />
                  )}
                </Field>
              </View>
            </Tile>
          </>
        )}
      </ResponsiveContainer>
      <OnboardingFooter
        onNext={onPressNext}
        onPrevious={onPressPrevious}
        justifyContent="start"
        loading={updateResult.isLoading()}
      />
    </>
  );
};
