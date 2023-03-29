import { Result } from "@swan-io/boxed";
import { isValid as isValidIban } from "iban";
import { match, P } from "ts-pattern";
import { Client } from "urql";
import { GetIbanValidationDocument, ValidIbanInformationFragment } from "../graphql/partner";
import { t } from "./i18n";
import { parseOperationResult } from "./urql";
export { isValid as isValidIban, printFormat as printIbanFormat } from "iban";

// Cache already validated IBANs to avoid backend call on submit
const alreadyValidatedIbans: Record<string, ValidIbanInformationFragment> = {};

export const getIbanValidation = async (client: Client, iban: string) => {
  const ibanWithoutSpaces = iban.replace(/ /g, "");

  // If we already validated the IBAN, we return the cached result
  const cachedValidation = alreadyValidatedIbans[ibanWithoutSpaces];
  if (cachedValidation) {
    return Result.Ok(cachedValidation);
  }

  const result = (
    await Result.fromPromise(
      client
        .query(GetIbanValidationDocument, { iban: ibanWithoutSpaces })
        .toPromise()
        .then(parseOperationResult),
    )
  )
    .mapError(() => "NoIbanValidation" as const)
    .flatMap(({ ibanValidation }) =>
      match(ibanValidation)
        .with(P.nullish, () => Result.Error("NoIbanValidation" as const))
        .with({ __typename: "InvalidIban" }, ({ code }) => Result.Error(code))
        .with({ __typename: "ValidIban" }, validation => {
          alreadyValidatedIbans[ibanWithoutSpaces] = validation;
          return Result.Ok(validation);
        })
        .exhaustive(),
    )
    .mapError(error =>
      match(error)
        .with("InvalidLength", "InvalidStructure", "InvalidChecksum", () => t("error.iban.invalid"))
        .with("InvalidBank", () => t("error.iban.invalidBank"))
        .with("NoIbanValidation", () => {
          // If we failed to validate the IBAN with backend, we do local validation
          if (!isValidIban(iban)) {
            return t("error.iban.invalid");
          }
        })
        .exhaustive(),
    );

  return result;
};
