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
import {
  cleanData,
  transformRepresentativesToInput,
  transformUboToInput,
} from "../../../utils/onboarding";
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
  const [representatives, setRepresentatives] = useState<OnboardingRepresentative[]>();

  const { Field, FieldsListener, setFieldValue, submitForm } = useForm({
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
      initialValue: accountAdmin?.typeOfRepresentation,
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
        const representativesInput = transformRepresentativesToInput(representatives);

        if (option.isNone()) {
          return;
        }
        const currentValues = option.get();
        const { country, typeOfRepresentation, ...input } = currentValues;

        // @TODO: improve matching logic
        const selectedRepresentative = values.currentRepresentative
          .flatMap(value => Option.fromNullable(value))
          .map(value => representativesInput?.find(item => item.lastName === value))
          .toUndefined();

        const companyInfo = cleanData(publicData);
        const uboInput = transformUboToInput(publicData?.ultimateBeneficialOwners);

        updateCompanyOnboarding({
          input: {
            onboardingId,
            company: {
              ...input,
              representatives: representativesInput,
              ultimateBeneficialOwners: uboInput,
              vatNumber: companyInfo?.vatNumber,
              tradeName: companyInfo?.tradeName,
              taxIdentificationNumber: companyInfo?.taxIdentificationNumber,
              registrationNumber: companyInfo?.registrationNumber,
              registrationDate: companyInfo?.registrationDate,
              companyType: companyInfo?.companyType,
              businessActivityCode: companyInfo?.businessActivityCode,
              businessActivityDescription: companyInfo?.businessActivityDescription,
              address: {
                country,
                ...companyInfo?.address,
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
              const { representatives, legalFormCode, ...info } = companyInfo;
              setPublicData(info);
              setFieldValue("legalFormCode", legalFormCode ?? undefined);

              if (representatives) {
                setRepresentatives(representatives.filter(Boolean) as OnboardingRepresentative[]);
              } else {
                setRepresentatives(undefined);
              }
            },
          )
          .otherwise(noop);
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
                              representatives={representatives}
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
