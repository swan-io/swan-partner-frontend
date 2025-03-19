import { FastifyInstance, FastifyReply, FastifyRequest, RouteGenericInterface } from "fastify";
import { Http2SecureServer, Http2ServerRequest, Http2ServerResponse } from "node:http2";

export type FastifySecureInstance = FastifyInstance<
  Http2SecureServer,
  Http2ServerRequest,
  Http2ServerResponse
>;

export type FastifySecureRequest = FastifyRequest<
  RouteGenericInterface,
  Http2SecureServer,
  Http2ServerRequest
>;

export type FastifySecureReply = FastifyReply<
  RouteGenericInterface,
  Http2SecureServer,
  Http2ServerRequest,
  Http2ServerResponse
>;
