import {
  BusinessActivityCategory,
  CompanyHeadcount,
  ForecastYearlyIncome,
  MonthlyPaymentVolume,
} from "../graphql/partner";
import { t } from "../utils/i18n";

export const monthlyPaymentVolumes: { text: string; value: MonthlyPaymentVolume }[] = [
  { text: t("monthlyPaymentVolume.lessThan10000"), value: "LessThan10000" },
  { text: t("monthlyPaymentVolume.between10000And50000"), value: "Between10000And50000" },
  { text: t("monthlyPaymentVolume.between50000And100000"), value: "Between50000And100000" },
  { text: t("monthlyPaymentVolume.moreThan100000"), value: "MoreThan100000" },
];

export const forecastYearlyIncome: { text: string; value: ForecastYearlyIncome }[] = [
  { text: t("forecastYearlyIncome.from0To500000"), value: "From0To500000" },
  { text: t("forecastYearlyIncome.from500001To1000000"), value: "From500001To1000000" },
  { text: t("forecastYearlyIncome.from1000001To5000000"), value: "From1000001To5000000" },
  { text: t("forecastYearlyIncome.moreThan5000000"), value: "MoreThan5000000" },
];

export const companyHeadcount: { text: string; value: CompanyHeadcount }[] = [
  { text: "1-10", value: "Between1And10" },
  { text: "11-50", value: "Between11And50" },
  { text: "51-250", value: "Between51And250" },
  { text: "+250", value: "MoreThan250" },
];

export const businessActivityCategories: { text: string; value: BusinessActivityCategory }[] = [
  {
    text: t("businessActivityCategory.accommodationAndFoodService"),
    value: "AccommodationAndFoodService",
  },
  {
    text: t("businessActivityCategory.administrativeAndSupportServiceActivities"),
    value: "AdministrativeAndSupportServiceActivities",
  },
  {
    text: t("businessActivityCategory.agricultureForestryAndFishing"),
    value: "AgricultureForestryAndFishing",
  },
  { text: t("businessActivityCategory.artsSportsAndRecreation"), value: "ArtsSportsAndRecreation" },
  { text: t("businessActivityCategory.construction"), value: "Construction" },
  { text: t("businessActivityCategory.education"), value: "Education" },
  {
    text: t("businessActivityCategory.electricityGasSteamAndAirConditioningSupply"),
    value: "ElectricityGasSteamAndAirConditioningSupply",
  },
  {
    text: t("businessActivityCategory.extraterritorialOrganisationsAndBodies"),
    value: "ExtraterritorialOrganisationsAndBodies",
  },
  {
    text: t("businessActivityCategory.financialAndInsuranceActivities"),
    value: "FinancialAndInsuranceActivities",
  },
  {
    text: t("businessActivityCategory.householdEmployerAndOwnUseActivities"),
    value: "HouseholdEmployerAndOwnUseActivities",
  },
  {
    text: t("businessActivityCategory.humanHealthAndSocialWork"),
    value: "HumanHealthAndSocialWork",
  },
  { text: t("businessActivityCategory.manufacturing"), value: "Manufacturing" },
  { text: t("businessActivityCategory.miningAndQuarrying"), value: "MiningAndQuarrying" },
  {
    text: t("businessActivityCategory.professionalScientificAndTechnicalActivities"),
    value: "ProfessionalScientificAndTechnicalActivities",
  },
  {
    text: t("businessActivityCategory.publicAdministrationAndDefenceSocialSecurity"),
    value: "PublicAdministrationAndDefenceSocialSecurity",
  },
  {
    text: t("businessActivityCategory.publishingBroadcastingAndContentProductionAndDistribution"),
    value: "PublishingBroadcastingAndContentProductionAndDistribution",
  },
  { text: t("businessActivityCategory.realEstateActivities"), value: "RealEstateActivities" },
  {
    text: t("businessActivityCategory.telecommunicationItAndInformationServices"),
    value: "TelecommunicationItAndInformationServices",
  },
  {
    text: t("businessActivityCategory.transportationAndStorage"),
    value: "TransportationAndStorage",
  },
  {
    text: t("businessActivityCategory.waterSupplySewerageWasteManagementAndRemediation"),
    value: "WaterSupplySewerageWasteManagementAndRemediation",
  },
  { text: t("businessActivityCategory.wholesaleAndRetailTrade"), value: "WholesaleAndRetailTrade" },
  { text: t("businessActivityCategory.otherServiceActivities"), value: "OtherServiceActivities" },
];
