const { JaegerExporter } = require("@opentelemetry/exporter-jaeger");
const { registerInstrumentations } = require("@opentelemetry/instrumentation");
const { FastifyInstrumentation } = require("@opentelemetry/instrumentation-fastify");
const { HttpInstrumentation } = require("@opentelemetry/instrumentation-http");
const { PinoInstrumentation } = require("@opentelemetry/instrumentation-pino");
const { JaegerPropagator } = require("@opentelemetry/propagator-jaeger");
const { Resource } = require("@opentelemetry/resources");
const { BatchSpanProcessor } = require("@opentelemetry/sdk-trace-base");
const { NodeTracerProvider } = require("@opentelemetry/sdk-trace-node");
const { SemanticResourceAttributes } = require("@opentelemetry/semantic-conventions");

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
