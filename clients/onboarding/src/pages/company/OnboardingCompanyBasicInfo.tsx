import { Option } from "@swan-io/boxed";
import { useMutation } from "@swan-io/graphql-client";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { RadioGroup, RadioGroupItem } from "@swan-io/lake/src/components/RadioGroup";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { breakpoints } from "@swan-io/lake/src/constants/design";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { CountryCCA3, companyCountries } from "@swan-io/shared-business/src/constants/countries";
import { showToast } from "@swan-io/shared-business/src/state/toasts";
import { translateError } from "@swan-io/shared-business/src/utils/i18n";
import { useForm } from "@swan-io/use-form";
import { useEffect, useState } from "react";
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

type BasicInfoValues = {
  country: CountryCCA3;
  typeOfRepresentation: TypeOfRepresentation;
  companyType: CompanyType;
};

type Props = {
  nextStep: CompanyOnboardingRoute;
  onboardingId: string;
  initialValues: BasicInfoValues;
};

const companyTypesPerCountry: Partial<Record<CountryCCA3, string>> = {
  BEL: "(SA, SPRL, SRL, SCRIS, SNC, SCS, GIE)",
  DEU: "(z.B. GmbH, UG, KG, GbR)",
  FRA: "(SA, SARL, SAS, SCI…)",
  ITA: "(SS, SRL, SPA, SNC, SAS…)",
  LUX: "(SA, SCS, SARLI, SNC, SCA, SC)",
  NLD: "(BV, NV, VOF…)",
};

const coOwnershipTypesPerCountry: Partial<Record<CountryCCA3, string>> = {
  NLD: "(VvE...)",
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

const getCompanyTypes = (country: CountryCCA3): RadioGroupItem<CompanyType>[] => {
  const items: RadioGroupItem<CompanyType>[] = [];
  items.push(
    {
      name: `${t("companyType.company")} ${companyTypesPerCountry[country] ?? ""}`,
      value: "Company",
    },
    {
      name: t("companyType.association"),
      value: "Association",
    },
  );

  const countriesWithHomeOwnerAssociation: CountryCCA3[] = ["FRA", "BEL", "DEU", "ESP", "NLD"];
  if (countriesWithHomeOwnerAssociation.includes(country)) {
    items.push({
      name: `${t("companyType.coOwnership")} ${coOwnershipTypesPerCountry[country] ?? ""}`,
      value: "HomeOwnerAssociation",
    });
  }

  items.push(
    {
      name: country === "FRA" ? t("companyType.selfEmployed.FRA") : t("companyType.selfEmployed"),
      value: "SelfEmployed",
    },
    { name: t("companyType.other"), value: "Other" },
  );

  return items;
};

export const OnboardingCompanyBasicInfo = ({ nextStep, onboardingId, initialValues }: Props) => {
  const [updateOnboarding, updateResult] = useMutation(UpdateCompanyOnboardingDocument);

  const { Field, submitForm, listenFields, setFieldValue } = useForm({
    country: {
      initialValue: initialValues.country,
    },
    typeOfRepresentation: {
      initialValue: initialValues.typeOfRepresentation,
    },
    companyType: {
      initialValue: initialValues.companyType,
    },
  });

  const [companyTypes, setCompanyTypes] = useState<RadioGroupItem<CompanyType>[]>(() =>
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
    submitForm({
      onSuccess: values => {
        const option = Option.allFromDict(values);

        if (option.isNone()) {
          return;
        }

        const { country, typeOfRepresentation, companyType } = option.get();

        updateOnboarding({
          input: {
            onboardingId,
            companyType,
            typeOfRepresentation,
            residencyAddress: { country },
            language: locale.language,
          },
          language: locale.language,
        })
          .mapOk(data => data.unauthenticatedUpdateCompanyOnboarding)
          .mapOkToResult(filterRejectionsToResult)
          .tapOk(() => Router.push(nextStep, { onboardingId }))
          .tapError(error => {
            // No need to add specific message depending on validation
            // because all fields are select or radio (so we can't have syntax error)
            // and all fields have a default value (so we can't have missing value)
            showToast({ variant: "error", error, title: translateError(error) });
          });
      },
    });
  };

  return (
    <>
      <OnboardingStepContent>
        <ResponsiveContainer breakpoint={breakpoints.medium}>
          {({ small }) => (
            <>
              <LakeHeading
                level={1}
                variant={small ? "h3" : "h1"}
                align={small ? "center" : "left"}
              >
                {t("company.step.basicInfo.title")}
              </LakeHeading>

              <Space height={small ? 8 : 12} />

              <LakeText align={small ? "center" : "left"}>
                {t("company.step.basicInfo.description")}
              </LakeText>

              <Space height={small ? 24 : 32} />

              <Tile>
                <Field name="country">
                  {({ value, onChange }) => (
                    <OnboardingCountryPicker
                      label={t("company.step.basicInfo.countryLabel")}
                      countries={companyCountries}
                      value={value}
                      onValueChange={onChange}
                      holderType="company"
                      onlyIconHelp={small}
                      hideError={true}
                    />
                  )}
                </Field>

                <Space height={small ? 24 : 32} />

                <Field name="typeOfRepresentation">
                  {({ value, onChange }) => (
                    <LakeLabel
                      label={t("company.step.basicInfo.legalRepresentativeLabel")}
                      type="radioGroup"
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

                {/* use 12 instead of 24 for large screen because RadioGroup with row direction has 12px margin bottom */}
                <Space height={small ? 24 : 12} />

                <Field name="companyType">
                  {({ value, onChange }) => (
                    <LakeLabel
                      label={t("company.step.basicInfo.organisationTypeLabel")}
                      type="radioGroup"
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

        <OnboardingFooter onNext={onPressNext} loading={updateResult.isLoading()} />
      </OnboardingStepContent>
    </>
  );
};
