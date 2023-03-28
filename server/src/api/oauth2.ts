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

const query = (input: RequestInfo, init?: RequestInit): Future<Result<unknown, Error>> => {
  return Future.fromPromise(
    fetch(input, init)
      .then(res => {
        if (res.ok) {
          return res;
        } else {
          throw new Error(`Failed with status ${res.status}`);
        }
      })
      .then(res => res.json() as unknown),
  ).mapError(error => error as Error);
};

type OAuth2Session = {
  expiresAt: number;
  accessToken: string;
  refreshToken: string;
};

export const getTokenFromCode = ({
  redirectUri,
  code,
}: {
  redirectUri: string;
  code: string;
}): Future<Result<OAuth2Session, Error>> => {
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
      .otherwise(() => Result.Error(new Error("OAuth2: invalid data received"))),
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
      .otherwise(() => Result.Error(new Error("OAuth2: invalid data received"))),
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
    headers: { Accept: "application/json" },
  });

  return data.mapResult(data =>
    match(data)
      .with({ access_token: P.string }, ({ access_token }) => Result.Ok(access_token))
      .otherwise(() => Result.Error(new Error("OAuth2: could not get client access token"))),
  );
};
