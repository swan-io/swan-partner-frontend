import { Option } from "@swan-io/boxed";
import { useMutation } from "@swan-io/graphql-client";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { breakpoints } from "@swan-io/lake/src/constants/design";
import { identity, noop } from "@swan-io/lake/src/utils/function";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { trim } from "@swan-io/lake/src/utils/string";
import { combineValidators, useForm } from "@swan-io/use-form";
import { StyleSheet } from "react-native";
import { match, P } from "ts-pattern";
import { OnboardingFooter } from "../../../components/OnboardingFooter";
import { StepTitle } from "../../../components/StepTitle";
import {
  IndividualOnboardingFragment,
  UpdatePublicIndividualAccountHolderOnboardingDocument,
} from "../../../graphql/partner";
import { locale, t } from "../../../utils/i18n";
import {
  extractServerValidationErrors,
  getValidationErrorMessage,
} from "../../../utils/validation";

import { BirthdatePicker } from "@swan-io/shared-business/src/components/BirthdatePicker";
import { CountryPicker } from "@swan-io/shared-business/src/components/CountryPicker";
import { PlacekitAddressSearchInput } from "@swan-io/shared-business/src/components/PlacekitAddressSearchInput";
import {
  allCountries,
  CountryCCA3,
  getCountryByCCA3,
  individualCountries,
  isCountryCCA3,
} from "@swan-io/shared-business/src/constants/countries";
import { showToast } from "@swan-io/shared-business/src/state/toasts";
import {
  validateEmail,
  validateName,
  validateNullableRequired,
  validateRequired,
} from "@swan-io/shared-business/src/utils/validation";
import { View } from "react-native";
import { OnboardingCountryPicker } from "../../../components/CountryPicker";
import { InputPhoneNumber } from "../../../components/InputPhoneNumber";
import { prefixPhoneNumber } from "../../../utils/phone";
import { Router } from "../../../utils/routes";
import { getUpdateOnboardingError } from "../../../utils/templateTranslations";

type Props = {
  onboarding: NonNullable<IndividualOnboardingFragment>; // todo IndividualOnboardingFragment
};

const styles = StyleSheet.create({
  gap: {
    gap: "32px",
  },
  grid: {
    display: "grid",
    gap: "8px",
  },
  gridDesktop: {
    gridTemplateColumns: "1fr 1fr",
    gap: "16px 32px",
  },
  inputFull: {
    gridColumnEnd: "span 2",
  },
});

export const OnboardingIndividualDetails = ({ onboarding }: Props) => {
  const [updateIndividualOnboarding, updateResult] = useMutation(
    UpdatePublicIndividualAccountHolderOnboardingDocument,
  );
  const onboardingId = onboarding.id;

  const { accountAdmin } = onboarding;
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
    phoneNumber: {
      initialValue: {
        country: getCountryByCCA3("FRA"),
        nationalNumber: "",
      },
      sanitize: ({ country, nationalNumber }) => ({
        country,
        nationalNumber: nationalNumber.trim(),
      }),
      validate: ({ country, nationalNumber }) => {
        if (nationalNumber.trim() === "") {
          return t("error.requiredField");
        }
        const phoneNumber = prefixPhoneNumber(country, nationalNumber);

        if (!phoneNumber.valid) {
          return t("error.invalidPhoneNumber");
        }
      },
    },
    nationality: {
      initialValue: match(accountAdmin?.nationality)
        .returnType<CountryCCA3>()
        .with(P.when(isCountryCCA3), identity)
        .otherwise(() => "FRA"),
      validate: validateRequired,
    },
    birthDate: {
      initialValue: accountAdmin?.birthInfo?.birthDate ?? undefined,
      validate: validateNullableRequired,
    },
    birthCountry: {
      initialValue: match(accountAdmin?.birthInfo?.country)
        .returnType<CountryCCA3>()
        .with(P.when(isCountryCCA3), identity)
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
      initialValue: match(accountAdmin?.address?.country)
        .returnType<CountryCCA3>()
        .with(P.when(isCountryCCA3), identity)
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
  });

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
          phoneNumber, // todo: store phoneNumber somewhere to prefil the sca at finalize
          ...input
        } = currentValues;

        updateIndividualOnboarding({
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
            },
          },
        })
          .mapOk(data => data.updatePublicIndividualAccountHolderOnboarding)
          .mapOkToResult(filterRejectionsToResult)
          .tapOk(() => Router.push("Activity", { onboardingId }))
          .tapError(error => {
            match(error)
              .with({ __typename: "ValidationRejection" }, error => {
                const invalidFields = extractServerValidationErrors(error, path => {
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
              <StepTitle isMobile={small}>{t("individual.step.about.title1")}</StepTitle>
              <View style={[styles.grid, large && styles.gridDesktop]}>
                <LakeLabel
                  label={t("individual.step.about.fistname")}
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
                  label={t("individual.step.about.lastname")}
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

                <Field name="birthDate">
                  {({ value, onChange, error }) => (
                    <BirthdatePicker
                      label={t("individual.step.about.birthdate")}
                      value={value}
                      onValueChange={onChange}
                      error={error}
                    />
                  )}
                </Field>

                <LakeLabel
                  label={t("individual.step.about.nationality")}
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
                  label={t("individual.step.about.email")}
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

                <Field name="phoneNumber">
                  {({ value, onBlur, onChange, valid, error, ref }) => (
                    <InputPhoneNumber
                      label={t("changeAdmin.step.requesterInfo.phoneNumber")}
                      ref={ref}
                      error={error}
                      value={value}
                      valid={valid}
                      onBlur={onBlur}
                      onValueChange={onChange}
                    />
                  )}
                </Field>
              </View>
            </Tile>

            <Tile style={styles.gap}>
              <StepTitle isMobile={small}>{t("individual.step.about.title2")}</StepTitle>
              <View style={[styles.grid, large && styles.gridDesktop]}>
                <LakeLabel
                  label={t("individual.step.about.birthCountry")}
                  style={styles.inputFull}
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
                      label={t("individual.step.about.birthCity")}
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
                      label={t("individual.step.about.birthPostal")}
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
              <StepTitle isMobile={small}>{t("individual.step.about.title3")}</StepTitle>
              <View style={[styles.grid, large && styles.gridDesktop]}>
                <Field name="residenceCountry">
                  {({ value, onChange }) => (
                    <OnboardingCountryPicker
                      label={t("individual.step.about.residenceCountry")}
                      value={value}
                      countries={individualCountries}
                      holderType="individual"
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
                          label={t("individual.step.about.residenceAddress")}
                          render={id => (
                            <PlacekitAddressSearchInput
                              id={id}
                              apiKey={__env.CLIENT_PLACEKIT_API_KEY}
                              country={residenceCountry.value}
                              value={value}
                              onValueChange={onChange}
                              onSuggestion={suggestion => {
                                setFieldValue("residenceAddress", suggestion.completeAddress);
                                setFieldValue("residenceCity", suggestion.city);
                                setFieldValue("residencePostal", suggestion.postalCode ?? "");
                              }}
                              language={locale.language}
                              placeholder={t("addressInput.placeholder")}
                              emptyResultText={t("common.noResult")}
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
                      label={t("individual.step.about.residenceCity")}
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

                <Field name="residencePostal">
                  {({ value, valid, error, onChange, ref }) => (
                    <LakeLabel
                      label={t("individual.step.about.residencePostal")}
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
          </>
        )}
      </ResponsiveContainer>
      <OnboardingFooter
        onNext={onPressNext}
        justifyContent="start"
        loading={updateResult.isLoading()}
      />
    </>
  );
};
