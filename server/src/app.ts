import cors from "@fastify/cors";
import replyFrom from "@fastify/reply-from";
import secureSession from "@fastify/secure-session";
import fastifyStatic from "@fastify/static";
import { Array, Future, Option, Result } from "@swan-io/boxed";
import fastify, { onRequestAsyncHookHandler } from "fastify";
import { randomUUID } from "node:crypto";
import { lookup } from "node:dns";
import fs from "node:fs";
import { Http2SecureServer } from "node:http2";
import path from "node:path";
import url from "node:url";
import { P, match } from "ts-pattern";
import {
  OAuth2State,
  createAuthUrl,
  getOAuth2StatePattern,
  getTokenFromCode,
  refreshAccessToken,
} from "./api/oauth2.js";
import {
  bindAccountMembership,
  finalizeOnboarding,
  getProjectId,
  onboardCompanyAccountHolder,
  onboardIndividualAccountHolder,
  parseAccountCountry,
} from "./api/partner.js";
import { HttpsConfig, startDevServer } from "./client/devServer.js";
import { getProductionRequestHandler } from "./client/prodServer.js";
import { env } from "./env.js";

const dirname = path.dirname(url.fileURLToPath(import.meta.url));

const COOKIE_MAX_AGE = 7_776_000; // 90 days
const OAUTH_STATE_COOKIE_MAX_AGE = 300; // 5 minutes

type InvitationConfig = {
  accessToken: string;
  inviteeAccountMembershipId: string;
  inviterAccountMembershipId: string;
};

type AppConfig = {
  mode: "development" | "test" | "production";
  httpsConfig?: HttpsConfig;
  sendAccountMembershipInvitation?: (config: InvitationConfig) => Promise<boolean>;
  onRequest?: onRequestAsyncHookHandler<Http2SecureServer>;
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

export const start = async ({
  mode,
  httpsConfig,
  onRequest,
  sendAccountMembershipInvitation,
}: AppConfig) => {
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
      }),
    },
  });

  /**
   * Handles the session storage in `swan_session_id`
   *
   * The session can contain the auth informations (`expiresAt`, `accessToken`, `refreshToken`).
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
   * Try to refresh the tokens if expired or expiring soon
   */
  app.addHook("preHandler", async (request, reply) => {
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
            domain: new URL(request.hostname).hostname,
            maxAge: COOKIE_MAX_AGE,
          });
          request.session.set("expiresAt", expiresAt);
          request.session.set("accessToken", accessToken);
          request.session.set("refreshToken", refreshToken);
        })
        .tapError(() => {
          request.session.delete();
          void reply.redirect("/login");
        });
    }
  });

  app.addHook("onRequest", (request, reply, done) => {
    request.accessToken = request.session.get("accessToken");
    done();
  });

  app.addHook("onRequest", function (request, reply) {
    if (onRequest != undefined) {
      return onRequest.call(this, request, reply);
    } else {
      return Promise.resolve();
    }
  });

  /**
   * Used to proxy Swan GraphQL APIs
   */
  await app.register(replyFrom);

  /**
   * Decorates the `reply` object with a `sendFile`
   */
  await app.register(fastifyStatic, {
    root: path.join(dirname, "../dist"),
    wildcard: false,
  });

  /**
   * Proxies the Swan "unauthenticated" GraphQL API.
   */
  app.post("/api/unauthenticated", (request, reply) => {
    return reply.from(env.UNAUTHENTICATED_API_URL);
  });

  /**
   * Proxies the Swan "partner" GraphQL API.
   */
  app.post("/api/partner", (request, reply) => {
    const accessToken = request.accessToken;
    if (accessToken == undefined) {
      return reply.status(401).send("Unauthorized");
    } else {
      return reply.from(env.PARTNER_API_URL, {
        rewriteRequestHeaders: (_req, headers) => ({
          ...headers,
          Authorization: `Bearer ${accessToken}`,
        }),
      });
    }
  });

  /**
   * Starts a new individual onboarding and redirects to the onboarding URL
   * e.g. /onboarding/individual/start?accountCountry=FRA
   */
  app.get<{ Querystring: Record<string, string> }>(
    "/onboarding/individual/start",
    (request, reply) => {
      const accountCountry = parseAccountCountry(request.query.accountCountry);
      Future.value(accountCountry)
        .flatMapOk(accountCountry => onboardIndividualAccountHolder({ accountCountry }))
        .tapOk(onboardingId => {
          return reply.redirect(`${env.ONBOARDING_URL}/onboardings/${onboardingId}`);
        })
        .tapError(error => {
          return reply.status(400).send(error);
        });
    },
  );

  /**
   * Starts a new company onboarding and redirects to the onboarding URL
   * e.g. /onboarding/individual/start?accountCountry=FRA
   */
  app.get<{ Querystring: Record<string, string> }>(
    "/onboarding/company/start",
    (request, reply) => {
      const accountCountry = parseAccountCountry(request.query.accountCountry);
      Future.value(accountCountry)
        .flatMapOk(accountCountry => onboardCompanyAccountHolder({ accountCountry }))
        .tapOk(onboardingId => {
          return reply.redirect(`${env.ONBOARDING_URL}/onboardings/${onboardingId}`);
        })
        .tapError(error => {
          return reply.status(400).send(error);
        });
    },
  );

  /**
   * Accept an account membership invitation
   * e.g. /invitation/:id
   */
  app.get<{ Querystring: Record<string, string>; Params: { accountMembershipId: string } }>(
    "/invitation/:accountMembershipId",
    (request, reply) => {
      const queryString = new URLSearchParams();
      queryString.append("accountMembershipId", request.params.accountMembershipId);
      return reply.redirect(`/auth/login?${queryString.toString()}`);
    },
  );

  /**
   * Send an account membership invitation
   * e.g. /invitation/:id/send?inviterAccountMembershipId=1234
   */
  app.post<{ Querystring: Record<string, string>; Params: { inviteeAccountMembershipId: string } }>(
    "/invitation/:inviteeAccountMembershipId/send",
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
          inviteeAccountMembershipId: request.params.inviteeAccountMembershipId,
          inviterAccountMembershipId,
        });
        return reply.send({ success: result });
      } catch (err) {
        return reply.status(400).send("An error occured");
      }
    },
  );

  /**
   * Builds a OAuth2 auth link and redirects to it.
   */
  app.get<{ Querystring: Record<string, string> }>("/auth/login", (request, reply) => {
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
    const state: OAuth2State = match({ onboardingId, accountMembershipId })
      .with({ onboardingId: P.string }, ({ onboardingId }) => ({
        id,
        type: "FinalizeOnboarding" as const,
        onboardingId,
      }))
      .with({ accountMembershipId: P.string }, ({ accountMembershipId }) => ({
        id,
        type: "BindAccountMembership" as const,
        accountMembershipId,
      }))
      .otherwise(() => ({ id, type: "Redirect" as const, redirectTo }));

    request.session.options({
      domain: new URL(request.hostname).hostname,
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
  app.get<{ Querystring: Record<string, string> }>("/auth/callback", (request, reply) => {
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
          ({ code, state }) => {
            getTokenFromCode({
              redirectUri: `${env.BANKING_URL}/auth/callback`,
              code,
            })
              .tapOk(({ expiresAt, accessToken, refreshToken }) => {
                // Store the tokens
                request.session.options({
                  domain: new URL(request.hostname).hostname,
                  maxAge: COOKIE_MAX_AGE,
                });
                request.session.set("expiresAt", expiresAt);
                request.session.set("accessToken", accessToken);
                request.session.set("refreshToken", refreshToken);

                return match(state)
                  .with({ type: "Redirect" }, ({ redirectTo = "/swanpopupcallback" }) => {
                    return reply.redirect(redirectTo);
                  })
                  .with({ type: "FinalizeOnboarding" }, ({ onboardingId }) => {
                    // Finalize the onboarding with the received user token
                    finalizeOnboarding({ onboardingId, accessToken })
                      .tapOk(({ redirectUrl, state, accountMembershipId }) => {
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

                        return reply.redirect(
                          `${env.ONBOARDING_URL}/swanpopupcallback?${queryString.toString()}`,
                        );
                      })
                      .tapError(error => {
                        request.log.error(error);
                        return reply.status(400).send("An error occured");
                      });
                  })
                  .with({ type: "BindAccountMembership" }, ({ accountMembershipId }) => {
                    bindAccountMembership({ accountMembershipId, accessToken })
                      .tapOk(({ accountMembershipId }) => {
                        return reply.redirect(`${env.BANKING_URL}/${accountMembershipId}`);
                      })
                      .tapError(error => {
                        request.log.error(error);
                        return reply.redirect(env.BANKING_URL);
                      });
                  })
                  .otherwise(error => {
                    request.log.error(error);
                    return reply.redirect("/swanpopupcallback");
                  });
              })
              .tapError(error => {
                request.log.error(error);
                return reply.status(401).send("An error occured");
              });
          },
        )
        .with({ error: P.string, errorDescription: P.string }, ({ error, errorDescription }) => {
          return reply.header("Content-Type", "text/html").status(400).send(`
        <style>html { font-family: sans-serif; }</style>
        <h1>Error: ${error}</h1>
        <p>Error: ${errorDescription}</p>`);
        })
        .otherwise(() => {
          return reply.status(400).send("Invalid `code` or `state`");
        })
    );
  });

  /**
   * Clears the session
   */
  app.post("/auth/logout", (request, reply) => {
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
      GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
      ACCOUNT_MEMBERSHIP_INVITATION_MODE: match(sendAccountMembershipInvitation)
        .with(P.nullish, () => "LINK")
        .otherwise(() => "EMAIL"),
      SWAN_PROJECT_ID: projectId.match({
        Ok: projectId => projectId,
        Error: () => undefined,
      }),
      ...Object.fromEntries(
        Array.keepMap(Object.entries(process.env), ([key, value]) =>
          key.startsWith("CLIENT_") ? Option.Some([key, value]) : Option.None(),
        ),
      ),
    };

    return reply
      .header("Content-Type", "application/javascript")
      .header("cache-control", `public, max-age=0`)
      .send(`window.__env = ${JSON.stringify(data)};`);
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
    console.error(error);
    // Send error response
    return reply.status(500).send({ ok: false });
  });

  return {
    app,
    ports,
  };
};
