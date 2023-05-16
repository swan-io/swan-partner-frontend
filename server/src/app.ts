import cors from "@fastify/cors";
import replyFrom from "@fastify/reply-from";
import secureSession from "@fastify/secure-session";
import fastifyStatic from "@fastify/static";
import fastifyView from "@fastify/view";
import { Array, Future, Option, Result } from "@swan-io/boxed";
import fastify from "fastify";
import mustache from "mustache";
// @ts-expect-error
import languageParser from "fastify-language-parser";
import { randomUUID } from "node:crypto";
import { lookup } from "node:dns";
import fs from "node:fs";
import url from "node:url";
import path from "pathe";
import { P, match } from "ts-pattern";
import {
  OAuth2State,
  createAuthUrl,
  getOAuth2StatePattern,
  getTokenFromCode,
  refreshAccessToken,
} from "./api/oauth2.js";
import {
  UnsupportedAccountCountryError,
  bindAccountMembership,
  finalizeOnboarding,
  getProjectId,
  parseAccountCountry,
} from "./api/partner.js";
import { swan__bindAccountMembership, swan__finalizeOnboarding } from "./api/partner.swan.js";
import {
  OnboardingRejectionError,
  onboardCompanyAccountHolder,
  onboardIndividualAccountHolder,
} from "./api/unauthenticated.js";
import { HttpsConfig, startDevServer } from "./client/devServer.js";
import { getProductionRequestHandler } from "./client/prodServer.js";
import { env } from "./env.js";
import { renderAuthError, renderError } from "./views/error.js";

const dirname = path.dirname(url.fileURLToPath(import.meta.url));
const packageJson = JSON.parse(
  fs.readFileSync(path.join(dirname, "../package.json"), "utf-8"),
) as unknown as { version: string };

const COOKIE_MAX_AGE = 300; // 5 minutes
const OAUTH_STATE_COOKIE_MAX_AGE = 300; // 5 minutes

export type InvitationConfig = {
  accessToken: string;
  requestLanguage: string;
  inviteeAccountMembershipId: string;
  inviterAccountMembershipId: string;
};

type AppConfig = {
  mode: "development" | "test" | "production";
  httpsConfig?: HttpsConfig;
  sendAccountMembershipInvitation?: (config: InvitationConfig) => Promise<unknown>;
};

declare module "@fastify/secure-session" {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface SessionData {
    expiresAt: number;
    accessToken: string;
    refreshToken: string;
    state: string;
  }
}

declare module "fastify" {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface FastifyRequest {
    config: {
      unauthenticatedApiUrl: string;
      partnerApiUrl: string;
      clientId: string;
      clientSecret: string;
    };
    accessToken: string | undefined;
    detectedLng: string;
  }
}

const getPort = (url: string) => {
  let port = new URL(url).port;
  if (port === "") {
    port = url.startsWith("https") ? "443" : "80";
  }
  return port;
};

const BANKING_PORT = getPort(env.BANKING_URL);
const ONBOARDING_PORT = getPort(env.ONBOARDING_URL);

const ports = new Set([BANKING_PORT, ONBOARDING_PORT]);

const assertIsBoundToLocalhost = (host: string) => {
  return new Promise((resolve, reject) => {
    lookup(host, { family: 4 }, (err, address) => {
      if (err != null || address !== "127.0.0.1") {
        reject(`${host} isn't bound to localhost, did you setup your /etc/hosts correctly?`);
      }
      resolve(true);
    });
  });
};

export const start = async ({ mode, httpsConfig, sendAccountMembershipInvitation }: AppConfig) => {
  if (mode === "development") {
    const BANKING_HOST = new URL(env.BANKING_URL).hostname;
    const ONBOARDING_HOST = new URL(env.ONBOARDING_URL).hostname;

    try {
      await Promise.all([
        assertIsBoundToLocalhost(BANKING_HOST),
        assertIsBoundToLocalhost(ONBOARDING_HOST),
      ]);
    } catch (err) {
      console.error(err);
      process.exit(1);
    }

    if (httpsConfig != null) {
      if (!fs.statSync(httpsConfig.key).isFile()) {
        console.error("Missing HTTPS key, did you generate it in `server/keys`?");
        process.exit(1);
      }

      if (!fs.statSync(httpsConfig.cert).isFile()) {
        console.error("Missing HTTPS cert, did you generate it in `server/keys`?");
        process.exit(1);
      }
    }
  }

  const app = fastify({
    // @ts-expect-error
    // To emulate secure cookies, we use HTTPS locally but expose HTTP in production,
    // in order to let the gateway handle that, and fastify ts bindings don't like that
    http2: httpsConfig != null,
    https:
      httpsConfig != null
        ? {
            key: fs.readFileSync(httpsConfig.key, "utf8"),
            cert: fs.readFileSync(httpsConfig.cert, "utf8"),
          }
        : null,
    trustProxy: true,
    logger: {
      level: env.LOG_LEVEL,
      ...(env.NODE_ENV === "development" && {
        transport: {
          target: "pino-pretty",
          options: { colorize: true },
        },
        formatters: {
          level(label) {
            return { level: label };
          },
        },
      }),
    },
    genReqId: () => `req-${randomUUID()}`,
  });

  /**
   * Handles the session storage in `swan_session_id`
   *
   * The session can contain the auth information (`expiresAt`, `accessToken`, `refreshToken`).
   * During an OAuth2 flow, we also set a `state` property, which we use for compararison
   * between start and callback to mitigate CSRF risks.
   */
  await app.register(secureSession, {
    cookieName: "swan_session_id",
    key: env.COOKIE_KEY,
    cookie: {
      path: "/",
      secure: true,
      httpOnly: true,
    },
  });

  /**
   * The onboarding uses `BANKING_URL` as API root so that session is preserved
   * when the onboarding flow completes with the OAuth2 flow
   */
  await app.register(cors, {
    origin: [env.ONBOARDING_URL, env.BANKING_URL],
    credentials: true,
  });

  /**
   * View engine for pretty error rendering
   */
  await app.register(fastifyView, {
    engine: {
      mustache,
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  await app.register(languageParser, {
    order: ["query"],
    fallbackLng: "en",
    supportedLngs: ["en", "fr"],
  });

  /**
   * Try to refresh the tokens if expired or expiring soon
   */
  app.addHook("onRequest", (request, reply, done) => {
    if (!request.url.startsWith("/api/")) {
      done();
    } else {
      const TEN_SECONDS = 10_000;
      const refreshToken = request.session.get("refreshToken");
      const expiresAt = request.session.get("expiresAt") ?? 0;
      if (typeof refreshToken == "string" && expiresAt < Date.now() + TEN_SECONDS) {
        refreshAccessToken({
          refreshToken,
          redirectUri: `${env.BANKING_URL}/auth/callback`,
        })
          .tapOk(({ expiresAt, accessToken, refreshToken }) => {
            request.session.options({
              maxAge: COOKIE_MAX_AGE,
            });
            request.session.set("expiresAt", expiresAt);
            request.session.set("accessToken", accessToken);
            request.session.set("refreshToken", refreshToken);
          })
          .tapError(error => {
            request.log.debug(error);
            request.session.delete();
            void reply.redirect("/login");
          })
          .tap(() => {
            done();
          });
      } else {
        // each API call extends the existing session lifetime
        const refreshToken = request.session.get("refreshToken");
        const expiresAt = request.session.get("expiresAt");
        const accessToken = request.session.get("accessToken");
        match({ refreshToken, expiresAt, accessToken })
          .with(
            {
              refreshToken: P.not(P.nullish),
              expiresAt: P.not(P.nullish),
              accessToken: P.not(P.nullish),
            },
            ({ expiresAt, accessToken, refreshToken }) => {
              request.session.options({
                maxAge: COOKIE_MAX_AGE,
              });
              request.session.set("expiresAt", expiresAt);
              request.session.set("accessToken", accessToken);
              request.session.set("refreshToken", refreshToken);
            },
          )
          .otherwise(() => {});
        done();
      }
    }
  });

  app.addHook("onRequest", (request, reply, done) => {
    request.accessToken = request.session.get("accessToken");
    done();
  });

  app.addHook("onRequest", (request, reply, done) => {
    if (request.url.startsWith("/api/") || !request.url.startsWith("/auth/")) {
      void reply.header("cache-control", `public, max-age=0`);
    }
    done();
  });

  /**
   * Used to proxy Swan GraphQL APIs
   */
  await app.register(replyFrom);

  /**
   * Decorates the `reply` object with a `sendFile`
   */
  if (env.NODE_ENV != "development") {
    await app.register(fastifyStatic, {
      root: path.join(dirname, "../dist"),
      wildcard: false,
    });
  }

  /**
   * An no-op to extend the cookie duration.
   */
  app.post("/api/ping", async (request, reply) => {
    return reply.header("cache-control", `public, max-age=0`).status(200).send({
      ok: true,
    });
  });

  /**
   * Proxies the Swan "unauthenticated" GraphQL API.
   */
  app.post("/api/unauthenticated", async (request, reply) => {
    return reply.from(env.UNAUTHENTICATED_API_URL);
  });

  /**
   * Proxies the Swan "partner" GraphQL API.
   */
  app.post("/api/partner", async (request, reply) => {
    return reply.from(env.PARTNER_API_URL, {
      rewriteRequestHeaders: (_req, headers) => ({
        ...headers,
        ...(request.accessToken != undefined
          ? { Authorization: `Bearer ${request.accessToken}` }
          : undefined),
      }),
    });
  });

  /**
   * Starts a new individual onboarding and redirects to the onboarding URL
   * e.g. /onboarding/individual/start?accountCountry=FRA
   */
  app.get<{ Querystring: Record<string, string> }>(
    "/onboarding/individual/start",
    async (request, reply) => {
      const accountCountry = parseAccountCountry(request.query.accountCountry);
      const projectId = await getProjectId();
      return Future.value(Result.allFromDict({ accountCountry, projectId }))
        .flatMapOk(({ accountCountry, projectId }) =>
          onboardIndividualAccountHolder({ accountCountry, projectId }),
        )
        .tapOk(onboardingId => {
          return reply.redirect(`${env.ONBOARDING_URL}/onboardings/${onboardingId}`);
        })
        .tapError(error => {
          match(error)
            .with(
              P.instanceOf(UnsupportedAccountCountryError),
              P.instanceOf(OnboardingRejectionError),
              error => request.log.warn(error),
            )
            .otherwise(error => request.log.error(error));
          return renderError(reply, { status: 400, requestId: request.id as string });
        })
        .map(() => undefined);
    },
  );

  /**
   * Starts a new company onboarding and redirects to the onboarding URL
   * e.g. /onboarding/individual/start?accountCountry=FRA
   */
  app.get<{ Querystring: Record<string, string> }>(
    "/onboarding/company/start",
    async (request, reply) => {
      const accountCountry = parseAccountCountry(request.query.accountCountry);
      const projectId = await getProjectId();
      return Future.value(Result.allFromDict({ accountCountry, projectId }))
        .flatMapOk(({ accountCountry, projectId }) =>
          onboardCompanyAccountHolder({ accountCountry, projectId }),
        )
        .tapOk(onboardingId => {
          return reply.redirect(`${env.ONBOARDING_URL}/onboardings/${onboardingId}`);
        })
        .tapError(error => {
          match(error)
            .with(
              P.instanceOf(UnsupportedAccountCountryError),
              P.instanceOf(OnboardingRejectionError),
              error => request.log.warn(error),
            )
            .otherwise(error => request.log.error(error));
          return renderError(reply, { status: 400, requestId: request.id as string });
        })
        .map(() => undefined);
    },
  );

  /**
   * Accept an account membership invitation
   * e.g. /api/invitation/:id
   */
  app.get<{ Querystring: Record<string, string>; Params: { accountMembershipId: string } }>(
    "/api/invitation/:accountMembershipId",
    async (request, reply) => {
      const queryString = new URLSearchParams();
      queryString.append("accountMembershipId", request.params.accountMembershipId);
      return reply.redirect(`/auth/login?${queryString.toString()}`);
    },
  );

  /**
   * Send an account membership invitation
   * e.g. /api/invitation/:id/send?inviterAccountMembershipId=1234
   */
  app.post<{ Querystring: Record<string, string>; Params: { inviteeAccountMembershipId: string } }>(
    "/api/invitation/:inviteeAccountMembershipId/send",
    async (request, reply) => {
      const accessToken = request.accessToken;
      if (accessToken == undefined) {
        return reply.status(401).send("Unauthorized");
      }
      if (sendAccountMembershipInvitation == null) {
        return reply.status(400).send("Not implemented");
      }
      const inviterAccountMembershipId = request.query.inviterAccountMembershipId;
      if (inviterAccountMembershipId == null) {
        return reply.status(400).send("Missing inviterAccountMembershipId");
      }
      try {
        const result = await sendAccountMembershipInvitation({
          accessToken,
          requestLanguage: request.detectedLng,
          inviteeAccountMembershipId: request.params.inviteeAccountMembershipId,
          inviterAccountMembershipId,
        });
        return reply.send({ success: result });
      } catch (err) {
        request.log.error(err);
        return renderError(reply, { status: 400, requestId: request.id as string });
      }
    },
  );

  /**
   * Builds a OAuth2 auth link and redirects to it.
   */
  app.get<{ Querystring: Record<string, string> }>("/auth/login", async (request, reply) => {
    const {
      redirectTo,
      scope = "",
      onboardingId,
      accountMembershipId,
      identificationLevel,
      projectId,
    } = request.query;
    if (typeof redirectTo === "string" && !redirectTo.startsWith("/")) {
      return reply.status(403).send("Invalid `redirectTo` param");
    }
    const id = randomUUID();
    // If provided with an `onboardingId`, it means that the callback should end up
    // finalizing the onboarding, otherwise do a simple redirection
    const state: OAuth2State = match({ onboardingId, accountMembershipId, projectId })
      // Internal usage only
      .with({ onboardingId: P.string, projectId: P.string }, ({ onboardingId, projectId }) => ({
        id,
        type: "Swan__FinalizeOnboarding" as const,
        onboardingId,
        projectId,
      }))
      .with({ onboardingId: P.string }, ({ onboardingId }) => ({
        id,
        type: "FinalizeOnboarding" as const,
        onboardingId,
      }))
      // Internal usage only
      .with(
        { accountMembershipId: P.string, projectId: P.string },
        ({ accountMembershipId, projectId }) => ({
          id,
          type: "Swan__BindAccountMembership" as const,
          accountMembershipId,
          projectId,
        }),
      )
      .with({ accountMembershipId: P.string }, ({ accountMembershipId }) => ({
        id,
        type: "BindAccountMembership" as const,
        accountMembershipId,
      }))
      .otherwise(() => ({ id, type: "Redirect" as const, redirectTo }));

    request.session.options({
      maxAge: OAUTH_STATE_COOKIE_MAX_AGE,
    });
    // store the state ID to compare it with what we receive
    request.session.set("state", state.id);
    return reply.redirect(
      createAuthUrl({
        scope: scope.split(" ").filter(item => item != null && item != ""),
        params: {
          ...(onboardingId != null ? { onboardingId } : null),
          ...(identificationLevel != null ? { identificationLevel } : null),
          ...(projectId != null ? { projectId } : null),
        },
        redirectUri: `${env.BANKING_URL}/auth/callback`,
        state: JSON.stringify(state),
      }),
    );
  });

  /**
   * OAuth2 Redirection handler
   */
  app.get<{ Querystring: Record<string, string> }>("/auth/callback", async (request, reply) => {
    const state = Result.fromExecution(
      () => JSON.parse(request.query.state ?? "{}") as unknown,
    ).getWithDefault({});
    const stateId = request.session.get("state") ?? "UNKNOWN";

    return (
      match({
        code: request.query.code,
        state,
        error: request.query.error,
        errorDescription: request.query.error_description,
      })
        // check `state` against the session saved one, to prevent Cross Site Request Forgery attacks
        .with(
          {
            code: P.string,
            state: getOAuth2StatePattern(stateId),
          },
          async ({ code, state }) => {
            const token = await getTokenFromCode({
              redirectUri: `${env.BANKING_URL}/auth/callback`,
              code,
            });

            return token.match({
              Ok: ({ expiresAt, accessToken, refreshToken }) => {
                // Store the tokens
                request.session.options({
                  maxAge: COOKIE_MAX_AGE,
                });
                request.session.set("expiresAt", expiresAt);
                request.session.set("accessToken", accessToken);
                request.session.set("refreshToken", refreshToken);

                return match(state)
                  .with({ type: "Redirect" }, ({ redirectTo = "/swanpopupcallback" }) => {
                    void reply.redirect(redirectTo);
                    return Future.value(Result.Ok(undefined));
                  })
                  .with({ type: "Swan__FinalizeOnboarding" }, ({ onboardingId, projectId }) => {
                    // Finalize the onboarding with the received user token
                    return swan__finalizeOnboarding({ onboardingId, accessToken, projectId })
                      .mapOk(({ redirectUrl, state, accountMembershipId }) => {
                        const queryString = new URLSearchParams();
                        if (redirectUrl != undefined) {
                          const authUri = createAuthUrl({
                            scope: [],
                            redirectUri: redirectUrl,
                            state: state ?? onboardingId,
                            params: {},
                          });
                          queryString.append("redirectUrl", authUri);
                        }
                        if (accountMembershipId != undefined) {
                          queryString.append("accountMembershipId", accountMembershipId);
                        }
                        queryString.append("projectId", projectId);

                        void reply.redirect(
                          `${env.ONBOARDING_URL}/swanpopupcallback?${queryString.toString()}`,
                        );
                        return undefined;
                      })
                      .tapError(error => {
                        request.log.error(error);
                        return renderError(reply, {
                          status: 400,
                          requestId: request.id as string,
                        });
                      });
                  })
                  .with({ type: "FinalizeOnboarding" }, ({ onboardingId }) => {
                    // Finalize the onboarding with the received user token
                    return finalizeOnboarding({ onboardingId, accessToken })
                      .mapOk(({ redirectUrl, state, accountMembershipId }) => {
                        const queryString = new URLSearchParams();
                        if (redirectUrl != undefined) {
                          const authUri = createAuthUrl({
                            scope: [],
                            redirectUri: redirectUrl,
                            state: state ?? onboardingId,
                            params: {},
                          });
                          queryString.append("redirectUrl", authUri);
                        }
                        if (accountMembershipId != undefined) {
                          queryString.append("accountMembershipId", accountMembershipId);
                        }

                        void reply.redirect(
                          `${env.ONBOARDING_URL}/swanpopupcallback?${queryString.toString()}`,
                        );
                        return undefined;
                      })
                      .tapError(error => {
                        request.log.error(error);
                        return renderError(reply, {
                          status: 400,
                          requestId: request.id as string,
                        });
                      });
                  })
                  .with({ type: "BindAccountMembership" }, ({ accountMembershipId }) => {
                    return bindAccountMembership({ accountMembershipId, accessToken })
                      .mapOk(({ accountMembershipId }) => {
                        void reply.redirect(`${env.BANKING_URL}/${accountMembershipId}`);
                        return undefined;
                      })
                      .tapError(error => {
                        request.log.error(error);
                        return reply.redirect(env.BANKING_URL);
                      });
                  })
                  .with(
                    { type: "Swan__BindAccountMembership" },
                    ({ accountMembershipId, projectId }) => {
                      return swan__bindAccountMembership({
                        accountMembershipId,
                        accessToken,
                        projectId,
                      })
                        .mapOk(({ accountMembershipId }) => {
                          void reply.redirect(`${env.BANKING_URL}/${accountMembershipId}`);
                          return undefined;
                        })
                        .tapError(error => {
                          request.log.error(error);
                          return reply.redirect(env.BANKING_URL);
                        });
                    },
                  )
                  .otherwise(error => {
                    request.log.error(error);
                    void reply.redirect("/swanpopupcallback");
                    return Future.value(Result.Ok(undefined));
                  });
              },
              Error: error => {
                request.log.error(error);
                void renderError(reply, { status: 400, requestId: request.id as string });
                return Future.value(Result.Ok(undefined));
              },
            });
          },
        )
        .with({ error: P.string, errorDescription: P.string }, ({ error, errorDescription }) => {
          void renderAuthError(reply, {
            status: 400,
            description: error === "access_denied" ? "Login failed" : errorDescription,
          });
          return Future.value(undefined);
        })
        .otherwise(() => {
          void renderAuthError(reply, {
            status: 400,
            description: "Could not initiate session",
          });
          return Future.value(undefined);
        })
    );
  });

  /**
   * Clears the session
   */
  app.post("/auth/logout", async (request, reply) => {
    if (request.session.get("accessToken") == null) {
      return reply.send({ success: false });
    } else {
      request.session.delete();
      return reply.send({ success: true });
    }
  });

  /**
   * Exposes environement variables to the client apps at runtime.
   * The client simply has to load `<script src="/env.js"></script>`
   */
  app.get("/env.js", async (request, reply) => {
    const projectId = await getProjectId();
    const data = {
      SWAN_ENVIRONMENT: env.OAUTH_CLIENT_ID.startsWith("LIVE_") ? "LIVE" : "SANDBOX",
      ACCOUNT_MEMBERSHIP_INVITATION_MODE: match(sendAccountMembershipInvitation)
        .with(P.nullish, () => "LINK")
        .otherwise(() => "EMAIL"),
      BANKING_URL: env.BANKING_URL,
      SWAN_PROJECT_ID: projectId.match({
        Ok: projectId => projectId,
        Error: () => undefined,
      }),
      ...Object.fromEntries(
        Array.filterMap(Object.entries(process.env), ([key, value]) =>
          key.startsWith("CLIENT_") ? Option.Some([key, value]) : Option.None(),
        ),
      ),
    };

    return reply
      .header("Content-Type", "application/javascript")
      .header("cache-control", `public, max-age=0`)
      .send(`window.__env = ${JSON.stringify(data)};`);
  });

  app.get("/health", async (request, reply) => {
    return reply.header("cache-control", `public, max-age=0`).status(200).send({
      version: packageJson.version,
      date: new Date().toISOString(),
      env: env.NODE_ENV,
    });
  });

  if (mode === "development") {
    // in dev mode, we boot vite servers that we proxy
    // the additional ports are the ones they need for the livereload web sockets
    const { additionalPorts } = await startDevServer(app, httpsConfig);
    additionalPorts.forEach(port => ports.add(String(port)));
  } else {
    // in production, simply serve the files
    const productionRequestHandler = getProductionRequestHandler();
    app.get("/*", productionRequestHandler);
  }

  app.setErrorHandler((error, request, reply) => {
    request.log.error(error);
    // Send error response
    return renderError(reply, { status: 500, requestId: request.id as string });
  });

  return {
    app,
    ports,
  };
};
