const { getNodeAutoInstrumentations } = require("@opentelemetry/auto-instrumentations-node");
const { Resource } = require("@opentelemetry/resources");
const opentelemetry = require("@opentelemetry/sdk-node");
const { ConsoleSpanExporter } = require("@opentelemetry/sdk-trace-base");
const { SemanticResourceAttributes } = require("@opentelemetry/semantic-conventions");
const process = require("process");

if (process.env.TRACING_SERVICE_NAME != null) {
  const traceExporter = new ConsoleSpanExporter();
  const sdk = new opentelemetry.NodeSDK({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: process.env.TRACING_SERVICE_NAME,
    }),
    traceExporter,
    instrumentations: [getNodeAutoInstrumentations()],
  });
  sdk.start();
  process.on("SIGTERM", () => {
    sdk
      .shutdown()
      .then(() => console.log("Tracing terminated"))
      .catch(error => console.log("Error terminating tracing", error))
      .finally(() => process.exit(0));
  });
}
