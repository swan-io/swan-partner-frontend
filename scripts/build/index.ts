import { execSync } from "child_process";
import fs from "fs";
import path from "pathe";
import pc from "picocolors";
import { build } from "vite";

const { version } = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "package.json"), "utf-8"),
) as { version: string };

const apps = ["onboarding", "banking"];

console.log(``);
console.log(`${pc.magenta("swan-partner-frontend")}`);
console.log(`${pc.white("---")}`);

void (async () => {
  for (const app of apps) {
    console.log(`${pc.magenta(app)} ${pc.gray("building")}`);

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

    console.log(`${pc.magenta(app)} ${pc.green("done")}`);
    console.log(``);
  }

  console.log(`${pc.magenta("server")} ${pc.gray("building")}`);
  execSync(`cd server && yarn build`);
  console.log(`${pc.magenta("server")} ${pc.green("done")}`);
})();
