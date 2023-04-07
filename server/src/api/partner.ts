import { Future, Result } from "@swan-io/boxed";
import { GraphQLClient } from "graphql-request";
import { P, match } from "ts-pattern";
import { env } from "../env.js";
import { AccountCountry, OnboardingRedirectInfoFragment, getSdk } from "../graphql/partner.js";
import { getClientAccessToken } from "./oauth2.js";

export const sdk = getSdk(new GraphQLClient(env.PARTNER_API_URL, { timeout: 30_000 }));

class NetworkError extends Error {
  constructor(error: unknown) {
    super();
    this.message = `NetworkError ${error instanceof Error ? error.message : String(error)}`;
  }
}

export const toFuture = <T>(promise: Promise<T>): Future<Result<T, Error>> => {
  return Future.fromPromise(promise).mapError(error => new NetworkError(error));
};

let projectId: Future<Result<string, Error>>;

export const getProjectId = (): Future<Result<string, Error>> => {
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

class UnsupportedAccountCountryError extends Error {
  country: string;
  constructor(accountCountry: string) {
    super(`UnsupportedAccountCountry`);
    this.message = "UnsupportedAccountCountry: ${accountCountry}";
    this.country = accountCountry;
  }
}

export const parseAccountCountry = (
  accountCountry: unknown,
): Result<AccountCountry | undefined, Error> =>
  match(accountCountry)
    .with("FRA", "DEU", "ESP", undefined, value => Result.Ok(value))
    .otherwise(country => Result.Error(new UnsupportedAccountCountryError(String(country))));

export class OnboardingRejection extends Error {
  __typename: "BadRequestRejection" | "ForbiddenRejection" | "ValidationRejection";
  message: string;
  constructor(
    __typename: "BadRequestRejection" | "ForbiddenRejection" | "ValidationRejection",
    message: string,
  ) {
    super();
    this.message = `OnboardingRejection: ${__typename} (${message})`;
    this.__typename = __typename;
    this.message = message;
  }
}

export const onboardCompanyAccountHolder = ({
  accountCountry,
}: {
  accountCountry?: AccountCountry;
}): Future<Result<string, Error>> => {
  return getClientAccessToken({ authMode: "FormData" })
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
}: {
  accountCountry?: AccountCountry;
}): Future<Result<string, Error>> => {
  return getClientAccessToken({ authMode: "FormData" })
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

type FinalizeOnboardingRejectionTypename =
  | "ForbiddenRejection"
  | "InternalErrorRejection"
  | "OnboardingNotCompletedRejection"
  | "ValidationRejection";

class FinalizeOnboardingRejection extends Error {
  onboardingId: string;
  __typename: FinalizeOnboardingRejectionTypename;
  message: string;
  constructor(
    onboardingId: string,
    __typename: FinalizeOnboardingRejectionTypename,
    message: string,
  ) {
    super();
    this.message = `OnboardingRejection: ${__typename} (${message})`;
    this.onboardingId = onboardingId;
    this.__typename = __typename;
    this.message = message;
  }
}

export const finalizeOnboarding = ({
  onboardingId,
  accessToken,
}: {
  onboardingId: string;
  accessToken: string;
}): Future<
  Result<
    {
      accountMembershipId: string | undefined;
      redirectUrl: string | undefined;
      state: string | undefined;
    },
    Error
  >
> => {
  const onboarding = toFuture(
    sdk.OnboardingRedirect({ onboardingId }, { Authorization: `Bearer ${accessToken}` }),
  );
  return onboarding
    .flatMapOk(({ onboarding }) => {
      return match(onboarding)
        .with({ statusInfo: { __typename: "OnboardingFinalizedStatusInfo" } }, () =>
          Future.value(Result.Ok<OnboardingRedirectInfoFragment, Error>(onboarding)),
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
                Result.Error(new FinalizeOnboardingRejection(onboardingId, __typename, message)),
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

type BindAccountMembershipRejectionTypename =
  | "AccountMembershipNotFoundRejection"
  | "AccountMembershipNotReadyToBeBoundRejection"
  | "BadAccountStatusRejection"
  | "IdentityAlreadyBindToAccountMembershipRejection"
  | "RestrictedToUserRejection"
  | "ValidationRejection";

class BindAccountMembershipRejection extends Error {
  accountMembershipId: string;
  __typename: BindAccountMembershipRejectionTypename;
  message: string;
  constructor(
    accountMembershipId: string,
    __typename: BindAccountMembershipRejectionTypename,
    message: string,
  ) {
    super();
    this.message = `OnboardingRejection: ${__typename} (${message})`;
    this.accountMembershipId = accountMembershipId;
    this.__typename = __typename;
    this.message = message;
  }
}

export const bindAccountMembership = ({
  accountMembershipId,
  accessToken,
}: {
  accountMembershipId: string;
  accessToken: string;
}): Future<
  Result<
    {
      accountMembershipId: string;
    },
    Error
  >
> => {
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
        ({ accountMembership: { id } }) =>
          Result.Ok<{ accountMembershipId: string }, Error>({ accountMembershipId: id }),
      )
      .otherwise(({ __typename, message }) =>
        Result.Error(new BindAccountMembershipRejection(accountMembershipId, __typename, message)),
      );
  });
};
