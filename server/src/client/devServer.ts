import { RouteHandlerMethod } from "fastify";
import fs from "node:fs";
import http from "node:http";
import { Http2SecureServer } from "node:http2";
import https from "node:https";
import path from "pathe";
import { env } from "../env";
import { FastifySecureInstance } from "../types";

export type HttpsConfig = {
  key: string;
  cert: string;
};

const BANKING_HOST = new URL(env.BANKING_URL).hostname;
const ONBOARDING_HOST = new URL(env.ONBOARDING_URL).hostname;
const PAYMENT_HOST = new URL(env.PAYMENT_URL).hostname;

const apps = ["onboarding", "banking", "payment"] as const;

type AppName = (typeof apps)[number];

async function createViteDevServer(appName: AppName, httpsConfig?: HttpsConfig) {
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

export async function startDevServer(app: FastifySecureInstance, httpsConfig?: HttpsConfig) {
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

  const handler: RouteHandlerMethod<Http2SecureServer> = (request, reply) => {
    const host = new URL(`${request.protocol}://${request.hostname}`).hostname;

    switch (host) {
      case BANKING_HOST:
        return reply.from(`http://localhost:${webBanking.mainServerPort}` + request.url);
      case ONBOARDING_HOST:
        return reply.from(`http://localhost:${onboarding.mainServerPort}` + request.url);
      case PAYMENT_HOST:
        return reply.from(`http://localhost:${payment.mainServerPort}` + request.url);
      default:
        return reply
          .status(404)
          .send(
            `Unknown host: "${host}", should be either "${BANKING_HOST}", "${ONBOARDING_HOST}" or "${PAYMENT_HOST}"`,
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
