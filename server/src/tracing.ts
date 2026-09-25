import fs from "node:fs";
import FastifyOtelInstrumentation from "@fastify/otel";
import { metrics } from "@opentelemetry/api";
import {
  getNodeAutoInstrumentations,
  InstrumentationConfigMap,
} from "@opentelemetry/auto-instrumentations-node";
import { CompositePropagator, W3CTraceContextPropagator } from "@opentelemetry/core";
import { PrometheusExporter } from "@opentelemetry/exporter-prometheus";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { FastifyRequest } from "fastify";
import path from "pathe";

const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../package.json"), "utf-8"),
) as { version: string };

/**
 * Must be run after `sdk.start()` — that's what registers the global meter provider.
 * Before it, `getMeter()` returns a no-op meter and nothing is exported.
 */
const registerMetrics = () => {
  metrics
    .getMeter("swan-internal-frontend")
    .createGauge("swan_app_build_info", { description: "Build information" })
    .record(1, { version: packageJson.version });
};

const sensibleHeaderKeys = new Set(["authorization", "cookie", "x-swan-token"]);

// Defensive denylist: redact the headers above plus any header whose name hints
// at a credential, so a new SDK using e.g. `x-foo-secret` can't silently leak a
// secret into a span attribute. Header names are lowercased before matching
// since outbound (undici/fetch) headers may not be normalized.
const isSensitiveHeader = (key: string): boolean => {
  const lower = key.toLowerCase();
  return sensibleHeaderKeys.has(lower) || /(?:api[-_]?key|token|secret|password|auth)/.test(lower);
};

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
  "@opentelemetry/instrumentation-openai": { enabled: false },
  "@opentelemetry/instrumentation-undici": {
    enabled: true,
    requestHook: (span, request) => {
      for (const [key, value = ""] of Object.entries(request.headers)) {
        if (!isSensitiveHeader(key)) {
          span.setAttribute(`http.header.${key}`, value);
        }
      }
    },
  },
  "@opentelemetry/instrumentation-winston": { enabled: false },

  "@opentelemetry/instrumentation-pino": { enabled: true },
  "@opentelemetry/instrumentation-net": { enabled: true },

  "@opentelemetry/instrumentation-http": {
    enabled: true,
    ignoreIncomingRequestHook: request => request.url === "/health" || request.url === "/metrics",
  },

  "@opentelemetry/instrumentation-host-metrics": {
    enabled: true,
  },
};

const fastifyInstrumentation = new FastifyOtelInstrumentation({
  registerOnInitialization: true,
  requestHook: (span, request: FastifyRequest) => {
    for (const [key, value = ""] of Object.entries(request.headers)) {
      if (!isSensitiveHeader(key)) {
        span.setAttribute(`http.header.${key}`, value);
      }
    }
  },
});

const traceExporter = new OTLPTraceExporter();
const spanProcessor = new BatchSpanProcessor(traceExporter);

const textMapPropagator = new CompositePropagator({
  propagators: [new W3CTraceContextPropagator()],
});

const serviceName = process.env.OTEL_SERVICE_NAME;
const METRICS_PORT = Number(process.env.OTEL_EXPORTER_PROMETHEUS_PORT ?? 9464);

if (serviceName != null) {
  const sdk = new NodeSDK({
    serviceName,
    instrumentations: [getNodeAutoInstrumentations(inputConfigs), fastifyInstrumentation],
    spanProcessor,
    textMapPropagator,
    traceExporter,
    metricReaders: [
      new PrometheusExporter({ port: METRICS_PORT }, () => {
        console.log(`Prometheus metrics server started on port ${METRICS_PORT}`);
      }),
    ],
  });

  sdk.start();
  registerMetrics();
}
