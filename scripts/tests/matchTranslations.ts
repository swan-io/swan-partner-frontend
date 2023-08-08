import { Result } from "@swan-io/boxed";
import glob from "fast-glob";
import { readFileSync, writeFileSync } from "fs";
import path from "pathe";
import { match } from "ts-pattern";

const isStringRecord = (value: unknown): value is Record<string, string> =>
  String(value) === "[object Object]" &&
  value != null &&
  Object.values(value).every(item => typeof item === "string");

const parseJsonSafe = (json: string) =>
  Result.fromExecution(() => JSON.parse(json) as unknown)
    .map(object =>
      match(object)
        .when(isStringRecord, record => record)
        .otherwise(() => ({})),
    )
    .match({
      Ok: record => record,
      Error: () => ({}),
    });

const readJsonFile = (filePath: string) => {
  const content = readFileSync(filePath, "utf-8");
  return parseJsonSafe(content);
};

const main = () => {
  const clients = ["banking", "onboarding"] as const;

  for (const client of clients) {
    const translations = readJsonFile(
      `${path.resolve(__dirname, `../../clients/${client}/src/locales`)}/en.json`,
    );
    const files = glob.sync(`${path.resolve(__dirname, `../../tests`)}/*.${client}.ts`);

    for (const file of files) {
      let code = readFileSync(file, "utf-8");

      const matches = code.match(/"(\\.|[^"])*"/g)?.map(v => v.replace(/"/g, ""));
      matches?.forEach(match => {
        const k = Object.keys(translations).find(key => translations[key] === match);
        if (k != null) {
          code = code.replaceAll(`"${match}"`, `t("${client}.${k}")`);
        }
      });

      writeFileSync(file, code, "utf-8");
    }
  }
};

main();
