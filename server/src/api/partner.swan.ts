import { Future, Result } from "@swan-io/boxed";
import { GetAccountMembershipInvitationDataQuery } from "../graphql/partner.js";
import { ServerError, sdk, toFuture } from "./partner.js";

export const getAccountMembershipInvitationData = ({
  accessToken,
  inviterAccountMembershipId,
  inviteeAccountMembershipId,
}: {
  accessToken: string;
  inviterAccountMembershipId: string;
  inviteeAccountMembershipId: string;
}): Future<Result<GetAccountMembershipInvitationDataQuery, ServerError>> => {
  return toFuture(
    sdk.GetAccountMembershipInvitationData(
      { inviterAccountMembershipId, inviteeAccountMembershipId },
      { "x-swan-token": `Bearer ${accessToken}` },
    ),
  );
};
