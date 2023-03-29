import { Lazy } from "@swan-io/boxed";
import { isValidVatNumber } from "@swan-io/shared-business/src/utils/validation";
import dayjs from "dayjs";
import { Validator } from "react-ux-form";
import { locale, t } from "./i18n";

export const validateNullableRequired: Validator<string | undefined> = value => {
  if (value == null || !value) {
    return t("common.form.required");
  }
};

export const validateRequired: Validator<string> = value => {
  if (!value) {
    return t("common.form.required");
  }
};

export const validateTaxIdentificationNumber: Validator<string> = value => {
  if (!value) {
    return t("common.form.required");
  }
  if (value.length !== 11 && value.length !== 10) {
    return t("common.form.invalidTaxIdentificationNumber");
  }
};

export const validateIndividualTaxNumber: Validator<string> = value => {
  if (!value) {
    return;
  }
  // accept 11 digits
  if (!/^\d{11}$/.test(value)) {
    return t("common.form.invalidTaxIdentificationNumber");
  }
};

export const validateAccountNameLength: Validator<string> = value => {
  const maxLength = 256;
  if (value.length > maxLength) {
    return t("accountDetails.invalidAccountName", { maxLength });
  }
};

export const validateEmail: Validator<string> = value => {
  if (!/.+@.+\..{2,}/.test(value)) {
    return t("common.form.invalidEmail");
  }
};

export const validateDate: Validator<string> = value => {
  if (!dayjs(value, locale.dateFormat, true).isValid()) {
    return t("common.form.invalidDate");
  }
};

export const validateAddressLine: Validator<string> = value => {
  if (value.length > 38) {
    return t("common.form.invalidAddressLine");
  }
};

export const REFERENCE_MAX_LENGTH = 35;

export const validateReference: Validator<string> = value => {
  const hasOnlyLatinChars = /^[\w/\-?:().,’+ ]*$/.test(value);
  const hasDoubleSlash = value.includes("//");
  const startOrEndWithSlash = [value[0], value[value.length - 1]].includes("/");

  if (value !== "" && (!hasOnlyLatinChars || hasDoubleSlash || startOrEndWithSlash)) {
    return t("error.transferReferenceInvalid");
  }

  if (value !== "" && value.length > REFERENCE_MAX_LENGTH) {
    return t("error.transferReferenceTooLong");
  }
};

export const validateVatNumber: Validator<string> = value => {
  const cleaned = value.replace(/[^A-Z0-9]/gi, "");
  if (cleaned.length === 0) {
    return;
  }

  if (!isValidVatNumber(cleaned)) {
    return t("common.form.invalidVatNumber");
  }
};

// Whitelisting the first 8 blocks of unicode (the 9th being cyrilic)
// And then whitelisting General punctuation, mathematical notations and emojis
// For reference : https://jrgraphix.net/r/Unicode/
const VALID_SEPA_BENEFICIARY_NAME_ALPHABET = Lazy(
  () =>
    /^([\u0020-\u03FF\u2200-\u22FF\u2000-\u206F]|(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff]))+$/,
);

export const validateSepaBeneficiaryNameAlphabet: Validator<string> = value => {
  if (!VALID_SEPA_BENEFICIARY_NAME_ALPHABET.get().test(value)) {
    return t("error.beneficiaryNameInvalid");
  }
};
