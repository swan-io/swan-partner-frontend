import { TypedDocumentNode } from "@graphql-typed-document-node/core";
import { APIRequestContext } from "@playwright/test";
import { Kind, print } from "graphql";
import { Exact } from "../graphql/partner-admin";
import { env } from "./env";
import { fetchOk, log } from "./functions";
import { getSession, saveSession } from "./session";

type ApiRequesterOptions<Result, Variables> = {
  headers?: Record<string, string | undefined>;
  query: TypedDocumentNode<Result, Variables>;
} & (Variables extends Exact<{ [key: string]: never }>
  ? { variables?: Variables }
  : { variables: Variables });

export const getApiAccessToken = () => {
  const formData = new FormData();

  formData.append("grant_type", "client_credentials");
  formData.append("client_id", env.OAUTH_CLIENT_ID);
  formData.append("client_secret", env.OAUTH_CLIENT_SECRET);

  return fetchOk(env.OAUTH_SERVER_URL + "/oauth2/token", {
    method: "POST",
    body: formData,
  })
    .then(response => response.json())
    .then((json: { access_token: string }) => json.access_token);
};

export const getApiRequester =
  (request: APIRequestContext) =>
  async <Result, Variables>({
    headers = {},
    query,
    variables,
  }: ApiRequesterOptions<Result, Variables>): Promise<Result> => {
    const performRequest = (accessToken: string): Promise<Result> =>
      request
        .post(env.PARTNER_ADMIN_API_URL, {
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

    const { accessToken } = await getSession();

    return performRequest(accessToken).catch(async (error: Error) => {
      if (error.message !== "UNAUTHORIZED") {
        return Promise.reject(error);
      }

      const accessToken = await getApiAccessToken();
      await saveSession({ accessToken });
      return performRequest(accessToken);
    });
  };
