import { Future, Result } from "@swan-io/boxed";
import { GraphQLClient } from "graphql-request";
import { match } from "ts-pattern";
import { env } from "../env";
import { AccountCountry, getSdk } from "../graphql/partner";
import { fetchWithTimeout } from "../utils/fetch";
import { OAuth2ClientCredentialsError, OAuth2NetworkError, getClientAccessToken } from "./oauth2";

export const sdk = getSdk(new GraphQLClient(env.PARTNER_API_URL, { fetch: fetchWithTimeout }));

export class ServerError extends Error {
  tag = "ServerError";
}

export const toFuture = <T>(promise: Promise<T>): Future<Result<T, ServerError>> => {
  return Future.fromPromise(promise).mapError(error => new ServerError(JSON.stringify(error)));
};

let projectId: Future<
  Result<string, OAuth2NetworkError | SyntaxError | OAuth2ClientCredentialsError>
>;

export const getProjectId = () => {
  if (projectId != undefined) {
    return projectId;
  }
  projectId = getClientAccessToken()
    .flatMapOk(accessToken =>
      toFuture(sdk.ProjectId({}, { Authorization: `Bearer ${accessToken}` })),
    )
    .mapOk(({ projectInfo: { id } }) => id);
  return projectId;
};

export class UnsupportedAccountCountryError extends Error {
  tag = "UnsupportedAccountCountryError";
}

export const parseAccountCountry = (
  accountCountry: unknown,
): Result<AccountCountry | undefined, UnsupportedAccountCountryError> =>
  match(accountCountry)
    .with("FRA", "DEU", "ESP", "NLD", "ITA", undefined, value => Result.Ok(value))
    .otherwise(country => Result.Error(new UnsupportedAccountCountryError(String(country))));

export class FinalizeOnboardingRejectionError extends Error {
  tag = "FinalizeOnboardingRejectionError";
}

export const finalizeOnboarding = ({
  onboardingId,
  accessToken,
}: {
  onboardingId: string;
  accessToken: string;
}) => {
  return toFuture(
    sdk.FinalizeOnboarding({ input: { onboardingId } }, { Authorization: `Bearer ${accessToken}` }),
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

export class BindAccountMembershipRejectionError extends Error {
  tag = "BindAccountMembershipRejectionError";
}

export const bindAccountMembership = ({
  accountMembershipId,
  accessToken,
}: {
  accountMembershipId: string;
  accessToken: string;
}) => {
  const bindAccountMembership = toFuture(
    sdk.BindAccountMembership(
      { input: { accountMembershipId } },
      { Authorization: `Bearer ${accessToken}` },
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
