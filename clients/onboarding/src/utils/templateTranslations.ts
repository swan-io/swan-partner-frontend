import { CountryCCA3 } from "@swan-io/shared-business/src/constants/countries";
import { match, P } from "ts-pattern";
import type { CombinedError } from "urql";
import { t } from "./i18n";

export const getErrorFieldLabel = (field: string) => {
  return match(field)
    .with("email", () => t("step.finalizeError.email"))
    .with("address", () => t("step.finalizeError.address"))
    .with("city", () => t("step.finalizeError.city"))
    .with("country", () => t("step.finalizeError.country"))
    .with("postalCode", () => t("step.finalizeError.postalCode"))
    .with("employmentStatus", () => t("step.finalizeError.employmentStatus"))
    .with("monthlyIncome", () => t("step.finalizeError.monthlyIncome"))
    .with("registrationNumber", () => t("step.finalizeError.registrationNumber"))
    .with("vatNumber", () => t("step.finalizeError.vatNumber"))
    .with("taxIdentificationNumber", () => t("step.finalizeError.taxIdentificationNumber"))
    .with("businessActivity", () => t("step.finalizeError.businessActivity"))
    .with("businessActivityDescription", () => t("step.finalizeError.businessActivityDescription"))
    .with("monthlyPaymentVolume", () => t("step.finalizeError.monthlyPaymentVolume"))
    .otherwise(() => field);
};

type UpdateOnboardingError =
  | Error
  | CombinedError
  | {
      __typename: "ForbiddenRejection";
    }
  | {
      __typename: "InternalErrorRejection";
    }
  | {
      __typename: "ValidationRejection";
    };

export const getUpdateOnboardingError = (
  error: UpdateOnboardingError,
): { title: string; description: string } => {
  return match(error)
    .with({ __typename: "ValidationRejection" }, () => {
      return {
        title: t("error.invalidFields"),
        description: t("error.fixInvalidFields"),
      };
    })
    .with({ __typename: "InternalErrorRejection" }, () => {
      return {
        title: t("error.generic"),
        description: t("error.tryAgain"),
      };
    })
    .with({ __typename: "ForbiddenRejection" }, () => {
      // this should never happen because the user won't be able to load the onboarding UI
      // if they don't have the right permissions
      return {
        title: t("error.generic"),
        description: t("error.tryAgain"),
      };
    })
    .with({ networkError: P.any }, () => {
      return {
        title: t("error.network"),
        description: t("error.checkConnection"),
      };
    })
    .otherwise(() => {
      return {
        title: t("error.generic"),
        description: t("error.tryAgain"),
      };
    });
};

export const getRegistrationNumberName = (country: CountryCCA3) => {
  const name = match(country)
    .with("AUT", () => "Firmenbuchnummer")
    .with("BEL", () => "Numéro d'entreprise / Vestigingseenheidsnummer")
    .with("HRV", () => "Matični broj poslovnog subjekta (MBS)")
    .with("CYP", () => "Αριθμός Μητρώου Εταιρίας Şirket kayıt numarası")
    .with("CZE", () => "Identifikační číslo")
    .with("DNK", () => "CVR-nummer")
    .with("EST", () => "Kood")
    .with("FIN", () => "Y-tunnus FO-nummer")
    .with("FRA", () => "Numéro SIREN")
    .with("DEU", () => "Nummer der Firma Registernummer")
    .with(
      "GRC",
      () => "τον Αριθμό Γενικού Εμπορικού Μητρώου τον Αριθμό Φορολογικού Μητρώου (Α.Φ.Μ.)",
    )
    .with("HUN", () => "Cégjegyzékszáma")
    .with("IRL", () => "Company Number")
    .with("ISL", () => "TIN")
    .with("ITA", () => "Codice fiscale")
    .with("LVA", () => "Reģistrācijas numurs")
    .with("LIE", () => "UID")
    .with("LTU", () => "Juridinio asmens kodas")
    .with("LUX", () => "Numéro d'immatriculation")
    .with("MLT", () => "Registration Number")
    .with("NLD", () => "KvK-nummer")
    .with("NOR", () => "TIN")
    .with("POL", () => "Numer w Krajowym Rejestrze Sądowym (numer KRS)")
    .with("PRT", () => "Número de Identificação Pessoa Coletiva (NIPC)")
    .with("ROU", () => "Număr de ordine în Registrul Comerţului")
    .with("SVK", () => "Identifikačného čísla Identification number")
    .with("SVN", () => "Matična številka")
    .with("ESP", () => "Número de identificación fiscal (NIF)")
    .with("SWE", () => "Registreringsnummer")
    .otherwise(() => null);

  if (name == null) {
    return "";
  }
  return ` - ${name}`;
};
