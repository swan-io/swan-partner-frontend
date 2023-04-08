/**
 * Notice
 * ---
 * This file is for Swan's internal usage only
 */
import { Future, Option, Result } from "@swan-io/boxed";
import { P, match } from "ts-pattern";
import { validate } from "valienv";
import { url } from "../env";

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

const additionalEnv = {
  ...validate({
    env: process.env,
    validators: {
      SWAN_AUTH_URL: url,
    },
  }),
  SWAN_AUTH_TOKEN: process.env.SWAN_AUTH_TOKEN,
};

type ExchangeTokenConfig =
  | { type: "ProjectToken"; projectId: string }
  | { type: "AccountMemberToken"; projectId: string };

export const exchangeToken = (
  originalAccessToken: string | undefined,
  config: ExchangeTokenConfig,
): Future<Result<Option<string>, Error>> => {
  if (originalAccessToken == undefined) {
    return Future.value(Result.Ok(Option.None()));
  }

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
      ...(additionalEnv.SWAN_AUTH_TOKEN != undefined
        ? { "x-swan-frontend": additionalEnv.SWAN_AUTH_TOKEN }
        : undefined),
    },
  }).mapOk(payload => {
    return match(payload)
      .with({ token: P.string }, ({ token }) => {
        return Option.Some(token);
      })
      .otherwise(err => {
        console.log(err);
        return Option.None();
      });
  });
};
