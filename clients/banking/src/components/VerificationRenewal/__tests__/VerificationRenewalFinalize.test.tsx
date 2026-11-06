import { Result } from "@bloodyowl/boxed";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GraphQLError } from "graphql";
import { describe, expect, test } from "vitest";
import { FinalizeVerificationRenewalMutation } from "../../../graphql/partner";
import { createMockClient, renderWithProviders } from "../../../utils/__tests__/testing";
import { RenewalStep, renewalSteps } from "../../../utils/verificationRenewal";
import { VerificationRenewalFinalize } from "../VerificationRenewalFinalize";

type Payload = FinalizeVerificationRenewalMutation["finalizeVerificationRenewal"];

const success: Payload = {
  __typename: "FinalizeVerificationRenewalSuccessPayload",
  verificationRenewal: { __typename: "PendingVerificationRenewal", id: "verification-renewal-id" },
};

// Answers each submit with the next response, the last one is repeated
const createBackend = (...responses: (Payload | "TechnicalError")[]) => {
  let call = 0;

  return createMockClient({
    FinalizeVerificationRenewal: () => {
      const response = responses[Math.min(call++, responses.length - 1)];
      return response === "TechnicalError"
        ? Result.Error([new GraphQLError("Internal server error")])
        : Result.Ok({ finalizeVerificationRenewal: response });
    },
  });
};

const companySteps: RenewalStep[] = [
  renewalSteps.accountHolderInformation,
  renewalSteps.renewalOwnership,
  renewalSteps.finalize,
];

const individualSteps: RenewalStep[] = [renewalSteps.personalInformation, renewalSteps.finalize];

const renderAndSubmit = async (
  client: ReturnType<typeof createMockClient>,
  steps = companySteps,
) => {
  const user = userEvent.setup();

  renderWithProviders(
    <VerificationRenewalFinalize
      verificationRenewalId="verification-renewal-id"
      steps={steps}
      previousStep={steps.at(-2)}
    />,
    { client },
  );

  await user.click(screen.getByRole("checkbox"));
  await user.click(screen.getByRole("button", { name: "Next" }));

  return user;
};

describe("VerificationRenewalFinalize", () => {
  test("shows the success screen once submitted", async () => {
    await renderAndSubmit(createBackend(success));

    expect(await screen.findByText("Thank you!")).toBeDefined();
  });

  test("lists the missing beneficiary information and links to the ownership step", async () => {
    await renderAndSubmit(
      createBackend({
        __typename: "ValidationRejection",
        message: "Input is invalid",
        fields: [
          {
            __typename: "ValidationFieldError",
            path: ["VerificationRenewalUltimateBeneficialOwner[1].residencyAddress"],
            code: "InvalidString",
            message: "residencyAddress is required",
          },
          {
            __typename: "ValidationFieldError",
            path: ["VerificationRenewalUltimateBeneficialOwner[0].birthDate"],
            code: "InvalidString",
            message: "birthDate is required",
          },
        ],
      }),
    );

    expect(await screen.findByText("Some information is missing")).toBeDefined();
    expect(screen.getByText("Missing information for 2 beneficiaries")).toBeDefined();
    expect(screen.getByText("• Residency address")).toBeDefined();
    expect(screen.getByText("• Birth date")).toBeDefined();
    expect(screen.getByRole("button", { name: "Review beneficiaries" })).toBeDefined();
    // retrying would fail the same way
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
  });

  test("offers to go back when the missing information has no step to fix it", async () => {
    await renderAndSubmit(
      createBackend({
        __typename: "ValidationRejection",
        message: "Input is invalid",
        fields: [
          {
            __typename: "ValidationFieldError",
            path: ["somethingElse"],
            code: "InvalidType",
            message: "somethingElse is invalid",
          },
        ],
      }),
      individualSteps,
    );

    expect(await screen.findByText("• somethingElse is invalid")).toBeDefined();
    expect(screen.queryByRole("button", { name: "Review beneficiaries" })).toBeNull();
    expect(screen.getByRole("button", { name: "Back" })).toBeDefined();
  });

  test.each([
    [
      "VerificationRenewalUpdateNotAllowedRejection",
      { __typename: "VerificationRenewalUpdateNotAllowedRejection", id: "id", message: "" },
      "This request can no longer be changed",
    ],
    [
      "VerificationRenewalNotFoundRejection",
      { __typename: "VerificationRenewalNotFoundRejection", id: "id", message: "" },
      "Request not found",
    ],
    ["ForbiddenRejection", { __typename: "ForbiddenRejection", message: "" }, "Access denied"],
  ] as const)("explains a %s without offering to retry", async (_, rejection, title) => {
    await renderAndSubmit(createBackend(rejection));

    expect(await screen.findByText(title)).toBeDefined();
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
  });

  test("lets the user retry after a technical error", async () => {
    const user = await renderAndSubmit(createBackend("TechnicalError", success));

    expect(await screen.findByText("Something went wrong")).toBeDefined();

    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByText("Thank you!")).toBeDefined();
  });
});
