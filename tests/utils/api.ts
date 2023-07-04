import { TypedDocumentNode } from "@graphql-typed-document-node/core";
import { APIRequestContext } from "@playwright/test";
import { Kind, print } from "graphql";
import { Exact } from "../graphql/partner-admin";
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
    const performRequest = (accessToken: string): Promise<Result> =>
      request
        .post(api === "partner" ? env.PARTNER_API_URL : env.PARTNER_ADMIN_API_URL, {
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
        })
        .then(response => {
          const status = response.status();

          if (response.ok()) {
            return response.json();
          }
          if (status === 401) {
            throw new Error("UNAUTHORIZED");
          }

          return Promise.reject(response);
        })
        .then((response: { data?: Result }) => {
          return response.data ?? Promise.reject(response);
        });

    const { project, user } = await getSession();
    const { accessToken } = as === "project" ? project : user;

    if (accessToken == null) {
      throw new Error("Missing accessToken");
    }

    const definition = query.definitions[0];

    if (definition?.kind === Kind.OPERATION_DEFINITION) {
      const { operation, selectionSet } = definition;
      const selection = selectionSet.selections[0];

      if (selection?.kind === Kind.FIELD) {
        const { name } = selection;

        if (variables != null) {
          log.info(`Calling ${name.value} ${operation} with variables:`);

          console.dir(variables, {
            depth: null,
            colors: true,
          });
        } else {
          log.info(`Calling ${name.value} ${operation}`);
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
