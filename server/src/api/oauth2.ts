import { Future, Result } from "@swan-io/boxed";
import { P, match } from "ts-pattern";
import { env } from "../env.js";

export type OAuth2State =
  | { id: string; type: "Redirect"; redirectTo?: string }
  | { id: string; type: "FinalizeOnboarding"; onboardingId: string }
  | { id: string; type: "BindAccountMembership"; accountMembershipId: string };

export const getOAuth2StatePattern = (id: string) =>
  P.union(
    { id, type: "Redirect" as const, redirectTo: P.optional(P.string) },
    { id, type: "FinalizeOnboarding" as const, onboardingId: P.string },
    { id, type: "BindAccountMembership" as const, accountMembershipId: P.string },
  );

export class OAuth2Error extends Error {}
export class OAuth2ServerError extends OAuth2Error {}
class OAuth2TokenFromCodeError extends OAuth2Error {}
class OAuth2RefreshTokenError extends OAuth2Error {}
class OAuth2ClientCredentialsError extends OAuth2Error {}

export const query = (
  input: RequestInfo,
  init?: RequestInit,
): Future<Result<unknown, OAuth2ServerError>> => {
  const request = Future.fromPromise(fetch(input, init)).mapError(error => error as Error);
  return request.flatMapOk(res => {
    const json: Promise<unknown> = res.json();
    const data: Future<Result<unknown, Error>> = Future.fromPromise(json).mapError(
      error => error as Error,
    );
    if (res.ok) {
      return data;
    } else {
      return data.mapResult(json =>
        Result.Error(
          new OAuth2ServerError(
            JSON.stringify({
              data: json,
              status: res.status,
            }),
          ),
        ),
      );
    }
  });
};

type OAuth2Session = {
  expiresAt: number;
  accessToken: string;
  refreshToken: string;
};

export const getTokenFromCode = ({
  redirectUri,
  authMode,
  code,
}: {
  redirectUri: string;
  authMode: "FormData" | "AuthorizationHeader";
  code: string;
}) => {
  const formData = new FormData();
  if (authMode === "FormData") {
    formData.append("client_id", env.OAUTH_CLIENT_ID);
    formData.append("client_secret", env.OAUTH_CLIENT_SECRET);
  }
  formData.append("grant_type", "authorization_code");
  formData.append("code", code);
  formData.append("redirect_uri", redirectUri);

  const data = query(`${env.OAUTH_SERVER_URL}/oauth2/token`, {
    method: "POST",
    body: formData,
    headers:
      authMode === "AuthorizationHeader"
        ? {
            Authorization: `Basic ${Buffer.from(
              `${env.OAUTH_CLIENT_ID}:${env.OAUTH_CLIENT_SECRET}`,
            ).toString("base64")}`,
          }
        : undefined,
  });

  return data.mapResult(data =>
    match(data)
      .with(
        { expires_in: P.number, access_token: P.string, refresh_token: P.string },
        ({ expires_in, access_token, refresh_token }) => {
          const session: OAuth2Session = {
            expiresAt: Date.now() + expires_in * 1000,
            accessToken: access_token,
            refreshToken: refresh_token,
          };
          return Result.Ok(session);
        },
      )
      .otherwise(data => Result.Error(new OAuth2TokenFromCodeError(JSON.stringify(data)))),
  );
};

export const createAuthUrl = ({
  scope: requestedScope,
  redirectUri,
  params,
  state,
}: {
  scope: string[];
  redirectUri: string;
  params: Record<string, string>;
  state: string;
}) => {
  const queryString = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => queryString.set(key, value));
  queryString.set("response_type", "code");
  queryString.set("client_id", env.OAUTH_CLIENT_ID);
  queryString.set("redirect_uri", redirectUri);
  queryString.set("state", state);
  // we always add `openid` (login through Swan) and `offline` (to get a refresh_token)
  queryString.set("scope", ["openid", "offline", ...requestedScope].join(" "));
  return `${env.OAUTH_SERVER_URL}/oauth2/auth?${queryString.toString()}`;
};

export const refreshAccessToken = ({
  refreshToken,
  redirectUri,
}: {
  refreshToken: string;
  redirectUri: string;
}) => {
  const formData = new FormData();
  formData.append("client_id", env.OAUTH_CLIENT_ID);
  formData.append("client_secret", env.OAUTH_CLIENT_SECRET);
  formData.append("grant_type", "refresh_token");
  formData.append("refresh_token", refreshToken);
  formData.append("redirect_uri", redirectUri);

  const data = query(`${env.OAUTH_SERVER_URL}/oauth2/token`, {
    method: "POST",
    body: formData,
  });

  return data.mapResult(data =>
    match(data)
      .with(
        { expires_in: P.number, access_token: P.string, refresh_token: P.string },
        ({ expires_in, access_token, refresh_token }) =>
          Result.Ok({
            expiresAt: Date.now() + expires_in * 1000,
            accessToken: access_token,
            refreshToken: refresh_token,
          }),
      )
      .otherwise(data => Result.Error(new OAuth2RefreshTokenError(JSON.stringify(data)))),
  );
};

export const getClientAccessToken = ({
  authMode,
}: {
  authMode: "FormData" | "AuthorizationHeader";
}) => {
  const formData = new FormData();
  if (authMode === "FormData") {
    formData.append("client_id", env.OAUTH_CLIENT_ID);
    formData.append("client_secret", env.OAUTH_CLIENT_SECRET);
  }
  formData.append("grant_type", "client_credentials");
  const data = query(`${env.OAUTH_SERVER_URL}/oauth2/token`, {
    method: "POST",
    body: formData,
    headers: {
      Accept: "application/json",
      ...(authMode === "AuthorizationHeader"
        ? {
            Authorization: `Basic ${Buffer.from(
              `${env.OAUTH_CLIENT_ID}:${env.OAUTH_CLIENT_SECRET}`,
            ).toString("base64")}`,
          }
        : undefined),
    },
  });

  return data.mapResult(data =>
    match(data)
      .with({ access_token: P.string }, ({ access_token }) => Result.Ok(access_token))
      .otherwise(data => Result.Error(new OAuth2ClientCredentialsError(JSON.stringify(data)))),
  );
};
