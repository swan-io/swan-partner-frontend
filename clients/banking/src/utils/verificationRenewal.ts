import { IconName } from "@swan-io/lake/src/components/Icon";
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

// the birth postal code is only needed for FICOBA: French account and person born in France
// like the backend, only FRA is checked until territories are no longer stored as countries
export const isBirthPostalCodeRequired = ({
  accountCountry,
  birthCountry,
}: {
  accountCountry: AccountCountry;
  birthCountry: string | undefined;
}) => accountCountry === "FRA" && birthCountry === "FRA";
