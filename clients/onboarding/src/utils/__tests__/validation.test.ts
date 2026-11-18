import { t as tSharedBusiness } from "@swan-io/shared-business/src/utils/i18n";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  extractServerInvalidFields,
  getServerInvalidFieldCode,
  getValidationErrorMessage,
  validateMaxLength,
  validateRegistrationDate,
  validateRegistrationDateString,
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

describe("registration date", () => {
  const invalidDate = tSharedBusiness("validation.invalidDate");

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(Date.UTC(2026, 10, 18, 12, 0)));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("validateRegistrationDate", () => {
    it("accepts a valid past date", () => {
      expect(validateRegistrationDate({ day: "01", month: "01", year: "2026" })).toBeUndefined();
      expect(validateRegistrationDate({ day: "12", month: "02", year: "1800" })).toBeUndefined();
    });

    it("accepts today and tomorrow to absorb time zone differences", () => {
      expect(validateRegistrationDate({ day: "18", month: "11", year: "2026" })).toBeUndefined();
      expect(validateRegistrationDate({ day: "19", month: "11", year: "2026" })).toBeUndefined();
    });

    it("rejects a year with fewer than 4 digits", () => {
      expect(validateRegistrationDate({ day: "12", month: "02", year: "198" })).toBe(invalidDate);
      expect(validateRegistrationDate({ day: "12", month: "02", year: "19" })).toBe(invalidDate);
    });

    it("rejects a year before 1800", () => {
      expect(validateRegistrationDate({ day: "31", month: "12", year: "1799" })).toBe(invalidDate);
      expect(validateRegistrationDate({ day: "12", month: "02", year: "0198" })).toBe(invalidDate);
    });

    it("rejects a date later than tomorrow", () => {
      expect(validateRegistrationDate({ day: "20", month: "11", year: "2026" })).toBe(invalidDate);
      expect(validateRegistrationDate({ day: "01", month: "01", year: "2030" })).toBe(invalidDate);
    });

    it("rejects a missing or impossible date", () => {
      expect(validateRegistrationDate(undefined)).toBe(invalidDate);
      expect(validateRegistrationDate({ day: "31", month: "02", year: "2020" })).toBe(invalidDate);
    });
  });

  describe("validateRegistrationDateString", () => {
    it("accepts a saved date within the bounds", () => {
      expect(validateRegistrationDateString("2026-01-01")).toBeUndefined();
    });

    it("rejects a saved date whose year was padded", () => {
      expect(validateRegistrationDateString("0198-02-12")).toBe(invalidDate);
    });

    it("rejects a saved date later than tomorrow", () => {
      expect(validateRegistrationDateString("2030-01-01")).toBe(invalidDate);
    });

    it("leaves an empty value to the required validator", () => {
      expect(validateRegistrationDateString(undefined)).toBeUndefined();
    });
  });
});
