import dotenv from "dotenv";
import { EOL } from "node:os";
import path from "pathe";
import pc from "picocolors";

const rootPath = path.resolve(__dirname, "../..");

const { parsed: example } = dotenv.config({
  path: path.join(rootPath, ".env.example"),
});

if (example == null) {
  console.log(`${pc.red("error")} .env.example file is missing.`);
  process.exit(1);
}

const { parsed: env } = dotenv.config({
  path: path.join(rootPath, ".env"),
});

if (env == null) {
  console.log(`${pc.red("error")}  .env file is missing.`);
  process.exit(1);
}

const issues: { kind: "extra" | "mismatch" | "missing"; key: string }[] = [];
const keys = Object.keys(env);
const exampleKeys = Object.keys(example);

keys.forEach(key => {
  const value = env[key];
  const exampleValue = example[key];

  if (exampleValue == null) {
    return issues.push({ kind: "extra", key });
  }
  if (exampleValue !== "" && value !== exampleValue) {
    return issues.push({ kind: "mismatch", key });
  }
});

exampleKeys.forEach(key => {
  if (!keys.includes(key)) {
    return issues.push({ kind: "missing", key });
  }
});

if (issues.length > 0) {
  console.log(pc.magenta("Issues in your .env file:"));

  console.log(
    issues
      .map(issue => {
        const start = `[${issue.kind}]`.padEnd(12, " ");

        switch (issue.kind) {
          case "extra":
            return pc.gray(start + issue.key);
          case "mismatch":
            return pc.green(start + issue.key);
          case "missing":
            return pc.red(start + issue.key);
        }
      })
      .join(EOL),
  );

  process.exit(1);
}
