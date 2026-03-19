import { Option } from "@swan-io/boxed";
import { useMutation } from "@swan-io/graphql-client";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { breakpoints, colors, radii } from "@swan-io/lake/src/constants/design";
import { noop } from "@swan-io/lake/src/utils/function";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { trim } from "@swan-io/lake/src/utils/string";
import { combineValidators, useForm } from "@swan-io/use-form";
import { Pressable, StyleSheet } from "react-native";
import { match, P } from "ts-pattern";
import { OnboardingFooter } from "../../../components/OnboardingFooter";
import { StepTitle } from "../../../components/StepTitle";
import {
  CompanyOnboardingFragment,
  UpdatePublicCompanyAccountHolderOnboardingDocument,
} from "../../../graphql/partner";
import { formatNestedMessage, t } from "../../../utils/i18n";
import {
  badUserInputErrorPattern,
  extractServerValidationFields,
  getValidationErrorMessage,
  ServerInvalidFieldCode,
  validateRegistrationNumber,
} from "../../../utils/validation";

import { Box } from "@swan-io/lake/src/components/Box";
import { Icon } from "@swan-io/lake/src/components/Icon";
import { LakeCheckbox } from "@swan-io/lake/src/components/LakeCheckbox";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { Link } from "@swan-io/lake/src/components/Link";
import { Space } from "@swan-io/lake/src/components/Space";
import { useFirstMountState } from "@swan-io/lake/src/hooks/useFirstMountState";
import { isNotNullish } from "@swan-io/lake/src/utils/nullish";
import { omit } from "@swan-io/lake/src/utils/object";
import { InlineDatePicker } from "@swan-io/shared-business/src/components/InlineDatePicker";
import { PlacekitAddressSearchInput } from "@swan-io/shared-business/src/components/PlacekitAddressSearchInput";
import { TaxIdentificationNumberInput } from "@swan-io/shared-business/src/components/TaxIdentificationNumberInput";
import { CompanyCountryCCA3 } from "@swan-io/shared-business/src/constants/countries";
import { showToast } from "@swan-io/shared-business/src/state/toasts";
import {
  validateCompanyTaxNumber,
  validateIndividualTaxNumber,
  validateNullableRequired,
  validateRequired,
  validateVatNumber,
} from "@swan-io/shared-business/src/utils/validation";
import { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { locale } from "../../../utils/i18n";
import { Router } from "../../../utils/routes";
import { hasOnboardingPrefilled } from "../../../utils/session";
import {
  getRegistrationNumberName,
  getUpdateOnboardingError,
} from "../../../utils/templateTranslations";

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
  prefilledInfo: {
    backgroundColor: colors.gray[50],
    borderRadius: radii[8],
    borderWidth: 1,
    borderColor: colors.gray[100],
    padding: 24,
  },
  tcuCheckbox: {
    top: 3, // center checkbox with text
    flexDirection: "row",
    alignItems: "center",
  },
  link: {
    color: colors.partner[500],
    textDecorationLine: "underline",
  },
  linkIcon: {
    marginLeft: 4,
    display: "inline-block",
    verticalAlign: "middle",
  },
});

export const OnboardingCompanyOrganisation = ({ onboarding, serverValidationErrors }: Props) => {
  const onboardingId = onboarding.id;
  const { accountInfo, company, projectInfo } = onboarding;
  const isFirstMount = useFirstMountState();

  const tcuUrl = "#"; //@todo missing in schema
  const tcuDocumentUri = projectInfo?.tcuDocumentUri ?? "#";

  const [updateCompanyOnboarding, updateResult] = useMutation(
    UpdatePublicCompanyAccountHolderOnboardingDocument,
  );

  const [isAddressFromSuggestion, setIsAddressFromSuggestion] = useState(
    Boolean(company?.address?.addressLine1 && company.address.city && company.address.postalCode),
  );

  const accountCountry = accountInfo?.country;
  const companyCountry = company?.address?.country;
  const companyType = company?.companyType;

  const haveToAcceptTcu = match({ accountCountry })
    .with({ accountCountry: P.union("DEU", "ITA") }, () => true)
    .otherwise(() => false);

  const isVatRequired = match({ accountCountry })
    .with({ accountCountry: "ITA" }, () => true)
    .otherwise(() => false);

  const isRegistrationNumberRequired = match({ companyCountry })
    .with({ companyCountry: "DEU" }, () => false)
    .otherwise(() => true);

  const isTaxIdentificationRequired = match({ companyCountry, accountCountry })
    .with({ companyCountry: P.not(accountCountry) }, () => true)
    .with({ accountCountry: P.union("DEU", "ESP", "ITA") }, () => true)
    .otherwise(() => false);

  //Italian company with a status self employed use the same tax validation rules as individual
  const hasCompanyTaxRules = match({ companyType, companyCountry })
    .with({ companyType: "SelfEmployed", companyCountry: "ITA" }, () => false)
    .otherwise(() => true);

  const validateTaxNumber = hasCompanyTaxRules
    ? validateCompanyTaxNumber
    : validateIndividualTaxNumber;

  const prefilled = useMemo(
    () =>
      hasOnboardingPrefilled
        .get()
        .getOr({ registrationNumber: false, vatNumber: false, registrationDate: false }),
    [],
  );

  const { Field, setFieldValue, setFieldError, submitForm, FieldsListener } = useForm({
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
            validateTaxNumber(companyCountry as CompanyCountryCCA3),
          )
        : undefined,
    },
    registrationNumber: {
      initialValue: company?.registrationNumber ?? "",
      sanitize: trim,
      validate: match(companyCountry)
        .with("BEL", () => combineValidators(validateRequired, validateRegistrationNumber))
        .with("DEU", () => undefined)
        .otherwise(() => validateRequired),
    },
    registrationDate: {
      initialValue: company?.registrationDate ?? undefined,
      validate: validateNullableRequired,
    },
    tcuAccepted: {
      initialValue: !haveToAcceptTcu, // initialize as accepted if not required
      validate: value => {
        if (value === false) {
          return t("step.finalize.termsError");
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
    Router.push("Details", { onboardingId });
  };

  const onPressNext = () => {
    submitForm({
      onSuccess: values => {
        const option = Option.allFromDict(omit(values, ["tcuAccepted"]));
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
          language: locale.language,
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
                          onValueChange={value => {
                            onChange(value);
                            if (value === "") {
                              setIsAddressFromSuggestion(false);
                            }
                          }}
                          onSuggestion={suggestion => {
                            setFieldValue("address", suggestion.completeAddress);
                            setFieldValue("city", suggestion.city);
                            setFieldValue("postalCode", suggestion.postalCode ?? "");
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
                          readOnly={isAddressFromSuggestion}
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
                          readOnly={isAddressFromSuggestion}
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
                          companyType ?? "Company",
                        ),
                      })}
                      optionalLabel={
                        isRegistrationNumberRequired ? undefined : t("common.optional")
                      }
                      render={id => (
                        <LakeTextInput
                          onBlur={onBlur}
                          help={
                            accountCountry === "BEL"
                              ? t("common.form.help.nbDigits", { nbDigits: "10" })
                              : undefined
                          }
                          id={id}
                          ref={ref}
                          value={value}
                          valid={valid}
                          error={error}
                          onChangeText={onChange}
                          readOnly={prefilled.registrationNumber}
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
                      readOnly={prefilled.registrationDate}
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
                      isCompany={hasCompanyTaxRules}
                      required={isTaxIdentificationRequired}
                      label={
                        // those are hardcoded because it's the only combination making the distinction
                        accountCountry === "DEU" && companyCountry === "DEU"
                          ? "Steuernummer"
                          : undefined
                      }
                      placeholder={
                        accountCountry === "DEU" && companyCountry === "DEU"
                          ? "Steuernummer des Unternehmens"
                          : undefined
                      }
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
                          readOnly={prefilled.vatNumber}
                        />
                      )}
                    />
                  )}
                </Field>
              </View>

              {/* If data are prefilled then registrationNumber will always be true */}
              {prefilled.registrationNumber && (
                <View style={styles.prefilledInfo}>
                  <LakeText variant="smallRegular">{t("company.step.legal.prefilled")}</LakeText>
                </View>
              )}
            </Tile>
          </>
        )}
      </ResponsiveContainer>

      <Box alignItems="start">
        {haveToAcceptTcu && (
          <>
            <Box>
              <Space height={32} />
              <Field name="tcuAccepted">
                {({ value, error, onChange, ref }) => (
                  <Pressable
                    ref={ref}
                    role="checkbox"
                    aria-checked={value}
                    onPress={() => onChange(!value)}
                    style={styles.tcuCheckbox}
                  >
                    <LakeCheckbox value={value} isError={isNotNullish(error)} />
                    <Space width={8} />

                    <LakeText>
                      {formatNestedMessage("step.finalize.terms", {
                        firstLink: (
                          <Link target="blank" to={tcuUrl} style={styles.link}>
                            {t("emailPage.firstLink")}

                            <Icon name="open-filled" size={16} style={styles.linkIcon} />
                          </Link>
                        ),
                        secondLink: (
                          <Link target="blank" to={tcuDocumentUri} style={styles.link}>
                            {t("emailPage.secondLink", { partner: projectInfo?.name })}

                            <Icon name="open-filled" size={16} style={styles.linkIcon} />
                          </Link>
                        ),
                      })}
                    </LakeText>
                  </Pressable>
                )}
              </Field>
            </Box>
            <Space height={4} />
            <FieldsListener names={["tcuAccepted"]}>
              {({ tcuAccepted }) => (
                <LakeText color={colors.negative[500]}>{tcuAccepted.error ?? " "}</LakeText>
              )}
            </FieldsListener>
          </>
        )}
      </Box>

      <OnboardingFooter
        onNext={onPressNext}
        onPrevious={onPressPrevious}
        justifyContent="start"
        loading={updateResult.isLoading()}
      />
    </>
  );
};
