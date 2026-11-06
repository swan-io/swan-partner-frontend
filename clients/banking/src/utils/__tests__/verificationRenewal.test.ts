import { Option } from "@bloodyowl/boxed";
import { describe, expect, it } from "vitest";
import { AccountCountry } from "../../graphql/partner";
import {
  getFinalizeValidationErrors,
  getUboRequirements,
  isBirthPostalCodeRequired,
  isUboTaxIdentificationNumberRequired,
  toSovereignCountry,
  UboValidationInput,
  validateUbo,
} from "../verificationRenewal";

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

// mirrors account-contract verification-renewal-ultimate-beneficial-owner.spec.ts
const accountCountries: AccountCountry[] = ["FRA", "DEU", "ESP", "NLD", "ITA", "BEL"];

const validUbo: UboValidationInput = {
  firstName: "Giulia",
  lastName: "Bianchi",
  birthDate: "1980-01-01",
  birthCountryCode: "POL",
  birthCity: "Warsaw",
  birthCityPostalCode: "",
  qualificationType: "Ownership",
  direct: true,
  indirect: false,
  totalPercentage: 50,
  addressLine1: "1 rue de la Paix",
  city: "Paris",
  postalCode: "75002",
  country: "FRA",
  taxIdentificationNumber: "",
};

const getErrorFields = (ubo: Partial<UboValidationInput>, accountCountry: AccountCountry) =>
  Object.entries(validateUbo(ubo, accountCountry))
    .filter(([, error]) => error != null)
    .map(([field]) => field)
    .sort();

describe("getUboRequirements", () => {
  it("requires the full residency address for DEU, ESP and BEL only", () => {
    expect(
      accountCountries.filter(
        country => getUboRequirements(country).isFullResidencyAddressRequired,
      ),
    ).toEqual(["DEU", "ESP", "BEL"]);
  });

  it("requires the birth info unless DEU", () => {
    expect(
      accountCountries.filter(country => getUboRequirements(country).isBirthInfoRequired),
    ).toEqual(["FRA", "ESP", "NLD", "ITA", "BEL"]);
  });
});

describe("isUboTaxIdentificationNumberRequired", () => {
  it("is required for a DEU or ITA account and a beneficiary living in that country", () => {
    expect(
      isUboTaxIdentificationNumberRequired({ accountCountry: "DEU", residencyCountry: "DEU" }),
    ).toBe(true);
    expect(
      isUboTaxIdentificationNumberRequired({ accountCountry: "ITA", residencyCountry: "ITA" }),
    ).toBe(true);
  });

  it("is not required for a beneficiary living abroad or another account country", () => {
    expect(
      isUboTaxIdentificationNumberRequired({ accountCountry: "ITA", residencyCountry: "FRA" }),
    ).toBe(false);
    expect(
      isUboTaxIdentificationNumberRequired({ accountCountry: "FRA", residencyCountry: "FRA" }),
    ).toBe(false);
    expect(
      isUboTaxIdentificationNumberRequired({ accountCountry: "DEU", residencyCountry: undefined }),
    ).toBe(false);
  });
});

describe("validateUbo", () => {
  it.each(accountCountries)("accepts a complete UBO for %s", accountCountry => {
    expect(getErrorFields(validUbo, accountCountry)).toEqual([]);
  });

  it.each(accountCountries)("requires the residency address country for %s", accountCountry => {
    const ubo = {
      ...validUbo,
      addressLine1: "",
      city: "",
      postalCode: "",
      country: undefined,
    };
    expect(getErrorFields(ubo, accountCountry)).toContain("country");
  });

  it.each(accountCountries)("requires the UBO type for %s", accountCountry => {
    expect(getErrorFields({ ...validUbo, qualificationType: undefined }, accountCountry)).toEqual([
      "qualificationType",
    ]);
  });

  it.each(["DEU", "ESP", "BEL"] as const)(
    "requires street, city and postal code for %s",
    accountCountry => {
      const ubo = { ...validUbo, addressLine1: "", city: "", postalCode: "" };
      expect(getErrorFields(ubo, accountCountry)).toEqual(["addressLine1", "city", "postalCode"]);
    },
  );

  it.each(["FRA", "NLD", "ITA"] as const)(
    "requires the rest of a partially filled residency address for %s",
    accountCountry => {
      expect(getErrorFields({ ...validUbo, addressLine1: "" }, accountCountry)).toEqual([
        "addressLine1",
      ]);
      expect(getErrorFields({ ...validUbo, city: "" }, accountCountry)).toEqual(["city"]);
    },
  );

  it.each(["FRA", "ESP", "NLD", "ITA", "BEL"] as const)(
    "requires birth date and birth city for %s",
    accountCountry => {
      const ubo = { ...validUbo, birthDate: null, birthCity: "" };
      expect(getErrorFields(ubo, accountCountry)).toEqual(["birthCity", "birthDate"]);
    },
  );

  it("doesn't require birth date and birth city for DEU", () => {
    const ubo = { ...validUbo, birthDate: null, birthCity: "" };
    expect(getErrorFields(ubo, "DEU")).toEqual([]);
  });

  it("requires the birth postal code for a FRA account and a UBO born in France", () => {
    const ubo = { ...validUbo, birthCountryCode: "FRA" as const, birthCityPostalCode: "" };
    expect(getErrorFields(ubo, "FRA")).toEqual(["birthCityPostalCode"]);
    expect(getErrorFields(ubo, "ITA")).toEqual([]);
  });

  it("requires the capital details when the UBO holds capital", () => {
    const ubo = { ...validUbo, direct: false, indirect: false, totalPercentage: undefined };
    expect(getErrorFields(ubo, "FRA")).toEqual(["direct", "indirect", "totalPercentage"]);
    expect(getErrorFields({ ...ubo, qualificationType: "Control" }, "FRA")).toEqual([]);
  });

  it.each(["DEU", "ITA"] as const)(
    "requires the tax identification number for a %s account and a beneficiary living there",
    accountCountry => {
      const ubo = { ...validUbo, country: accountCountry, taxIdentificationNumber: "" };
      expect(getErrorFields(ubo, accountCountry)).toContain("taxIdentificationNumber");
      expect(getErrorFields({ ...ubo, country: "FRA" }, accountCountry)).not.toContain(
        "taxIdentificationNumber",
      );
    },
  );

  it("requires first name, last name and birth country", () => {
    const ubo = { ...validUbo, firstName: "", lastName: "", birthCountryCode: undefined };
    expect(getErrorFields(ubo, "FRA")).toEqual(["birthCountryCode", "firstName", "lastName"]);
  });

  // test case from the ticket: Italian company, UBO without a residency address
  it("flags an ITA UBO without residency address", () => {
    const ubo = {
      ...validUbo,
      addressLine1: "",
      city: "",
      postalCode: "",
      country: undefined,
    };
    expect(getErrorFields(ubo, "ITA")).toEqual(["country"]);
  });
});

describe("getFinalizeValidationErrors", () => {
  const uboError = (index: number, field: string) => ({
    path: [`VerificationRenewalUltimateBeneficialOwner[${index}].${field}`],
    message: `${field} is required`,
  });

  it("returns nothing when there's no field", () => {
    expect(getFinalizeValidationErrors([])).toEqual({
      beneficialOwners: Option.None(),
      others: [],
    });
  });

  // format returned by the backend today (checked on master sandbox)
  it("maps a beneficial owner field to its label", () => {
    expect(getFinalizeValidationErrors([uboError(1, "residencyAddress")])).toEqual({
      beneficialOwners: Option.Some({ count: 1, fields: ["Residency address"] }),
      others: [],
    });
  });

  it("maps residency address sub-fields", () => {
    const { beneficialOwners } = getFinalizeValidationErrors([
      uboError(0, "residencyAddress.addressLine1"),
      uboError(0, "residencyAddress.city"),
      uboError(0, "residencyAddress.postalCode"),
      uboError(0, "residencyAddress.country"),
    ]);
    expect(beneficialOwners).toEqual(
      Option.Some({
        count: 1,
        fields: [
          "Residency address line",
          "Residency city",
          "Residency postcode",
          "Residency country",
        ],
      }),
    );
  });

  it("counts distinct beneficial owners and dedupes labels", () => {
    const { beneficialOwners } = getFinalizeValidationErrors([
      uboError(0, "birthDate"),
      uboError(1, "birthDate"),
      uboError(1, "isDirect"),
      uboError(1, "isIndirect"),
    ]);
    expect(beneficialOwners).toEqual(
      Option.Some({ count: 2, fields: ["Birth date", "Direct or indirect ownership"] }),
    );
  });

  it("supports a path split in segments", () => {
    const { beneficialOwners } = getFinalizeValidationErrors([
      { path: ["VerificationRenewalUltimateBeneficialOwner[0]", "type"], message: "" },
    ]);
    expect(beneficialOwners).toEqual(
      Option.Some({ count: 1, fields: ["Type of control exercised"] }),
    );
  });

  it("falls back to the backend message for an unknown beneficial owner field", () => {
    const { beneficialOwners } = getFinalizeValidationErrors([uboError(0, "gender")]);
    expect(beneficialOwners).toEqual(Option.Some({ count: 1, fields: ["gender is required"] }));
  });

  it("keeps the backend message for an unknown entity", () => {
    expect(
      getFinalizeValidationErrors([
        { path: ["AccountHolder.name"], message: "name is required" },
        { path: ["somethingElse"], message: "Input is invalid" },
      ]),
    ).toEqual({
      beneficialOwners: Option.None(),
      others: ["name is required", "Input is invalid"],
    });
  });
});
