/**
 * Notice
 * ---
 * This file is for Swan's internal usage only
 */
import { Result } from "@swan-io/boxed";
import { P, match } from "ts-pattern";
import { OAuth2Error, query } from "./oauth2";

const additionalEnv = {
  SWAN_AUTH_URL: process.env.SWAN_AUTH_URL as string,
  SWAN_AUTH_TOKEN: process.env.SWAN_AUTH_TOKEN,
};

class OAuth2ExchangeTokenError extends OAuth2Error {
  tag = "OAuth2ExchangeTokenError";
}

type ExchangeTokenConfig =
  | { type: "ProjectToken"; projectId: string }
  | { type: "AccountMemberToken"; projectId: string };

export const exchangeToken = (originalAccessToken: string, config: ExchangeTokenConfig) => {
  return query(additionalEnv.SWAN_AUTH_URL, {
    method: "POST",
    body: JSON.stringify(
      match(config)
        .with({ type: "ProjectToken" }, ({ projectId }) => ({
          token: originalAccessToken,
          impersonatedProjectIdByMember: projectId,
          clientCredentials: "true",
        }))
        .with({ type: "AccountMemberToken" }, ({ projectId }) => ({
          token: originalAccessToken,
          impersonatedProjectId: projectId,
          clientCredentials: "false",
        }))
        .exhaustive(),
    ),
    headers: {
      "Content-Type": "application/json",
      ...(additionalEnv.SWAN_AUTH_TOKEN != null
        ? { "x-swan-frontend": additionalEnv.SWAN_AUTH_TOKEN }
        : undefined),
    },
  }).mapOkToResult(payload => {
    return match(payload)
      .with({ token: P.string }, ({ token }) => {
        return Result.Ok(token);
      })
      .otherwise(data => {
        return Result.Error(new OAuth2ExchangeTokenError(JSON.stringify(data)));
      });
  });
};
