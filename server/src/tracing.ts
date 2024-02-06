import { CompositePropagator, W3CTraceContextPropagator } from "@opentelemetry/core";
import { JaegerExporter } from "@opentelemetry/exporter-jaeger";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { FastifyInstrumentation } from "@opentelemetry/instrumentation-fastify";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { PinoInstrumentation } from "@opentelemetry/instrumentation-pino";
import { JaegerPropagator } from "@opentelemetry/propagator-jaeger";
import { Resource } from "@opentelemetry/resources";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import { FastifyRequest } from "fastify";

const sensibleHeaderKeys = ["authorization", "cookie", "x-swan-token"];

if (process.env.TRACING_SERVICE_NAME != null) {
  const provider = new NodeTracerProvider({
    resource: Resource.default().merge(
      new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: process.env.TRACING_SERVICE_NAME,
      }),
    ),
  });

  provider.addSpanProcessor(new BatchSpanProcessor(new JaegerExporter()));

  provider.register({
    propagator: new CompositePropagator({
      propagators: [new W3CTraceContextPropagator(), new JaegerPropagator()],
    }),
  });

  registerInstrumentations({
    instrumentations: [
      new PinoInstrumentation(),
      new HttpInstrumentation({
        ignoreIncomingPaths: [/\/health/],
      }),
      new FastifyInstrumentation({
        requestHook: (span, { request: { headers } }: { request: FastifyRequest }) => {
          for (const [key, value = ""] of Object.entries(headers)) {
            if (!sensibleHeaderKeys.includes(key.toLowerCase())) {
              span.setAttribute(`http.header.${key}`, value);
            }
          }
        },
      }),
    ],
  });
}
