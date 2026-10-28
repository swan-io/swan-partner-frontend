import { describe, expect, it } from "vitest";
import {
  extractServerInvalidFields,
  getServerInvalidFieldCode,
  getValidationErrorMessage,
  validateMaxLength,
  validateRegistrationNumber,
  validateUboPercentage,
} from "../validation";

describe("validateMaxLength", () => {
  it("returns undefined for an empty value or one within the limit", () => {
    expect(validateMaxLength(5)("")).toBeUndefined();
    expect(validateMaxLength(5)("abcde")).toBeUndefined();
  });

  it("returns an error when the value exceeds the limit", () => {
    expect(validateMaxLength(5)("abcdef")).toBe(" ");
  });
});

describe("getValidationErrorMessage", () => {
  it("returns the required-field message for Missing", () => {
    expect(getValidationErrorMessage("Missing")).toBeTruthy();
  });

  it("treats an empty InvalidString value as a required-field error", () => {
    expect(getValidationErrorMessage("InvalidString", "")).toBe(
      getValidationErrorMessage("Missing"),
    );
  });

  it("treats a filled InvalidString value as an invalid-field error", () => {
    const message = getValidationErrorMessage("InvalidString", "value");
    expect(message).not.toBe(getValidationErrorMessage("Missing"));
    expect(message).toBe(getValidationErrorMessage("TooLong"));
  });

  it("returns a distinct message for UnrecognizedKeys", () => {
    expect(getValidationErrorMessage("UnrecognizedKeys")).not.toBe(
      getValidationErrorMessage("Missing"),
    );
  });
});

describe("getServerInvalidFieldCode", () => {
  it("returns Invalid when the server flags the value as invalid", () => {
    expect(getServerInvalidFieldCode(["Invalid"])).toBe("Invalid");
    expect(getServerInvalidFieldCode(["Missing", "Invalid"])).toBe("Invalid");
  });

  it("falls back to Missing otherwise", () => {
    expect(getServerInvalidFieldCode(["Missing"])).toBe("Missing");
    expect(getServerInvalidFieldCode([])).toBe("Missing");
    expect(getServerInvalidFieldCode(null)).toBe("Missing");
  });
});

describe("extractServerInvalidFields", () => {
  it("keeps the server error code for each mapped field", () => {
    const result = extractServerInvalidFields(
      {
        __typename: "OnboardingInvalidStatusInfo",
        errors: [
          {
            __typename: "ValidationError",
            field: "accountAdmin.address.postalCode",
            errors: ["Invalid"],
          },
          { __typename: "ValidationError", field: "accountAdmin.email", errors: ["Missing"] },
          { __typename: "ValidationError", field: "unmapped", errors: ["Invalid"] },
        ],
      },
      field =>
        field === "accountAdmin.address.postalCode"
          ? "residencePostal"
          : field === "accountAdmin.email"
            ? "email"
            : null,
    );

    expect(result).toEqual([
      { fieldName: "residencePostal", code: "Invalid" },
      { fieldName: "email", code: "Missing" },
    ]);
  });

  it("returns no field when the onboarding is not invalid", () => {
    expect(
      extractServerInvalidFields({ __typename: "OnboardingValidStatusInfo" }, () => "email"),
    ).toEqual([]);
  });
});

describe("getValidationErrorMessage (server codes)", () => {
  it("returns the invalid-field message for Invalid", () => {
    expect(getValidationErrorMessage("Invalid")).toBe(getValidationErrorMessage("TooLong"));
  });
});

describe("validateUboPercentage", () => {
  it("accepts a percentage between 25 and 100 inclusive", () => {
    expect(validateUboPercentage("25")).toBeUndefined();
    expect(validateUboPercentage("50")).toBeUndefined();
    expect(validateUboPercentage("100")).toBeUndefined();
  });

  it("rejects values out of range or non-numeric", () => {
    expect(validateUboPercentage("24")).toBeDefined();
    expect(validateUboPercentage("101")).toBeDefined();
    expect(validateUboPercentage("abc")).toBeDefined();
  });
});

describe("validateRegistrationNumber", () => {
  it("accepts exactly ten digits", () => {
    expect(validateRegistrationNumber("1234567890")).toBeUndefined();
  });

  it("rejects the wrong length or non-digit characters", () => {
    expect(validateRegistrationNumber("123")).toBeDefined();
    expect(validateRegistrationNumber("12345678901")).toBeDefined();
    expect(validateRegistrationNumber("abcdefghij")).toBeDefined();
  });
});
