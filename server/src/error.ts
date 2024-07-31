import { HttpErrorCodes } from "@fastify/sensible/lib/httpError";
import { Accepts } from "accepts";
import escapeHtml from "escape-html";
import { FastifyInstance, FastifyReply, FastifyRequest, RouteGenericInterface } from "fastify";
import fs from "node:fs";
import { Http2SecureServer, Http2ServerRequest, Http2ServerResponse } from "node:http2";
import path from "pathe";
import { match } from "ts-pattern";

const viewsPath = path.join(__dirname, "views");
const errorTemplate = fs.readFileSync(path.join(viewsPath, "error.html"), "utf-8");
const authErrorTemplate = fs.readFileSync(path.join(viewsPath, "auth-error.html"), "utf-8");

const getAcceptType = (accept: Accepts): "html" | "json" => {
  const type = accept.type(["html", "json"]);

  return match(Array.isArray(type) ? type[0] : type)
    .with("json", value => value)
    .otherwise(() => "html");
};

export const replyWithError = (
  app: FastifyInstance<Http2SecureServer, Http2ServerRequest, Http2ServerResponse>,
  request: FastifyRequest<RouteGenericInterface, Http2SecureServer, Http2ServerRequest>,
  reply: FastifyReply<Http2SecureServer, Http2ServerRequest, Http2ServerResponse>,
  { status, requestId }: { status: Exclude<HttpErrorCodes, string>; requestId: string },
) => {
  const accept = request.accepts();

  return match(getAcceptType(accept))
    .with("json", () => {
      const error = app.httpErrors.getHttpError(status);

      return reply
        .type("application/json")
        .status(status)
        .send({ ...error, requestId });
    })
    .otherwise(() => {
      return reply
        .type("text/html")
        .status(status)
        .send(errorTemplate.replaceAll("{{REQUEST_ID}}", escapeHtml(requestId)));
    });
};

export const replyWithAuthError = (
  app: FastifyInstance<Http2SecureServer, Http2ServerRequest, Http2ServerResponse>,
  request: FastifyRequest<RouteGenericInterface, Http2SecureServer, Http2ServerRequest>,
  reply: FastifyReply<Http2SecureServer, Http2ServerRequest, Http2ServerResponse>,
  { status, description }: { status: Exclude<HttpErrorCodes, string>; description: string },
) => {
  const accept = request.accepts();

  return match(getAcceptType(accept))
    .with("json", () => {
      const error = app.httpErrors.getHttpError(status);

      return reply
        .type("application/json")
        .status(status)
        .send({ ...error, description });
    })
    .otherwise(() => {
      return reply
        .type("text/html")
        .status(status)
        .send(authErrorTemplate.replaceAll("{{description}}", escapeHtml(description)));
    });
};
