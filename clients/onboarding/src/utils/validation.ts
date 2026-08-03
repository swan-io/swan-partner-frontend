import { Array, Option } from "@swan-io/boxed";
import { isEmpty } from "@swan-io/lake/src/utils/nullish";
import { Validator } from "@swan-io/use-form";
import { match, P } from "ts-pattern";
import {
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

export type ServerInvalidFieldCode = "Missing";

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
  currentValue?: string | string[],
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
