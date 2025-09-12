import react from "@vitejs/plugin-react-swc";
import { execSync } from "child_process";
import fs from "fs";
import path from "pathe";
import pc from "picocolors";
import { build } from "vite";

const { version } = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "package.json"), "utf-8"),
) as { version: string };

const appNames = ["onboarding", "banking", "payment"];

console.log(``);
console.log(`${pc.magenta("swan-partner-frontend")}`);
console.log(`${pc.white("---")}`);

void (async () => {
  console.log(`${pc.magenta("server")} ${pc.gray("building")}`);
  execSync(`cd server && pnpm build`);
  console.log(`${pc.magenta("server")} ${pc.green("done")}`);
  console.log(``);

  for (const appName of appNames) {
    console.log(`${pc.magenta(appName)} ${pc.gray("building")}`);
    const cwd = process.cwd();

    try {
      await build({
        root: path.join(cwd, "clients", appName),
        plugins: [react()],
        logLevel: "error",
        mode: "production",
        define: { "process.env.NODE_ENV": JSON.stringify("production") },
        resolve: {
          alias: { "react-native": "react-native-web" },
        },
        build: {
          outDir: path.join(cwd, "server", "dist", "static", appName),
          // The polyfill generates a bug on Safari, where it makes the module
          // always be invalidated due to credentials being sent (i.e. Cookies)
          polyfillModulePreload: false,
          sourcemap: true,
          target: ["es2019", "edge80", "firefox72", "chrome80", "safari12"],
          assetsDir: `assets/${version}`,
        },
      });
    } catch (error) {
      if (error != null) {
        console.error(error);
        process.exit(1);
      }
    }

    console.log(`${pc.magenta(appName)} ${pc.green("done")}`);
    console.log(``);
  }
})();
