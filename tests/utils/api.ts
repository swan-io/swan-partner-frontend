import { TypedDocumentNode } from "@graphql-typed-document-node/core";
import { APIRequestContext } from "@playwright/test";
import { GraphQLError, Kind, print } from "graphql";
import { Exact } from "../graphql/partner";
import { env } from "./env";
import { log } from "./functions";
import { getSession, saveSession } from "./session";
import { getProjectAccessToken, refreshUserTokens } from "./tokens";

type ApiRequesterOptions<Result, Variables> = {
  api?: "partner" | "partner-admin";
  as?: "project" | "user";
  headers?: Record<string, string | undefined>;
  query: TypedDocumentNode<Result, Variables>;
} & (Variables extends Exact<{ [key: string]: never }>
  ? { variables?: Variables }
  : { variables: Variables });

export const getApiRequester =
  (request: APIRequestContext) =>
  async <Result, Variables>({
    api = "partner",
    as = "project",
    headers = {},
    query,
    variables,
  }: ApiRequesterOptions<Result, Variables>): Promise<Result> => {
    const performRequest = async (accessToken: string): Promise<Result> => {
      const response = await request.post(
        api === "partner" ? env.PARTNER_API_URL : env.PARTNER_ADMIN_API_URL,
        {
          headers: {
            ...headers,
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          data: {
            query: print(query),
            variables,
          },
        },
      );

      const status = response.status();

      if (status === 401) {
        throw new Error("UNAUTHORIZED");
      }
      if (!response.ok()) {
        throw new Error(response.statusText());
      }

      const { data, errors = [] } = (await response.json()) as {
        data?: Result;
        errors?: GraphQLError[];
      };

      if (errors.length > 0) {
        const message = errors.map(error => error.message).join("\n");
        throw new Error(message);
      }

      if (data == null) {
        throw new Error("No Content");
      }

      log.info(`${operationName} response:`);

      console.dir(data, {
        depth: null,
        colors: true,
      });

      return data;
    };

    const { project, user } = await getSession();
    const { accessToken } = as === "project" ? project : user;

    if (accessToken == null) {
      throw new Error("Missing accessToken");
    }

    const definition = query.definitions[0];
    let operationName = "Operation";

    if (definition?.kind === Kind.OPERATION_DEFINITION) {
      const { name, operation } = definition;

      if (name?.kind === Kind.NAME) {
        operationName = `${name.value} ${operation}`;

        if (variables != null) {
          log.info(`${operationName} called with variables:`);

          console.dir(variables, {
            depth: null,
            colors: true,
          });
        } else {
          log.info(`${operationName} called`);
        }
      }
    }

    return performRequest(accessToken).catch(async (error: Error) => {
      if (error.message !== "UNAUTHORIZED") {
        return Promise.reject(error);
      }

      if (as === "project") {
        const accessToken = await getProjectAccessToken();
        await saveSession({ project: { accessToken } });
        return performRequest(accessToken);
      } else {
        const {
          user: { refreshToken },
        } = await getSession();

        if (refreshToken == null) {
          throw new Error("Missing refreshToken");
        }

        const tokens = await refreshUserTokens(refreshToken);
        await saveSession({ user: tokens });
        return performRequest(tokens.accessToken);
      }
    });
  };
