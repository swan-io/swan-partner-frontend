import { isValid as isValidIban } from "iban";
import { t } from "./i18n";
export { printFormat as printIbanFormat } from "iban";

export const validateIban = (iban: string) => {
  if (!isValidIban(iban)) {
    return t("error.iban.invalid");
  }
};
