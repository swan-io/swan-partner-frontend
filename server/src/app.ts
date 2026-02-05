import accepts from "@fastify/accepts";
import cors from "@fastify/cors";
import fastifyHelmet from "@fastify/helmet";
import middie from "@fastify/middie";
import replyFrom from "@fastify/reply-from";
import secureSession from "@fastify/secure-session";
import sensible, { HttpErrorCodes } from "@fastify/sensible";
import fastifyStatic from "@fastify/static";
import fastifyView from "@fastify/view";
import { Array, Future, Option, Result } from "@swan-io/boxed";
import fastify, { FastifyReply } from "fastify";
import mustache from "mustache";
import { randomUUID } from "node:crypto";
import { lookup } from "node:dns";
import fs from "node:fs";
import path from "pathe";
import { P, match } from "ts-pattern";
import {
  OAuth2State,
  createAuthUrl,
  getOAuth2StatePattern,
  getTokenFromCode,
  refreshAccessToken,
} from "./api/oauth2";
import {
  UnsupportedAccountCountryError,
  bindAccountMembership,
  createPublicCompanyAccountHolderOnboarding,
  createPublicIndividualAccountHolderOnboarding,
  finalizeOnboarding,
  finalizeOnboardingV2,
  getProjectId,
  parseAccountCountry,
} from "./api/partner";
import {
  swan__bindAccountMembership,
  swan__finalizeOnboarding,
  swan__finalizeOnboardingV2,
} from "./api/partner.swan";
import {
  OnboardingRejectionError,
  getOnboardingOAuthClientId,
  onboardCompanyAccountHolder,
  onboardIndividualAccountHolder,
} from "./api/unauthenticated";
import { startDevServer } from "./client/devServer";
import { getProductionRequestHandler } from "./client/prodServer";
import { env } from "./env";
import { replyWithAuthError, replyWithError } from "./error";
import { getTgglClient } from "./utils/tggl";

const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../package.json"), "utf-8"),
) as { version: string };

const keysPath = path.join(__dirname, "../keys");

const keys = {
  key: path.join(keysPath, "_wildcard.swan.local-key.pem"),
  cert: path.join(keysPath, "_wildcard.swan.local.pem"),
};

const COOKIE_MAX_AGE = 60 * (env.NODE_ENV !== "test" ? 5 : 60); // 5 minutes (except for tests)
const OAUTH_STATE_COOKIE_MAX_AGE = 900; // 15 minutes

export type InvitationConfig = {
  accessToken: string;
  inviteeAccountMembershipId: string;
  inviterAccountMembershipId: string;
  language: string;
};

type AppConfig = {
  allowedCorsOrigins?: string[];
  sendAccountMembershipInvitation?: (config: InvitationConfig) => Promise<unknown>;
};

declare module "@fastify/secure-session" {
  interface SessionData {
    expiresAt: number;
    accessToken: string;
    refreshToken: string;
    state: string;
  }
}

declare module "fastify" {
  interface FastifyRequest {
    accessToken: string | undefined;
    config: {
      unauthenticatedApiUrl: string;
      partnerApiUrl: string;
      clientId: string;
      clientSecret: string;
    };
  }
}

export const appNames = ["banking", "onboarding", "payment"] as const;

export type AppName = (typeof appNames)[number];

const URLS = {
  BANKING: new URL(env.BANKING_URL),
  ONBOARDING: new URL(env.ONBOARDING_URL),
  PAYMENT: new URL(env.PAYMENT_URL),
};

export const getAppNameByHostName = (hostname: string): AppName | undefined => {
  switch (hostname) {
    case URLS.BANKING.hostname:
      return "banking";
    case URLS.ONBOARDING.hostname:
      return "onboarding";
    case URLS.PAYMENT.hostname:
      return "payment";
  }
};

const getPort = (url: URL) =>
  url.port === "" ? (url.protocol === "https:" ? "443" : "80") : url.port;

const ports = new Set([getPort(URLS.BANKING), getPort(URLS.ONBOARDING), getPort(URLS.PAYMENT)]);

type Reply = FastifyReply | Promise<FastifyReply>;

const assertIsBoundToLocalhost = (host: string) => {
  return new Promise((resolve, reject) => {
    lookup(host, { family: 4 }, (err, address) => {
      if (err != null || address !== "127.0.0.1") {
        reject(
          new Error(`${host} isn't bound to localhost, did you setup your /etc/hosts correctly?`),
        );
      }
      resolve(true);
    });
  });
};

export const start = async ({
  sendAccountMembershipInvitation,
  allowedCorsOrigins = [],
}: AppConfig) => {
  if (env.NODE_ENV === "development") {
    try {
      await Promise.all([
        assertIsBoundToLocalhost(URLS.BANKING.hostname),
        assertIsBoundToLocalhost(URLS.ONBOARDING.hostname),
        assertIsBoundToLocalhost(URLS.PAYMENT.hostname),
      ]);
    } catch (err) {
      console.error(err);
      process.exit(1);
    }

    if (env.NODE_ENV === "development") {
      if (!fs.statSync(keys.key).isFile()) {
        console.error("Missing HTTPS key, did you generate it in `server/keys`?");
        process.exit(1);
      }

      if (!fs.statSync(keys.cert).isFile()) {
        console.error("Missing HTTPS cert, did you generate it in `server/keys`?");
        process.exit(1);
      }
    }
  }

  const app = fastify({
    trustProxy: true,
    // To emulate secure cookies, we use HTTPS locally but expose HTTP in production
    ...(env.NODE_ENV === "development" && {
      https: {
        key: fs.readFileSync(keys.key, "utf-8"),
        cert: fs.readFileSync(keys.cert, "utf-8"),
      },
    }),
    logger: {
      level: env.LOG_LEVEL,
      formatters: {
        level(label) {
          return { level: label };
        },
      },
      ...(env.NODE_ENV === "development" && {
        transport: {
          target: "pino-pretty",
          options: { colorize: true },
        },
      }),
    },
    requestIdHeader: "x-swan-request-id",
    genReqId: () => `req-${randomUUID()}`,
  });

  /**
   * Adds some useful utilities to your Fastify instance
   */
  await app.register(accepts);
  await app.register(middie);
  await app.register(sensible);

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
      secure: env.BANKING_URL.startsWith("https"),
      httpOnly: true,
      domain: `.${new URL(env.BANKING_URL).hostname}`,
    },
  });

  await app.register(fastifyHelmet, {
    crossOriginOpenerPolicy: {
      policy: "unsafe-none",
    },
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["*", "data:", "blob:", "'unsafe-inline'"],
        frameAncestors: ["'self'", env.BANKING_URL],
      },
    },
  });

  const corsOptions = {
    origin: [
      URLS.BANKING.origin,
      URLS.ONBOARDING.origin,
      URLS.PAYMENT.origin,
      ...allowedCorsOrigins,
    ],
    credentials: true,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
  };

  /**
   * The onboarding uses `BANKING_URL` as API root so that session is preserved
   * when the onboarding flow completes with the OAuth2 flow
   */
  await app.register(cors, corsOptions);

  /**
   * View engine for pretty error rendering
   */
  await app.register(fastifyView, {
    engine: {
      mustache,
    },
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

      if (typeof refreshToken === "string" && expiresAt < Date.now() + TEN_SECONDS) {
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
              refreshToken: P.nonNullable,
              expiresAt: P.nonNullable,
              accessToken: P.nonNullable,
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

  app.addHook("onRequest", (request, _reply, done) => {
    request.accessToken = request.session.get("accessToken");
    done();
  });

  app.addHook("onRequest", (request, reply, done) => {
    if (request.url.startsWith("/api/") || request.url.startsWith("/auth/")) {
      void reply.header("cache-control", "private, max-age=0");
    }
    done();
  });

  /**
   * Used to proxy Swan GraphQL APIs
   */
  await app.register(replyFrom, {
    http: {},
  });

  /**
   * Decorates the `reply` object with a `sendFile`
   */
  if (env.NODE_ENV === "production") {
    await app.register(fastifyStatic, {
      root: path.join(__dirname, "./static"),
      wildcard: false,
    });
  } else {
    const root = path.resolve(__dirname, "../..");

    for (const url of Object.values(URLS)) {
      const appName = getAppNameByHostName(url.hostname);

      if (appName != null) {
        await app.register(fastifyStatic, {
          constraints: { host: url.host },
          root: path.join(root, "clients", appName, "public"),
          wildcard: false,
          decorateReply: false,
        });
      }
    }
  }

  /**
   * An no-op to extend the cookie duration.
   */
  app.post("/api/ping", async (_request, reply) => {
    return reply.header("cache-control", "private, max-age=0").status(200).send({
      ok: true,
    });
  });

  /**
   * Proxies the Swan "unauthenticated" GraphQL API.
   */
  app.post("/api/unauthenticated", async (_request, reply) => {
    return reply.from(env.UNAUTHENTICATED_API_URL);
  });

  /**
   * Proxies the Swan "partner" GraphQL API.
   */
  app.post("/api/partner", async (request, reply) => {
    return reply.from(env.PARTNER_API_URL, {
      rewriteRequestHeaders: (_req, headers) => ({
        ...headers,
        ...(request.accessToken != null
          ? { Authorization: `Bearer ${request.accessToken}` }
          : undefined),
      }),
    });
  });

  /**
   * Proxies the Swan "partner-admin" GraphQL API.
   */
  app.post("/api/partner-admin", async (request, reply) => {
    return reply.from(env.PARTNER_ADMIN_API_URL, {
      rewriteRequestHeaders: (_req, headers) => ({
        ...headers,
        ...(request.accessToken != null
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
        .flatMapOk(({ accountCountry, projectId }) => {
          const tgglClient = getTgglClient(projectId);
          const isOnboardingV2 = tgglClient.get("OnboardingV2NoCode", false);
          request.log.info(`#isOnboardingV2 ${isOnboardingV2}`);
          if (isOnboardingV2) {
            return createPublicIndividualAccountHolderOnboarding({
              accountCountry,
              projectId,
            });
          } else {
            return onboardIndividualAccountHolder({ accountCountry, projectId });
          }
        })
        .tapOk(onboardingId => {
          return reply
            .header("cache-control", "private, max-age=0")
            .redirect(`${env.ONBOARDING_URL}/onboardings/${onboardingId}`);
        })
        .tapError(error => {
          match(error)
            .with(
              P.instanceOf(UnsupportedAccountCountryError),
              P.instanceOf(OnboardingRejectionError),
              error => request.log.warn(error),
            )
            .otherwise(error => request.log.error(error));

          return replyWithError(app, request, reply, {
            status: 400,
            requestId: String(request.id),
          });
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
        .flatMapOk(({ accountCountry, projectId }) => {
          const tgglClient = getTgglClient(projectId);
          const isOnboardingV2 = tgglClient.get("OnboardingV2NoCode", false);
          request.log.info(`#isOnboardingV2 ${isOnboardingV2}`);
          if (isOnboardingV2) {
            return createPublicCompanyAccountHolderOnboarding({ accountCountry, projectId });
          } else {
            return onboardCompanyAccountHolder({ accountCountry, projectId });
          }
        })
        .tapOk(onboardingId => {
          return reply
            .header("cache-control", "private, max-age=0")
            .redirect(`${env.ONBOARDING_URL}/onboardings/${onboardingId}`);
        })
        .tapError(error => {
          match(error)
            .with(
              P.instanceOf(UnsupportedAccountCountryError),
              P.instanceOf(OnboardingRejectionError),
              error => request.log.warn(error),
            )
            .otherwise(error => request.log.error(error));

          return replyWithError(app, request, reply, {
            status: 400,
            requestId: String(request.id),
          });
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
   * e.g. /api/invitation/:inviteeAccountMembershipId/send?inviterAccountMembershipId=1234&lang=en
   */
  app.post<{
    Params: { inviteeAccountMembershipId: string };
    Querystring: Record<string, string>;
  }>("/api/invitation/:inviteeAccountMembershipId/send", async (request, reply) => {
    const accessToken = request.accessToken;

    if (accessToken == null) {
      return reply.status(401).send("Unauthorized");
    }
    if (sendAccountMembershipInvitation == null) {
      return reply.status(400).send("Not implemented");
    }

    const { inviterAccountMembershipId, lang = "en" } = request.query;

    if (inviterAccountMembershipId == null) {
      return reply.status(400).send("Missing inviterAccountMembershipId");
    }

    try {
      const result = await sendAccountMembershipInvitation({
        accessToken,
        inviteeAccountMembershipId: request.params.inviteeAccountMembershipId,
        inviterAccountMembershipId,
        language: lang,
      });
      return reply.send({ success: result });
    } catch (err) {
      request.log.error(err);

      return replyWithError(app, request, reply, {
        status: 400,
        requestId: String(request.id),
      });
    }
  });

  /**
   * Builds a OAuth2 auth link and redirects to it.
   */
  app.get<{ Querystring: Record<string, string> }>("/auth/login", async (request, reply) => {
    const {
      redirectTo,
      scope = "",
      onboardingId,
      onboardingV2,
      accountMembershipId,
      identificationLevel,
      projectId,
      email,
      phoneNumber,
    } = request.query;
    if (typeof redirectTo === "string") {
      const hostUrl = new URL(env.BANKING_URL);
      const url = new URL(redirectTo, hostUrl);
      if (url.host !== hostUrl.host) {
        return reply.status(403).send("Invalid `redirectTo` param");
      }
    }

    const id = randomUUID();

    // If provided with an `onboardingId`, it means that the callback should end up
    // finalizing the onboarding, otherwise do a simple redirection
    const state: OAuth2State = match({ onboardingId, onboardingV2, accountMembershipId, projectId })
      // Internal usage only
      .with(
        { onboardingV2: "true", onboardingId: P.string, projectId: P.string },
        ({ onboardingId, projectId }) => ({
          id,
          type: "Swan__FinalizeOnboardingV2" as const,
          onboardingId,
          projectId,
        }),
      )
      .with({ onboardingV2: "true", onboardingId: P.string }, ({ onboardingId }) => ({
        id,
        type: "FinalizeOnboardingV2" as const,
        onboardingId,
      }))
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
        scope: scope.split(" ").filter(item => item != null && item !== ""),
        params: {
          ...(email != null ? { email } : null),
          ...(phoneNumber != null ? { phoneNumber } : null),
          ...(onboardingId != null ? { onboardingId } : null),
          ...(identificationLevel != null ? { identificationLevel } : null),
          ...(projectId != null ? { projectId } : null),
          ...(accountMembershipId != null ? { accountMembershipId } : null),
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
    const state = Result.fromExecution<unknown>(() =>
      JSON.parse(request.query.state ?? "{}"),
    ).getOr({});

    const stateId = request.session.get("state") ?? "UNKNOWN";

    return (
      match({
        code: request.query.code,
        state,
        error: request.query.error,
        errorDescription: request.query.error_description,
      })
        .returnType<Reply>()
        // check `state` against the session saved one, to prevent Cross Site Request Forgery attacks
        .with(
          { code: P.string, state: getOAuth2StatePattern(stateId) },
          async ({ code, state }) => {
            const token = await getTokenFromCode({
              redirectUri: `${env.BANKING_URL}/auth/callback`,
              code,
            });

            return token.match<Reply>({
              Ok: ({ expiresAt, accessToken, refreshToken }) => {
                // Store the tokens
                request.session.options({
                  maxAge: COOKIE_MAX_AGE,
                });

                request.session.set("expiresAt", expiresAt);
                request.session.set("accessToken", accessToken);
                request.session.set("refreshToken", refreshToken);

                return match(state)
                  .returnType<Reply>()
                  .with({ type: "Redirect" }, ({ redirectTo = "/" }) => {
                    return reply.redirect(redirectTo);
                  })
                  .with({ type: "Swan__FinalizeOnboardingV2" }, ({ onboardingId, projectId }) => {
                    const onboardingOAuthClientId = getOnboardingOAuthClientId({ onboardingId });

                    // Finalize the onboarding with the received user token
                    return onboardingOAuthClientId
                      .flatMapOk(({ onboardingInfo }) =>
                        swan__finalizeOnboardingV2({ onboardingId, accessToken, projectId }).mapOk(
                          payload => ({
                            ...payload,
                            oAuthClientId: onboardingInfo?.projectInfo?.oAuthClientId ?? undefined,
                          }),
                        ),
                      )
                      .toPromise()
                      .then(result => {
                        return result.match<Reply>({
                          Ok: ({ redirectUrl, state, accountMembershipId, oAuthClientId }) => {
                            if (redirectUrl != null) {
                              const redirectHost = new URL(redirectUrl).hostname;

                              // When onboarding from the dashboard, we don't yet have a OAuth2 client,
                              // so we bypass the second OAuth2 link.
                              if (
                                redirectHost ===
                                URLS.BANKING.hostname.replace("banking.", "dashboard.")
                              ) {
                                return reply.redirect(redirectUrl);
                              } else {
                                const authUri = createAuthUrl({
                                  oAuthClientId,
                                  scope: [],
                                  redirectUri: redirectUrl,
                                  state: state ?? onboardingId,
                                  params: {},
                                });

                                return reply.redirect(authUri);
                              }
                            }

                            return reply.redirect(
                              `${env.BANKING_URL}/projects/${projectId}/${accountMembershipId}/activation`,
                            );
                          },
                          Error: error => {
                            request.log.error(error);

                            return replyWithError(app, request, reply, {
                              status: 400,
                              requestId: String(request.id),
                            });
                          },
                        });
                      });
                  })
                  .with({ type: "FinalizeOnboardingV2" }, ({ onboardingId }) => {
                    // Finalize the onboarding with the received user token
                    return finalizeOnboardingV2({ onboardingId, accessToken })
                      .toPromise()
                      .then(result => {
                        return result.match<Reply>({
                          Ok: ({ redirectUrl, state, accountMembershipId }) => {
                            if (redirectUrl != null) {
                              const authUri = createAuthUrl({
                                scope: [],
                                redirectUri: redirectUrl,
                                state: state ?? onboardingId,
                                params: {},
                              });

                              return reply.redirect(authUri);
                            }

                            return reply.redirect(
                              `${env.BANKING_URL}/${accountMembershipId}/activation`,
                            );
                          },
                          Error: error => {
                            request.log.error(error);

                            return replyWithError(app, request, reply, {
                              status: 400,
                              requestId: String(request.id),
                            });
                          },
                        });
                      });
                  })
                  .with({ type: "Swan__FinalizeOnboarding" }, ({ onboardingId, projectId }) => {
                    const onboardingOAuthClientId = getOnboardingOAuthClientId({ onboardingId });

                    // Finalize the onboarding with the received user token
                    return onboardingOAuthClientId
                      .flatMapOk(({ onboardingInfo }) =>
                        swan__finalizeOnboarding({ onboardingId, accessToken, projectId }).mapOk(
                          payload => ({
                            ...payload,
                            oAuthClientId: onboardingInfo?.projectInfo?.oAuthClientId ?? undefined,
                          }),
                        ),
                      )
                      .toPromise()
                      .then(result => {
                        return result.match<Reply>({
                          Ok: ({ redirectUrl, state, accountMembershipId, oAuthClientId }) => {
                            if (redirectUrl != null) {
                              const redirectHost = new URL(redirectUrl).hostname;

                              // When onboarding from the dashboard, we don't yet have a OAuth2 client,
                              // so we bypass the second OAuth2 link.
                              if (
                                redirectHost ===
                                URLS.BANKING.hostname.replace("banking.", "dashboard.")
                              ) {
                                return reply.redirect(redirectUrl);
                              } else {
                                const authUri = createAuthUrl({
                                  oAuthClientId,
                                  scope: [],
                                  redirectUri: redirectUrl,
                                  state: state ?? onboardingId,
                                  params: {},
                                });

                                return reply.redirect(authUri);
                              }
                            }

                            return reply.redirect(
                              `${env.BANKING_URL}/projects/${projectId}/${accountMembershipId}/activation`,
                            );
                          },
                          Error: error => {
                            request.log.error(error);

                            return replyWithError(app, request, reply, {
                              status: 400,
                              requestId: String(request.id),
                            });
                          },
                        });
                      });
                  })
                  .with({ type: "FinalizeOnboarding" }, ({ onboardingId }) => {
                    // Finalize the onboarding with the received user token
                    return finalizeOnboarding({ onboardingId, accessToken })
                      .toPromise()
                      .then(result => {
                        return result.match<Reply>({
                          Ok: ({ redirectUrl, state, accountMembershipId }) => {
                            if (redirectUrl != null) {
                              const authUri = createAuthUrl({
                                scope: [],
                                redirectUri: redirectUrl,
                                state: state ?? onboardingId,
                                params: {},
                              });

                              return reply.redirect(authUri);
                            }

                            return reply.redirect(
                              `${env.BANKING_URL}/${accountMembershipId}/activation`,
                            );
                          },
                          Error: error => {
                            request.log.error(error);

                            return replyWithError(app, request, reply, {
                              status: 400,
                              requestId: String(request.id),
                            });
                          },
                        });
                      });
                  })
                  .with({ type: "BindAccountMembership" }, ({ accountMembershipId }) => {
                    return bindAccountMembership({ accountMembershipId, accessToken })
                      .toPromise()
                      .then(result => {
                        return result.match<Reply>({
                          Ok: ({ accountMembershipId }) => {
                            return reply.redirect(`${env.BANKING_URL}/${accountMembershipId}`);
                          },
                          Error: error => {
                            request.log.error(error);
                            return reply.redirect(env.BANKING_URL);
                          },
                        });
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
                        .toPromise()
                        .then(result => {
                          return result.match<Reply>({
                            Ok: ({ accountMembershipId }) => {
                              return reply.redirect(
                                `${env.BANKING_URL}/projects/${projectId}/${accountMembershipId}`,
                              );
                            },
                            Error: error => {
                              request.log.error(error);
                              return reply.redirect(env.BANKING_URL);
                            },
                          });
                        });
                    },
                  )
                  .otherwise(error => {
                    request.log.error(error);
                    return reply.redirect(env.BANKING_URL);
                  });
              },
              Error: error => {
                request.log.error(error);

                return replyWithError(app, request, reply, {
                  status: 400,
                  requestId: String(request.id),
                });
              },
            });
          },
        )
        .with({ error: P.string, errorDescription: P.string }, ({ error, errorDescription }) => {
          return replyWithAuthError(app, request, reply, {
            status: 400,
            description: error === "access_denied" ? "Login failed" : errorDescription,
          });
        })
        .otherwise(() => {
          return replyWithAuthError(app, request, reply, {
            status: 400,
            description: "Could not initiate session",
          });
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
   * Log request issue to mezmo
   */
  app.post("/api/errors/report", async (request, reply) => {
    const success = Option.fromNullable(request.body)
      .flatMap(body => (typeof body === "string" ? Option.Some(body) : Option.None()))
      .toResult("Invalid body")
      .flatMap(body => Result.fromExecution(() => JSON.parse(body) as unknown))
      .tapOk(body => {
        request.log.warn({
          name: "ClientSideError",
          contents: body,
        });
      })
      .isOk();

    return reply.send({ success });
  });

  /**
   * Exposes environement variables to the client apps at runtime.
   * The client simply has to load `<script src="/env.js"></script>`
   */
  app.get("/env.js", async (_request, reply) => {
    const projectId = await getProjectId();
    const data = {
      VERSION: packageJson.version,
      SWAN_ENVIRONMENT:
        process.env.SWAN_ENVIRONMENT ??
        (env.OAUTH_CLIENT_ID.startsWith("LIVE_") ? "LIVE" : "SANDBOX"),
      ACCOUNT_MEMBERSHIP_INVITATION_MODE: match(sendAccountMembershipInvitation)
        .with(P.nullish, () => "LINK")
        .otherwise(() => "EMAIL"),
      TGGL_API_KEY: process.env.TGGL_API_KEY,
      BANKING_URL: env.BANKING_URL,
      PAYMENT_URL: env.PAYMENT_URL,
      SWAN_PROJECT_ID: projectId.match({
        Ok: projectId => projectId,
        Error: () => undefined,
      }),
      IS_SWAN_MODE: projectId.match({
        Ok: () => false,
        Error: () => true,
      }),
      ...Object.fromEntries(
        Array.filterMap(Object.entries(process.env), ([key, value]) =>
          key.startsWith("CLIENT_") ? Option.Some([key, value]) : Option.None(),
        ),
      ),
    };

    return reply
      .header("Content-Type", "application/javascript")
      .header("cache-control", "public, max-age=0")
      .send(`window.__env = ${JSON.stringify(data)};`);
  });

  app.get("/health", async (_request, reply) => {
    return reply.header("cache-control", "private, max-age=0").status(200).send({
      version: packageJson.version,
      date: new Date().toISOString(),
      env: env.NODE_ENV,
    });
  });

  if (env.NODE_ENV !== "production") {
    // in dev mode, we boot vite servers that we proxy
    // the additional ports are the ones they need for the livereload web sockets
    await startDevServer(app, corsOptions);
  } else {
    // in production, simply serve the files
    const productionRequestHandler = getProductionRequestHandler();
    app.get("/*", productionRequestHandler);
  }

  app.setErrorHandler((error, request, reply) => {
    request.log.error(error);

    const statusCode = error.statusCode as Exclude<HttpErrorCodes, string>;

    // Send error response
    return replyWithError(app, request, reply, {
      status: statusCode ?? 500,
      requestId: String(request.id),
    });
  });

  return {
    app,
    ports,
  };
};
