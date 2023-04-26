import { Array, Option } from "@swan-io/boxed";
import { isEmpty } from "@swan-io/lake/src/utils/nullish";
import { isValidVatNumber } from "@swan-io/shared-business/src/utils/validation";
import { Validator } from "react-ux-form";
import { match } from "ts-pattern";
import {
  OnboardingInvalidInfoFragment,
  UpdateValidationErrorsFragment,
  ValidationFieldErrorCode,
} from "../graphql/unauthenticated";
import { t } from "./i18n";

export const validateRequired: Validator<string> = value => {
  if (!value) {
    return t("error.requiredField");
  }
};

export const validateEmail: Validator<string> = value => {
  if (!/.+@.+\..{2,}/.test(value)) {
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
