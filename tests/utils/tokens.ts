import { randomUUID } from "node:crypto";
import querystring from "node:querystring";
import { REDIRECT_URI } from "./constants";
import { env } from "./env";
import { fetchOk } from "./functions";

export const getProjectAccessToken = () => {
  const formData = new FormData();

  formData.append("grant_type", "client_credentials");
  formData.append("client_id", env.OAUTH_CLIENT_ID);
  formData.append("client_secret", env.OAUTH_CLIENT_SECRET);

  return fetchOk(`${env.OAUTH_SERVER_URL}/oauth2/token`, {
    method: "POST",
    body: formData,
  })
    .then(response => response.json())
    .then((json: { access_token: string }) => json.access_token);
};

export const getUserAuthLink = () =>
  `${env.OAUTH_SERVER_URL}/oauth2/auth?${querystring.encode({
    client_id: env.OAUTH_CLIENT_ID,
    response_type: "code",
    scope: ["openid", "offline", "idverified"].join(" "),
    state: randomUUID(),
    phoneNumber: env.PHONE_NUMBER,
    redirect_uri: REDIRECT_URI,
  })}`;

export const getUserTokens = (code: string) => {
  const formData = new FormData();

  formData.append("grant_type", "authorization_code");
  formData.append("code", code);
  formData.append("client_id", env.OAUTH_CLIENT_ID);
  formData.append("client_secret", env.OAUTH_CLIENT_SECRET);
  formData.append("redirect_uri", REDIRECT_URI);

  return fetchOk(`${env.OAUTH_SERVER_URL}/oauth2/token`, {
    method: "POST",
    body: formData,
  })
    .then(response => response.json())
    .then((json: { access_token: string; refresh_token: string }) => ({
      accessToken: json.access_token,
      refreshToken: json.refresh_token,
    }));
};

export const refreshUserTokens = async (refreshToken: string) => {
  const formData = new FormData();

  formData.append("grant_type", "refresh_token");
  formData.append("refresh_token", refreshToken);
  formData.append("client_id", env.OAUTH_CLIENT_ID);
  formData.append("client_secret", env.OAUTH_CLIENT_SECRET);
  formData.append("redirect_uri", REDIRECT_URI);

  return fetchOk(`${env.OAUTH_SERVER_URL}/oauth2/token`, {
    method: "POST",
    body: formData,
  })
    .then(response => response.json())
    .then((json: { access_token: string; refresh_token: string }) => ({
      accessToken: json.access_token,
      refreshToken: json.refresh_token,
    }));
};
