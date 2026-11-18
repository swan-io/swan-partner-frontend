import { Result } from "@bloodyowl/boxed";
import { screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import {
  CompanyRenewalInfoFragment,
  GetVerificationRenewalQuery,
  IndividualRenewalInfoFragment,
  VerificationRenewalRequirement,
} from "../../../graphql/partner";
import { createMockClient, renderWithProviders } from "../../../utils/__tests__/testing";
import { Router } from "../../../utils/routes";
import { VerificationRenewalArea } from "../VerificationRenewalArea";

type VerificationRenewal = NonNullable<GetVerificationRenewalQuery["verificationRenewal"]>;

const individualInfo: IndividualRenewalInfoFragment = {
  __typename: "IndividualVerificationRenewalInfo",
  type: "Individual",
  additionalDetails: null,
  accountAdmin: {
    __typename: "IndividualVerificationRenewalAccountAdmin",
    firstName: "Camille",
    lastName: "Martin",
    employmentStatus: "Employee",
    monthlyIncome: "Between1500And3000",
    residencyAddress: {
      __typename: "Address",
      addressLine1: "12 rue des Lilas",
      addressLine2: null,
      city: "Lyon",
      postalCode: "69003",
      state: null,
      country: "FRA",
    },
  },
};

const companyInfo: CompanyRenewalInfoFragment = {
  __typename: "CompanyVerificationRenewalInfo",
  type: "Company",
  additionalDetails: null,
  company: {
    __typename: "CompanyVerificationRenewalCompanyInfo",
    name: "Atelier Martin",
    businessActivityDescription: "Furniture restoration",
    monthlyPaymentVolume: "LessThan10000",
    residencyAddress: {
      __typename: "Address",
      addressLine1: "12 rue des Lilas",
      addressLine2: null,
      city: "Lyon",
      postalCode: "69003",
      country: "FRA",
    },
    ultimateBeneficialOwners: [],
  },
  accountAdmin: {
    __typename: "CompanyVerificationRenewalAccountAdmin",
    firstName: "Camille",
    lastName: "Martin",
    typeOfRepresentation: "LegalRepresentative",
    email: "camille@atelier-martin.example",
    birthInfo: {
      __typename: "BirthInfo",
      city: "Lyon",
      country: "FRA",
      birthDate: "1985-04-12",
      postalCode: "69003",
    },
  },
};

const waitingForInformation = (
  id: string,
  info: IndividualRenewalInfoFragment | CompanyRenewalInfoFragment,
  verificationRequirements: VerificationRenewalRequirement[],
): VerificationRenewal => ({
  __typename: "WaitingForInformationVerificationRenewal",
  id,
  accountCountries: ["FRA"],
  verificationRequirements,
  supportingDocumentCollection: null,
  info,
});

const renewals: VerificationRenewal[] = [
  waitingForInformation("individual", individualInfo, ["AccountHolderDetailsRequired"]),
  waitingForInformation("company", companyInfo, [
    "AccountHolderDetailsRequired",
    "LegalRepresentativeDetailsRequired",
  ]),
  waitingForInformation("company-administrator-only", companyInfo, [
    "LegalRepresentativeDetailsRequired",
  ]),
  waitingForInformation("nothing-left", individualInfo, []),
  { __typename: "PendingVerificationRenewal", id: "submitted", info: individualInfo },
];

const createBackend = () =>
  createMockClient({
    GetVerificationRenewal: ({ id }) =>
      Result.Ok({
        __typename: "Query",
        projectInfo: {
          __typename: "ProjectInfo",
          id: "project-id",
          accentColor: null,
          name: "Lakeflow",
          logoUri: null,
        },
        verificationRenewal: renewals.find(renewal => renewal.id === id) ?? null,
      } satisfies GetVerificationRenewalQuery),
  });

const openRenewalLink = (verificationRenewalId: string) => {
  Router.replace("VerificationRenewalRoot", { verificationRenewalId });

  renderWithProviders(<VerificationRenewalArea verificationRenewalId={verificationRenewalId} />, {
    client: createBackend(),
  });
};

describe("VerificationRenewalArea", () => {
  test("opens an individual renewal on the personal information step", async () => {
    openRenewalLink("individual");

    expect(await screen.findByText("Camille")).toBeDefined();
  });

  test("opens a company renewal on the account holder information step", async () => {
    openRenewalLink("company");

    expect(await screen.findByText("Atelier Martin")).toBeDefined();
  });

  test("opens on the first step the renewal requires", async () => {
    openRenewalLink("company-administrator-only");

    expect(await screen.findByText("camille@atelier-martin.example")).toBeDefined();
  });

  test("shows the success screen when nothing is left to fill", async () => {
    openRenewalLink("nothing-left");

    expect(await screen.findByText("Thank you!")).toBeDefined();
  });

  test("shows the success screen for a renewal already submitted", async () => {
    openRenewalLink("submitted");

    expect(await screen.findByText("Thank you!")).toBeDefined();
  });
});
