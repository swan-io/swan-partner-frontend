import { DatePickerDate } from "@swan-io/shared-business/src/components/DatePicker";
import dayjs from "dayjs";
import { describe, expect, it } from "vitest";
import { CompleteAddressWithContactInput } from "../../graphql/partner";
import {
  isAfterUpdatedAtSelectable,
  isBeforeUpdatedAtSelectable,
  validateAccountNameLength,
  validateAccountReasonClose,
  validateAddress,
  validateAddressLine,
  validateAfterUpdatedAt,
  validateBeforeUpdatedAt,
  validateBeneficiaryName,
  validateBirthdate,
  validateCity,
  validateCMC7,
  validateDate,
  validateDateWithinNextYear,
  validateHexColor,
  validateMandateCreditorName,
  validateMaxLength,
  validateMinLength,
  validateNumeric,
  validatePattern,
  validatePostalCode,
  validateReference,
  validateRLMC,
  validateState,
  validateTime,
  validateTodayOrAfter,
  validateTransferReference,
  validateUrl,
} from "../validations";

const dateFormat = "DD/MM/YYYY";

describe("validateMandateCreditorName", () => {
  it("accepts a valid name", () => {
    expect(validateMandateCreditorName("John Doe")).toBeUndefined();
  });

  it("rejects an empty, too long, or out-of-range value", () => {
    expect(validateMandateCreditorName("")).toBeDefined();
    expect(validateMandateCreditorName("a".repeat(71))).toBeDefined();
    expect(validateMandateCreditorName("😀")).toBeDefined();
  });
});

describe("validateBeneficiaryName", () => {
  it("accepts a valid name containing digits", () => {
    expect(validateBeneficiaryName("John Doe 123")).toBeUndefined();
  });

  it("rejects an empty, too long, or invalid value", () => {
    expect(validateBeneficiaryName("")).toBeDefined();
    expect(validateBeneficiaryName("a".repeat(71))).toBeDefined();
    expect(validateBeneficiaryName("😀")).toBeDefined();
  });
});

describe("validateTransferReference", () => {
  it("accepts a valid reference", () => {
    expect(validateTransferReference("REF-123")).toBeUndefined();
  });

  it("rejects references that are too long, malformed, or slash-bounded", () => {
    expect(validateTransferReference("a".repeat(36))).toBeDefined();
    expect(validateTransferReference("ref@")).toBeDefined();
    expect(validateTransferReference("ref/")).toBeDefined();
  });
});

describe("validateAccountReasonClose", () => {
  it("accepts a message within 255 characters", () => {
    expect(validateAccountReasonClose("a".repeat(255))).toBeUndefined();
  });

  it("rejects a message longer than 255 characters", () => {
    expect(validateAccountReasonClose("a".repeat(256))).toBeDefined();
  });
});

describe("validateAccountNameLength", () => {
  it("accepts a name within 256 characters", () => {
    expect(validateAccountNameLength("a".repeat(256))).toBeUndefined();
  });

  it("rejects a name longer than 256 characters", () => {
    expect(validateAccountNameLength("a".repeat(257))).toBeDefined();
  });
});

describe("validateDate", () => {
  it("accepts a date in the locale format", () => {
    expect(validateDate("31/12/2020")).toBeUndefined();
  });

  it("rejects a date not matching the locale format", () => {
    expect(validateDate("2020-12-31")).toBeDefined();
  });
});

describe("validateBirthdate", () => {
  it("accepts a date in the past", () => {
    expect(validateBirthdate("01/01/2000")).toBeUndefined();
  });

  it("rejects an invalid date", () => {
    expect(validateBirthdate("not a date")).toBeDefined();
  });

  it("rejects a date after tomorrow", () => {
    expect(validateBirthdate(dayjs().add(2, "day").format(dateFormat))).toBeDefined();
  });
});

describe("validateTodayOrAfter", () => {
  it("accepts tomorrow", () => {
    expect(validateTodayOrAfter(dayjs.utc().add(1, "day").format(dateFormat))).toBeUndefined();
  });

  it("rejects empty, invalid, or past dates", () => {
    expect(validateTodayOrAfter("")).toBeDefined();
    expect(validateTodayOrAfter("not a date")).toBeDefined();
    expect(validateTodayOrAfter(dayjs.utc().subtract(1, "day").format(dateFormat))).toBeDefined();
  });
});

describe("validateDateWithinNextYear", () => {
  it("accepts a date within the next year", () => {
    expect(
      validateDateWithinNextYear(dayjs.utc().add(1, "day").format(dateFormat)),
    ).toBeUndefined();
  });

  it("rejects empty, invalid, or dates beyond one year", () => {
    expect(validateDateWithinNextYear("")).toBeDefined();
    expect(validateDateWithinNextYear("not a date")).toBeDefined();
    expect(validateDateWithinNextYear(dayjs.utc().add(2, "year").format(dateFormat))).toBeDefined();
  });
});

describe("validateTime", () => {
  it("accepts a time at or after the minimum", () => {
    expect(validateTime(9, 30)("10:00")).toBeUndefined();
    expect(validateTime(9, 30)("09:45")).toBeUndefined();
  });

  it("rejects a time before the minimum", () => {
    expect(validateTime(9, 30)("09:15")).toBeDefined();
    expect(validateTime(9, 30)("08:00")).toBeDefined();
  });
});

describe("validateAddress", () => {
  const validAddress: CompleteAddressWithContactInput = {
    addressLine1: "12 rue de la Paix",
    city: "Paris",
    country: "FRA",
    firstName: "John",
    lastName: "Doe",
    phoneNumber: "+33612345678",
    postalCode: "75000",
    state: "",
  };

  it("returns false when every field is valid", () => {
    expect(validateAddress(validAddress)).toBe(false);
  });

  it("returns true when a field is invalid", () => {
    expect(validateAddress({ ...validAddress, addressLine1: "a".repeat(39) })).toBe(true);
  });

  it("returns true when a required field is empty", () => {
    expect(validateAddress({ ...validAddress, city: "" })).toBe(true);
  });
});

describe("validateAddressLine", () => {
  it("accepts a line within 38 characters", () => {
    expect(validateAddressLine("a".repeat(38))).toBeUndefined();
  });

  it("rejects a line longer than 38 characters", () => {
    expect(validateAddressLine("a".repeat(39))).toBeDefined();
  });
});

describe("validateCity", () => {
  it("accepts a city within 30 characters", () => {
    expect(validateCity("a".repeat(30))).toBeUndefined();
  });

  it("rejects a city longer than 30 characters", () => {
    expect(validateCity("a".repeat(31))).toBeDefined();
  });
});

describe("validatePostalCode", () => {
  it("accepts a postal code within 10 characters", () => {
    expect(validatePostalCode("a".repeat(10))).toBeUndefined();
  });

  it("rejects a postal code longer than 10 characters", () => {
    expect(validatePostalCode("a".repeat(11))).toBeDefined();
  });
});

describe("validateState", () => {
  it("accepts a state within 30 characters", () => {
    expect(validateState("a".repeat(30))).toBeUndefined();
  });

  it("rejects a state longer than 30 characters", () => {
    expect(validateState("a".repeat(31))).toBeDefined();
  });
});

describe("isAfterUpdatedAtSelectable", () => {
  const date: DatePickerDate = { day: 1, month: 0, year: 2024 };

  it("returns true when there is no upper bound filter", () => {
    expect(isAfterUpdatedAtSelectable(date, {})).toBe(true);
  });

  it("returns true when the date is before the upper bound", () => {
    expect(isAfterUpdatedAtSelectable(date, { isBeforeUpdatedAt: "2024-06-15" })).toBe(true);
  });

  it("returns false when the date is after the upper bound", () => {
    expect(
      isAfterUpdatedAtSelectable(
        { day: 1, month: 11, year: 2024 },
        { isBeforeUpdatedAt: "2024-06-15" },
      ),
    ).toBe(false);
  });
});

describe("isBeforeUpdatedAtSelectable", () => {
  it("returns true when there is no lower bound filter", () => {
    expect(isBeforeUpdatedAtSelectable({ day: 1, month: 0, year: 2024 }, {})).toBe(true);
  });

  it("returns true when the date is after the lower bound", () => {
    expect(
      isBeforeUpdatedAtSelectable(
        { day: 1, month: 11, year: 2024 },
        { isAfterUpdatedAt: "2024-06-15" },
      ),
    ).toBe(true);
  });

  it("returns false when the date is before the lower bound", () => {
    expect(
      isBeforeUpdatedAtSelectable(
        { day: 1, month: 0, year: 2024 },
        { isAfterUpdatedAt: "2024-06-15" },
      ),
    ).toBe(false);
  });
});

describe("validateAfterUpdatedAt", () => {
  it("accepts a valid date when there is no filter", () => {
    expect(validateAfterUpdatedAt("15/06/2024", {})).toBeUndefined();
  });

  it("rejects an empty or invalid date", () => {
    expect(validateAfterUpdatedAt("", {})).toBeDefined();
    expect(validateAfterUpdatedAt("not a date", {})).toBeDefined();
  });
});

describe("validateBeforeUpdatedAt", () => {
  it("accepts a valid date when there is no filter", () => {
    expect(validateBeforeUpdatedAt("15/06/2024", {})).toBeUndefined();
  });

  it("rejects an empty or invalid date", () => {
    expect(validateBeforeUpdatedAt("", {})).toBeDefined();
    expect(validateBeforeUpdatedAt("not a date", {})).toBeDefined();
  });
});

describe("validateMinLength", () => {
  it("accepts an empty value or one at least as long as the minimum", () => {
    expect(validateMinLength(3)("")).toBeUndefined();
    expect(validateMinLength(3)("abc")).toBeUndefined();
  });

  it("rejects a value shorter than the minimum", () => {
    expect(validateMinLength(3)("ab")).toBeDefined();
  });
});

describe("validateMaxLength", () => {
  it("accepts an empty value or one within the maximum", () => {
    expect(validateMaxLength(3)("")).toBeUndefined();
    expect(validateMaxLength(3)("abc")).toBeUndefined();
  });

  it("rejects a value longer than the maximum", () => {
    expect(validateMaxLength(3)("abcd")).toBeDefined();
  });
});

describe("validatePattern", () => {
  it("accepts an empty value or one matching the pattern", () => {
    expect(validatePattern("^[0-9]+$")("")).toBeUndefined();
    expect(validatePattern("^[0-9]+$")("456")).toBeUndefined();
  });

  it("rejects a value not matching the pattern", () => {
    expect(validatePattern("^[0-9]+$")("abc")).toBeDefined();
    expect(validatePattern("^[0-9]+$", "123")("abc")).toBeDefined();
  });
});

describe("validateNumeric", () => {
  it("accepts an integer or float within bounds", () => {
    expect(validateNumeric()("50")).toBeUndefined();
    expect(validateNumeric({ min: 0, max: 100 })("1.5")).toBeUndefined();
  });

  it("rejects empty or non-numeric values", () => {
    expect(validateNumeric()("")).toBeDefined();
    expect(validateNumeric()("abc")).toBeDefined();
  });

  it("rejects values outside the bounds", () => {
    expect(validateNumeric({ min: 0 })("-5")).toBeDefined();
    expect(validateNumeric({ max: 100 })("150")).toBeDefined();
  });
});

describe("validateUrl", () => {
  it("accepts an http or https url", () => {
    expect(validateUrl("https://example.com")).toBeUndefined();
  });

  it("rejects empty, wrong-protocol, or malformed urls", () => {
    expect(validateUrl("")).toBeDefined();
    expect(validateUrl("ftp://example.com")).toBeDefined();
    expect(validateUrl("example.com")).toBeDefined();
    expect(validateUrl("https://ex ample.com")).toBeDefined();
  });
});

describe("validateHexColor", () => {
  it("accepts a six-digit hex color", () => {
    expect(validateHexColor("aabbcc")).toBeUndefined();
    expect(validateHexColor("AABBCC")).toBeUndefined();
  });

  it("rejects malformed hex colors", () => {
    expect(validateHexColor("gggggg")).toBeDefined();
    expect(validateHexColor("abc")).toBeDefined();
    expect(validateHexColor("aabbccdd")).toBeDefined();
  });
});

describe("validateCMC7", () => {
  it("accepts exactly 31 digits", () => {
    expect(validateCMC7("0".repeat(31))).toBeUndefined();
  });

  it("rejects the wrong length or non-digit characters", () => {
    expect(validateCMC7("0".repeat(30))).toBeDefined();
    expect(validateCMC7("a".repeat(31))).toBeDefined();
  });
});

describe("validateRLMC", () => {
  it("accepts a two-digit key that satisfies the mod 97 checksum", () => {
    expect(validateRLMC("0".repeat(31))("00")).toBeUndefined();
  });

  it("rejects a key that fails the checksum", () => {
    expect(validateRLMC("0".repeat(31))("01")).toBeDefined();
  });

  it("rejects a key that is not two digits", () => {
    expect(validateRLMC("0".repeat(31))("5")).toBeDefined();
  });
});

describe("validateReference", () => {
  it("accepts undefined, empty, or a valid reference", () => {
    expect(validateReference(undefined)).toBeUndefined();
    expect(validateReference("")).toBeUndefined();
    expect(validateReference("ABC-123")).toBeUndefined();
  });

  it("rejects a too-long or invalid reference", () => {
    expect(validateReference("a".repeat(36))).toBeDefined();
    expect(validateReference("abc@")).toBeDefined();
  });
});
