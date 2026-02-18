import { match } from "ts-pattern";
import { UltimateBeneficialOwner } from "../../../banking/src/graphql/partner";
import {
  OnboardingRepresentative,
  OnboardingRepresentativeInput,
  UltimateBeneficialOwnerInput,
} from "../graphql/partner";

/**
 * Transforms OnboardingRepresentative (output type with __typename) to OnboardingRepresentativeInput (input type without __typename)
 */
export const transformRepresentativesToInput = (
  representatives: OnboardingRepresentative[] | undefined,
): OnboardingRepresentativeInput[] => {
  if (!representatives) {
    return [];
  }

  return representatives.map(representative => {
    return match(representative)
      .with({ __typename: "OnboardingIndividualRepresentative" }, individual => {
        const rep = cleanData(individual);
        const input: OnboardingRepresentativeInput = {
          type: "Individual",
          ...rep,
        };
        return input;
      })
      .with({ __typename: "OnboardingCompanyRepresentative" }, company => {
        const { legalFormCode, ...rep } = cleanData(company);
        const input: OnboardingRepresentativeInput = {
          type: "Company",
          legalForm: legalFormCode,
          ...rep,
        };
        return input;
      })
      .exhaustive();
  });
};

/**
 * Transforms UltimateBeneficialOwner array (output type with __typename) to UltimateBeneficialOwnerInput array (input type without __typename)
 */
export const transformUboToInput = (
  ubos: Array<UltimateBeneficialOwner | null | undefined> | null | undefined,
): UltimateBeneficialOwnerInput[] => {
  if (!ubos) {
    return [];
  }

  return ubos
    .filter(ubo => ubo != null)
    .map(ubo => {
      const { qualificationType, ownership, controlTypes, unitedStatesTaxInfo, ...input } = ubo;
      const cleanedUbo = cleanData(input);

      // @TODO: add unitedStatesTaxInfo?
      return {
        ...cleanedUbo,
        qualificationType: qualificationType ?? undefined,
        ownership: qualificationType === "Ownership" ? ownership : undefined,
        controlTypes: qualificationType === "Control" ? controlTypes : undefined,
      };
    });
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
