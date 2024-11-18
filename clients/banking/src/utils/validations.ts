import { isNotNullishOrEmpty } from "@swan-io/lake/src/utils/nullish";
import { DatePickerDate } from "@swan-io/shared-business/src/components/DatePicker";
import { isValidEmail, isValidVatNumber } from "@swan-io/shared-business/src/utils/validation";
import { Validator, combineValidators } from "@swan-io/use-form";
import dayjs from "dayjs";
import { P, match } from "ts-pattern";
import { locale, t } from "./i18n";

export const validateNullableRequired: Validator<string | undefined> = value => {
  if (value == null || !value) {
    return t("common.form.required");
  }
};

export const validateArrayRequired: Validator<string[] | undefined> = value => {
  if (value == null || value.length < 1) {
    return t("common.form.required");
  }
};

export const validateRequired: Validator<string> = value => {
  if (!value) {
    return t("common.form.required");
  }
};

export const validateForPermissions: Validator<string> = value => {
  if (!value) {
    return t("common.form.required.permissions");
  }
};

// This regex was copied from the backend to ensure that the validation is the same
// Matches all unicode letters, spaces, dashes, apostrophes, commas, and single quotes
const VALID_NAME_RE =
  /^(?:[A-Za-zÀ-ÖÙ-öù-ƿǄ-ʯʹ-ʽΈ-ΊΎ-ΡΣ-ҁҊ-Ֆա-ևႠ-Ⴥა-ჺᄀ-፜፩-ᎏᵫ-ᶚḀ-῾ⴀ-ⴥ⺀-⿕ぁ-ゖゝ-ㇿ㋿-鿯鿿-ꒌꙀ-ꙮꚀ-ꚙꜦ-ꞇꞍ-ꞿꥠ-ꥼＡ-Ｚａ-ｚ.]| |'|-|Ά|Ό|,)*$/;

export const validateName: Validator<string> = value => {
  if (!value) {
    return t("common.form.required");
  }

  // Rule copied from the backend
  if (value.length > 100) {
    return t("common.form.invalidName");
  }

  const isValid = VALID_NAME_RE.test(value);

  if (!isValid) {
    return t("common.form.invalidName");
  }
};

// Beneficiary name input must accept numeric value, unlike other validation name
export const validateBeneficiaryName: Validator<string> = value => {
  if (!value) {
    return t("common.form.required");
  }

  // Rule copied from the backend
  if (value.length > 100) {
    return t("common.form.invalidName");
  }

  // Matches all unicode letters, spaces, dashes, apostrophes, commas, and single quotes
  const isValid = value.match(
    /^(?:[A-Za-zÀ-ÖÙ-öù-ƿǄ-ʯʹ-ʽΈ-ΊΎ-ΡΣ-ҁҊ-Ֆա-ևႠ-Ⴥა-ჺᄀ-፜፩-ᎏᵫ-ᶚḀ-῾ⴀ-ⴥ⺀-⿕ぁ-ゖゝ-ㇿ㋿-鿯鿿-ꒌꙀ-ꙮꚀ-ꚙꜦ-ꞇꞍ-ꞿꥠ-ꥼＡ-Ｚａ-ｚ.]| |'|-|Ά|Ό|,|[0-9])*$/,
  );

  if (!isValid) {
    return t("common.form.invalidName");
  }
};

const TRANSFER_REFERENCE_REGEX = /^[a-zA-Z0-9-?.+,/':() ]+$/;

export const validateTransferReference: Validator<string> = value => {
  if (value.length > 35) {
    return t("common.form.invalidTransferReference");
  }

  if (
    !TRANSFER_REFERENCE_REGEX.test(value) ||
    value.startsWith("/") ||
    value.endsWith("/") ||
    value.includes("//")
  ) {
    return t("common.form.invalidTransferReference");
  }
};

export const validateAccountReasonClose: Validator<string> = value => {
  const maxLength = 255;
  if (value.length > maxLength) {
    return t("common.form.invalidMessage", { maxLength });
  }
};

export const validateAccountNameLength: Validator<string> = value => {
  const maxLength = 256;
  if (value.length > maxLength) {
    return t("accountDetails.invalidAccountName", { maxLength });
  }
};

export const validateEmail: Validator<string> = value => {
  if (!isValidEmail(value)) {
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
  if (!value) {
    return t("common.form.required");
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

export const validateDateWithinNextYear: Validator<string> = value => {
  if (!value) {
    return t("common.form.required");
  }

  const date = dayjs.utc(value, "DD/MM/YYYY");
  if (!date.isValid()) {
    return t("common.form.invalidDate");
  }

  const nextYear = dayjs.utc().add(1, "year");
  if (date.isAfter(nextYear, "day")) {
    return t("common.form.dateIsNotWithinYear");
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

export const validateVatNumber: Validator<string> = value => {
  const cleaned = value.replace(/[^A-Z0-9]/gi, "");
  if (cleaned.length === 0) {
    return;
  }

  if (!isValidVatNumber(cleaned)) {
    return t("common.form.invalidVatNumber");
  }
};

export const isAfterUpdatedAtSelectable = (date: DatePickerDate, filters: unknown) => {
  return match(filters)
    .with({ isBeforeUpdatedAt: P.string }, ({ isBeforeUpdatedAt }) => {
      const isAfterUpdatedAt = dayjs()
        .date(date.day)
        .month(date.month)
        .year(date.year)
        .endOf("day");
      const isBeforeUpdatedAtDate = dayjs(isBeforeUpdatedAt).startOf("day");

      return isAfterUpdatedAt.isBefore(isBeforeUpdatedAtDate);
    })
    .otherwise(() => true);
};

// value comes from input text above the datepicker
// so the format of value is locale.dateFormat
export const validateAfterUpdatedAt = (value: string, filters: unknown) => {
  return (
    validateRequired(value) ??
    validateDate(value) ??
    match(filters)
      .with({ isBeforeUpdatedAt: P.string }, ({ isBeforeUpdatedAt }) => {
        const isAfterUpdatedAt = dayjs(value, locale.dateFormat).endOf("day");
        const isBeforeUpdatedAtDate = dayjs(isBeforeUpdatedAt).startOf("day");

        if (!isAfterUpdatedAt.isBefore(isBeforeUpdatedAtDate)) {
          const updatedBefore = isBeforeUpdatedAtDate.format("LL");
          return t("common.form.chooseDateBefore", { date: updatedBefore });
        }
      })
      .otherwise(() => undefined)
  );
};

export const isBeforeUpdatedAtSelectable = (date: DatePickerDate, filters: unknown) => {
  return match(filters)
    .with({ isAfterUpdatedAt: P.string }, ({ isAfterUpdatedAt }) => {
      const isBeforeUpdatedAt = dayjs()
        .date(date.day)
        .month(date.month)
        .year(date.year)
        .startOf("day");
      const isAfterUpdatedAtDate = dayjs(isAfterUpdatedAt).endOf("day");

      return isBeforeUpdatedAt.isAfter(isAfterUpdatedAtDate);
    })
    .otherwise(() => true);
};

// value comes from input text above the datepicker
// so the format of value is locale.dateFormat
export const validateBeforeUpdatedAt = (value: string, filters: unknown) => {
  return (
    validateRequired(value) ??
    validateDate(value) ??
    match(filters)
      .with({ isAfterUpdatedAt: P.string }, ({ isAfterUpdatedAt }) => {
        const isBeforeUpdatedAt = dayjs(value, locale.dateFormat).startOf("day");
        const isAfterUpdatedAtDate = dayjs(isAfterUpdatedAt).endOf("day");

        if (!isBeforeUpdatedAt.isAfter(isAfterUpdatedAtDate)) {
          const updatedAfter = isAfterUpdatedAtDate.format("LL");
          return t("common.form.chooseDateAfter", { date: updatedAfter });
        }
      })
      .otherwise(() => undefined)
  );
};

export const validatePattern =
  (regex: string, example?: string): Validator<string> =>
  value => {
    if (value && regex && !new RegExp(String(regex)).test(value)) {
      return isNotNullishOrEmpty(example)
        ? t("transfer.new.internationalTransfer.beneficiary.form.field.invalid.example", {
            example,
          })
        : t("transfer.new.internationalTransfer.beneficiary.form.field.invalid");
    }
  };

export const validateNumeric = (params?: { min?: number; max?: number }): Validator<string> =>
  combineValidators<string>(validateRequired, value => {
    // first regex test integer and the second one test float
    if (!/^-?\d+$/.test(value) && !/^-?\d+\.\d+$/.test(value)) {
      return t("common.form.number");
    }
    const parsed = parseFloat(value);
    if (params?.min != null && parsed < params.min) {
      return t("common.form.number.upperThan", { value: params.min });
    }
    if (params?.max != null && parsed > params.max) {
      return t("common.form.number.lowerThan", { value: params.max });
    }
  });

export const validateUrl: Validator<string> = combineValidators<string>(validateRequired, value => {
  const [protocol, remainingUrl] = value.split("://");
  const regexProtocol = /^(http|https)$/g; // Switch to /^[A-Za-z][A-Za-z0-9+-.]{0,}$/ if we support PKCE one day // https://www.ietf.org/rfc/rfc2396.txt
  const regexRemainingUrl = /^[A-Za-z0-9\-._~:/?#[\]@!$&'()*+,;=]+$/g;

  // <string>.split("://")[0] always returns a string
  if (!regexProtocol.test(protocol as string)) {
    return t("common.form.url.invalidProtocol");
  }

  // If <string> includes "://", then <string>.split("://")[1] will always returns a string
  if (!value.includes("://") || !regexRemainingUrl.test(remainingUrl as string)) {
    return t("common.form.url.invalidFormat");
  }
});

const HEX_COLOR_RE = /^[a-fA-F0-9]{6}$/;

export const validateHexColor: Validator<string> = value => {
  if (!HEX_COLOR_RE.test(value)) {
    return t("common.form.invalidColor");
  }
};

const CMC7_RE = /^\d{31}$/;

export const validateCMC7 = (value: string) => {
  if (!CMC7_RE.test(value)) {
    return t("common.form.invalidCMC7");
  }
};

const RLMC_RE = /^\d{2}$/;

export const validateRLMC = (value: string) => {
  if (!RLMC_RE.test(value)) {
    return t("common.form.invalidRLMC");
  }
};
