import { Future, Result } from "@swan-io/boxed";
import { GraphQLClient } from "graphql-request";
import { P, match } from "ts-pattern";
import { env } from "../env.js";
import { AccountCountry, getSdk } from "../graphql/unauthenticated.js";

export const sdk = getSdk(new GraphQLClient(env.UNAUTHENTICATED_API_URL, { timeout: 30_000 }));

export class ServerError extends Error {
  tag = "ServerError";
}

export const toFuture = <T>(promise: Promise<T>): Future<Result<T, ServerError>> => {
  return Future.fromPromise(promise).mapError(error => new ServerError(JSON.stringify(error)));
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
  projectId,
  accountCountry,
}: {
  projectId: string;
  accountCountry?: AccountCountry;
}) => {
  return toFuture(
    sdk.OnboardCompanyAccountHolder({ input: { accountCountry, projectId } }),
  ).mapOkToResult(({ unauthenticatedOnboardPublicCompanyAccountHolder }) =>
    match(unauthenticatedOnboardPublicCompanyAccountHolder)
      .with(
        { __typename: "UnauthenticatedOnboardPublicCompanyAccountHolderSuccessPayload" },
        ({ onboarding: { id } }) => Result.Ok(id),
      )
      .with(
        {
          __typename: P.union("ValidationRejection", "PublicOnboardingDisabledRejection"),
        },
        ({ __typename, message }) =>
          Result.Error(new OnboardingRejectionError(JSON.stringify({ __typename, message }))),
      )
      .exhaustive(),
  );
};

export const onboardIndividualAccountHolder = ({
  projectId,
  accountCountry,
}: {
  projectId: string;
  accountCountry?: AccountCountry;
}) => {
  return toFuture(
    sdk.OnboardIndividualAccountHolder({ input: { accountCountry, projectId } }),
  ).mapOkToResult(({ unauthenticatedOnboardPublicIndividualAccountHolder }) =>
    match(unauthenticatedOnboardPublicIndividualAccountHolder)
      .with(
        { __typename: "UnauthenticatedOnboardPublicIndividualAccountHolderSuccessPayload" },
        ({ onboarding: { id } }) => Result.Ok(id),
      )
      .with(
        {
          __typename: P.union("ValidationRejection", "PublicOnboardingDisabledRejection"),
        },
        ({ __typename, message }) =>
          Result.Error(new OnboardingRejectionError(JSON.stringify({ __typename, message }))),
      )
      .exhaustive(),
  );
};
