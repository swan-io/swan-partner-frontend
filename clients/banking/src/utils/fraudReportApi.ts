import { Future, Result } from "@bloodyowl/boxed";
import { Client, ClientError } from "@bloodyowl/graphql-client";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { FraudReportApi } from "@swan-io/shared-business/src/utils/fraudReport/api";
import {
  DisputeCaseStatusInfo,
  FraudReportCase,
} from "@swan-io/shared-business/src/utils/fraudReport/types";
import { match } from "ts-pattern";
import {
  DraftFraudDisputeCaseDocument,
  FraudDisputeCaseFragment,
  SubmitDisputeCaseDocument,
  UpdateDraftFraudDisputeCaseDocument,
} from "../graphql/partner";
import { partnerClient } from "./gql";

const toStatusInfo = (statusInfo: FraudDisputeCaseFragment["statusInfo"]): DisputeCaseStatusInfo =>
  match(statusInfo)
    .returnType<DisputeCaseStatusInfo>()
    .with({ __typename: "DisputeCaseDraftStatusInfo" }, ({ expiresAt }) => ({
      status: "Draft",
      expiresAt,
    }))
    .with({ __typename: "DisputeCaseExpiredStatusInfo" }, ({ expiredAt }) => ({
      status: "Expired",
      expiredAt,
    }))
    .with({ __typename: "DisputeCaseCanceledStatusInfo" }, ({ canceledAt }) => ({
      status: "Canceled",
      canceledAt,
    }))
    .with({ __typename: "DisputeCaseSubmittedStatusInfo" }, ({ submittedAt }) => ({
      status: "Submitted",
      submittedAt,
    }))
    .exhaustive();

const toFraudReportCase = ({
  id,
  account,
  statusInfo,
  fraudDetails,
  fraudCardDetails,
  fraudTransferDetails,
  victimAccountMembership,
  hasVictim,
  externalReference,
  supportingDocumentCollection,
  createdAt,
  updatedAt,
}: FraudDisputeCaseFragment): FraudReportCase => ({
  id,
  accountId: account.id,
  statusInfo: toStatusInfo(statusInfo),
  // The API doesn't expose reportedTransactions yet
  transactions: [],
  fraudDetails:
    fraudDetails == null
      ? null
      : {
          reportedReason: fraudDetails.reportedReason,
          reportedTypology: fraudDetails.reportedTypology,
          description: fraudDetails.description,
          discoveredAt: fraudDetails.discoveredAt,
          discoveryDetails: fraudDetails.discoveryDetails,
          fraudsterChannels: fraudDetails.fraudsterChannels,
          sharedInformationWithFraudster: fraudDetails.sharedInformationWithFraudster,
          hasFiledPoliceComplaint: fraudDetails.hasFiledPoliceComplaint,
        },
  fraudCardDetails:
    fraudCardDetails == null
      ? null
      : {
          isLostOrStolen: fraudCardDetails.isLostOrStolen,
          lostOrStolenNoticedAt: fraudCardDetails.lostOrStolenNoticedAt,
          hasContactedMerchant: fraudCardDetails.hasContactedMerchant,
        },
  fraudTransferDetails:
    fraudTransferDetails == null
      ? null
      : { hasContactedBankOrBeneficiary: fraudTransferDetails.hasContactedBankOrBeneficiary },
  victimAccountMembershipId: victimAccountMembership?.id ?? null,
  hasVictim,
  externalReference,
  supportingDocumentCollection: {
    id: supportingDocumentCollection.id,
    status: supportingDocumentCollection.statusInfo.status,
  },
  createdAt,
  updatedAt,
});

type CasePayload =
  | { __typename: `${string}Rejection` }
  | { __typename: `${string}SuccessPayload`; disputeCase: FraudDisputeCaseFragment };

const toCaseResult = <Payload extends CasePayload>(request: Future<Result<Payload, ClientError>>) =>
  request
    .mapError(error => ({ kind: "error" as const, error }))
    .mapOkToResult(payload =>
      filterRejectionsToResult(payload)
        .map(({ disputeCase }) => toFraudReportCase(disputeCase))
        .mapError(rejection => ({ kind: "rejection" as const, rejection })),
    );

// The return type ties each payload's rejections to Lake's: a rejection added to the schema
// fails the build here until Lake knows it. Cancel and draft reads come with FRONT-2445,
// uploads with FRONT-2443.
export type WebBankingFraudReportApi = Pick<FraudReportApi, "draft" | "update" | "submit">;

export const createFraudReportApi = (client: Client = partnerClient): WebBankingFraudReportApi => ({
  draft: input =>
    toCaseResult(
      client
        .commitMutation(DraftFraudDisputeCaseDocument, { input })
        .mapOk(data => data.draftFraudDisputeCase),
    ),
  update: input =>
    toCaseResult(
      client
        .commitMutation(UpdateDraftFraudDisputeCaseDocument, { input })
        .mapOk(data => data.updateDraftFraudDisputeCase),
    ),
  submit: input =>
    toCaseResult(
      client
        .commitMutation(SubmitDisputeCaseDocument, { input })
        .mapOk(data => data.submitDisputeCase),
    ),
});
