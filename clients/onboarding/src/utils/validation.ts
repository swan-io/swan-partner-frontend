import { Array, Option } from "@bloodyowl/boxed";
import { isEmpty, isNotNullish, isNullish } from "@swan-io/lake/src/utils/nullish";
import {
  ExtractedDate,
  extractDate,
  formatExtractedDate,
} from "@swan-io/shared-business/src/utils/date";
import { t as tSharedBusiness } from "@swan-io/shared-business/src/utils/i18n";
import { Validator } from "@swan-io/use-form";
import dayjs from "dayjs";
import { match, P } from "ts-pattern";
import {
  FieldValidationError,
  OnboardingInvalidInfoFragment,
  UpdateValidationErrorsFragment,
} from "../graphql/unauthenticated";
import { t } from "./i18n";

export const validateMaxLength: (maxLength: number) => Validator<string> = maxLength => value => {
  if (!value) {
    return;
  }

  if (value.length > maxLength) {
    return " ";
  }
};

// A field can carry several errors: "Invalid" wins since the value exists but must be fixed.
// No error listed falls back to "Missing", the historical behavior.
export const getServerInvalidFieldCode = (
  errors: FieldValidationError[] | null | undefined,
): FieldValidationError => (errors?.includes("Invalid") === true ? "Invalid" : "Missing");

// @depreacted: moving to extractServerValidationFields when using Graphql error
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

const validationFieldErrorCodePattern = P.union(
  "InvalidString",
  "InvalidType",
  "TooLong",
  "TooShort",
  "UnrecognizedKeys",
);

type ValidationFieldErrorCode = P.infer<typeof validationFieldErrorCodePattern>;

export const badUserInputErrorPattern = [
  {
    extensions: {
      code: "BAD_USER_INPUT",
      meta: {
        fields: P.array({ path: P.array(P.string), code: validationFieldErrorCodePattern }).select(
          "fields",
        ),
      },
    },
  },
] as const;

export const extractServerValidationFields = <T extends string>(
  fields: P.infer<typeof badUserInputErrorPattern>[0]["extensions"]["meta"]["fields"],
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
): { fieldName: T; code: FieldValidationError }[] => {
  return match(statusInfo)
    .with({ __typename: "OnboardingInvalidStatusInfo" }, ({ errors }) =>
      Array.filterMap(errors, error => {
        const fieldName = getFieldName(error.field);
        if (fieldName != null) {
          return Option.Some({ fieldName, code: getServerInvalidFieldCode(error.errors) });
        }
        return Option.None();
      }),
    )
    .otherwise(() => []);
};

export const getValidationErrorMessage = (
  code: ValidationFieldErrorCode | FieldValidationError,
  currentValue?: string | string[],
): string => {
  return match(code)
    .with("Missing", () => t("error.requiredField"))
    .with("InvalidString", () =>
      isEmpty(currentValue) ? t("error.requiredField") : t("error.invalidField"),
    )
    .with("Invalid", "InvalidType", "TooLong", "TooShort", () => t("error.invalidField"))
    .with("UnrecognizedKeys", () => t("error.unrecognizedKeys"))
    .exhaustive();
};

export const validateUboPercentage: Validator<string> = value => {
  const num = Number(value);
  if (Number.isNaN(num) || num < 25 || num > 100) {
    return t("error.invalidUboPercentage");
  }
};

// use for Belgium only
export const validateRegistrationNumber: Validator<string> = value => {
  // test integer
  if (!/^\d{10}$/.test(value)) {
    return t("common.form.help.nbDigits", { nbDigits: "10" });
  }
};

const MIN_REGISTRATION_YEAR = 1800;

export const validateRegistrationDate = (value: ExtractedDate | undefined) => {
  const date = isNotNullish(value)
    ? dayjs.utc(formatExtractedDate(value), "YYYY-MM-DD", true)
    : undefined;

  if (
    isNullish(date) ||
    !date.isValid() ||
    // formatExtractedDate pads short years (198 → 0198), this bound rejects them
    date.year() < MIN_REGISTRATION_YEAR ||
    // one day of margin for users in a time zone ahead of UTC
    date.isAfter(dayjs.utc().add(1, "day"), "day")
  ) {
    return tSharedBusiness("validation.invalidDate");
  }
};

// the picker only validates on input, so a date saved before these bounds existed must be checked by the form
export const validateRegistrationDateString = (value: string | undefined) =>
  isNotNullish(value) ? validateRegistrationDate(extractDate(value)) : undefined;
