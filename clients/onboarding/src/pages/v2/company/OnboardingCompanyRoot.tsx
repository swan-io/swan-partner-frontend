import { useDeferredQuery, useMutation } from "@swan-io/graphql-client";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { breakpoints, colors } from "@swan-io/lake/src/constants/design";
import { useForm } from "@swan-io/use-form";
import { StyleSheet } from "react-native";
import { match, P } from "ts-pattern";
import { OnboardingFooter } from "../../../components/OnboardingFooter";
import {
  CompanyInfo,
  CompanyOnboardingFragment,
  CompanyRelatedCompany,
  CompanyRelatedIndividual,
  GetPublicCompamyInfoRegistryDataDocument,
  LegalForm,
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
import { omit } from "@swan-io/lake/src/utils/object";
import { trim } from "@swan-io/lake/src/utils/string";
import {
  companyCountries,
  CountryCCA3,
  isCountryCCA3,
} from "@swan-io/shared-business/src/constants/countries";
import { showToast } from "@swan-io/shared-business/src/state/toasts";
import {
  validateNullableRequired,
  validateRequired,
} from "@swan-io/shared-business/src/utils/validation";
import { useCallback, useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { OnboardingCountryPicker } from "../../../components/CountryPicker";
import { LakeCompanyInput } from "../../../components/LakeCompanyInput";
import { LegalFormsInput } from "../../../components/LegalFormsInput";
import { RepresentativeFormsInput } from "../../../components/RepresentativeFormInput";
import { cleanData, transformRelatedIndividualsToInput } from "../../../utils/onboarding";
import { CompanySuggestion } from "../../../utils/Pappers";
import { Router } from "../../../utils/routes";
import { getUpdateOnboardingError } from "../../../utils/templateTranslations";
import {
  badUserInputErrorPattern,
  extractServerValidationFields,
  getValidationErrorMessage,
} from "../../../utils/validation";

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
  emptyResult: {
    paddingHorizontal: 24,
    paddingVertical: 4,
  },
  link: {
    color: colors.partner[500],
    textDecorationLine: "underline",
  },
  linkHover: {
    opacity: 0.8,
  },
});

export const OnboardingCompanyRoot = ({ onboarding }: Props) => {
  const onboardingId = onboarding.id;
  const { accountAdmin, accountInfo, company } = onboarding;

  const initialCountry = match([company?.address?.country, accountInfo?.country])
    .returnType<CountryCCA3>()
    .with([P.when(isCountryCCA3), P._], ([country]) => country)
    .with([P._, P.when(isCountryCCA3)], ([_, country]) => country)
    .otherwise(() => "FRA");

  const [updateCompanyOnboarding, updateResult] = useMutation(
    UpdatePublicCompanyAccountHolderOnboardingDocument,
  );
  const [_publicCompany, { query }] = useDeferredQuery(GetPublicCompamyInfoRegistryDataDocument);

  const [siren, setSiren] = useState<string | null>(null);
  const [publicData, setPublicData] = useState<CompanyInfo>();
  const [manualMode, setManualMode] = useState<boolean>(initialCountry !== "FRA");
  const [representatives, setRepresentatives] =
    useState<(CompanyRelatedIndividual | CompanyRelatedCompany)[]>();

  const { Field, FieldsListener, setFieldValue, setFieldError, submitForm } = useForm({
    name: {
      initialValue: company?.name ?? "",
      sanitize: trim,
      validate: validateRequired,
    },
    country: {
      initialValue: initialCountry,
      validate: validateRequired,
    },
    legalFormCode: {
      initialValue: company?.legalFormCode ?? undefined,
      validate: (value, { getFieldValue }) => {
        if (getFieldValue("country") !== "FRA") {
          return validateNullableRequired(value);
        }
      },
    },
    typeOfRepresentation: {
      initialValue: accountAdmin?.typeOfRepresentation || "LegalRepresentative",
    },
    currentRepresentative: {
      initialValue: accountAdmin?.lastName ?? undefined,
      validate: (value, { getFieldValue }) => {
        if (getFieldValue("country") === "FRA" && representatives && value == null) {
          return t("error.requiredField");
        }
      },
    },
  });

  const onPressNext = () => {
    submitForm({
      onSuccess: values => {
        const option = Option.allFromDict(omit(values, ["currentRepresentative"]));

        if (option.isNone()) {
          return;
        }
        const currentValues = option.get();
        const { country, typeOfRepresentation, ...input } = currentValues;

        // @TODO: improve matching logic
        const selectedRepresentative = values.currentRepresentative
          .flatMap(value => Option.fromNullable(value))
          .map(value =>
            representatives?.find(item =>
              match(item)
                .with(
                  { __typename: P.not("CompanyRelatedCompany") },
                  individual => individual.lastName === value,
                )
                .otherwise(() => false),
            ),
          )
          .toUndefined() as CompanyRelatedIndividual | undefined;
        const cleanedRepresentative = cleanData(selectedRepresentative);

        const companyInfo = cleanData(publicData);
        const relatedIndividuals = transformRelatedIndividualsToInput(
          publicData?.relatedIndividuals,
        );

        updateCompanyOnboarding({
          input: {
            onboardingId,
            company: {
              ...input,
              vatNumber: companyInfo?.vatNumber,
              tradeName: companyInfo?.tradeName,
              taxIdentificationNumber: companyInfo?.taxIdentificationNumber,
              registrationNumber: companyInfo?.registrationNumber,
              registrationDate: companyInfo?.registrationDate,
              businessActivity: companyInfo?.businessActivity,
              businessActivityCode: companyInfo?.businessActivityCode,
              businessActivityDescription: companyInfo?.businessActivityDescription,
              relatedCompanies: companyInfo?.relatedCompanies,
              relatedIndividuals: relatedIndividuals,
              address: {
                country,
                ...companyInfo?.address,
              },
            },
            accountAdmin: {
              firstName: cleanedRepresentative?.firstName,
              lastName: cleanedRepresentative?.lastName,
              address: cleanedRepresentative?.address,
              birthInfo: cleanedRepresentative?.birthInfo,
              nationality: cleanedRepresentative?.nationality,
              email: cleanedRepresentative?.email,
              typeOfRepresentation,
            },
          },
        })
          .mapOk(data => data.updatePublicCompanyAccountHolderOnboarding)
          .mapOkToResult(filterRejectionsToResult)
          .tapOk(() => Router.push("Details", { onboardingId }))
          .tapError(error => {
            match(error)
              .with(badUserInputErrorPattern, ({ fields }) => {
                const invalidFields = extractServerValidationFields(fields, path => {
                  return match(path)
                    .with(["company", "name"], () => "name" as const)
                    .with(["company", "legalFormCode"], () => "legalFormCode" as const)
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

  useEffect(() => {
    if (siren != null) {
      query({
        input: { registrationNumber: siren, residencyAddressCountry: "FRA" },
      })
        .tapOk(({ publicCompanyInfoRegistryData }) => {
          match(publicCompanyInfoRegistryData)
            .with({ __typename: "CompanyInfo" }, companyInfo => {
              console.log("companyInfo", companyInfo);
              const { relatedIndividuals, relatedCompanies, legalFormCode, ...info } = companyInfo;
              setPublicData(info);
              setFieldValue("legalFormCode", legalFormCode ?? undefined);
              setRepresentatives([...(relatedIndividuals ?? []), ...(relatedCompanies ?? [])]);
            })
            .otherwise(noop);
        })
        .tapError(() => {
          //@todo: For testing purposes must be removed before going in production
          const companyInfo: CompanyInfo = {
            __typename: "CompanyInfo",
            registrationNumber: "838622140",
            name: "SOURCE VENTURES",
            businessActivity: null,
            businessActivityCode: "66.30Z",
            businessActivityDescription: "Gestion de fonds",
            relatedCompanies: [
              {
                __typename: "CompanyRelatedCompany",
                registrationCountry: "FRA",
                entityName: "PARISIENNE D'EXPERTISE COMPTABLE SPEC",
                registrationNumber: null,
                roles: ["Commissaire aux comptes titulaire"],
              },
            ],
            relatedIndividuals: [
              {
                __typename: "CompanyLegalRepresentativeAndUltimateBeneficialOwner",
                firstName: "Martin",
                preferredFirstName: "Martin",
                address: {
                  __typename: "AddressInfo",
                  addressLine1: "16 Rue Gustave Nickles",
                  addressLine2: null,
                  city: "Bagnolet",
                  country: "FRA",
                  postalCode: "93170",
                  state: null,
                },
                birthInfo: {
                  __typename: "BirthInfo",
                  birthDate: "1987-02-23",
                  city: "Castres",
                  country: "FRA",
                  postalCode: null,
                },
                email: null,
                lastName: "Charpentier",
                legalRepresentative: {
                  __typename: "RelatedIndividualLegalRepresentative",
                  roles: ["Président"],
                },
                nationality: "FRA",
                sex: "Male",
                taxIdentificationNumber: null,
                type: "LegalRepresentativeAndUltimateBeneficialOwner",
                ultimateBeneficialOwner: {
                  __typename: "RelatedIndividualUltimateBeneficialOwner",
                  controlTypes: null,
                  ownership: {
                    __typename: "UltimateBeneficialOwnerOwnership",
                    totalPercentage: 35.79,
                    type: "Indirect",
                  },
                  qualificationType: "Ownership",
                },
                unitedStatesTaxInfo: null,
              },
              {
                __typename: "CompanyLegalRepresentative",
                firstName: "Victor, Nathan, Nicolas",
                preferredFirstName: "Victor",
                address: {
                  __typename: "AddressInfo",
                  addressLine1: "110 Avenue du Président Wilson",
                  addressLine2: null,
                  city: "Montreuil",
                  postalCode: "93100",
                  country: "FRA",
                  state: null,
                },
                email: null,
                lastName: "Mertz",
                legalRepresentative: {
                  __typename: "RelatedIndividualLegalRepresentative",
                  roles: ["Directeur général"],
                },
                sex: "Male",
                taxIdentificationNumber: null,
                type: "LegalRepresentative",
                birthInfo: {
                  __typename: "BirthInfo",
                  birthDate: "1986-11-01",
                  city: "Strasbourg",
                  country: "FRA",
                  postalCode: null,
                },
                nationality: "FRA",
                unitedStatesTaxInfo: null,
              },
            ],
            legalFormCode: "6CHY",
          };
          setPublicData(companyInfo);
          setFieldValue("legalFormCode", companyInfo.legalFormCode ?? undefined);

          setRepresentatives([
            ...(companyInfo.relatedIndividuals ?? []),
            ...(companyInfo.relatedCompanies ?? []),
          ]);
        });
    }
  }, [siren, query, setFieldValue]);

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
            <LakeText>
              {t("company.step.organisation.subtitle")} {manualMode ? "true" : "false"}
            </LakeText>
            <Tile style={styles.gap}>
              <View style={[styles.grid, large && styles.gridDesktop]}>
                <Field name="country">
                  {({ value, onChange }) => (
                    <OnboardingCountryPicker
                      label={t("company.step.organisation.countryLabel")}
                      value={value}
                      countries={companyCountries}
                      holderType="company"
                      onlyIconHelp={small}
                      onValueChange={country => {
                        setManualMode(country !== "FRA");
                        onChange(country);
                      }}
                    />
                  )}
                </Field>

                <FieldsListener names={["country", "currentRepresentative"]}>
                  {({ country, currentRepresentative }) => (
                    <>
                      <Field name="name">
                        {({ value, valid, error, onChange, ref }) => (
                          <LakeLabel
                            label={t("company.step.organisation.nameLabel")}
                            render={id =>
                              manualMode === false ? (
                                <LakeCompanyInput
                                  id={id}
                                  ref={ref}
                                  value={value}
                                  error={error}
                                  onValueChange={onChange}
                                  onSuggestion={onSelectCompany}
                                  onLoadError={noop}
                                  emptyResult={
                                    <LakeText style={styles.emptyResult}>
                                      {t("company.step.organisation.notListed")}{" "}
                                      <Pressable
                                        onPress={() => {
                                          setManualMode(true);
                                          setRepresentatives(undefined);
                                        }}
                                        style={({ hovered }) => hovered && styles.linkHover}
                                      >
                                        <LakeText style={styles.link}>
                                          {t("company.step.organisation.addDetails")}
                                        </LakeText>
                                      </Pressable>
                                    </LakeText>
                                  }
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

                      <Field name="legalFormCode">
                        {({ value, onChange, ref, error }) =>
                          manualMode ? (
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
                                  error={error}
                                  onValueChange={onChange}
                                  onLoadError={noop}
                                />
                              )}
                            />
                          ) : null
                        }
                      </Field>

                      {representatives && (
                        <Field name="currentRepresentative">
                          {({ value, onChange, error }) => (
                            <RepresentativeFormsInput
                              individuals={representatives}
                              value={value}
                              onChange={onChange}
                              error={error}
                            />
                          )}
                        </Field>
                      )}

                      <Field name="typeOfRepresentation">
                        {({ value, onChange }) =>
                          manualMode || currentRepresentative.value === "" ? (
                            <LakeLabel
                              label={t("company.step.organisation.relationLabel")}
                              render={() => (
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
                            />
                          ) : null
                        }
                      </Field>
                    </>
                  )}
                </FieldsListener>
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
