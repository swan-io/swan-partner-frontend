import { match } from "ts-pattern";
import {
  CompanyAccountHolderOnboardingAccountAdmin,
  CompanyLegalRepresentativeAndUltimateBeneficialOwner,
  CompanyRelatedIndividual,
  RelatedIndividualInput,
  RelatedIndividualUltimateBeneficialOwner,
  RelatedIndividualUltimateBeneficialOwnerInput,
  UltimateBeneficialOwnerQualificationType,
  UnitedStatesTaxInfo,
  UnitedStatesTaxInfoInput,
} from "../graphql/partner";

const toUltimateBeneficialOwnerInput = (
  ubo: RelatedIndividualUltimateBeneficialOwner | null | undefined,
): RelatedIndividualUltimateBeneficialOwnerInput | undefined => {
  if (ubo == null) {
    return undefined;
  }

  const { qualificationType, identityDocumentInfo, ownership, controlTypes } = ubo;

  const raw = match(qualificationType)
    .with("Ownership", qualificationType => ({
      qualificationType,
      identityDocumentInfo,
      ownership: ownership ?? { type: "Direct" as const },
    }))
    .with("Control", qualificationType => ({
      qualificationType,
      identityDocumentInfo,
      controlTypes: controlTypes ?? [],
    }))
    .otherwise(() => ({
      qualificationType: "LegalRepresentative" as UltimateBeneficialOwnerQualificationType,
      identityDocumentInfo,
    }));

  return cleanData(raw);
};

const toUnitedStatesTaxInfoInput = (
  info: UnitedStatesTaxInfo | null | undefined,
): UnitedStatesTaxInfoInput | undefined =>
  info?.isUnitedStatesPerson != null
    ? {
        isUnitedStatesPerson: info.isUnitedStatesPerson,
        unitedStatesTaxIdentificationNumber: info.unitedStatesTaxIdentificationNumber ?? undefined,
      }
    : undefined;

export const transformRelatedIndividualsToInput = (
  individuals: CompanyRelatedIndividual[] | undefined | null,
): RelatedIndividualInput[] => {
  if (!individuals) {
    return [];
  }

  return individuals.map(individual => {
    const { unitedStatesTaxInfo, ultimateBeneficialOwner, ...rest } =
      individual as CompanyLegalRepresentativeAndUltimateBeneficialOwner; // Cast for typescript to be able to descruture ultimateBeneficialOwner

    return {
      ...cleanData(rest),
      unitedStatesTaxInfo: toUnitedStatesTaxInfoInput(unitedStatesTaxInfo),
      ultimateBeneficialOwner: toUltimateBeneficialOwnerInput(ultimateBeneficialOwner),
    };
  }) as RelatedIndividualInput[];
};

const namesMatch = (
  a: { firstName?: string | null; lastName?: string | null },
  b: { firstName?: string | null; lastName?: string | null },
): boolean =>
  a.firstName?.trim().toLowerCase() === b.firstName?.trim().toLowerCase() &&
  a.lastName?.trim().toLowerCase() === b.lastName?.trim().toLowerCase();

export const isAccountAdminInRelatedIndividuals = (
  accountAdmin: CompanyAccountHolderOnboardingAccountAdmin | null | undefined,
  relatedIndividuals: CompanyRelatedIndividual[] | null | undefined,
): boolean => {
  if (accountAdmin?.firstName == null || accountAdmin.lastName == null) {
    return false;
  }

  if (!relatedIndividuals || relatedIndividuals.length === 0) {
    return false;
  }

  return relatedIndividuals.some(individual => namesMatch(accountAdmin, individual));
};

export const upsertAccountAdminInRelatedIndividuals = (
  accountAdmin: CompanyAccountHolderOnboardingAccountAdmin | null | undefined,
  relatedIndividuals: CompanyRelatedIndividual[] | null | undefined,
  updatedFields: Omit<RelatedIndividualInput, "type">,
): RelatedIndividualInput[] => {
  const inputs = transformRelatedIndividualsToInput(relatedIndividuals);

  const matchIndex = inputs.findIndex(
    individual =>
      accountAdmin?.firstName != null &&
      accountAdmin.lastName != null &&
      namesMatch(accountAdmin, individual),
  );

  // Add new individual
  if (matchIndex === -1) {
    return [
      ...inputs,
      {
        ...updatedFields,
        type: "LegalRepresentative" as const,
        legalRepresentative: { roles: [] },
      },
    ];
  }

  // Update existing individual
  return inputs.map((individual, index) =>
    index === matchIndex ? { ...individual, ...updatedFields } : individual,
  );
};

// Utility function to clean data from __typename and undefined fields
type CleanData<T> = T extends (infer U)[]
  ? CleanData<U>[]
  : T extends object
    ? { [K in keyof T as K extends "__typename" ? never : K]: CleanData<T[K]> }
    : T;

export const cleanData = <T>(value: T): CleanData<T> => {
  if (value == null) {
    return undefined as CleanData<T>;
  }

  if (Array.isArray(value)) {
    return value
      .map(item => cleanData(item))
      .filter((item): item is NonNullable<typeof item> => item !== undefined) as CleanData<T>;
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const cleaned: Record<string, unknown> = {};

    for (const [key, item] of Object.entries(record)) {
      if (key === "__typename") {
        continue;
      }

      const next = cleanData(item);

      if (next !== undefined) {
        cleaned[key] = next;
      }
    }

    return cleaned as CleanData<T>;
  }

  return value as CleanData<T>;
};
