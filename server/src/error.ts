import { HttpErrorCodes } from "@fastify/sensible/lib/httpError";
import { FastifyInstance, FastifyReply, FastifyRequest, RouteGenericInterface } from "fastify";
import fs from "node:fs";
import { Http2SecureServer, Http2ServerRequest, Http2ServerResponse } from "node:http2";
import url from "node:url";
import path from "pathe";
import { match } from "ts-pattern";

const dirname = path.dirname(url.fileURLToPath(import.meta.url));

const errorTemplate = fs.readFileSync(path.join(dirname, "views", "error.html"), "utf-8");
const authErrorTemplate = fs.readFileSync(path.join(dirname, "views", "auth-error.html"), "utf-8");

export const replyWithError = (
  app: FastifyInstance<Http2SecureServer, Http2ServerRequest, Http2ServerResponse>,
  request: FastifyRequest<RouteGenericInterface, Http2SecureServer, Http2ServerRequest>,
  reply: FastifyReply<Http2SecureServer, Http2ServerRequest, Http2ServerResponse>,
  { status, requestId }: { status: Exclude<HttpErrorCodes, string>; requestId: string },
) => {
  const accept = request.accepts();
  const type = accept.type(["json", "html"]);

  return match(type)
    .with("html", () =>
      reply
        .type("text/html")
        .status(status)
        .send(errorTemplate.replaceAll("{{REQUEST_ID}}", requestId)),
    )
    .otherwise(() => {
      const error = app.httpErrors.getHttpError(status);

      return reply
        .type("application/json")
        .status(status)
        .send({ ...error, requestId });
    });
};

export const replyWithAuthError = (
  app: FastifyInstance<Http2SecureServer, Http2ServerRequest, Http2ServerResponse>,
  request: FastifyRequest<RouteGenericInterface, Http2SecureServer, Http2ServerRequest>,
  reply: FastifyReply<Http2SecureServer, Http2ServerRequest, Http2ServerResponse>,
  { status, description }: { status: Exclude<HttpErrorCodes, string>; description: string },
) => {
  const accept = request.accepts();
  const type = accept.type(["json", "html"]);

  return match(type)
    .with("html", () =>
      reply
        .type("text/html")
        .status(status)
        .send(authErrorTemplate.replaceAll("{{description}}", description)),
    )
    .otherwise(() => {
      const error = app.httpErrors.getHttpError(status);

      return reply
        .type("application/json")
        .status(status)
        .send({ ...error, description });
    });
};
