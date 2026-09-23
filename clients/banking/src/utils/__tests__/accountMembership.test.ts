import { describe, expect, it } from "vitest";
import { isMembershipTaxIdRequired } from "../accountMembership";

describe("isMembershipTaxIdRequired", () => {
  it("never requires a tax id for German accounts", () => {
    expect(
      isMembershipTaxIdRequired({
        accountCountry: "DEU",
        residencyCountry: "DEU",
        canInitiatePayments: false,
      }),
    ).toBe(false);

    expect(
      isMembershipTaxIdRequired({
        accountCountry: "DEU",
        residencyCountry: "DEU",
        canInitiatePayments: true,
      }),
    ).toBe(false);
  });

  it("requires a tax id for Italian accounts with an Italian residency allowed to initiate payments", () => {
    expect(
      isMembershipTaxIdRequired({
        accountCountry: "ITA",
        residencyCountry: "ITA",
        canInitiatePayments: true,
      }),
    ).toBe(true);
  });

  it("doesn't require a tax id for Italian accounts without the payment permission", () => {
    expect(
      isMembershipTaxIdRequired({
        accountCountry: "ITA",
        residencyCountry: "ITA",
        canInitiatePayments: false,
      }),
    ).toBe(false);
  });

  it("doesn't require a tax id when the residency country doesn't match the account country", () => {
    expect(
      isMembershipTaxIdRequired({
        accountCountry: "ITA",
        residencyCountry: "FRA",
        canInitiatePayments: true,
      }),
    ).toBe(false);
  });

  it("doesn't require a tax id for other account countries", () => {
    expect(
      isMembershipTaxIdRequired({
        accountCountry: "FRA",
        residencyCountry: "FRA",
        canInitiatePayments: true,
      }),
    ).toBe(false);

    expect(
      isMembershipTaxIdRequired({
        accountCountry: "ESP",
        residencyCountry: "ESP",
        canInitiatePayments: true,
      }),
    ).toBe(false);

    expect(
      isMembershipTaxIdRequired({
        accountCountry: "NLD",
        residencyCountry: "NLD",
        canInitiatePayments: true,
      }),
    ).toBe(false);

    expect(
      isMembershipTaxIdRequired({
        accountCountry: "BEL",
        residencyCountry: "BEL",
        canInitiatePayments: true,
      }),
    ).toBe(false);
  });
});
