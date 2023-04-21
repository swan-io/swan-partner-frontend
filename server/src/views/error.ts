import { FastifyReply } from "fastify";
import fs from "node:fs";
import { Http2SecureServer, Http2ServerRequest, Http2ServerResponse } from "node:http2";
import path from "node:path";

const errorTemplate = fs.readFileSync(path.join(__dirname, "error.html"), "utf-8");
const authErrorTemplate = fs.readFileSync(path.join(__dirname, "auth-error.html"), "utf-8");

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
