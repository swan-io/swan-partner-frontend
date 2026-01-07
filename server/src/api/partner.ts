import { Future, Result } from "@swan-io/boxed";
import { GraphQLClient } from "graphql-request";
import { match, P } from "ts-pattern";
import { env } from "../env";
import { AccountCountry, getSdk } from "../graphql/partner";
import { fetchWithTimeout } from "../utils/fetch";
import { getClientAccessToken, OAuth2ClientCredentialsError, OAuth2NetworkError } from "./oauth2";

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
  if (projectId != null) {
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
): Result<AccountCountry, UnsupportedAccountCountryError> =>
  match(accountCountry)
    .with("FRA", "DEU", "ESP", "NLD", "ITA", "BEL", value => Result.Ok(value))
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
      const redirectUrl =
        oauthRedirectUrl != null && oauthRedirectUrl !== "" ? oauthRedirectUrl : undefined;

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

export class CreateOnboardingRejectionError extends Error {
  tag = "CreateOnboardingRejectionError";
}

export const createPublicIndividualAccountHolderOnboarding = ({
  projectId,
  accountCountry,
}: {
  projectId: string;
  accountCountry: AccountCountry;
}) => {
  return toFuture(
    sdk.CreatePublicIndividualAccountHolderOnboarding({
      input: { projectId, accountInfo: { country: accountCountry }, accountAdmin: {} },
    }),
  ).mapOkToResult(({ createPublicIndividualAccountHolderOnboarding }) =>
    match(createPublicIndividualAccountHolderOnboarding)
      .with(
        { __typename: "CreatePublicIndividualAccountHolderOnboardingSuccessPayload" },
        ({ onboarding: { id } }) => Result.Ok(id),
      )
      .with(
        {
          __typename: P.union(
            "ValidationRejection",
            "PublicOnboardingDisabledRejection",
            "ForbiddenRejection",
          ),
        },
        ({ __typename, message }) =>
          Result.Error(new CreateOnboardingRejectionError(JSON.stringify({ __typename, message }))),
      )
      .exhaustive(),
  );
};

export const createPublicCompanyAccountHolderOnboarding = ({
  projectId,
  accountCountry,
}: {
  projectId: string;
  accountCountry: AccountCountry;
}) => {
  return toFuture(
    sdk.CreatePublicCompanyAccountHolderOnboarding({
      input: { accountInfo: { country: accountCountry }, accountAdmin: {}, company: {}, projectId },
    }),
  ).mapOkToResult(({ createPublicCompanyAccountHolderOnboarding }) =>
    match(createPublicCompanyAccountHolderOnboarding)
      .with(
        { __typename: "CreatePublicCompanyAccountHolderOnboardingSuccessPayload" },
        ({ onboarding: { id } }) => Result.Ok(id),
      )
      .with(
        {
          __typename: P.union(
            "ValidationRejection",
            "PublicOnboardingDisabledRejection",
            "ForbiddenRejection",
          ),
        },
        ({ __typename, message }) =>
          Result.Error(new CreateOnboardingRejectionError(JSON.stringify({ __typename, message }))),
      )
      .exhaustive(),
  );
};
