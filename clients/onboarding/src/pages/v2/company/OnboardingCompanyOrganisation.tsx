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
import { t } from "../../../utils/i18n";
import {
  badUserInputErrorPattern,
  extractServerValidationFields,
  getValidationErrorMessage,
  ServerInvalidFieldCode,
  validateRegistrationNumber,
} from "../../../utils/validation";

import { InlineDatePicker } from "@swan-io/shared-business/src/components/InlineDatePicker";
import { PlacekitAddressSearchInput } from "@swan-io/shared-business/src/components/PlacekitAddressSearchInput";
import { TaxIdentificationNumberInput } from "@swan-io/shared-business/src/components/TaxIdentificationNumberInput";
import { CompanyCountryCCA3 } from "@swan-io/shared-business/src/constants/countries";
import { showToast } from "@swan-io/shared-business/src/state/toasts";
import {
  validateCompanyTaxNumber,
  validateNullableRequired,
  validateRequired,
  validateVatNumber,
} from "@swan-io/shared-business/src/utils/validation";
import { useEffect } from "react";
import { View } from "react-native";
import { locale } from "../../../utils/i18n";
import { Router } from "../../../utils/routes";
import {
  getRegistrationNumberName,
  getUpdateOnboardingError,
} from "../../../utils/templateTranslations";
import { useFirstMountState } from "@swan-io/lake/src/hooks/useFirstMountState";

export type OrganisationFieldApiRequired =
  | "address"
  | "city"
  | "postalCode"
  | "vatNumber"
  | "taxIdentificationNumber"
  | "registrationNumber";

type Props = {
  onboarding: NonNullable<CompanyOnboardingFragment>;
  serverValidationErrors: {
    fieldName: OrganisationFieldApiRequired;
    code: ServerInvalidFieldCode;
  }[];
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

export const OnboardingCompanyOrganisation = ({ onboarding, serverValidationErrors }: Props) => {
  const onboardingId = onboarding.id;
  const { accountInfo, company } = onboarding;
  const isFirstMount = useFirstMountState();

  const [updateCompanyOnboarding, updateResult] = useMutation(
    UpdatePublicCompanyAccountHolderOnboardingDocument,
  );

  const accountCountry = accountInfo?.country;
  const companyCountry = company?.address?.country;

  const isVatRequired = match({ accountCountry })
    .with({ accountCountry: "ITA" }, () => true)
    .otherwise(() => false);

  const isTaxIdentificationRequired = match({ companyCountry, accountCountry })
    .with({ companyCountry: P.not(accountCountry) }, () => true)
    .with({ accountCountry: "DEU" }, () => true)
    .with({ accountCountry: "ESP" }, () => true)
    .with({ accountCountry: "ITA" }, () => true)
    .otherwise(() => false);

  const { Field, setFieldValue, setFieldError, submitForm } = useForm({
    address: {
      initialValue: company?.address?.addressLine1 ?? "",
      sanitize: trim,
      validate: validateRequired,
    },
    city: {
      initialValue: company?.address?.city ?? "",
      sanitize: trim,
      validate: validateRequired,
    },
    postalCode: {
      initialValue: company?.address?.postalCode ?? "",
      sanitize: trim,
      validate: validateRequired,
    },
    vatNumber: {
      initialValue: company?.vatNumber ?? "",
      sanitize: trim,
      validate: isVatRequired
        ? combineValidators(validateRequired, validateVatNumber)
        : validateVatNumber,
    },
    taxIdentificationNumber: {
      initialValue: company?.taxIdentificationNumber ?? "",
      sanitize: trim,
      validate: isTaxIdentificationRequired
        ? combineValidators(
            validateRequired,
            validateCompanyTaxNumber(companyCountry as CompanyCountryCCA3),
          )
        : undefined,
    },
    registrationNumber: {
      initialValue: company?.registrationNumber ?? "",
      sanitize: trim,
      validate:
        companyCountry === "BEL"
          ? combineValidators(validateRequired, validateRegistrationNumber)
          : validateRequired,
    },
    registrationDate: {
      initialValue: company?.registrationDate ?? undefined,
      validate: validateNullableRequired,
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
    Router.push("Details", { onboardingId });
  };

  const onPressNext = () => {
    submitForm({
      onSuccess: values => {
        const option = Option.allFromDict(values);
        if (option.isNone()) {
          return;
        }
        const currentValues = option.get();

        const { address, city, postalCode, vatNumber, ...input } = currentValues;

        updateCompanyOnboarding({
          input: {
            onboardingId,
            company: {
              address: {
                addressLine1: address,
                city,
                postalCode,
              },
              vatNumber: vatNumber === "" ? undefined : vatNumber, // Return undefined if empty otherwise the backend with run a regex on it
              regulatoryClassification: "NonFinancialActive", // Default value as we don't use it yet on product side but required by the api
              ...input,
            },
          },
        })
          .mapOk(data => data.updatePublicCompanyAccountHolderOnboarding)
          .mapOkToResult(filterRejectionsToResult)
          .tapOk(() => Router.push("Activity", { onboardingId }))
          .tapError(error => {
            match(error)
              .with(badUserInputErrorPattern, ({ fields }) => {
                const invalidFields = extractServerValidationFields(fields, path => {
                  return match(path)
                    .with(["company", "address", "addressLine1"], () => "address" as const)
                    .with(["company", "address", "city"], () => "city" as const)
                    .with(["company", "address", "postalCode"], () => "postalCode" as const)
                    .with(["company", "vatNumber"], () => "vatNumber" as const)
                    .with(
                      ["company", "taxIdentificationNumber"],
                      () => "taxIdentificationNumber" as const,
                    )
                    .with(["company", "registrationNumber"], () => "registrationNumber" as const)
                    .with(["company", "registrationDate"], () => "registrationDate" as const)
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
              <StepTitle isMobile={small}>{t("company.step.organisation.address.title")}</StepTitle>
              <View style={[styles.grid, large && styles.gridDesktop]}>
                <Field name="address">
                  {({ value, onChange, error }) => (
                    <LakeLabel
                      style={styles.inputFull}
                      label={t("common.address")}
                      render={id => (
                        <PlacekitAddressSearchInput
                          id={id}
                          apiKey={__env.CLIENT_PLACEKIT_API_KEY}
                          country={companyCountry as CompanyCountryCCA3}
                          value={value}
                          onValueChange={onChange}
                          onSuggestion={suggestion => {
                            setFieldValue("address", suggestion.completeAddress);
                            setFieldValue("city", suggestion.city);
                            setFieldValue("postalCode", suggestion.postalCode ?? "");
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

                <Field name="city">
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
                        />
                      )}
                    />
                  )}
                </Field>

                <Field name="postalCode">
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
                        />
                      )}
                    />
                  )}
                </Field>
              </View>
            </Tile>

            <Tile style={styles.gap}>
              <StepTitle isMobile={small}>{t("company.step.legal.title")}</StepTitle>
              <View style={[styles.grid, large && styles.gridDesktop]}>
                <Field name="registrationNumber">
                  {({ value, valid, error, onChange, ref, onBlur }) => (
                    <LakeLabel
                      label={t("company.step.legal.registrationNumberLabel", {
                        registrationNumberLegalName: getRegistrationNumberName(
                          companyCountry as CompanyCountryCCA3,
                          company?.companyType ?? "Company",
                        ),
                      })}
                      render={id => (
                        <LakeTextInput
                          onBlur={onBlur}
                          // @todo shall we keep it?
                          // help={
                          //   accountCountry === "BEL"
                          //     ? t("common.form.help.nbDigits", { nbDigits: "10" })
                          //     : undefined
                          // }
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

                <Field name="registrationDate">
                  {({ value, onChange, error }) => (
                    <InlineDatePicker
                      label={t("company.step.legal.registrationDateLabel")}
                      value={value}
                      onValueChange={onChange}
                      error={error}
                    />
                  )}
                </Field>

                <Field name="taxIdentificationNumber">
                  {({ value, valid, error, onChange, onBlur, ref }) => (
                    <TaxIdentificationNumberInput
                      ref={ref}
                      value={value}
                      error={error}
                      valid={valid}
                      onChange={onChange}
                      onBlur={onBlur}
                      country={companyCountry as CompanyCountryCCA3}
                      isCompany={true}
                      required={isTaxIdentificationRequired}
                    />
                  )}
                </Field>

                <Field name="vatNumber">
                  {({ value, valid, error, onChange, ref, onBlur }) => (
                    <LakeLabel
                      label={t("company.step.legal.vatLabel")}
                      optionalLabel={isVatRequired ? undefined : t("common.optional")}
                      render={id => (
                        <LakeTextInput
                          id={id}
                          onBlur={onBlur}
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
        onPrevious={onPressPrevious}
        justifyContent="start"
        loading={updateResult.isLoading()}
      />
    </>
  );
};
