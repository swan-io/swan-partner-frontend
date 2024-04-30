import { isNotNullishOrEmpty } from "@swan-io/lake/src/utils/nullish";
import { DatePickerDate } from "@swan-io/shared-business/src/components/DatePicker";
import { isValidEmail, isValidVatNumber } from "@swan-io/shared-business/src/utils/validation";
import { Validator } from "@swan-io/use-form";
import dayjs from "dayjs";
import { P, match } from "ts-pattern";
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

export const validateName: Validator<string> = value => {
  if (!value) {
    return t("common.form.required");
  }

  // Rule copied from the backend
  if (value.length > 100) {
    return t("common.form.invalidName");
  }

  // This regex was copied from the backend to ensure that the validation is the same
  // Matches all unicode letters, spaces, dashes, apostrophes, commas, and single quotes
  const isValid = value.match(
    /^(?:[A-Za-zÀ-ÖÙ-öù-ƿǄ-ʯʹ-ʽΈ-ΊΎ-ΡΣ-ҁҊ-Ֆա-ևႠ-Ⴥა-ჺᄀ-፜፩-ᎏᵫ-ᶚḀ-῾ⴀ-ⴥ⺀-⿕ぁ-ゖゝ-ㇿ㋿-鿯鿿-ꒌꙀ-ꙮꚀ-ꚙꜦ-ꞇꞍ-ꞿꥠ-ꥼＡ-Ｚａ-ｚ.]| |'|-|Ά|Ό|,)*$/,
  );

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
    /^(?:[A-Za-zÀ-ÖÙ-öù-ƿǄ-ʯʹ-ʽΈ-ΊΎ-ΡΣ-ҁҊ-Ֆա-ևႠ-Ⴥა-ჺᄀ-፜፩-ᎏᵫ-ᶚḀ-῾ⴀ-ⴥ⺀-⿕ぁ-ゖゝ-ㇿ㋿-鿯鿿-ꒌꙀ-ꙮꚀ-ꚙꜦ-ꞇꞍ-ꞿꥠ-ꥼＡ-Ｚａ-ｚ.]| |'|-|Ά|Ό|,|[1-9])*$/,
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
