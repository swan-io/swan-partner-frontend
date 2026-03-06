import { match } from "ts-pattern";
import {
  CompanyLegalRepresentativeAndUltimateBeneficialOwner,
  CompanyRelatedIndividual,
  RelatedIndividualInput,
  RelatedIndividualUltimateBeneficialOwner,
  RelatedIndividualUltimateBeneficialOwnerInput,
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
    .with("Ownership", () => ({
      qualificationType,
      identityDocumentInfo,
      ownership: ownership ?? { type: "Direct" as const },
    }))
    .with("Control", () => ({
      qualificationType,
      identityDocumentInfo,
      controlTypes: controlTypes ?? [],
    }))
    .otherwise(() => ({ qualificationType, identityDocumentInfo }));

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
