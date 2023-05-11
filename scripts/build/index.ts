import chalk from "chalk";
import { execSync } from "child_process";
import fs from "fs";
import path from "pathe";
import { build } from "vite";

const { version } = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "package.json"), "utf-8"),
) as { version: string };

const apps = ["onboarding", "banking"];

console.log(``);
console.log(`${chalk.magenta("swan-partner-frontend")}`);
console.log(`${chalk.white("---")}`);

void (async () => {
  for (const app of apps) {
    console.log(`${chalk.magenta(app)} ${chalk.grey("building")}`);

    try {
      await build({
        configFile: path.resolve(process.cwd(), "clients", app, "vite.config.js"),
        logLevel: "error",
        build: {
          outDir: path.join(process.cwd(), "server/dist", app),
          // The polyfill generates a bug on Safari, where it makes the module
          // always be invalidated due to credentials being sent (i.e. Cookies)
          polyfillModulePreload: false,
          sourcemap: true,
          assetsDir: `assets/${version}`,
        },
      });
    } catch (error) {
      if (error != null) {
        console.error(error);
        process.exit(1);
      }
    }

    console.log(`${chalk.magenta(app)} ${chalk.green("done")}`);
    console.log(``);
  }

  console.log(`${chalk.magenta("server")} ${chalk.grey("building")}`);
  execSync(`cd server && yarn build`);
  console.log(`${chalk.magenta("server")} ${chalk.green("done")}`);
})();
