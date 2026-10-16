import { describe, expect, it } from "vitest";
import { isBirthPostalCodeRequired, toSovereignCountry } from "../verificationRenewal";

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

  it("is required for a person born in a French territory", () => {
    expect(isBirthPostalCodeRequired({ accountCountry: "FRA", birthCountry: "REU" })).toBe(true);
  });

  it("is not required for a non-French account", () => {
    expect(isBirthPostalCodeRequired({ accountCountry: "BEL", birthCountry: "FRA" })).toBe(false);
  });
});

describe("toSovereignCountry", () => {
  it("maps French territories to France", () => {
    expect(toSovereignCountry("REU")).toBe("FRA");
    expect(toSovereignCountry("FRA")).toBe("FRA");
  });

  it("keeps sovereign countries", () => {
    expect(toSovereignCountry("POL")).toBe("POL");
  });

  it("drops other territories and invalid values", () => {
    expect(toSovereignCountry("PRI")).toBeUndefined();
    expect(toSovereignCountry(undefined)).toBeUndefined();
  });
});
