import { describe, expect, it } from "vitest";
import {
  getValidationErrorMessage,
  isValidUrl,
  validateDate,
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

describe("validateDate", () => {
  it("accepts a valid date in the locale format", () => {
    expect(validateDate("31/12/2020")).toBeUndefined();
  });

  it("rejects an empty or malformed date", () => {
    expect(validateDate("")).toBeDefined();
    expect(validateDate("2020-12-31")).toBeDefined();
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

describe("isValidUrl", () => {
  it("accepts urls with or without a protocol", () => {
    expect(isValidUrl("https://example.com")).toBe(true);
    expect(isValidUrl("www.example.com")).toBe(true);
    expect(isValidUrl("example.com")).toBe(true);
  });

  it("rejects values that are not urls", () => {
    expect(isValidUrl("")).toBe(false);
    expect(isValidUrl("example")).toBe(false);
    expect(isValidUrl("not a url")).toBe(false);
  });
});
