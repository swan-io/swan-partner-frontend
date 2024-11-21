import {
  CompanyWithUboCountryCCA3,
  CountryCCA3,
  isCompanyWithUboCountryCCA3,
} from "@swan-io/shared-business/src/constants/countries";

const countryUboDenominations: Record<
  CompanyWithUboCountryCCA3,
  { singular: string; plural: string; title: string }
> = {
  BEL: {
    singular: "Bénéficiaire effectif",
    plural: "Bénéficiaires effectifs",
    title: "Bénéficiaires",
  },
  DEU: {
    singular: "Wirtschaftlich Berechtigter",
    plural: "Wirtschaftlich Berechtigten",
    title: "Wirtschaftlich Berechtigte",
  },
  FRA: {
    singular: "Bénéficiaire effectif",
    plural: "Bénéficiaires effectifs",
    title: "Bénéficiaires",
  },
  ITA: {
    singular: "Titolare effettivo",
    plural: "Titolari effettivi",
    title: "Titolari effettivi",
  },
  LTU: {
    singular: "Ultimate Beneficial Owner",
    plural: "Ultimate Beneficial Owners",
    title: "Beneficial Owners",
  },
  LUX: {
    singular: "Bénéficiaire effectif",
    plural: "Bénéficiaires effectifs",
    title: "Bénéficiaires",
  },
  NLD: {
    singular: "Ultimate Beneficial Owner",
    plural: "Ultimate Beneficial Owners",
    title: "Beneficial Owners",
  },
};

export const getCountryUbo = (
  country: CountryCCA3 | undefined,
): { singular: string; plural: string; title: string } => {
  return isCompanyWithUboCountryCCA3(country)
    ? countryUboDenominations[country]
    : {
        singular: "Beneficiary",
        plural: "Beneficiaries",
        title: "Beneficiaries",
      };
};
