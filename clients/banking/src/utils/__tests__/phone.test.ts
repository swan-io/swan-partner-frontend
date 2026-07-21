import { countries } from "@swan-io/shared-business/src/constants/countries";
import { describe, expect, it } from "vitest";
import { maskPhoneNumber, parsePhoneNumber, prefixPhoneNumber } from "../phone";

const franceCountry = countries.find(country => country.cca3 === "FRA");

if (franceCountry == null) {
  throw new Error("FRA not found in countries");
}

describe("parsePhoneNumber", () => {
  it("returns the country and national number for a valid international number", () => {
    const result = parsePhoneNumber("+33612345678");
    expect(result.country.cca3).toBe("FRA");
    expect(result.nationalNumber).toBe("612345678");
  });

  it("strips non-digit characters from the national number", () => {
    const result = parsePhoneNumber("+33 6 12 34 56 78");
    expect(result.country.cca3).toBe("FRA");
    expect(result.nationalNumber).toBe("612345678");
  });

  it("returns an empty string when value is wrong", () => {
    expect(parsePhoneNumber(undefined).nationalNumber).toBe("");
    expect(parsePhoneNumber("").nationalNumber).toBe("");
    expect(parsePhoneNumber("   ").nationalNumber).toBe("");
    expect(parsePhoneNumber("not a phone").nationalNumber).toBe("");
    expect(parsePhoneNumber("+3300").nationalNumber).toBe("");
  });
});

describe("prefixPhoneNumber", () => {
  it("returns a valid E164 number for a valid national number", () => {
    expect(prefixPhoneNumber(franceCountry, "612345678")).toEqual({
      valid: true,
      e164: "+33612345678",
    });
  });

  it("ignores non-digit characters when parsing", () => {
    expect(prefixPhoneNumber(franceCountry, "6 12 34 56 78")).toEqual({
      valid: true,
      e164: "+33612345678",
    });
  });

  it("returns invalid for a national number that cannot form a valid phone number", () => {
    expect(prefixPhoneNumber(franceCountry, "0")).toEqual({ valid: false });
    expect(prefixPhoneNumber(franceCountry, "")).toEqual({ valid: false });
  });
});

describe("maskPhoneNumber", () => {
  it("masks the digits between the first three and last three", () => {
    expect(maskPhoneNumber("0612345678")).toBe("061****678");
  });

  it("masks the digits between the first three and last three", () => {
    expect(maskPhoneNumber("+33612345678")).toBe("+336*****678");
  });

  it("returns the value unchanged when there are fewer than seven digits", () => {
    expect(maskPhoneNumber("12345")).toBe("12345");
  });
});
