import { Future, Result } from "@swan-io/boxed";
import { P, match } from "ts-pattern";
import { env } from "../env.js";

export type OAuth2State =
  | { id: string; type: "Redirect"; redirectTo?: string }
  | { id: string; type: "FinalizeOnboarding"; onboardingId: string }
  | { id: string; type: "BindAccountMembership"; accountMembershipId: string }
  | { id: string; type: "Swan__FinalizeOnboarding"; onboardingId: string; projectId: string }
  | {
      id: string;
      type: "Swan__BindAccountMembership";
      accountMembershipId: string;
      projectId: string;
    };

export const getOAuth2StatePattern = (id: string) =>
  P.union(
    { id, type: "Redirect" as const, redirectTo: P.optional(P.string) },
    { id, type: "FinalizeOnboarding" as const, onboardingId: P.string },
    { id, type: "Swan__FinalizeOnboarding" as const, onboardingId: P.string, projectId: P.string },
    { id, type: "BindAccountMembership" as const, accountMembershipId: P.string },
    {
      id,
      type: "Swan__BindAccountMembership" as const,
      accountMembershipId: P.string,
      projectId: P.string,
    },
  );

export class OAuth2Error extends Error {
  tag = "OAuth2Error";
}
export class OAuth2NetworkError extends OAuth2Error {
  tag = "OAuth2NetworkError";
}
export class OAuth2ServerError extends OAuth2Error {
  tag = "OAuth2ServerError";
}
class OAuth2TokenFromCodeError extends OAuth2Error {
  tag = "OAuth2TokenFromCodeError";
}
class OAuth2RefreshTokenError extends OAuth2Error {
  tag = "OAuth2RefreshTokenError";
}
export class OAuth2ClientCredentialsError extends OAuth2Error {
  tag = "OAuth2ClientCredentialsError";
}

export const query = (input: RequestInfo, init?: RequestInit) => {
  const request = Future.fromPromise(fetch(input, init)).mapError(
    error => new OAuth2NetworkError(undefined, { cause: error }),
  );

  const f = (res: Response) => {
    const json: Promise<unknown> = res.json();
    const data = Future.fromPromise(json).mapError(error => error as SyntaxError);
    if (res.ok) {
      return data;
    } else {
      return data.mapOkToResult(json =>
        Result.Error<unknown, OAuth2ServerError>(
          new OAuth2ServerError(
            JSON.stringify({
              data: json,
              status: res.status,
            }),
          ),
        ),
      );
    }
  };
  return request.flatMapOk(f);
};

type OAuth2Session = {
  expiresAt: number;
  accessToken: string;
  refreshToken: string;
};

export const getTokenFromCode = ({ redirectUri, code }: { redirectUri: string; code: string }) => {
  const formData = new FormData();
  formData.append("client_id", env.OAUTH_CLIENT_ID);
  formData.append("client_secret", env.OAUTH_CLIENT_SECRET);
  formData.append("grant_type", "authorization_code");
  formData.append("code", code);
  formData.append("redirect_uri", redirectUri);

  const data = query(`${env.OAUTH_SERVER_URL}/oauth2/token`, {
    method: "POST",
    body: formData,
  });

  return data.mapOkToResult(data =>
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

  return data.mapOkToResult(data =>
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

export const getClientAccessToken = () => {
  const formData = new FormData();
  formData.append("client_id", env.OAUTH_CLIENT_ID);
  formData.append("client_secret", env.OAUTH_CLIENT_SECRET);
  formData.append("grant_type", "client_credentials");
  const data = query(`${env.OAUTH_SERVER_URL}/oauth2/token`, {
    method: "POST",
    body: formData,
    headers: {
      Accept: "application/json",
    },
  });

  return data.mapOkToResult(data =>
    match(data)
      .with({ access_token: P.string }, ({ access_token }) => Result.Ok(access_token))
      .otherwise(data => Result.Error(new OAuth2ClientCredentialsError(JSON.stringify(data)))),
  );
};
