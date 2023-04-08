import { FastifyReply } from "fastify";
import fs from "node:fs";
import { Http2SecureServer, Http2ServerRequest, Http2ServerResponse } from "node:http2";
import path from "node:path";
import url from "node:url";

const dirname = path.dirname(url.fileURLToPath(import.meta.url));

const template = fs.readFileSync(path.join(dirname, "error.html"), "utf-8");

export const renderError = (
  reply: FastifyReply<Http2SecureServer, Http2ServerRequest, Http2ServerResponse>,
  { status, requestId }: { status: number; requestId: string },
) => {
  return reply
    .status(status)
    .header("content-type", "text/html")
    .send(template.replace("{{REQUEST_ID}}", requestId));
};
