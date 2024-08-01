import { FastifyReply, RouteHandlerMethod } from "fastify";
import { Http2SecureServer } from "http2";
import fs, { Stats } from "node:fs";
import path from "pathe";
import { env } from "../env";

const staticPath = path.join(__dirname, "../static");

const yearInSeconds = 31536000;
const yearInMilliseconds = yearInSeconds * 1000;

// The following isn't really elegant, but `fastify-static` doesn't provide any
// compelling way to manage the fallback index.html when routing using the
// request host.
const handleRequest = async (
  reqPath: string,
  appName: string,
  reply: FastifyReply<Http2SecureServer>,
) => {
  const isStaticAsset = reqPath.startsWith("assets/") || reqPath.includes(".manager.bundle.js");
  const handleRequest = async (err: NodeJS.ErrnoException | null, stat: Stats) => {
    if (err == null && stat.isFile()) {
      if (isStaticAsset) {
        // Cache for a year if the file exists
        void reply.header("cache-control", `public, max-age=${yearInSeconds}, immutable`);
        const date = new Date();
        date.setTime(date.getTime() + yearInMilliseconds);
        void reply.header("expires", date.toUTCString());
      }
      return reply.sendFile(reqPath, path.join(staticPath, appName));
    } else {
      // Prevents having old HTMLs in cache referencing assets that
      // do not longer exist in its files
      void reply.header("cache-control", `private, max-age=0`);
      if (isStaticAsset) {
        return reply.sendFile(reqPath, path.join(staticPath, appName));
      } else {
        // Fallback to `index.html` *only* if the file isn't a static asset
        return reply.sendFile("/index.html", path.join(staticPath, appName));
      }
    }
  };

  fs.stat(path.join(staticPath, appName, reqPath), (err, stat) => void handleRequest(err, stat));
};

export function getProductionRequestHandler() {
  const BANKING_HOST = new URL(env.BANKING_URL).hostname;
  const ONBOARDING_HOST = new URL(env.ONBOARDING_URL).hostname;
  const PAYMENT_HOST = new URL(env.PAYMENT_URL).hostname;

  const handler: RouteHandlerMethod<Http2SecureServer> = (request, reply) => {
    const host = new URL(`${request.protocol}://${request.hostname}`).hostname;
    const params = request.params as Record<string, string>;

    const reqPath = params["*"] ?? "index.html";
    if (reqPath.includes("..")) {
      return reply.code(404).send("404");
    }
    switch (host) {
      case BANKING_HOST:
        void handleRequest(reqPath, "banking", reply);
        break;
      case ONBOARDING_HOST:
        void handleRequest(reqPath, "onboarding", reply);
        break;
      case PAYMENT_HOST:
        void handleRequest(reqPath, "payment", reply);
        break;
      default:
        return reply.code(404).send("404");
    }
  };

  return handler;
}
