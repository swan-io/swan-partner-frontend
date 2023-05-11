import { FastifyReply } from "fastify";
import fs from "node:fs";
import { Http2SecureServer, Http2ServerRequest, Http2ServerResponse } from "node:http2";
import url from "node:url";
import path from "pathe";

const dirname = path.dirname(url.fileURLToPath(import.meta.url));

const errorTemplate = fs.readFileSync(path.join(dirname, "error.html"), "utf-8");
const authErrorTemplate = fs.readFileSync(path.join(dirname, "auth-error.html"), "utf-8");

export const renderError = (
  reply: FastifyReply<Http2SecureServer, Http2ServerRequest, Http2ServerResponse>,
  { status, requestId }: { status: number; requestId: string },
) => {
  return reply
    .status(status)
    .header("content-type", "text/html")
    .send(errorTemplate.replaceAll("{{REQUEST_ID}}", requestId));
};

export const renderAuthError = (
  reply: FastifyReply<Http2SecureServer, Http2ServerRequest, Http2ServerResponse>,
  { status, description }: { status: number; description: string },
) => {
  return reply
    .status(status)
    .header("content-type", "text/html")
    .send(authErrorTemplate.replaceAll("{{description}}", description));
};
