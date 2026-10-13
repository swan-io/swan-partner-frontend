import { describe, expect, it } from "vitest";
import { isBirthPostalCodeRequired } from "../verificationRenewal";

describe("isBirthPostalCodeRequired", () => {
  it("is required for a French account and a person born in France", () => {
    expect(isBirthPostalCodeRequired({ accountCountry: "FRA", birthCountry: "FRA" })).toBe(true);
  });

  it("is not required for a person born outside France", () => {
    expect(isBirthPostalCodeRequired({ accountCountry: "FRA", birthCountry: "POL" })).toBe(false);
    expect(isBirthPostalCodeRequired({ accountCountry: "FRA", birthCountry: undefined })).toBe(
      false,
    );
  });

  it("only checks FRA, not French territories", () => {
    expect(isBirthPostalCodeRequired({ accountCountry: "FRA", birthCountry: "REU" })).toBe(false);
  });

  it("is not required for a non-French account", () => {
    expect(isBirthPostalCodeRequired({ accountCountry: "BEL", birthCountry: "FRA" })).toBe(false);
  });
});
