import chalk from "chalk";
import { execSync } from "child_process";
import path from "node:path";
import url from "node:url";
import { start } from "./app.js";
import { env } from "./env.js";

const dirname = path.dirname(url.fileURLToPath(import.meta.url));

start({
  mode: env.NODE_ENV,
  httpsConfig:
    env.NODE_ENV === "development"
      ? {
          key: path.join(dirname, "../keys/_wildcard.swan.local+1-key.pem"),
          cert: path.join(dirname, "../keys/_wildcard.swan.local+1.pem"),
          ca: execSync(`echo "$(mkcert -CAROOT)/rootCA.pem"`).toString("utf-8").trim(),
        }
      : undefined,
}).then(
  () => {
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
