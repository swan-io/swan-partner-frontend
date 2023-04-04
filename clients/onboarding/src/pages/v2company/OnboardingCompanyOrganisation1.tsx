import { Result } from "@swan-io/boxed";
import { Box } from "@swan-io/lake/src/components/Box";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { Switch } from "@swan-io/lake/src/components/Switch";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { breakpoints, colors } from "@swan-io/lake/src/constants/design";
import { useFirstMountState } from "@swan-io/lake/src/hooks/useFirstMountState";
import { useUrqlMutation } from "@swan-io/lake/src/hooks/useUrqlMutation";
import { showToast } from "@swan-io/lake/src/state/toasts";
import { noop } from "@swan-io/lake/src/utils/function";
import { emptyToUndefined } from "@swan-io/lake/src/utils/nullish";
import { AddressFormPart } from "@swan-io/shared-business/src/components/AddressFormPart";
import { CountryCCA3 } from "@swan-io/shared-business/src/constants/countries";
import { validateCompanyTaxNumber } from "@swan-io/shared-business/src/utils/validation";
import { useCallback, useEffect } from "react";
import { hasDefinedKeys, useForm } from "react-ux-form";
import { match } from "ts-pattern";
import { LakeCompanyInput } from "../../components/LakeCompanyInput";
import { OnboardingFooter } from "../../components/OnboardingFooter";
import { OnboardingStepContent } from "../../components/OnboardingStepContent";
import { StepTitle } from "../../components/StepTitle";
import {
  AccountCountry,
  GetCompanyInfoDocument,
  UpdateCompanyOnboardingDocument,
} from "../../graphql/unauthenticated";
import { CompanySuggestion } from "../../utils/Pappers";
import { locale, t } from "../../utils/i18n";
import { logFrontendError } from "../../utils/logger";
import { CompanyOnboardingRoute, Router } from "../../utils/routes";
import {
  getRegistrationNumberName,
  getUpdateOnboardingError,
} from "../../utils/templateTranslations";
import { parseOperationResult, urql } from "../../utils/urql";
import {
  ServerInvalidFieldCode,
  extractServerValidationErrors,
  getValidationErrorMessage,
  validateRequired,
  validateVatNumber,
} from "../../utils/validation";

export type Organisation1FieldName =
  | "name"
  | "registrationNumber"
  | "vatNumber"
  | "taxIdentificationNumber"
  | "address"
  | "city"
  | "postalCode";

type Props = {
  previousStep: CompanyOnboardingRoute;
  nextStep: CompanyOnboardingRoute;
  initialIsRegistered: boolean;
  initialName: string;
  initialRegistrationNumber: string;
  initialVatNumber: string;
  initialTaxIdentificationNumber: string;
  initialAddressLine1: string;
  initialCity: string;
  initialPostalCode: string;
  country: CountryCCA3;
  accountCountry: AccountCountry;
  onboardingId: string;
  serverValidationErrors: {
    fieldName: Organisation1FieldName;
    code: ServerInvalidFieldCode;
  }[];
};

const registerNamePerCountry: Partial<Record<CountryCCA3, string>> = {
  BEL: "“Code des sociétés”",
  DEU: "Handelsregister",
  FRA: "RCS",
  ITA: "REGISTRO IMPRESE",
  NLD: "Handelsregister",
};

export const OnboardingCompanyOrganisation1 = ({
  previousStep,
  nextStep,
  initialIsRegistered,
  initialName,
  initialRegistrationNumber,
  initialVatNumber,
  initialTaxIdentificationNumber,
  initialAddressLine1,
  initialCity,
  initialPostalCode,
  country,
  accountCountry,
  onboardingId,
  serverValidationErrors,
}: Props) => {
  const [updateResult, updateOnboarding] = useUrqlMutation(UpdateCompanyOnboardingDocument);
  const isFirstMount = useFirstMountState();
  const canSetTaxIdentification = accountCountry === "DEU" && country === "DEU";

  const { Field, FieldsListener, submitForm, setFieldValue, listenFields, setFieldError } = useForm(
    {
      isRegistered: {
        initialValue: initialIsRegistered,
      },
      name: {
        initialValue: initialName,
        validate: validateRequired,
        sanitize: value => value.trim(),
      },
      registrationNumber: {
        initialValue: initialRegistrationNumber,
        validate: (value, { getFieldState }) => {
          const isRegistered = getFieldState("isRegistered").value;
          return isRegistered ? validateRequired(value) : undefined;
        },
        sanitize: value => value.trim(),
      },
      vatNumber: {
        initialValue: initialVatNumber,
        validate: validateVatNumber,
        sanitize: value => value.trim(),
      },
      taxIdentificationNumber: {
        initialValue: initialTaxIdentificationNumber,
        validate: canSetTaxIdentification ? validateCompanyTaxNumber : undefined,
        sanitize: value => value.trim(),
      },
      address: {
        initialValue: initialAddressLine1,
        validate: validateRequired,
        sanitize: value => value.trim(),
      },
      city: {
        initialValue: initialCity,
        validate: validateRequired,
        sanitize: value => value.trim(),
      },
      postalCode: {
        initialValue: initialPostalCode,
        validate: validateRequired,
        sanitize: value => value.trim(),
      },
    },
  );

  useEffect(() => {
    if (isFirstMount) {
      serverValidationErrors.forEach(({ fieldName, code }) => {
        const message = getValidationErrorMessage(code);
        setFieldError(fieldName, message);
      });
    }
  }, [serverValidationErrors, isFirstMount, setFieldError]);

  const onPressPrevious = () => {
    Router.push(previousStep, { onboardingId });
  };

  const onPressNext = () => {
    submitForm(values => {
      if (
        !hasDefinedKeys(values, [
          "isRegistered",
          "name",
          "registrationNumber",
          "vatNumber",
          "address",
          "city",
          "postalCode",
        ])
      ) {
        return;
      }
      const {
        isRegistered,
        name,
        registrationNumber,
        vatNumber,
        taxIdentificationNumber,
        address,
        city,
        postalCode,
      } = values;

      updateOnboarding({
        input: {
          onboardingId,
          isRegistered,
          name,
          registrationNumber,
          vatNumber: emptyToUndefined(vatNumber),
          taxIdentificationNumber: emptyToUndefined(taxIdentificationNumber ?? ""),
          residencyAddress: {
            addressLine1: address,
            city,
            postalCode,
          },
        },
        language: locale.language,
      })
        .mapResult(({ unauthenticatedUpdateCompanyOnboarding }) =>
          match(unauthenticatedUpdateCompanyOnboarding)
            .with({ __typename: "UnauthenticatedUpdateCompanyOnboardingSuccessPayload" }, value =>
              Result.Ok(value),
            )
            .otherwise(error => Result.Error(error)),
        )
        .tapOk(() => {
          Router.push(nextStep, { onboardingId });
        })
        .tapError(error => {
          match(error)
            .with({ __typename: "ValidationRejection" }, error => {
              const invalidFields = extractServerValidationErrors(error, path =>
                match(path)
                  .with(["registrationNumber"] as const, ([fieldName]) => fieldName)
                  .with(["vatNumber"] as const, ([fieldName]) => fieldName)
                  .with(["taxIdentificationNumber"] as const, ([fieldName]) => fieldName)
                  .with(["residencyAddress", "addressLine1"], () => "address" as const)
                  .with(["residencyAddress", "city"] as const, ([, fieldName]) => fieldName)
                  .with(["residencyAddress", "postalCode"] as const, ([, fieldName]) => fieldName)
                  .otherwise(() => null),
              );
              invalidFields.forEach(({ fieldName, code }) => {
                const message = getValidationErrorMessage(code, values[fieldName]);
                setFieldError(fieldName, message);
              });
            })
            .otherwise(noop);

          const errorMessage = getUpdateOnboardingError(error);
          showToast({
            variant: "error",
            title: errorMessage.title,
            description: errorMessage.description,
          });
        });
    });
  };

  const onSelectCompany = useCallback(
    (suggestion: CompanySuggestion) => {
      // once a company is selected from auto-completion, we query our API to get some informations not available with auto-completion
      urql
        .query(
          GetCompanyInfoDocument,
          { siren: suggestion.siren },
          { requestPolicy: "network-only" },
        )
        .toPromise()
        .then(parseOperationResult)
        .then(({ companyInfoBySiren }) => {
          if (companyInfoBySiren.__typename !== "CompanyInfoBySirenSuccessPayload") {
            throw new Error(companyInfoBySiren.__typename);
          }

          const { companyName, siren, headquarters, vatNumber } = companyInfoBySiren.companyInfo;

          setFieldValue("name", companyName);
          setFieldValue("registrationNumber", siren);
          setFieldValue("vatNumber", vatNumber ?? "");
          setFieldValue("address", headquarters.address);
          setFieldValue("city", headquarters.town);
          setFieldValue("postalCode", headquarters.zipCode);
        })
        .catch(() => {
          // if request to get company info fail, we fill with info from auto completion
          setFieldValue("registrationNumber", suggestion.siren);
        });
    },
    [setFieldValue],
  );

  const countryRegisterName = registerNamePerCountry[country];

  return (
    <>
      <OnboardingStepContent>
        <ResponsiveContainer breakpoint={breakpoints.medium}>
          {({ small, large }) => (
            <>
              <StepTitle isMobile={small}>{t("company.step.organisation1.title")}</StepTitle>
              <Space height={small ? 24 : 32} />

              <Tile>
                <Field name="isRegistered">
                  {({ value, onChange }) => (
                    <LakeLabel
                      label={
                        countryRegisterName != null
                          ? t("company.step.organisation1.isRegisteredWithNameLabel", {
                              countryRegisterName,
                            })
                          : t("company.step.organisation1.isRegisteredLabel")
                      }
                      render={() => (
                        <Box direction="row" alignItems="center">
                          <LakeText variant="smallRegular" color={colors.gray[900]}>
                            {t("common.no")}
                          </LakeText>

                          <Space width={8} />
                          <Switch value={value} onValueChange={onChange} />
                          <Space width={8} />

                          <LakeText variant="smallRegular" color={colors.gray[900]}>
                            {t("common.yes")}
                          </LakeText>
                        </Box>
                      )}
                    />
                  )}
                </Field>

                <Space height={24} />

                <Field name="name">
                  {({ value, valid, error, onChange }) => (
                    <LakeLabel
                      label={t("company.step.organisation1.organisationLabel")}
                      render={() =>
                        country === "FRA" ? (
                          <LakeCompanyInput
                            value={value}
                            placeholder={t("company.step.organisation1.organisationPlaceholder")}
                            error={error}
                            onValueChange={onChange}
                            onSuggestion={onSelectCompany}
                            onLoadError={logFrontendError}
                          />
                        ) : (
                          <LakeTextInput
                            value={value}
                            placeholder={t("company.step.organisation1.organisationPlaceholder")}
                            valid={valid}
                            error={error}
                            onChangeText={onChange}
                          />
                        )
                      }
                    />
                  )}
                </Field>

                <Space height={12} />

                <FieldsListener names={["isRegistered"]}>
                  {({ isRegistered }) => (
                    <Field name="registrationNumber">
                      {({ value, valid, error, onChange }) => (
                        <LakeLabel
                          label={t("company.step.organisation1.registrationNumberLabel", {
                            registrationNumberLegalName: getRegistrationNumberName(country),
                          })}
                          optionalLabel={isRegistered.value ? undefined : t("common.optional")}
                          render={id => (
                            <LakeTextInput
                              id={id}
                              placeholder={t(
                                "company.step.organisation1.registrationNumberPlaceholder",
                              )}
                              value={value}
                              valid={valid}
                              // when we set isRegistered to false, validation on registrationNumber isn't triggered
                              error={isRegistered.value ? error : undefined}
                              onChangeText={onChange}
                            />
                          )}
                        />
                      )}
                    </Field>
                  )}
                </FieldsListener>

                <Space height={12} />

                <Field name="vatNumber">
                  {({ value, valid, error, onChange }) => (
                    <LakeLabel
                      label={t("company.step.organisation1.vatLabel")}
                      optionalLabel={t("common.optional")}
                      render={id => (
                        <LakeTextInput
                          id={id}
                          placeholder={t("company.step.organisation1.vatPlaceholder")}
                          value={value}
                          valid={valid}
                          error={error}
                          onChangeText={onChange}
                        />
                      )}
                    />
                  )}
                </Field>

                {canSetTaxIdentification && (
                  <>
                    <Space height={12} />

                    <Field name="taxIdentificationNumber">
                      {({ value, valid, error, onChange }) => (
                        <LakeLabel
                          label={t("company.step.organisation1.taxNumberLabel")}
                          optionalLabel={t("common.optional")}
                          render={id => (
                            <LakeTextInput
                              id={id}
                              placeholder={t("company.step.organisation1.taxNumberPlaceholder")}
                              value={value}
                              valid={valid}
                              error={error}
                              onChangeText={onChange}
                            />
                          )}
                        />
                      )}
                    </Field>
                  </>
                )}
              </Tile>

              <Space height={small ? 24 : 32} />
              <StepTitle isMobile={small}>{t("company.step.organisation1.addressTitle")}</StepTitle>
              <Space height={small ? 24 : 32} />

              <Tile>
                <AddressFormPart
                  initialAddress={initialAddressLine1}
                  initialCity={initialCity}
                  initialPostalCode={initialPostalCode}
                  country={country}
                  label={t("company.step.organisation1.addressLabel")}
                  Field={Field}
                  setFieldValue={setFieldValue}
                  listenFields={listenFields}
                  isLarge={large}
                />
              </Tile>
            </>
          )}
        </ResponsiveContainer>
      </OnboardingStepContent>

      <OnboardingFooter
        onPrevious={onPressPrevious}
        onNext={onPressNext}
        loading={updateResult.isLoading()}
      />
    </>
  );
};
