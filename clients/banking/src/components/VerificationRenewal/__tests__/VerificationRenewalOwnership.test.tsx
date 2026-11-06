import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { assert, describe, expect, test } from "vitest";
import {
  AccountCountry,
  CompanyRenewalInfoFragment,
  GetVerificationRenewalQuery,
  VerificationRenewalUboFragment,
} from "../../../graphql/partner";
import { createMockClient, renderWithProviders } from "../../../utils/__tests__/testing";
import { renewalSteps } from "../../../utils/verificationRenewal";
import { VerificationRenewalOwnership } from "../VerificationRenewalOwnership";

const completeUbo: VerificationRenewalUboFragment = {
  __typename: "VerificationRenewalUltimateBeneficialOwner",
  firstName: "Giulia",
  lastName: "Bianchi",
  sex: null,
  // required for an Italian account and a beneficiary living in Italy
  taxIdentificationNumber: "RSSMRA85T10A562S",
  qualificationType: "Ownership",
  ownership: {
    __typename: "UltimateBeneficialOwnerOwnership",
    totalPercentage: 60,
    type: "Direct",
  },
  birthInfo: {
    __typename: "BirthInfo",
    birthDate: "1980-01-01",
    city: "Roma",
    country: "ITA",
    postalCode: null,
  },
  address: {
    __typename: "AddressInfo",
    addressLine1: "Via del Corso 1",
    addressLine2: null,
    city: "Roma",
    postalCode: "00186",
    country: "ITA",
    state: null,
  },
};

const makeInfo = (ubo: VerificationRenewalUboFragment) =>
  ({
    __typename: "CompanyVerificationRenewalInfo",
    type: "Company",
    additionalDetails: null,
    company: {
      name: "Bianchi SRL",
      residencyAddress: {
        addressLine1: "Via del Corso 1",
        addressLine2: null,
        city: "Roma",
        postalCode: "00186",
        country: "ITA",
      },
      businessActivityDescription: null,
      monthlyPaymentVolume: null,
      ultimateBeneficialOwners: [ubo],
    },
    accountAdmin: null,
  }) as unknown as CompanyRenewalInfoFragment;

const verificationRenewal = {
  __typename: "WaitingForInformationVerificationRenewal",
  id: "verification-renewal-id",
  verificationRequirements: ["UboDetailsRequired"],
} as unknown as GetVerificationRenewalQuery["verificationRenewal"];

const renderOwnership = (ubo: VerificationRenewalUboFragment, accountCountry: AccountCountry) =>
  renderWithProviders(
    <VerificationRenewalOwnership
      accountHolderType="Company"
      info={makeInfo(ubo)}
      accountCountry={accountCountry}
      verificationRenewalId="verification-renewal-id"
      companyCountry="ITA"
      previousStep={undefined}
      initialNextStep={renewalSteps.finalize}
      verificationRenewal={verificationRenewal}
    />,
    // the step only sends a request when the user saves a beneficiary
    { client: createMockClient({}) },
  );

describe("VerificationRenewalOwnership", () => {
  // test case of FRONT-2341: the backend rejected it at submit while the step let it through
  test("flags an Italian beneficiary without residency address", () => {
    renderOwnership({ ...completeUbo, address: null }, "ITA");

    expect(screen.getByText("Giulia Bianchi", { exact: false })).toBeDefined();
    expect(screen.getByText("Missing info")).toBeDefined();
  });

  test("doesn't flag a complete beneficiary", () => {
    renderOwnership(completeUbo, "ITA");

    expect(screen.getByText("Giulia Bianchi", { exact: false })).toBeDefined();
    expect(screen.queryByText("Missing info")).toBeNull();
  });

  // the residency address country is required for every account country
  test.each(["FRA", "DEU", "ESP", "NLD", "ITA", "BEL"] as const)(
    "asks for the residency address after the identity for a %s account",
    async accountCountry => {
      const user = userEvent.setup();
      renderOwnership(completeUbo, accountCountry);

      await user.click(screen.getByRole("button", { name: "Edit" }));
      // The step also has a "Next" button: look in the modal only
      const modal = (await screen.findByText("Edit an owner")).closest("[role=dialog]");
      assert(modal instanceof HTMLElement);

      await user.click(within(modal).getByRole("button", { name: "Next" }));
      expect(await screen.findByText("Fill in the address")).toBeDefined();
    },
  );
});
