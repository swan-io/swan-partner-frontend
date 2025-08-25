import {
  getNodeAutoInstrumentations,
  InstrumentationConfigMap,
} from "@opentelemetry/auto-instrumentations-node";
import { CompositePropagator, W3CTraceContextPropagator } from "@opentelemetry/core";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { JaegerPropagator } from "@opentelemetry/propagator-jaeger";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { FastifyRequest } from "fastify";

const sensibleHeaderKeys = new Set(["authorization", "cookie", "x-swan-token"]);

const inputConfigs: Required<InstrumentationConfigMap> = {
  "@opentelemetry/instrumentation-amqplib": { enabled: false },
  "@opentelemetry/instrumentation-aws-lambda": { enabled: false },
  "@opentelemetry/instrumentation-aws-sdk": { enabled: false },
  "@opentelemetry/instrumentation-bunyan": { enabled: false },
  "@opentelemetry/instrumentation-cassandra-driver": { enabled: false },
  "@opentelemetry/instrumentation-connect": { enabled: false },
  "@opentelemetry/instrumentation-cucumber": { enabled: false },
  "@opentelemetry/instrumentation-dataloader": { enabled: false },
  "@opentelemetry/instrumentation-dns": { enabled: false },
  "@opentelemetry/instrumentation-express": { enabled: false },
  "@opentelemetry/instrumentation-fs": { enabled: false },
  "@opentelemetry/instrumentation-generic-pool": { enabled: false },
  "@opentelemetry/instrumentation-graphql": { enabled: false },
  "@opentelemetry/instrumentation-grpc": { enabled: false },
  "@opentelemetry/instrumentation-hapi": { enabled: false },
  "@opentelemetry/instrumentation-ioredis": { enabled: false },
  "@opentelemetry/instrumentation-kafkajs": { enabled: false },
  "@opentelemetry/instrumentation-knex": { enabled: false },
  "@opentelemetry/instrumentation-koa": { enabled: false },
  "@opentelemetry/instrumentation-lru-memoizer": { enabled: false },
  "@opentelemetry/instrumentation-memcached": { enabled: false },
  "@opentelemetry/instrumentation-mongodb": { enabled: false },
  "@opentelemetry/instrumentation-mongoose": { enabled: false },
  "@opentelemetry/instrumentation-mysql2": { enabled: false },
  "@opentelemetry/instrumentation-mysql": { enabled: false },
  "@opentelemetry/instrumentation-nestjs-core": { enabled: false },
  "@opentelemetry/instrumentation-oracledb": { enabled: false },
  "@opentelemetry/instrumentation-pg": { enabled: false },
  "@opentelemetry/instrumentation-redis": { enabled: false },
  "@opentelemetry/instrumentation-restify": { enabled: false },
  "@opentelemetry/instrumentation-router": { enabled: false },
  "@opentelemetry/instrumentation-runtime-node": { enabled: false },
  "@opentelemetry/instrumentation-socket.io": { enabled: false },
  "@opentelemetry/instrumentation-tedious": { enabled: false },
  "@opentelemetry/instrumentation-undici": { enabled: false },
  "@opentelemetry/instrumentation-winston": { enabled: false },

  "@opentelemetry/instrumentation-pino": { enabled: true },
  "@opentelemetry/instrumentation-net": { enabled: true },

  "@opentelemetry/instrumentation-http": {
    enabled: true,
    ignoreIncomingRequestHook: request => request.url === "/health" || request.url === "/metrics",
  },

  "@opentelemetry/instrumentation-fastify": {
    enabled: true,
    requestHook: (span, { request }: { request: FastifyRequest }) => {
      for (const [key, value = ""] of Object.entries(request.headers)) {
        if (!sensibleHeaderKeys.has(key)) {
          span.setAttribute(`http.header.${key}`, value);
        }
      }
    },
  },
};

const traceExporter = new OTLPTraceExporter();
const spanProcessor = new BatchSpanProcessor(traceExporter);

const textMapPropagator = new CompositePropagator({
  propagators: [new W3CTraceContextPropagator(), new JaegerPropagator()],
});

const serviceName = process.env.TRACING_SERVICE_NAME;

if (serviceName != null) {
  const sdk = new NodeSDK({
    serviceName,
    instrumentations: [getNodeAutoInstrumentations(inputConfigs)],
    spanProcessor,
    textMapPropagator,
    traceExporter,
  });

  sdk.start();
}
