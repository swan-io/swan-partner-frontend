import { Option } from "@bloodyowl/boxed";
import { IconName } from "@swan-io/lake/src/components/Icon";
import {
  CountryCCA3,
  isCountryCCA3,
  isFrenchTerritoryCCA3,
  isTerritoryCCA3,
} from "@swan-io/shared-business/src/constants/countries";
import {
  validateBooleanRequired,
  validateIndividualTaxNumber,
  validateRequired,
} from "@swan-io/shared-business/src/utils/validation";
import { combineValidators, Validator } from "@swan-io/use-form";
import { match, P } from "ts-pattern";
import {
  AccountCountry,
  AccountHolderType,
  GetVerificationRenewalQuery,
  UltimateBeneficialOwnerQualificationType,
} from "../graphql/partner";
import { TranslationKey, t } from "./i18n";
import { VerificationRenewalRoute } from "./routes";

export type RenewalStep = {
  id: VerificationRenewalRoute;
  label: string;
  icon: IconName;
};

export const renewalSteps = {
  accountHolderInformation: {
    id: "VerificationRenewalAccountHolderInformation",
    label: t("verificationRenewal.step.accountHolderInfo"),
    icon: "building-regular",
  },
  administratorInformation: {
    id: "VerificationRenewalAdministratorInformation",
    label: t("verificationRenewal.step.administratorInfo"),
    icon: "person-regular",
  },
  personalInformation: {
    id: "VerificationRenewalPersonalInformation",
    label: t("verificationRenewal.step.personalInfo"),
    icon: "person-regular",
  },
  renewalOwnership: {
    id: "VerificationRenewalOwnership",
    label: t("verificationRenewal.step.ownership"),
    icon: "people-add-regular",
  },
  renewalDocuments: {
    id: "VerificationRenewalDocuments",
    label: t("verificationRenewal.step.documents"),
    icon: "document-regular",
  },
  finalize: {
    id: "VerificationRenewalFinalize",
    label: t("verificationRenewal.step.finalize"),
    icon: "checkmark-filled",
  },
} satisfies Record<string, RenewalStep>;

export const getRenewalSteps = (
  data: GetVerificationRenewalQuery["verificationRenewal"],
  accountHolderType: AccountHolderType,
): RenewalStep[] => {
  const requirements = match(data)
    .with(
      {
        verificationRequirements: P.nonNullable,
      },
      ({ verificationRequirements }) => verificationRequirements,
    )
    .otherwise(() => []);

  const orderedSteps: RenewalStep[] = [];

  const steps = new Set(requirements);

  if (steps.has("AccountHolderDetailsRequired") && accountHolderType === "Company") {
    orderedSteps.push(renewalSteps.accountHolderInformation);
  }

  if (steps.has("AccountHolderDetailsRequired") && accountHolderType === "Individual") {
    orderedSteps.push(renewalSteps.personalInformation);
  }

  if (steps.has("LegalRepresentativeDetailsRequired") && accountHolderType === "Company") {
    orderedSteps.push(renewalSteps.administratorInformation);
  }

  if (steps.has("UboDetailsRequired") && accountHolderType === "Company") {
    orderedSteps.push(renewalSteps.renewalOwnership);
  }

  if (steps.has("SupportingDocumentsRequired")) {
    orderedSteps.push(renewalSteps.renewalDocuments);
  }

  orderedSteps.push(renewalSteps.finalize);

  return orderedSteps;
};

// person country pickers only list sovereign countries: a French territory is France, and
// another territory has no equivalent in the list so it's left empty to be picked again
// (same as onboarding's toSovereignCountry)
export const toSovereignCountry = (value: unknown): CountryCCA3 | undefined =>
  match(value)
    .returnType<CountryCCA3 | undefined>()
    .with(P.when(isFrenchTerritoryCCA3), () => "FRA" as const)
    .with(P.when(isCountryCCA3), cca3 => (isTerritoryCCA3(cca3) ? undefined : cca3))
    .otherwise(() => undefined);

// the birth postal code is only needed for FICOBA: French account and person born in France
// (same as onboarding's isBirthPostalCodeRequired)
export const isBirthPostalCodeRequired = ({
  accountCountry,
  birthCountry,
}: {
  accountCountry: AccountCountry;
  birthCountry: CountryCCA3 | undefined;
}) => accountCountry === "FRA" && isFrenchTerritoryCCA3(birthCountry);

// UBO rules depending on the account country, they must be at least as strict as the backend
// (VerificationRenewalUltimateBeneficialOwner.getErrors in account-contract), which checks them
// again on finalizeVerificationRenewal. The residency address country is always required.
export const getUboRequirements = (accountCountry: AccountCountry) => ({
  isFullResidencyAddressRequired: match(accountCountry)
    .with("DEU", "ESP", "BEL", () => true)
    .otherwise(() => false),
  isBirthInfoRequired: accountCountry !== "DEU",
});

// the tax identification number is required for a beneficiary living in the account country,
// for German and Italian accounts
export const isUboTaxIdentificationNumberRequired = ({
  accountCountry,
  residencyCountry,
}: {
  accountCountry: AccountCountry;
  residencyCountry: CountryCCA3 | undefined;
}) => (accountCountry === "DEU" || accountCountry === "ITA") && residencyCountry === accountCountry;

export type UboValidationInput = {
  firstName: string;
  lastName: string;
  birthDate: string | undefined;
  birthCountryCode: CountryCCA3;
  birthCity: string;
  birthCityPostalCode: string;
  qualificationType: UltimateBeneficialOwnerQualificationType | undefined;
  direct?: boolean;
  indirect?: boolean;
  totalPercentage?: number;
  addressLine1?: string;
  city?: string;
  postalCode?: string;
  country: CountryCCA3;
  taxIdentificationNumber?: string;
};

// Used to surface "missing information" when a user starts a section without completing it.
const isPartiallyFilled = (values: string[]) =>
  values.some(value => value.length > 0) && values.some(value => value.length === 0);

const validateCca3CountryCode: Validator<string | undefined> = value => {
  if (value == null) {
    return t("common.form.required");
  }
  if (!isCountryCCA3(value)) {
    // no need to set an error message because country picker contains only valid values
    // this is used only for validateUbo function to display an error indicator without opening UBO modal
    return " ";
  }
};

export const validateUbo = (
  editorState: Partial<UboValidationInput>,
  accountCountry: AccountCountry,
): Partial<Record<keyof UboValidationInput, string | void>> => {
  const { isFullResidencyAddressRequired, isBirthInfoRequired } =
    getUboRequirements(accountCountry);
  const validateTaxNumber = isUboTaxIdentificationNumberRequired({
    accountCountry,
    residencyCountry: editorState.country,
  })
    ? combineValidators(validateRequired, validateIndividualTaxNumber(accountCountry))
    : validateIndividualTaxNumber(accountCountry);

  const isAddressDetailRequired =
    isFullResidencyAddressRequired ||
    isPartiallyFilled([
      editorState.addressLine1 ?? "",
      editorState.city ?? "",
      editorState.postalCode ?? "",
      editorState.country ?? "",
    ]);

  return {
    firstName: validateRequired(editorState.firstName ?? ""),
    lastName: validateRequired(editorState.lastName ?? ""),
    birthDate: isBirthInfoRequired ? validateRequired(editorState.birthDate ?? "") : undefined,
    birthCountryCode: validateCca3CountryCode(editorState.birthCountryCode),
    birthCity: isBirthInfoRequired ? validateRequired(editorState.birthCity ?? "") : undefined,
    birthCityPostalCode: isBirthPostalCodeRequired({
      accountCountry,
      birthCountry: editorState.birthCountryCode,
    })
      ? validateRequired(editorState.birthCityPostalCode ?? "")
      : undefined,
    qualificationType: validateRequired(editorState.qualificationType ?? ""),
    totalPercentage:
      editorState.qualificationType === "Ownership"
        ? validateRequired(editorState.totalPercentage?.toString() ?? "")
        : undefined,
    addressLine1: isAddressDetailRequired
      ? validateRequired(editorState.addressLine1 ?? "")
      : undefined,
    city: isAddressDetailRequired ? validateRequired(editorState.city ?? "") : undefined,
    country: validateRequired(editorState.country ?? ""),
    postalCode: isAddressDetailRequired
      ? validateRequired(editorState.postalCode ?? "")
      : undefined,
    taxIdentificationNumber: validateTaxNumber(editorState.taxIdentificationNumber ?? ""),
    indirect:
      editorState.qualificationType !== "Ownership" || editorState.direct === true
        ? undefined
        : validateBooleanRequired(editorState.indirect),
    direct:
      editorState.qualificationType !== "Ownership" || editorState.indirect === true
        ? undefined
        : validateBooleanRequired(editorState.direct),
  };
};

type ValidationField = {
  path: string[];
  message: string;
};

export type FinalizeValidationErrors = {
  // index in the path isn't reliable to find the beneficial owner (backend order isn't guaranteed),
  // so we only count how many are in error
  beneficialOwners: Option<{ count: number; fields: string[] }>;
  // errors we can't map to a step, displayed with the backend message
  others: string[];
};

const UBO_ENTITY = "VerificationRenewalUltimateBeneficialOwner";

// e.g. "VerificationRenewalUltimateBeneficialOwner[1].residencyAddress.city"
const FIELD_PATH_REGEX = /^(\w+)(?:\[(\d+)\])?\.(.+)$/;

const uboFieldLabelKeys: Partial<Record<string, TranslationKey>> = {
  firstName: "verificationRenewal.ownership.firstName",
  lastName: "verificationRenewal.ownership.lastName",
  birthDate: "verificationRenewal.ownership.birthDate",
  birthCity: "verificationRenewal.ownership.birthCity",
  birthCityPostalCode: "verificationRenewal.ownership.birthPostalCode",
  birthCountryCode: "verificationRenewal.ownership.birthCountry",
  type: "verificationRenewal.ownership.type",
  totalCapitalPercentage: "verificationRenewal.ownership.totalCapitalPercentage",
  isDirect: "verificationRenewal.finalize.validation.directOrIndirect",
  isIndirect: "verificationRenewal.finalize.validation.directOrIndirect",
  residencyAddress: "verificationRenewal.finalize.validation.residencyAddress",
  "residencyAddress.addressLine1": "verificationRenewal.finalize.validation.residencyAddressLine",
  "residencyAddress.city": "verificationRenewal.finalize.validation.residencyCity",
  "residencyAddress.postalCode": "verificationRenewal.finalize.validation.residencyPostalCode",
  "residencyAddress.country": "verificationRenewal.finalize.validation.residencyCountry",
};

const getUboFieldLabel = (field: string) =>
  Option.fromNullable(uboFieldLabelKeys[field]).map(key => t(key));

const unique = (values: string[]) => [...new Set(values)];

export const getFinalizeValidationErrors = (
  fields: ValidationField[],
): FinalizeValidationErrors => {
  const uboIndexes = new Set<string>();
  const uboFields: string[] = [];
  const others: string[] = [];

  fields.forEach(({ path, message }) => {
    // path is sent as a single string today, joining also supports a path split in segments
    const [, entity, index = "", field = ""] = FIELD_PATH_REGEX.exec(path.join(".")) ?? [];

    if (entity === UBO_ENTITY) {
      uboIndexes.add(index);
      uboFields.push(getUboFieldLabel(field).getOr(message));
    } else {
      others.push(message);
    }
  });

  return {
    beneficialOwners:
      uboFields.length > 0
        ? Option.Some({ count: uboIndexes.size, fields: unique(uboFields) })
        : Option.None(),
    others: unique(others),
  };
};
