import { Result } from "@bloodyowl/boxed";
import { NetworkError } from "@bloodyowl/request";
import { FraudDetailsInput } from "@swan-io/shared-business/src/utils/fraudReport/types";
import { GraphQLError } from "graphql";
import { describe, expect, it } from "vitest";
import { createFraudReportApi } from "../fraudReportApi";
import { createMockClient, MockHandlers } from "./testing";

const input = (variables: Record<string, unknown>) => variables.input as Record<string, unknown>;

const disputeCase = (overrides: Record<string, unknown> = {}) => ({
  __typename: "FraudDisputeCase",
  id: "case-1",
  account: { __typename: "Account", id: "account-1" },
  statusInfo: {
    __typename: "DisputeCaseDraftStatusInfo",
    expiresAt: "2026-12-24T10:00:00.000Z",
  },
  fraudDetails: null,
  fraudCardDetails: null,
  fraudTransferDetails: null,
  victimAccountMembership: null,
  hasVictim: false,
  externalReference: null,
  supportingDocumentCollection: {
    __typename: "SupportingDocumentCollection",
    id: "collection-1",
    statusInfo: {
      __typename: "SupportingDocumentCollectionWaitingForDocumentStatusInfo",
      status: "WaitingForDocument",
    },
  },
  createdAt: "2026-11-24T10:00:00.000Z",
  updatedAt: "2026-11-24T10:00:00.000Z",
  ...overrides,
});

const caseResult = {
  id: "case-1",
  accountId: "account-1",
  statusInfo: { status: "Draft", expiresAt: "2026-12-24T10:00:00.000Z" },
  transactions: [],
  fraudDetails: null,
  fraudCardDetails: null,
  fraudTransferDetails: null,
  victimAccountMembershipId: null,
  hasVictim: false,
  externalReference: null,
  supportingDocumentCollection: { id: "collection-1", status: "WaitingForDocument" },
  createdAt: "2026-11-24T10:00:00.000Z",
  updatedAt: "2026-11-24T10:00:00.000Z",
};

const fraudDetails: FraudDetailsInput = {
  reportedReason: "Manipulated",
  reportedTypology: "FakeAdvisor",
  description: "A fake advisor called me",
  discoveredAt: "2026-11-20",
  discoveryDetails: null,
  fraudsterChannels: ["Phone"],
  sharedInformationWithFraudster: ["VerificationCode"],
  hasFiledPoliceComplaint: true,
};

const api = (handlers: MockHandlers) => createFraudReportApi(createMockClient(handlers));

describe("fraud report adapter: draft", () => {
  it("creates a draft from the input and returns the case", async () => {
    const result = await api({
      DraftFraudDisputeCase: variables =>
        Result.Ok({
          draftFraudDisputeCase: {
            __typename: "DraftFraudDisputeCaseSuccessPayload",
            disputeCase: disputeCase({
              victimAccountMembership: {
                __typename: "AccountMembership",
                id: input(variables).victimAccountMembershipId,
              },
              hasVictim: true,
              fraudTransferDetails: {
                __typename: "FraudTransferDetails",
                hasContactedBankOrBeneficiary: null,
              },
            }),
          },
        }),
    }).draft({ transactionIds: ["transfer-1"], victimAccountMembershipId: "membership-2" });

    expect(result).toEqual(
      Result.Ok({
        ...caseResult,
        victimAccountMembershipId: "membership-2",
        hasVictim: true,
        fraudTransferDetails: { hasContactedBankOrBeneficiary: null },
      }),
    );
  });

  it("returns a rejection with its typename and fields", async () => {
    const result = await api({
      DraftFraudDisputeCase: variables =>
        Result.Ok({
          draftFraudDisputeCase: {
            __typename: "DisputeCaseTransactionsNotReportableRejection",
            message: "Not reportable",
            transactions: (input(variables).transactionIds as string[]).map(transactionId => ({
              __typename: "DisputeCaseNotReportableTransaction",
              transactionId,
              reason: "TransactionStatusNotReportable",
            })),
          },
        }),
    }).draft({ transactionIds: ["card-1"] });

    expect(result).toMatchObject(
      Result.Error({
        kind: "rejection",
        rejection: {
          __typename: "DisputeCaseTransactionsNotReportableRejection",
          message: "Not reportable",
          transactions: [{ transactionId: "card-1", reason: "TransactionStatusNotReportable" }],
        },
      }),
    );
  });

  it("returns a GraphQL error as an error, not a rejection", async () => {
    const result = await api({
      DraftFraudDisputeCase: () =>
        Result.Error([new GraphQLError("Forbidden", { extensions: { code: "FORBIDDEN" } })]),
    }).draft({ transactionIds: ["card-1"] });

    expect(result).toMatchObject(Result.Error({ kind: "error" }));
  });

  it("returns a network error as an error", async () => {
    const result = await api({
      DraftFraudDisputeCase: () => Result.Error(new NetworkError("/mock")),
    }).draft({ transactionIds: ["card-1"] });

    expect(result).toMatchObject(Result.Error({ kind: "error" }));
  });
});

describe("fraud report adapter: update", () => {
  it("updates the draft and returns the stored details", async () => {
    const result = await api({
      UpdateDraftFraudDisputeCase: variables =>
        Result.Ok({
          updateDraftFraudDisputeCase: {
            __typename: "UpdateDraftFraudDisputeCaseSuccessPayload",
            disputeCase: disputeCase({
              id: input(variables).disputeCaseId,
              fraudDetails: {
                __typename: "FraudDetails",
                ...(input(variables).fraudDetails as object),
              },
              fraudCardDetails: {
                __typename: "FraudCardDetails",
                isLostOrStolen: true,
                lostOrStolenNoticedAt: "2026-11-19",
                hasContactedMerchant: false,
              },
            }),
          },
        }),
    }).update({ disputeCaseId: "case-1", fraudDetails });

    expect(result).toEqual(
      Result.Ok({
        ...caseResult,
        fraudDetails,
        fraudCardDetails: {
          isLostOrStolen: true,
          lostOrStolenNoticedAt: "2026-11-19",
          hasContactedMerchant: false,
        },
      }),
    );
  });

  it("returns a wrong status rejection", async () => {
    const result = await api({
      UpdateDraftFraudDisputeCase: variables =>
        Result.Ok({
          updateDraftFraudDisputeCase: {
            __typename: "DisputeCaseWrongStatusRejection",
            message: "Wrong status",
            disputeCaseId: input(variables).disputeCaseId,
            currentStatus: "Submitted",
            expectedStatuses: ["Draft"],
          },
        }),
    }).update({ disputeCaseId: "case-1", externalReference: null });

    expect(result).toMatchObject(
      Result.Error({
        kind: "rejection",
        rejection: {
          __typename: "DisputeCaseWrongStatusRejection",
          disputeCaseId: "case-1",
          currentStatus: "Submitted",
          expectedStatuses: ["Draft"],
        },
      }),
    );
  });

  it("returns a BAD_USER_INPUT error as an error", async () => {
    const result = await api({
      UpdateDraftFraudDisputeCase: () =>
        Result.Error([new GraphQLError("Bad input", { extensions: { code: "BAD_USER_INPUT" } })]),
    }).update({ disputeCaseId: "case-1" });

    expect(result).toMatchObject(Result.Error({ kind: "error" }));
  });
});

describe("fraud report adapter: submit", () => {
  it("submits the case and returns its submitted status", async () => {
    const result = await api({
      SubmitDisputeCase: variables =>
        Result.Ok({
          submitDisputeCase: {
            __typename: "SubmitDisputeCaseSuccessPayload",
            disputeCase: disputeCase({
              id: input(variables).disputeCaseId,
              statusInfo: {
                __typename: "DisputeCaseSubmittedStatusInfo",
                submittedAt: "2026-11-24T11:00:00.000Z",
              },
            }),
          },
        }),
    }).submit({ disputeCaseId: "case-1" });

    expect(result).toEqual(
      Result.Ok({
        ...caseResult,
        statusInfo: { status: "Submitted", submittedAt: "2026-11-24T11:00:00.000Z" },
      }),
    );
  });

  it("returns an incomplete rejection with the missing fields", async () => {
    const result = await api({
      SubmitDisputeCase: () =>
        Result.Ok({
          submitDisputeCase: {
            __typename: "DisputeCaseIncompleteRejection",
            message: "Incomplete",
            missingFields: [{ __typename: "DisputeCaseFieldPath", path: ["fraudDetails"] }],
          },
        }),
    }).submit({ disputeCaseId: "case-1" });

    expect(result).toMatchObject(
      Result.Error({
        kind: "rejection",
        rejection: {
          __typename: "DisputeCaseIncompleteRejection",
          missingFields: [{ path: ["fraudDetails"] }],
        },
      }),
    );
  });

  it("returns an already reported rejection", async () => {
    const result = await api({
      SubmitDisputeCase: () =>
        Result.Ok({
          submitDisputeCase: {
            __typename: "DisputeCaseTransactionsAlreadyReportedRejection",
            message: "Already reported",
            transactions: [
              {
                __typename: "DisputeCaseAlreadyReportedTransaction",
                transactionId: "card-1",
                disputeCaseId: null,
              },
            ],
          },
        }),
    }).submit({ disputeCaseId: "case-1" });

    expect(result).toMatchObject(
      Result.Error({
        kind: "rejection",
        rejection: {
          __typename: "DisputeCaseTransactionsAlreadyReportedRejection",
          transactions: [{ transactionId: "card-1", disputeCaseId: null }],
        },
      }),
    );
  });
});
