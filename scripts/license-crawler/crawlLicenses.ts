import chalk from "chalk";
import { exec as originalExec } from "child_process";
import fs from "node:fs";
import path from "pathe";

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

async function getLicenses() {
  const info = await exec("yarn --json workspaces info");
  const packages = JSON.parse(info);
  const data: { location: string }[] = JSON.parse(packages.data);
  const directDependencies = new Set();

  Object.values(data).forEach(({ location }) => {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), location, "package.json"), "utf-8"),
    );
    if (packageJson.dependencies !== undefined) {
      Object.keys(packageJson.dependencies).forEach(name => directDependencies.add(name));
    }
    if (packageJson.devDependencies !== undefined) {
      Object.keys(packageJson.devDependencies).forEach(name => directDependencies.add(name));
    }
  });

  const licencesOutput = await exec("yarn --json licenses list");
  const licencesOutputLines = licencesOutput.trim().split("\n");
  const licenses: {
    head: [string, string, string, string, string, string];
    body: [string, string, string, string, string, string][];
  } = JSON.parse(licencesOutputLines[licencesOutputLines.length - 1] as string).data;
  const directDependenciesLicenses = licenses.body
    .filter(([name]) => directDependencies.has(name) && !name.startsWith("@swan-io/"))
    .map(
      ([name, version, license, url, vendorUrl, vendorName]) =>
        [
          name,
          version,
          license,
          url.replace(/^git\+/, ""),
          vendorUrl.replace(/^git\+/, ""),
          vendorName,
        ] as const,
    );
  return {
    head: licenses.head,
    licenses: directDependenciesLicenses,
  };
}

async function report() {
  const { head, licenses } = await getLicenses();
  fs.writeFileSync(
    path.join(process.cwd(), "LICENSE_REPORT.md"),
    `# License report

${head.join(" | ")}
${head.map(() => "---").join(" | ")}
${licenses.map(items => items.join(" | ")).join("\n")}
`,
    "utf-8",
  );
}

const DENY_LIST = ["GPL", "AGPL"];
const DENY_LIST_REGEX = new RegExp(DENY_LIST.map(item => `\\b${item}\\b`).join("|"));

async function check() {
  const { licenses } = await getLicenses();
  let hasError = false;
  console.log(`${chalk.white("---")}`);
  console.log(`${chalk.green("Swan license check")}`);
  console.log(`${chalk.white("---")}`);
  console.log("");

  licenses.forEach(([name, version, license]) => {
    if (DENY_LIST_REGEX.exec(license)) {
      console.error(
        `${chalk.blue(name)}@${chalk.gray(version)} has unauthorized license ${chalk.red(license)}`,
      );
      hasError = true;
    }
  });
  if (hasError) {
    process.exit(1);
  } else {
    console.log(chalk.green("All good!"));
  }
}

async function main() {
  if (process.argv.includes("--check")) {
    await check();
  }

  if (process.argv.includes("--report")) {
    report();
  }
}

main();
