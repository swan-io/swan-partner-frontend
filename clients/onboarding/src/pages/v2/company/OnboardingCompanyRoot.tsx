import { useDeferredQuery, useMutation } from "@swan-io/graphql-client";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { breakpoints } from "@swan-io/lake/src/constants/design";
import { useForm } from "@swan-io/use-form";
import { StyleSheet } from "react-native";
import { match, P } from "ts-pattern";
import { OnboardingFooter } from "../../../components/OnboardingFooter";
import { StepTitle } from "../../../components/StepTitle";
import {
  CompanyOnboardingFragment,
  GetPublicCompamyInfoRegistryDataDocument,
  UpdatePublicCompanyAccountHolderOnboardingDocument,
} from "../../../graphql/partner";
import { t } from "../../../utils/i18n";

import { Option } from "@swan-io/boxed";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { noop } from "@swan-io/lake/src/utils/function";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { pick } from "@swan-io/lake/src/utils/object";
import { trim } from "@swan-io/lake/src/utils/string";
import {
  CountryCCA3,
  individualCountries,
  isCountryCCA3,
} from "@swan-io/shared-business/src/constants/countries";
import { showToast } from "@swan-io/shared-business/src/state/toasts";
import { validateRequired } from "@swan-io/shared-business/src/utils/validation";
import { useCallback, useState } from "react";
import { View } from "react-native";
import { OnboardingCountryPicker } from "../../../components/CountryPicker";
import { LakeCompanyInput } from "../../../components/LakeCompanyInput";
import { CompanySuggestion } from "../../../utils/Pappers";
import { Router } from "../../../utils/routes";
import { getUpdateOnboardingError } from "../../../utils/templateTranslations";

type Props = {
  onboarding: NonNullable<CompanyOnboardingFragment>;
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

const cleanRegistryData = (value: unknown) => {
  if (value == null) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value.map(cleanRegistryData).filter(item => item !== undefined);
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const cleaned: Record<string, unknown> = {};

    for (const [key, item] of Object.entries(record)) {
      if (key === "__typename") {
        continue;
      }

      const next = cleanRegistryData(item);

      if (next !== undefined) {
        cleaned[key] = next;
      }
    }

    return cleaned;
  }

  return value;
};

export const OnboardingCompanyRoot = ({ onboarding }: Props) => {
  const onboardingId = onboarding.id;
  const { accountAdmin, accountInfo, company } = onboarding;

  const [updateCompanyOnboarding, updateResult] = useMutation(
    UpdatePublicCompanyAccountHolderOnboardingDocument,
  );

  const [_publicCompany, { query }] = useDeferredQuery(GetPublicCompamyInfoRegistryDataDocument);

  const [siren, setSiren] = useState<string | null>(null);

  const { Field, FieldsListener, submitForm } = useForm({
    name: {
      initialValue: company?.name ?? "",
      sanitize: trim,
      validate: validateRequired,
    },
    country: {
      initialValue: match([company?.address?.country, accountInfo?.country])
        .returnType<CountryCCA3>()
        .with([P.when(isCountryCCA3), P._], ([country]) => country)
        .with([P._, P.when(isCountryCCA3)], ([_, country]) => country)
        .otherwise(() => "FRA"),
      validate: validateRequired,
    },
    legalFormCode: {
      initialValue: company?.legalFormCode,
    },
    typeOfRepresentation: {
      initialValue: accountAdmin?.typeOfRepresentation,
    },
  });

  const onPressNext = () => {
    // Router.push("Details", { onboardingId });
    submitForm({
      onSuccess: values => {
        const option = Option.allFromDict(pick(values, ["name", "country"]));
        console.log("values", values);
        if (option.isNone()) {
          return;
        }
        const currentValues = option.get();
        const { name, ...input } = currentValues;

        if (siren) {
          query({
            input: { registrationNumber: siren, residencyAddressCountry: "FRA" },
          }).tapOk(({ publicCompanyInfoRegistryData }) => {
            match(publicCompanyInfoRegistryData)
              .with(
                { __typename: "PublicCompanyInfoRegistryDataSuccessPayload" },
                ({ companyInfo }) => {
                  console.log("companyInfo", companyInfo);
                  const data = cleanRegistryData(companyInfo);
                  const { legalFormCode, address, ...company } = data;

                  updateCompanyOnboarding({
                    input: {
                      onboardingId,
                      company: {
                        ...company,
                      },
                    },
                  })
                    .mapOk(data => data.updatePublicCompanyAccountHolderOnboarding)
                    .mapOkToResult(filterRejectionsToResult)
                    // .tapOk(() => Router.push("Details", { onboardingId }))
                    .tapError(error => {
                      showToast({ variant: "error", error, ...getUpdateOnboardingError(error) });
                    });
                },
              )
              .otherwise(noop);
          });
        }

        console.log("#updateCompanyOnboarding");

        updateCompanyOnboarding({
          input: {
            onboardingId,
            company: {
              name,
              address: {
                ...input,
              },
            },
          },
        })
          .mapOk(data => data.updatePublicCompanyAccountHolderOnboarding)
          .mapOkToResult(filterRejectionsToResult)
          .tapOk(() => Router.push("Details", { onboardingId }))
          .tapError(error => {
            match(error)
              .with({ __typename: "ValidationRejection" }, _error => {
                // const invalidFields = extractServerValidationErrors(error, path => {
                //   return match(path)
                //     .with(["accountAdmin", "email"], () => "email" as const)
                //     .with(["accountAdmin", "firstName"], () => "firstName" as const)
                //     .with(["accountAdmin", "lastName"], () => "lastName" as const)
                //     .with(["accountAdmin", "nationality"], () => "nationality" as const)
                //     .with(["accountAdmin", "birthInfo", "birthDate"], () => "birthDate" as const)
                //     .with(["accountAdmin", "birthInfo", "country"], () => "birthCountry" as const)
                //     .with(["accountAdmin", "birthInfo", "city"], () => "birthCity" as const)
                //     .with(["accountAdmin", "birthInfo", "postalCode"], () => "birthPostal" as const)
                //     .with(
                //       ["accountAdmin", "address", "addressLine1"],
                //       () => "residenceAddress" as const,
                //     )
                //     .with(["accountAdmin", "address", "country"], () => "residenceCountry" as const)
                //     .with(["accountAdmin", "address", "city"], () => "residenceCity" as const)
                //     .with(
                //       ["accountAdmin", "address", "postalCode"],
                //       () => "residencePostal" as const,
                //     )
                //     .otherwise(() => null);
                // });
                // invalidFields.forEach(({ fieldName, code }) => {
                //   const message = getValidationErrorMessage(code, currentValues[fieldName]);
                //   setFieldError(fieldName, message);
                // });
              })
              .otherwise(noop);
            showToast({ variant: "error", error, ...getUpdateOnboardingError(error) });
          });
      },
    });
  };

  const onSelectCompany = useCallback(({ siren }: CompanySuggestion) => {
    setSiren(siren);
  }, []);

  const country = "FRA";

  return (
    <>
      <ResponsiveContainer breakpoint={breakpoints.medium} style={styles.gap}>
        {({ large, small }) => (
          <>
            <Tile style={styles.gap}>
              <StepTitle isMobile={small}>{t("individual.step.about.title1")}</StepTitle>
              <View style={[styles.grid, large && styles.gridDesktop]}>
                <Field name="country">
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

                <Field name="name">
                  {({ value, valid, error, onChange, ref }) => (
                    <LakeLabel
                      label={t("company.step.organisation1.organisationLabel")}
                      render={id =>
                        country === "FRA" ? (
                          <LakeCompanyInput
                            id={id}
                            ref={ref}
                            value={value}
                            placeholder={t("company.step.organisation1.organisationPlaceholder")}
                            error={error}
                            onValueChange={onChange}
                            onSuggestion={onSelectCompany}
                            onLoadError={noop}
                            // disabled={autofillResult.isLoading()}
                          />
                        ) : (
                          <LakeTextInput
                            id={id}
                            ref={ref}
                            value={value}
                            placeholder={t("company.step.organisation1.organisationPlaceholder")}
                            valid={valid}
                            error={error}
                            onChangeText={onChange}
                            // disabled={autofillResult.isLoading()}
                          />
                        )
                      }
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
