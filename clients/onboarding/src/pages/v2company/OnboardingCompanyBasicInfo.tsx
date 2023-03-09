import { Result } from "@swan-io/boxed";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { RadioGroup, RadioGroupItem } from "@swan-io/lake/src/components/RadioGroup";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { breakpoints } from "@swan-io/lake/src/constants/design";
import { useUrqlMutation } from "@swan-io/lake/src/hooks/useUrqlMutation";
import { showToast } from "@swan-io/lake/src/state/toasts";
import {
  companyCountriesItems,
  CountryCCA3,
} from "@swan-io/shared-business/src/constants/countries";
import { useEffect, useMemo, useState } from "react";
import { hasDefinedKeys, useForm } from "react-ux-form";
import { match, P } from "ts-pattern";
import { OnboardingCountryPicker } from "../../components/CountryPicker";
import { OnboardingFooter } from "../../components/OnboardingFooter";
import { OnboardingStepContent } from "../../components/OnboardingStepContent";
import {
  CompanyType,
  TypeOfRepresentation,
  UpdateCompanyOnboardingDocument,
} from "../../graphql/unauthenticated";
import { locale, t } from "../../utils/i18n";
import { CompanyOnboardingRoute, Router } from "../../utils/routes";

type FormCompanyType = CompanyType | "NonRegistredCompany";

type BasicInfoValues = {
  country: CountryCCA3;
  typeOfRepresentation: TypeOfRepresentation;
  companyType: CompanyType;
  isRegistered: boolean;
};

type Props = {
  nextStep: CompanyOnboardingRoute;
  onboardingId: string;
  initialValues: BasicInfoValues;
  hasUbos: boolean;
};

const companyTypesPerCountry: Partial<Record<CountryCCA3, string>> = {
  BEL: "(SA, SPRL, SCRL, SCRIS, SNC, SCS, GIE)",
  DEU: "(GmbH, EI, Gbr, KG)",
  FRA: "(SA, SARL, SAS, SCI, EI, EIRL, Micro-entreprise…)",
  ITA: "(SS, SRL, SPA, SNC, SAS…)",
  LUX: "(SA, SCS, SARLI, SNC, SCA, SC)",
  NLD: "(BV, NV, VOF…)",
};

const typeOfRepresentationItems: RadioGroupItem<TypeOfRepresentation>[] = [
  {
    name: t("company.step.basicInfo.legalRepresentative"),
    value: "LegalRepresentative",
  },
  {
    name: t("company.step.basicInfo.powerOfAttorney"),
    value: "PowerOfAttorney",
  },
];

const companyTypeToFormCompanyType = ({
  companyType,
  isRegistered,
}: BasicInfoValues): FormCompanyType => {
  return match({ companyType, isRegistered })
    .with({ companyType: "Company", isRegistered: true }, () => "Company" as const)
    .with({ companyType: "Company", isRegistered: false }, () => "NonRegistredCompany" as const)
    .with({ companyType: P.string }, ({ companyType }) => companyType)
    .exhaustive();
};

const formCompanyTypeToCompanyType = (
  formCompanyType: FormCompanyType,
): { companyType: CompanyType; isRegistered: boolean } => {
  return match(formCompanyType)
    .with("Company", () => ({ companyType: "Company" as const, isRegistered: true }))
    .with("NonRegistredCompany", () => ({ companyType: "Company" as const, isRegistered: false }))
    .with(P.string, companyType => ({ companyType, isRegistered: false }))
    .exhaustive();
};

const getCompanyTypes = (country: CountryCCA3): RadioGroupItem<FormCompanyType>[] => {
  const items: RadioGroupItem<FormCompanyType>[] = [];
  items.push(
    {
      name: `${t("companyType.registredCompany")} ${companyTypesPerCountry[country] ?? ""}`,
      value: "Company",
    },
    {
      name: `${t("companyType.nonRegistredCompany")} ${companyTypesPerCountry[country] ?? ""}`,
      value: "NonRegistredCompany",
    },
    {
      name: t("companyType.association"),
      value: "Association",
    },
  );

  const countriesWithHomeOwnerAssociation: CountryCCA3[] = ["FRA", "BEL"];
  if (countriesWithHomeOwnerAssociation.includes(country)) {
    items.push({
      name: t("companyType.homeOwnerAssociation"),
      value: "HomeOwnerAssociation",
    });
  }

  items.push(
    { name: t("companyType.selfEmployed"), value: "SelfEmployed" },
    { name: t("companyType.other"), value: "Other" },
  );

  return items;
};

export const OnboardingCompanyBasicInfo = ({
  nextStep,
  onboardingId,
  initialValues,
  hasUbos,
}: Props) => {
  const [updateResult, updateOnboarding] = useUrqlMutation(UpdateCompanyOnboardingDocument);

  const formCompanyType: FormCompanyType = useMemo(
    () => companyTypeToFormCompanyType(initialValues),
    [initialValues],
  );

  const { Field, submitForm, listenFields, setFieldValue } = useForm({
    country: {
      initialValue: initialValues.country,
    },
    typeOfRepresentation: {
      initialValue: initialValues.typeOfRepresentation,
    },
    companyType: {
      initialValue: formCompanyType,
    },
  });

  const [companyTypes, setCompanyTypes] = useState<RadioGroupItem<FormCompanyType>[]>(() =>
    getCompanyTypes(initialValues.country),
  );

  useEffect(() => {
    return listenFields(["country", "companyType"], ({ country, companyType }) => {
      const companyTypes = getCompanyTypes(country.value);
      const companyTypeIsAvailable = companyTypes.some(({ value }) => value === companyType.value);
      if (!companyTypeIsAvailable) {
        setFieldValue("companyType", "Company");
      }

      setCompanyTypes(companyTypes);
    });
  }, [listenFields, setFieldValue]);

  const onPressNext = () => {
    submitForm(values => {
      if (!hasDefinedKeys(values, ["country", "typeOfRepresentation", "companyType"])) {
        return;
      }

      const { companyType, isRegistered } = formCompanyTypeToCompanyType(values.companyType);
      const { country, typeOfRepresentation } = values;

      updateOnboarding({
        input: {
          onboardingId,
          companyType,
          isRegistered,
          typeOfRepresentation,
          residencyAddress: { country },
          // set ubos to empty to prevent backend auto-filling them in background
          // only when the user has not defined any ubos
          individualUltimateBeneficialOwners: !hasUbos ? [] : undefined,
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
        .tapError(() => {
          // No need to add specific message depending on validation
          // because all fields are select or radio (so we can't have syntax error)
          // and all fields have a default value (so we can't have missing value)
          showToast({ variant: "error", title: t("error.generic") });
        });
    });
  };

  return (
    <>
      <OnboardingStepContent>
        <ResponsiveContainer breakpoint={breakpoints.medium}>
          {({ small }) => (
            <>
              <LakeHeading level={1}>{t("company.step.basicInfo.title")}</LakeHeading>
              <Space height={small ? 8 : 12} />
              <LakeText>{t("company.step.basicInfo.description")}</LakeText>
              <Space height={small ? 24 : 32} />

              <Tile>
                <Field name="country">
                  {({ value, onChange }) => (
                    <OnboardingCountryPicker
                      label={t("company.step.basicInfo.countryLabel")}
                      items={companyCountriesItems}
                      value={value}
                      onValueChange={onChange}
                      holderType="company"
                      onlyIconHelp={small}
                    />
                  )}
                </Field>

                <Space height={small ? 24 : 32} />

                <Field name="typeOfRepresentation">
                  {({ value, onChange }) => (
                    <LakeLabel
                      label={t("company.step.basicInfo.legalRepresentativeLabel")}
                      render={() => (
                        <RadioGroup
                          direction={small ? "column" : "row"}
                          items={typeOfRepresentationItems}
                          value={value}
                          onValueChange={onChange}
                        />
                      )}
                    />
                  )}
                </Field>

                <Space height={24} />

                <Field name="companyType">
                  {({ value, onChange }) => (
                    <LakeLabel
                      label={t("company.step.basicInfo.organisationTypeLabel")}
                      optionalLabel={t("company.step.basicInfo.organisationTypeOptional")}
                      render={() => (
                        <RadioGroup items={companyTypes} value={value} onValueChange={onChange} />
                      )}
                    />
                  )}
                </Field>
              </Tile>
            </>
          )}
        </ResponsiveContainer>
      </OnboardingStepContent>

      <OnboardingFooter onNext={onPressNext} loading={updateResult.isLoading()} />
    </>
  );
};
