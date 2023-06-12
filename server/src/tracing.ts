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

if (process.env.TRACING_SERVICE_NAME != null) {
  const provider = new NodeTracerProvider({
    resource: Resource.default().merge(
      new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: process.env.TRACING_SERVICE_NAME,
      }),
    ),
  });

  const jaegerPropagator = new JaegerPropagator();
  const jaegerExporter = new JaegerExporter();
  const batchSpanProcessor = new BatchSpanProcessor(jaegerExporter);

  provider.addSpanProcessor(batchSpanProcessor);
  provider.register({ propagator: jaegerPropagator });

  registerInstrumentations({
    instrumentations: [
      new PinoInstrumentation(),
      new HttpInstrumentation({
        ignoreIncomingPaths: [/\/health/],
      }),
      new FastifyInstrumentation(),
    ],
  });
}
