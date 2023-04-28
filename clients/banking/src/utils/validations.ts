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

// birthdate can be only in the past, today or tomorrow (to allow timezones)
export const validateBirthdate: Validator<string> = value => {
  const date = dayjs(value, locale.dateFormat);
  if (!date.isValid()) {
    return t("common.form.invalidDate");
  }

  const tomorrow = dayjs().startOf("day").add(1, "day");

  if (date.isAfter(tomorrow)) {
    return t("common.form.birthdateCannotBeFuture");
  }
};

export const validateTodayOrAfter: Validator<string> = value => {
  if (value === "") {
    return;
  }

  const date = dayjs.utc(value, "DD/MM/YYYY");
  if (!date.isValid()) {
    return t("common.form.invalidDate");
  }

  const today = dayjs.utc();
  if (date.isBefore(today, "day")) {
    return t("common.form.dateCannotBePast");
  }
};

export const validateTime =
  (minHours: number, minMinutes: number): Validator<string> =>
  value => {
    const [hoursStr, minutesStr] = value.split(":");

    if (hoursStr?.length !== 2 || minutesStr?.length !== 2) {
      return t("common.form.invalidTime");
    }

    const hours = Number(hoursStr);
    const minutes = Number(minutesStr);

    if (isNaN(hours) || isNaN(minutes)) {
      return t("common.form.invalidTime");
    }

    if (hours < 0 || hours > 23) {
      return t("common.form.invalidTime");
    }

    if (minutes < 0 || minutes > 59) {
      return t("common.form.invalidTime");
    }
    if (hours < minHours || (hours === minHours && minutes < minMinutes)) {
      return t("common.form.dateCannotBePast");
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
