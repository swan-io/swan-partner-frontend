import { Future, Result } from "@swan-io/boxed";
import { match } from "ts-pattern";
import { GetAccountMembershipInvitationDataQuery } from "../graphql/partner";
import { exchangeToken } from "./oauth2.swan";
import {
  BindAccountMembershipRejectionError,
  FinalizeOnboardingRejectionError,
  ServerError,
  sdk,
  toFuture,
} from "./partner";

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

export const swan__finalizeOnboarding = ({
  onboardingId,
  accessToken,
  projectId,
}: {
  onboardingId: string;
  accessToken: string;
  projectId: string;
}) => {
  return exchangeToken(accessToken, {
    type: "AccountMemberToken",
    projectId,
  })
    .flatMapOk(accessToken =>
      toFuture(
        sdk.FinalizeOnboarding(
          { input: { onboardingId } },
          { "x-swan-token": `Bearer ${accessToken}` },
        ),
      ),
    )
    .mapOkToResult(({ finalizeOnboarding }) =>
      match(finalizeOnboarding)
        .with({ __typename: "FinalizeOnboardingSuccessPayload" }, ({ onboarding }) =>
          Result.Ok(onboarding),
        )
        .otherwise(({ __typename, message }) =>
          Result.Error(
            new FinalizeOnboardingRejectionError(
              JSON.stringify({ onboardingId, __typename, message }),
            ),
          ),
        ),
    )
    .mapOk(onboarding => {
      const oauthRedirectUrl = onboarding.oAuthRedirectParameters?.redirectUrl?.trim();
      const legacyRedirectUrl = onboarding.redirectUrl.trim();
      const redirectUrl =
        oauthRedirectUrl != null && oauthRedirectUrl !== ""
          ? oauthRedirectUrl
          : legacyRedirectUrl != null && legacyRedirectUrl !== ""
            ? legacyRedirectUrl
            : undefined;

      return {
        accountMembershipId: onboarding.account?.legalRepresentativeMembership.id,
        redirectUrl,
        state: onboarding.oAuthRedirectParameters?.state ?? undefined,
      };
    });
};

export const swan__bindAccountMembership = ({
  accountMembershipId,
  accessToken,
  projectId,
}: {
  accountMembershipId: string;
  accessToken: string;
  projectId: string;
}) => {
  const bindAccountMembership = exchangeToken(accessToken, {
    type: "AccountMemberToken",
    projectId,
  }).flatMapOk(accessToken =>
    toFuture(
      sdk.BindAccountMembership(
        { input: { accountMembershipId } },
        { "x-swan-token": `Bearer ${accessToken}` },
      ),
    ),
  );
  return bindAccountMembership.mapOkToResult(({ bindAccountMembership }) => {
    return match(bindAccountMembership)
      .with(
        { __typename: "BindAccountMembershipSuccessPayload" },
        ({ accountMembership: { id } }) => Result.Ok({ accountMembershipId: id }),
      )
      .otherwise(({ __typename, message }) =>
        Result.Error(
          new BindAccountMembershipRejectionError(
            JSON.stringify({ accountMembershipId, __typename, message }),
          ),
        ),
      );
  });
};
