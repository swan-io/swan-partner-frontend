import { ClientError } from "@swan-io/graphql-client";
import { CountryCCA3 } from "@swan-io/shared-business/src/constants/countries";
import { translateError } from "@swan-io/shared-business/src/utils/i18n";
import { match, P } from "ts-pattern";
import { CompanyType } from "../graphql/unauthenticated";
import { isTranslationKey, t } from "./i18n";

export const getErrorFieldLabel = (field: string) =>
  match(`step.finalizeError.${field}`)
    .with(P.when(isTranslationKey), key => t(key))
    .otherwise(() => field);

type UpdateOnboardingError =
  | Error
  | ClientError
  | { __typename: "ForbiddenRejection" }
  | { __typename: "InternalErrorRejection" }
  | { __typename: "ValidationRejection" };

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
    .with({ __typename: "InternalErrorRejection" }, error => {
      return {
        title: translateError(error),
        description: t("error.tryAgain"),
      };
    })
    .with({ __typename: "ForbiddenRejection" }, error => {
      // this should never happen because the user won't be able to load the onboarding UI
      // if they don't have the right permissions
      return {
        title: translateError(error),
        description: t("error.tryAgain"),
      };
    })
    .otherwise(error => {
      return {
        title: translateError(error),
        description: t("error.tryAgain"),
      };
    });
};

export const getRegistrationNumberName = (country: CountryCCA3, companyType: CompanyType) => {
  const name = match(country)
    .with("AUT", () => "Firmenbuchnummer")
    .with("BEL", () => "CBE or Ondernemingsnummer")
    .with("HRV", () => "Matični broj poslovnog subjekta [MBS]")
    .with("CYP", () => "Αριθμός Μητρώου Εταιρίας Şirket kayıt numarası")
    .with("CZE", () => "Identifikační číslo")
    .with("DNK", () => "CVR-nummer")
    .with("EST", () => "Kood")
    .with("FIN", () => "Y-tunnus")
    .with("FRA", () => (companyType === "Association" ? "SIREN or RNA" : "Numéro SIREN"))
    .with("DEU", () => "Registernummer")
    .with(
      "GRC",
      () => "τον Αριθμό Γενικού Εμπορικού Μητρώου τον Αριθμό Φορολογικού Μητρώου [Α.Φ.Μ.]",
    )
    .with("HUN", () => "Cégjegyzékszáma")
    .with("IRL", () => "Company Number")
    .with("ISL", () => "TIN")
    .with("ITA", () => "REA number")
    .with("LVA", () => "Reģistrācijas numurs")
    .with("LIE", () => "UID")
    .with("LTU", () => "Juridinio asmens kodas")
    .with("LUX", () => "Numéro d'immatriculation")
    .with("MLT", () => "Registration Number")
    .with("NLD", () => "KvK-nummer")
    .with("NOR", () => "TIN")
    .with("POL", () => "Numer w Krajowym Rejestrze Sądowym [numer KRS]")
    .with("PRT", () => "Número de Identificação Pessoa Coletiva [NIPC]")
    .with("ROU", () => "Număr de ordine în Registrul Comerţului")
    .with("SVK", () => "Identifikačného čísla Identification number")
    .with("SVN", () => "Matična številka")
    .with("ESP", () => "Número de identificación fiscal [NIF]")
    .with("SWE", () => "Registreringsnummer")
    .otherwise(() => null);

  if (name == null) {
    return "";
  }
  return `${name}`;
};
