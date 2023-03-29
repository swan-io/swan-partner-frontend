import chalk from "chalk";
import path from "node:path";
import url from "node:url";
import { start } from "./app.js";
import { env } from "./env.js";

const dirname = path.dirname(url.fileURLToPath(import.meta.url));

start({
  mode: env.NODE_ENV,
  httpsConfig:
    false //env.NODE_ENV === "development"
      ? {
          key: path.join(dirname, "../keys/_wildcard.swan.local-key.pem"),
          cert: path.join(dirname, "../keys/_wildcard.swan.local.pem"),
        }
      : undefined,
}).then(
  ({ app, ports }) => {
    const listenPort = async (port: string) => {
      // Expose 8080 so that we don't need `sudo` to listen to the port
      // That's the port we expose when dockerized
      const finalPort = port === "80" || port === "443" ? "8080" : port;

      try {
        await app.listen({ port: Number(finalPort), host: "0.0.0.0" });
      } catch (err) {
        console.error(err);
        process.exit(1);
      }
    };

    ports.forEach(port => void listenPort(port));

    console.log(``);
    console.log(`${chalk.magenta("swan-partner-frontend")}`);
    console.log(`${chalk.white("---")}`);
    console.log(chalk.green(`${env.NODE_ENV === "development" ? "dev server" : "server"} started`));
    console.log(``);
    console.log(`${chalk.magenta("Banking")} -> ${env.BANKING_URL}`);
    console.log(
      `${chalk.magenta("Onboarding Individual")} -> ${
        env.ONBOARDING_URL
      }/onboarding/individual/start`,
    );
    console.log(
      `${chalk.magenta("Onboarding Company")} -> ${env.ONBOARDING_URL}/onboarding/company/start`,
    );
    console.log(`${chalk.white("---")}`);
    console.log(``);
    console.log(``);
  },
  err => {
    console.error(err);
    process.exit(1);
  },
);
