import fastProxy from "fast-proxy";
import { FastifyInstance, RouteHandlerMethod } from "fastify";
import fs from "node:fs";
import http, { IncomingMessage, ServerResponse } from "node:http";
import { Http2SecureServer } from "node:http2";
import https from "node:https";
import path from "pathe";
import { env } from "../env";

export type HttpsConfig = {
  key: string;
  cert: string;
};

async function createViteDevServer(appName: string, httpsConfig?: HttpsConfig) {
  const liveReloadServer =
    httpsConfig != null ? https.createServer(httpsConfig) : http.createServer();
  const { createServer } = await import("vite");
  const { default: getPort } = await import("get-port");
  const mainServerPort = await getPort();
  const liveReloadServerPort = await getPort();
  liveReloadServer.listen(liveReloadServerPort);

  const server = await createServer({
    configFile: path.resolve(process.cwd(), "clients", appName, "vite.config.js"),
    server: {
      port: mainServerPort,
      hmr: {
        server: liveReloadServer,
        port: liveReloadServerPort,
      },
    },
  });

  await server.listen();

  return { mainServerPort, liveReloadServerPort };
}

const apps = ["onboarding", "banking", "payment"] as const;

const BANKING_HOST = new URL(env.BANKING_URL).hostname;
const ONBOARDING_HOST = new URL(env.ONBOARDING_URL).hostname;
const PAYMENT_HOST = new URL(env.PAYMENT_URL).hostname;

export async function startDevServer(
  app: FastifyInstance<Http2SecureServer>,
  httpsConfig?: HttpsConfig,
) {
  const [onboarding, webBanking, payment] = await Promise.all(
    apps.map(app => {
      return createViteDevServer(
        app,
        httpsConfig != null
          ? {
              key: fs.readFileSync(httpsConfig.key, "utf8"),
              cert: fs.readFileSync(httpsConfig.cert, "utf8"),
            }
          : undefined,
      );
    }),
  );

  if (onboarding == null || webBanking == null || payment == null) {
    console.error("Failed to start dev servers");
    process.exit(1);
  }

  const { proxy: webBankingProxy } = fastProxy({
    base: `http://localhost:${webBanking.mainServerPort}`,
  });
  const { proxy: onboardingProxy } = fastProxy({
    base: `http://localhost:${onboarding.mainServerPort}`,
  });
  const { proxy: paymentProxy } = fastProxy({
    base: `http://localhost:${payment.mainServerPort}`,
  });
  const handler: RouteHandlerMethod<Http2SecureServer> = (request, reply) => {
    const host = new URL(`${request.protocol}://${request.hostname}`).hostname;

    switch (host) {
      case BANKING_HOST:
        return webBankingProxy(
          request.raw as unknown as IncomingMessage,
          reply.raw as unknown as ServerResponse,
          request.url,
          {},
        );
      case ONBOARDING_HOST:
        return onboardingProxy(
          request.raw as unknown as IncomingMessage,
          reply.raw as unknown as ServerResponse,
          request.url,
          {},
        );
      case PAYMENT_HOST:
        return paymentProxy(
          request.raw as unknown as IncomingMessage,
          reply.raw as unknown as ServerResponse,
          request.url,
          {},
        );
      default:
        return reply
          .status(404)
          .send(
            `Unknown host: "${host}", should be either "${BANKING_HOST}", "${ONBOARDING_HOST} or "${PAYMENT_HOST}"`,
          );
    }
  };

  app.get("/*", handler);
  app.post("/*", handler);

  const additionalPorts = new Set([
    onboarding.liveReloadServerPort,
    webBanking.liveReloadServerPort,
  ]);

  return { additionalPorts };
}
