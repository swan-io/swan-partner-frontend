export { isValid, printFormat } from "iban";

// https://github.com/arhs/iban.js/blob/v0.0.14/iban.js#L341
const EVERY_FOUR_CHARS = /(.{4})(?!$)/g;

export const printMaskedFormat = (iban: string) =>
  iban.replace(EVERY_FOUR_CHARS, `$1 `).toUpperCase();
