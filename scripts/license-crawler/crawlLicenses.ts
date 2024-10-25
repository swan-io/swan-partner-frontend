import { exec as originalExec } from "child_process";
import fs from "node:fs";
import path from "pathe";
import pc from "picocolors";
import * as markdown from "prettier/plugins/markdown";
import * as prettier from "prettier/standalone";

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

type Package = {
  name: string;
  dependencies: Record<string, { version: string }>;
  devDependencies: Record<string, { version: string }>;
};

type DependencyRaw = {
  name: string;
  versions: (string | undefined)[];
  license: string | undefined;
  author: string | undefined;
  homepage: string | undefined;
};

type Dependency = {
  name: string;
  version: string;
  license: string;
  author: string;
  homepage: string;
};

async function getDirectDependencies() {
  const pkgDependencies = (JSON.parse(await exec("pnpm list -r --json")) as Package[])
    .filter(pkg => pkg.name !== "@swan-io/partner-frontend")
    .reduce<Record<string, { name: string; version: string }>>(
      (acc, pkg) => ({
        ...acc,
        ...Object.fromEntries(
          Object.entries({ ...pkg.dependencies, ...pkg.devDependencies })
            .map(([name, { version }]) => [`${name}@${version}`, { name, version }] as const)
            .filter(([key]) => !key.startsWith("@swan-io/") && !(key in acc)),
        ),
      }),
      {},
    );

  return Object.values(
    JSON.parse(await exec("pnpm licenses ls -r --json")) as Record<string, DependencyRaw[]>,
  )
    .flat()
    .reduce<Dependency[]>((acc, item) => {
      item.versions
        .filter(version => version != null)
        .map(version => {
          const pkgDependency = pkgDependencies[`${item.name}@${version}`];

          if (pkgDependency != null) {
            acc.push({
              name: pkgDependency.name,
              version: pkgDependency.version,
              license: item.license ?? "Unknown",
              author: item.author ?? "Unknown",
              homepage: item.homepage ?? "Unknown",
            });
          }
        });

      return acc;
    }, [])
    .toSorted((a, b) => {
      return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
    });
}

async function report() {
  const head = ["Name", "Version", "License", "Author", "Homepage"];
  const directDependencies = await getDirectDependencies();

  const output = `# License report

${head.join(" | ")}
${head.map(() => "-").join(" | ")}
${directDependencies.map(item => [item.name, item.version, item.license, item.author, item.homepage].join(" | ")).join("\n")}
  `;

  fs.writeFileSync(
    path.join(process.cwd(), "LICENSE_REPORT.md"),
    await prettier.format(output, { parser: "markdown", plugins: [markdown] }),
    "utf-8",
  );
}

const DENY_LIST = ["GPL", "AGPL"];
const DENY_LIST_REGEX = new RegExp(DENY_LIST.map(item => `\\b${item}\\b`).join("|"));

async function check() {
  const directDependencies = await getDirectDependencies();
  let hasError = false;

  console.log(`${pc.white("---")}`);
  console.log(`${pc.green("Swan license check")}`);
  console.log(`${pc.white("---")}`);
  console.log("");

  directDependencies.forEach(({ name, version, license }) => {
    if (DENY_LIST_REGEX.exec(license)) {
      console.error(
        `${pc.blue(name)}@${pc.gray(version)} has unauthorized license ${pc.red(license)}`,
      );
      hasError = true;
    }
  });

  if (hasError) {
    process.exit(1);
  } else {
    console.log(pc.green("All good!"));
  }
}

async function main() {
  if (process.argv.includes("--check")) {
    await check();
  }

  if (process.argv.includes("--report")) {
    void report();
  }
}

void main();
