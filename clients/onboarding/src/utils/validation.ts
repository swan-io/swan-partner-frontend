import { Array, Option } from "@swan-io/boxed";
import { isEmpty } from "@swan-io/lake/src/utils/nullish";
import { isValidEmail, isValidVatNumber } from "@swan-io/shared-business/src/utils/validation";
import { combineValidators, Validator } from "@swan-io/use-form";
import dayjs from "dayjs";
import { match } from "ts-pattern";
import {
  OnboardingInvalidInfoFragment,
  UpdateValidationErrorsFragment,
  ValidationFieldErrorCode,
} from "../graphql/unauthenticated";
import { locale, t } from "./i18n";

export const validateRequiredBoolean: Validator<boolean | undefined> = value => {
  if (typeof value != "boolean") {
    return t("error.requiredField");
  }
};

export const validateRequired: Validator<string> = value => {
  if (!value) {
    return t("error.requiredField");
  }
};

// This regex was copied from the backend to ensure that the validation is the same
// Matches all unicode letters, spaces, dashes, apostrophes, commas, and single quotes
const VALID_NAME_RE =
  /^(?:[A-Za-zÀ-ÖÙ-öù-ƿǄ-ʯʹ-ʽΈ-ΊΎ-ΡΣ-ҁҊ-Ֆա-ևႠ-Ⴥა-ჺᄀ-፜፩-ᎏᵫ-ᶚḀ-῾ⴀ-ⴥ⺀-⿕ぁ-ゖゝ-ㇿ㋿-鿯鿿-ꒌꙀ-ꙮꚀ-ꚙꜦ-ꞇꞍ-ꞿꥠ-ꥼＡ-Ｚａ-ｚ.]| |'|-|Ά|Ό|,)*$/;

export const validateName: Validator<string> = value => {
  if (!value) {
    return t("error.requiredField");
  }

  // Rule copied from the backend
  if (value.length > 100) {
    return t("error.invalidName");
  }

  const isValid = VALID_NAME_RE.test(value);

  if (!isValid) {
    return t("error.invalidName");
  }
};

export const validateEmail: Validator<string> = value => {
  if (!isValidEmail(value)) {
    return t("error.invalidEmail");
  }
};

export const validateMaxLength: (maxLength: number) => Validator<string> = maxLength => value => {
  if (!value) {
    return;
  }

  if (value.length > maxLength) {
    return " ";
  }
};

export type ServerInvalidFieldCode = "Missing";

export const extractServerValidationErrors = <T extends string>(
  { fields }: UpdateValidationErrorsFragment,
  pathToFieldName: (path: string[]) => T | null = () => null,
): { fieldName: T; code: ValidationFieldErrorCode }[] => {
  return Array.filterMap(fields, ({ path, code }) => {
    const fieldName = pathToFieldName(path);
    if (fieldName != null) {
      return Option.Some({ fieldName, code });
    }
    return Option.None();
  });
};

export const extractServerInvalidFields = <T extends string>(
  statusInfo: OnboardingInvalidInfoFragment,
  getFieldName: (field: string) => T | null,
): { fieldName: T; code: ServerInvalidFieldCode }[] => {
  return match(statusInfo)
    .with({ __typename: "OnboardingInvalidStatusInfo" }, ({ errors }) =>
      Array.filterMap(errors, error => {
        const fieldName = getFieldName(error.field);
        if (fieldName != null) {
          return Option.Some({ fieldName, code: "Missing" as const });
        }
        return Option.None();
      }),
    )
    .otherwise(() => []);
};

export const getValidationErrorMessage = (
  code: ValidationFieldErrorCode | ServerInvalidFieldCode,
  currentValue?: string,
): string => {
  return match(code)
    .with("Missing", () => t("error.requiredField"))
    .with("InvalidString", () =>
      isEmpty(currentValue) ? t("error.requiredField") : t("error.invalidField"),
    )
    .with("InvalidType", "TooLong", "TooShort", () => t("error.invalidField"))
    .with("UnrecognizedKeys", () => t("error.unrecognizedKeys"))
    .exhaustive();
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

export const validateDate: Validator<string> = combineValidators<string>(
  validateRequired,
  value => {
    if (!dayjs(value, locale.dateFormat, true).isValid()) {
      return t("common.form.invalidDate");
    }
  },
);
