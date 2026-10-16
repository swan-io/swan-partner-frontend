import { IconName } from "@swan-io/lake/src/components/Icon";
import {
  CountryCCA3,
  isCountryCCA3,
  isFrenchTerritoryCCA3,
  isTerritoryCCA3,
} from "@swan-io/shared-business/src/constants/countries";
import { match, P } from "ts-pattern";
import { AccountCountry, AccountHolderType, GetVerificationRenewalQuery } from "../graphql/partner";
import { t } from "./i18n";
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
