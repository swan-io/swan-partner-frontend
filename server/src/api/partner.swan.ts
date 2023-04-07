import { Future, Result } from "@swan-io/boxed";
import { P, match } from "ts-pattern";
import { AccountCountry, GetAccountMembershipInvitationDataQuery } from "../graphql/partner";
import { getClientAccessToken } from "./oauth2";
import { exchangeToken } from "./oauth2.swan";
import { OnboardingRejection, sdk, toFuture } from "./partner";

export const onboardCompanyAccountHolder = ({
  accountCountry,
  projectId,
}: {
  accountCountry?: AccountCountry;
  projectId: string;
}): Future<Result<string, Error>> => {
  return getClientAccessToken({ authMode: "AuthorizationHeader" })
    .flatMapOk(token => exchangeToken(token, { type: "ProjectToken", projectId }))
    .mapResult(token => token.toResult(new Error("Couldn't get token")))
    .flatMapOk(accessToken =>
      toFuture(
        sdk.OnboardPublicCompanyAccountHolder(
          { input: { accountCountry } },
          { Authorization: `Bearer ${accessToken}` },
        ),
      ),
    )
    .mapResult(({ onboardCompanyAccountHolder }) =>
      match(onboardCompanyAccountHolder)
        .with(
          { __typename: "OnboardCompanyAccountHolderSuccessPayload" },
          ({ onboarding: { id } }) => Result.Ok(id),
        )
        .with(
          {
            __typename: P.union("BadRequestRejection", "ForbiddenRejection", "ValidationRejection"),
          },
          ({ __typename, message }) => Result.Error(new OnboardingRejection(__typename, message)),
        )
        .exhaustive(),
    );
};

export const onboardIndividualAccountHolder = ({
  accountCountry,
  projectId,
}: {
  accountCountry?: AccountCountry;
  projectId: string;
}): Future<Result<string, Error>> => {
  return getClientAccessToken({ authMode: "AuthorizationHeader" })
    .flatMapOk(token => exchangeToken(token, { type: "ProjectToken", projectId }))
    .mapResult(token => token.toResult(new Error("Couldn't get token")))
    .flatMapOk(accessToken =>
      toFuture(
        sdk.OnboardPublicIndividualAccountHolder(
          { input: { accountCountry } },
          { Authorization: `Bearer ${accessToken}` },
        ),
      ),
    )
    .mapResult(({ onboardIndividualAccountHolder }) =>
      match(onboardIndividualAccountHolder)
        .with(
          { __typename: "OnboardIndividualAccountHolderSuccessPayload" },
          ({ onboarding: { id } }) => Result.Ok(id),
        )
        .with(
          {
            __typename: P.union("ForbiddenRejection", "ValidationRejection"),
          },
          ({ __typename, message }) => Result.Error(new OnboardingRejection(__typename, message)),
        )
        .exhaustive(),
    );
};

export const getAccountMembershipInvitationData = ({
  inviterAccountMembershipId,
  inviteeAccountMembershipId,
  projectId,
}: {
  inviterAccountMembershipId: string;
  inviteeAccountMembershipId: string;
  projectId: string;
}): Future<Result<GetAccountMembershipInvitationDataQuery, Error>> => {
  return getClientAccessToken({ authMode: "AuthorizationHeader" })
    .flatMapOk(token => exchangeToken(token, { type: "ProjectToken", projectId }))
    .mapResult(token => token.toResult(new Error("Couldn't get token")))
    .flatMapOk(accessToken =>
      toFuture(
        sdk.GetAccountMembershipInvitationData(
          { inviterAccountMembershipId, inviteeAccountMembershipId },
          { "x-swan-token": `Bearer ${accessToken}` },
        ),
      ),
    );
};
