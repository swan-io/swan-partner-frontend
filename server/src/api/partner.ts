import { Future, Result } from "@swan-io/boxed";
import { GraphQLClient } from "graphql-request";
import { P, match } from "ts-pattern";
import { env } from "../env.js";
import { AccountCountry, OnboardingRedirectInfoFragment, getSdk } from "../graphql/partner.js";
import {
  OAuth2ClientCredentialsError,
  OAuth2NetworkError,
  getClientAccessToken,
} from "./oauth2.js";

export const sdk = getSdk(new GraphQLClient(env.PARTNER_API_URL, { timeout: 30_000 }));

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
  projectId = getClientAccessToken({ authMode: "FormData" })
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
    .with("FRA", "DEU", "ESP", undefined, value => Result.Ok(value))
    .otherwise(country => Result.Error(new UnsupportedAccountCountryError(String(country))));

export class OnboardingRejectionError extends Error {
  tag = "OnboardingRejectionError";
}

export const onboardCompanyAccountHolder = ({
  accountCountry,
}: {
  accountCountry?: AccountCountry;
}) => {
  return getClientAccessToken({ authMode: "FormData" })
    .flatMapOk(accessToken =>
      toFuture(
        sdk.OnboardCompanyAccountHolder(
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
          ({ __typename, message }) =>
            Result.Error(new OnboardingRejectionError(JSON.stringify({ __typename, message }))),
        )
        .exhaustive(),
    );
};

export const onboardIndividualAccountHolder = ({
  accountCountry,
}: {
  accountCountry?: AccountCountry;
}) => {
  return getClientAccessToken({ authMode: "FormData" })
    .flatMapOk(accessToken =>
      toFuture(
        sdk.OnboardIndividualAccountHolder(
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
          ({ __typename, message }) =>
            Result.Error(new OnboardingRejectionError(JSON.stringify({ __typename, message }))),
        )
        .exhaustive(),
    );
};

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
  const onboarding = toFuture(
    sdk.OnboardingRedirect({ onboardingId }, { Authorization: `Bearer ${accessToken}` }),
  ).mapOk(({ onboarding }) => onboarding);

  return onboarding
    .flatMapOk(onboarding => {
      return match<
        OnboardingRedirectInfoFragment,
        Future<
          Result<OnboardingRedirectInfoFragment, ServerError | FinalizeOnboardingRejectionError>
        >
      >(onboarding)
        .with({ statusInfo: { __typename: "OnboardingFinalizedStatusInfo" } }, () =>
          Future.value(Result.Ok(onboarding)),
        )
        .otherwise(() => {
          return toFuture(
            sdk.FinalizeOnboarding(
              { input: { onboardingId } },
              { Authorization: `Bearer ${accessToken}` },
            ),
          ).mapResult(({ finalizeOnboarding }) =>
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
          );
        });
    })
    .mapOk(onboarding => {
      const redirectUrl = match(onboarding.oAuthRedirectParameters?.redirectUrl?.trim())
        .with("", () => undefined)
        .otherwise(value => value);

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
  return bindAccountMembership.mapResult(({ bindAccountMembership }) => {
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
