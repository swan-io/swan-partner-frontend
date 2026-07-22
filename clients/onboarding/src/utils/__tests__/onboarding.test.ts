import { describe, expect, it } from "vitest";
import {
  CompanyAccountHolderOnboardingAccountAdmin,
  CompanyRelatedIndividual,
  RelatedIndividualInput,
} from "../../graphql/partner";
import {
  cleanData,
  isAccountAdminInRelatedIndividuals,
  namesMatch,
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

describe("isAccountAdminInRelatedIndividuals", () => {
  const related = asIndividuals([
    { firstName: "John", lastName: "Doe" },
    { firstName: "Jane", lastName: "Smith" },
  ]);

  it("returns true when the admin matches a related individual", () => {
    expect(
      isAccountAdminInRelatedIndividuals(asAdmin({ firstName: "john", lastName: "doe" }), related),
    ).toBe(true);
  });

  it("returns false when the admin matches no related individual", () => {
    expect(
      isAccountAdminInRelatedIndividuals(asAdmin({ firstName: "Bob", lastName: "Brown" }), related),
    ).toBe(false);
  });

  it("returns false when the admin is missing or incomplete", () => {
    expect(isAccountAdminInRelatedIndividuals(null, related)).toBe(false);
    expect(isAccountAdminInRelatedIndividuals(asAdmin({ firstName: "John" }), related)).toBe(false);
  });

  it("returns false when there are no related individuals", () => {
    expect(
      isAccountAdminInRelatedIndividuals(asAdmin({ firstName: "John", lastName: "Doe" }), []),
    ).toBe(false);
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
