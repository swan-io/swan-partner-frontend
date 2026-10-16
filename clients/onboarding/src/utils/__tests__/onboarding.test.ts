import { describe, expect, it } from "vitest";
import {
  CompanyAccountHolderOnboardingAccountAdmin,
  CompanyRelatedIndividual,
  RelatedIndividualInput,
} from "../../graphql/partner";
import {
  cleanData,
  isBirthPostalCodeRequired,
  isCompanyRegistrationNumberRequired,
  namesMatch,
  toSovereignCountry,
  transformRelatedIndividualsToInput,
  upsertAccountAdminInRelatedIndividuals,
} from "../onboarding";

const asIndividuals = (individuals: unknown[]) =>
  individuals as unknown as CompanyRelatedIndividual[];

const asAdmin = (admin: unknown) => admin as CompanyAccountHolderOnboardingAccountAdmin;

const asUpdatedFields = (fields: unknown) => fields as Omit<RelatedIndividualInput, "type">;

describe("cleanData", () => {
  it("returns undefined for null or undefined", () => {
    expect(cleanData(null)).toBeUndefined();
    expect(cleanData(undefined)).toBeUndefined();
  });

  it("strips __typename and drops undefined and null fields", () => {
    expect(cleanData({ __typename: "X", a: 1, b: undefined, c: null })).toEqual({ a: 1 });
  });

  it("keeps empty strings and zeros", () => {
    expect(cleanData({ a: 0, b: "" })).toEqual({ a: 0, b: "" });
  });

  it("cleans nested objects recursively", () => {
    expect(cleanData({ __typename: "X", nested: { __typename: "Y", v: 2 } })).toEqual({
      nested: { v: 2 },
    });
  });

  it("cleans arrays and filters out null items", () => {
    expect(cleanData([{ __typename: "X", a: 1 }, null, { a: 2 }])).toEqual([{ a: 1 }, { a: 2 }]);
  });
});

describe("namesMatch", () => {
  it("matches names ignoring case and surrounding whitespace", () => {
    expect(
      namesMatch({ firstName: " John ", lastName: "DOE" }, { firstName: "john", lastName: "doe" }),
    ).toBe(true);
  });

  it("returns false when names differ", () => {
    expect(
      namesMatch({ firstName: "John", lastName: "Doe" }, { firstName: "Jane", lastName: "Doe" }),
    ).toBe(false);
  });

  it("returns false when a name is missing or empty", () => {
    expect(
      namesMatch({ firstName: "John", lastName: null }, { firstName: "John", lastName: "Doe" }),
    ).toBe(false);
    expect(namesMatch({ firstName: "", lastName: "Doe" }, { firstName: "", lastName: "Doe" })).toBe(
      false,
    );
  });
});

describe("transformRelatedIndividualsToInput", () => {
  it("returns an empty array for null or undefined", () => {
    expect(transformRelatedIndividualsToInput(null)).toEqual([]);
    expect(transformRelatedIndividualsToInput(undefined)).toEqual([]);
  });

  it("strips __typename and normalizes missing tax info and beneficial owner", () => {
    const result = transformRelatedIndividualsToInput(
      asIndividuals([
        {
          __typename: "CompanyLegalRepresentative",
          firstName: "John",
          lastName: "Doe",
          unitedStatesTaxInfo: null,
          ultimateBeneficialOwner: null,
        },
      ]),
    );
    expect(result).toEqual([{ firstName: "John", lastName: "Doe" }]);
  });

  it("maps an ownership beneficial owner with a default ownership type", () => {
    const result = transformRelatedIndividualsToInput(
      asIndividuals([
        {
          __typename: "CompanyUltimateBeneficialOwner",
          firstName: "John",
          lastName: "Doe",
          ultimateBeneficialOwner: {
            __typename: "RelatedIndividualUltimateBeneficialOwner",
            qualificationType: "Ownership",
            identityDocumentInfo: null,
            ownership: null,
            controlTypes: null,
          },
        },
      ]),
    );
    expect(result[0]?.ultimateBeneficialOwner).toEqual({
      qualificationType: "Ownership",
      ownership: { type: "Direct" },
    });
  });

  it("maps the united states tax info when present", () => {
    const result = transformRelatedIndividualsToInput(
      asIndividuals([
        {
          __typename: "CompanyLegalRepresentative",
          firstName: "John",
          lastName: "Doe",
          unitedStatesTaxInfo: {
            __typename: "UnitedStatesTaxInfo",
            isUnitedStatesPerson: true,
            unitedStatesTaxIdentificationNumber: "123456789",
          },
        },
      ]),
    );
    expect(result[0]?.unitedStatesTaxInfo).toEqual({
      isUnitedStatesPerson: true,
      unitedStatesTaxIdentificationNumber: "123456789",
    });
  });
});

describe("upsertAccountAdminInRelatedIndividuals", () => {
  const related = asIndividuals([
    { __typename: "CompanyLegalRepresentative", firstName: "John", lastName: "Doe" },
  ]);

  it("appends a new legal representative when the admin is not found", () => {
    const result = upsertAccountAdminInRelatedIndividuals(
      asAdmin({ firstName: "Jane", lastName: "Smith" }),
      related,
      asUpdatedFields({ firstName: "Jane", lastName: "Smith" }),
    );
    expect(result).toHaveLength(2);
    expect(result[1]).toEqual({
      firstName: "Jane",
      lastName: "Smith",
      type: "LegalRepresentative",
      legalRepresentative: { roles: [] },
    });
  });

  it("updates the matching individual in place", () => {
    const result = upsertAccountAdminInRelatedIndividuals(
      asAdmin({ firstName: "John", lastName: "Doe" }),
      related,
      asUpdatedFields({ firstName: "Johnny", lastName: "Doe" }),
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ firstName: "Johnny", lastName: "Doe" });
  });

  it("appends when the admin is null", () => {
    const result = upsertAccountAdminInRelatedIndividuals(
      null,
      related,
      asUpdatedFields({ firstName: "Jane", lastName: "Smith" }),
    );
    expect(result).toHaveLength(2);
  });
});

describe("isCompanyRegistrationNumberRequired", () => {
  it("is optional for a French CSE", () => {
    expect(isCompanyRegistrationNumberRequired({ country: "FRA", legalFormCode: "XK4T" })).toBe(
      false,
    );
    expect(isCompanyRegistrationNumberRequired({ country: "FRA", legalFormCode: "K99N" })).toBe(
      false,
    );
  });

  it("is required for other French legal forms", () => {
    expect(isCompanyRegistrationNumberRequired({ country: "FRA", legalFormCode: "5RDO" })).toBe(
      true,
    );
    expect(isCompanyRegistrationNumberRequired({ country: "FRA", legalFormCode: null })).toBe(true);
  });

  it("is optional for German companies", () => {
    expect(isCompanyRegistrationNumberRequired({ country: "DEU", legalFormCode: "2HBR" })).toBe(
      false,
    );
  });

  it("is required for other countries", () => {
    expect(isCompanyRegistrationNumberRequired({ country: "BEL", legalFormCode: "XK4T" })).toBe(
      true,
    );
    expect(isCompanyRegistrationNumberRequired({ country: undefined, legalFormCode: null })).toBe(
      true,
    );
  });
});

describe("toSovereignCountry", () => {
  it("maps French territories to France", () => {
    expect(toSovereignCountry("MTQ")).toBe("FRA");
    expect(toSovereignCountry("REU")).toBe("FRA");
    expect(toSovereignCountry("FRA")).toBe("FRA");
  });

  it("keeps sovereign countries", () => {
    expect(toSovereignCountry("POL")).toBe("POL");
  });

  it("drops other territories", () => {
    expect(toSovereignCountry("PRI")).toBeUndefined();
    expect(toSovereignCountry("GRL")).toBeUndefined();
  });

  it("drops values that aren't country codes", () => {
    expect(toSovereignCountry(undefined)).toBeUndefined();
    expect(toSovereignCountry("FR")).toBeUndefined();
  });
});

describe("isBirthPostalCodeRequired", () => {
  it("is required for a French account and a person born in France", () => {
    expect(isBirthPostalCodeRequired({ accountCountry: "FRA", birthCountry: "FRA" })).toBe(true);
    expect(isBirthPostalCodeRequired({ accountCountry: "FRA", birthCountry: "GLP" })).toBe(true);
  });

  it("is not required for a person born outside France", () => {
    expect(isBirthPostalCodeRequired({ accountCountry: "FRA", birthCountry: "POL" })).toBe(false);
    expect(isBirthPostalCodeRequired({ accountCountry: "FRA", birthCountry: undefined })).toBe(
      false,
    );
  });

  it("is not required for a non-French account", () => {
    expect(isBirthPostalCodeRequired({ accountCountry: "DEU", birthCountry: "FRA" })).toBe(false);
    expect(isBirthPostalCodeRequired({ accountCountry: undefined, birthCountry: "FRA" })).toBe(
      false,
    );
  });
});
