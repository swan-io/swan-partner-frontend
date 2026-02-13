import { useDeferredQuery, useMutation } from "@swan-io/graphql-client";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { breakpoints } from "@swan-io/lake/src/constants/design";
import { useForm } from "@swan-io/use-form";
import { StyleSheet } from "react-native";
import { match, P } from "ts-pattern";
import { OnboardingFooter } from "../../../components/OnboardingFooter";
import {
  CompanyOnboardingFragment,
  GetPublicCompamyInfoRegistryDataDocument,
  LegalForm,
  OnboardingRepresentative,
  UpdatePublicCompanyAccountHolderOnboardingDocument,
} from "../../../graphql/partner";
import { t } from "../../../utils/i18n";

import { Option } from "@swan-io/boxed";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { RadioGroup } from "@swan-io/lake/src/components/RadioGroup";
import { noop } from "@swan-io/lake/src/utils/function";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { trim } from "@swan-io/lake/src/utils/string";
import {
  CountryCCA3,
  individualCountries,
  isCountryCCA3,
} from "@swan-io/shared-business/src/constants/countries";
import { showToast } from "@swan-io/shared-business/src/state/toasts";
import { validateRequired } from "@swan-io/shared-business/src/utils/validation";
import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import { OnboardingCountryPicker } from "../../../components/CountryPicker";
import { LakeCompanyInput } from "../../../components/LakeCompanyInput";
import { LegalFormsInput } from "../../../components/LegalFormsInput";
import { RepresentativeFormsInput } from "../../../components/RepresentativeFormInput";
import { transformRepresentativesToInput } from "../../../utils/onboarding";
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
    gap: "16px 32px",
  },
});

// WIP
// const cleanRegistryData = (value: unknown) => {
//   if (value == null) {
//     return undefined;
//   }

//   if (Array.isArray(value)) {
//     return value.map(cleanRegistryData).filter(item => item !== undefined);
//   }

//   if (typeof value === "object") {
//     const record = value as Record<string, unknown>;
//     const cleaned: Record<string, unknown> = {};

//     for (const [key, item] of Object.entries(record)) {
//       if (key === "__typename") {
//         continue;
//       }

//       const next = cleanRegistryData(item);

//       if (next !== undefined) {
//         cleaned[key] = next;
//       }
//     }

//     return cleaned;
//   }

//   return value;
// };

export const OnboardingCompanyRoot = ({ onboarding }: Props) => {
  const onboardingId = onboarding.id;
  const { accountAdmin, accountInfo, company } = onboarding;

  const [updateCompanyOnboarding, updateResult] = useMutation(
    UpdatePublicCompanyAccountHolderOnboardingDocument,
  );

  const [_publicCompany, { query }] = useDeferredQuery(GetPublicCompamyInfoRegistryDataDocument);

  const [siren, setSiren] = useState<string | null>(null);
  const [representatives, setRepresentatives] = useState<OnboardingRepresentative[]>();

  const { Field, FieldsListener, setFieldValue, submitForm } = useForm({
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
      initialValue: company?.legalFormCode ?? "",
    },
    typeOfRepresentation: {
      initialValue: accountAdmin?.typeOfRepresentation,
    },
    currentRepresentative: {
      initialValue: "",
    },
  });

  const onPressNext = () => {
    submitForm({
      onSuccess: values => {
        const option = Option.allFromDict(values);
        const representativesInput = transformRepresentativesToInput(representatives);

        if (option.isNone()) {
          return;
        }
        const currentValues = option.get();
        const { country, typeOfRepresentation, currentRepresentative, ...input } = currentValues;

        // @TODO: improve matching logic
        const selectedRepresentative = representativesInput?.find(
          item => item.lastName === currentRepresentative,
        );

        updateCompanyOnboarding({
          input: {
            onboardingId,
            company: {
              ...input,
              representatives: representativesInput,
              address: {
                country,
              },
            },
            accountAdmin: {
              firstName: selectedRepresentative?.firstName,
              lastName: selectedRepresentative?.lastName,
              address: selectedRepresentative?.address,
              birthInfo: selectedRepresentative?.birthInfo,
              nationality: selectedRepresentative?.nationality,
              email: selectedRepresentative?.email,
              typeOfRepresentation,
            },
          },
        })
          .mapOk(data => data.updatePublicCompanyAccountHolderOnboarding)
          .mapOkToResult(filterRejectionsToResult)
          .tapOk(() => Router.push("Details", { onboardingId }))
          .tapError(error => {
            match(error)
              .with({ __typename: "ValidationRejection" }, _error => {
                // @TODO: handle validation errors@
                // const invalidFields = extractServerValidationErrors(error, path => {
                //   return match(path)
                //     .with(["accountAdmin", "email"], () => "email" as const)
                //     .with(["accountAdmin", "firstName"], () => "firstName" as const)
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

  useEffect(() => {
    if (siren != null) {
      query({
        input: { registrationNumber: siren, residencyAddressCountry: "FRA" },
      }).tapOk(({ publicCompanyInfoRegistryData }) => {
        match(publicCompanyInfoRegistryData)
          .with(
            { __typename: "PublicCompanyInfoRegistryDataSuccessPayload" },
            ({ companyInfo }) => {
              if (companyInfo?.representatives) {
                setRepresentatives(
                  companyInfo.representatives.filter(Boolean) as OnboardingRepresentative[],
                );
              } else {
                setRepresentatives(undefined);
              }
            },
          )
          .otherwise(noop);
      });
    }
  }, [siren, query]);

  const onSelectCompany = useCallback(
    ({ siren, name }: CompanySuggestion) => {
      setSiren(siren);
      setFieldValue("name", name);
    },
    [setFieldValue],
  );

  const onSelectLegalFormCode = useCallback(
    ({ code }: LegalForm) => {
      setFieldValue("legalFormCode", code);
    },
    [setFieldValue],
  );

  return (
    <>
      <ResponsiveContainer breakpoint={breakpoints.medium} style={styles.gap}>
        {({ large, small }) => (
          <>
            <LakeHeading level={1}>{t("company.step.organisation.title")}</LakeHeading>
            <LakeText>{t("company.step.organisation.subtitle")}</LakeText>
            <Tile style={styles.gap}>
              <View style={[styles.grid, large && styles.gridDesktop]}>
                <Field name="country">
                  {({ value, onChange }) => (
                    <OnboardingCountryPicker
                      label={t("company.step.organisation.countryLabel")}
                      value={value}
                      countries={individualCountries}
                      holderType="individual"
                      onlyIconHelp={small}
                      onValueChange={onChange}
                    />
                  )}
                </Field>

                <FieldsListener names={["country", "name", "legalFormCode"]}>
                  {({ country }) => (
                    <>
                      <Field name="name">
                        {({ value, valid, error, onChange, ref }) => (
                          <LakeLabel
                            label={t("company.step.organisation.nameLabel")}
                            render={id =>
                              country.value === "FRA" ? (
                                <LakeCompanyInput
                                  id={id}
                                  ref={ref}
                                  value={value}
                                  error={error}
                                  onValueChange={onChange}
                                  onSuggestion={onSelectCompany}
                                  onLoadError={noop}
                                />
                              ) : (
                                <LakeTextInput
                                  id={id}
                                  ref={ref}
                                  value={value}
                                  valid={valid}
                                  error={error}
                                  onChangeText={onChange}
                                />
                              )
                            }
                          />
                        )}
                      </Field>

                      {/* {country.value !== "FRA" && ( */}
                      <Field name="legalFormCode">
                        {({ value, onChange, ref }) => (
                          <LakeLabel
                            label={t("company.step.organisation.legalFormLabel")}
                            render={id => (
                              <LegalFormsInput
                                id={id}
                                ref={ref}
                                value={value}
                                country={country.value}
                                placeholder={t("company.step.organisation.legalFormPlaceholder")}
                                onSuggestion={onSelectLegalFormCode}
                                onValueChange={onChange}
                                onLoadError={noop}
                              />
                            )}
                          />
                        )}
                      </Field>
                      {/* )} */}

                      {/* {country.value === "FRA" && ( */}
                      <LakeLabel
                        label={t("company.step.organisation.relationLabel")}
                        render={() => (
                          <Field name="typeOfRepresentation">
                            {({ value, onChange }) => (
                              <RadioGroup
                                direction="row"
                                items={[
                                  {
                                    name: t("company.step.organisation.relation.legal"),
                                    value: "LegalRepresentative",
                                  },
                                  {
                                    name: t("company.step.organisation.relation.attorney"),
                                    value: "PowerOfAttorney",
                                  },
                                ]}
                                value={value}
                                onValueChange={onChange}
                              />
                            )}
                          </Field>
                        )}
                      />
                      {/* )} */}
                    </>
                  )}
                </FieldsListener>

                {representatives && (
                  <Field name="currentRepresentative">
                    {({ value, onChange }) => (
                      <RepresentativeFormsInput
                        representatives={representatives}
                        value={value}
                        onChange={onChange}
                      />
                    )}
                  </Field>
                )}
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
