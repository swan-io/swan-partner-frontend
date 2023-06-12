import { exec as originalExec } from "node:child_process";
import fs from "node:fs";
import path from "pathe";
import pc from "picocolors";
import prompts from "prompts";
import semverGt from "semver/functions/gt.js";
import { PackageJson } from "type-fest";

const { version } = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../../package.json"), "utf8"),
) as { version: string };

const exec = (command: string) => {
  return new Promise<string>((resolve, reject) => {
    originalExec(command, (err, stdout) => {
      if (err) {
        reject(err);
      } else {
        resolve(stdout);
      }
    });
  });
};

async function bump() {
  console.log(``);
  console.log(`${pc.magenta("swan-partner-frontend")}`);
  console.log(`${pc.white("---")}`);
  console.log(pc.green(`version bump`));
  console.log("");

  console.log(`${pc.gray("i")} ${pc.blue("info")} Current version: ${version}`);
  const response = await prompts({
    type: "text",
    name: "version",
    message: `${pc.gray("question")} New version:`,
  });
  const nextVersion = response.version as string;

  try {
    if (!semverGt(nextVersion, version)) {
      console.error(`${pc.red("ERROR")} ${version} cannot be added after ${nextVersion}`);
      return process.exit(1);
    }
  } catch (_) {
    console.error(`${pc.red("ERROR")} ${version} couln't be parsed`);
    return process.exit(1);
  }

  const info = await exec("yarn --json workspaces info");
  const packages = JSON.parse(info) as { data: string };
  const data = JSON.parse(packages.data) as { location: string }[];

  Object.values(data).forEach(({ location }) => {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), location, "package.json"), "utf-8"),
    ) as PackageJson;
    fs.writeFileSync(
      path.join(process.cwd(), location, "package.json"),
      JSON.stringify({ ...packageJson, version: nextVersion }, null, 2) + "\n",
      "utf-8",
    );
  });

  try {
    await exec(`yarn version --new-version ${nextVersion} --no-git-tag-version`);
    await exec(
      `git add package.json ${Object.values(data)
        .map(({ location }) => path.join(process.cwd(), location, "package.json"))
        .join(" ")}`,
    );
    await exec(`git commit -m v${nextVersion}`);
  } catch (err) {
    console.log(err);
    return process.exit(1);
  }
}

void bump();
