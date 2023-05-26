import fs from "node:fs";
import os from "node:os";
import path from "pathe";

const isStringRecord = (value: unknown): value is Record<string, string> =>
  String(value) === "[object Object]" &&
  value != null &&
  Object.values(value).every(item => typeof item === "string");

const localesPath = path.resolve(__dirname, "../src/locales");
const files = fs.readdirSync(localesPath).map(file => path.join(localesPath, file));

files.forEach(file => {
  const content = fs.readFileSync(file, "utf-8");
  const json: unknown = JSON.parse(content);

  if (!isStringRecord(json)) {
    throw new Error(`Invalid JSON: ${file}`);
  }

  const sorted = Object.keys(json)
    .sort()
    .reduce<Record<string, string>>((acc, key) => ({ ...acc, [key]: json[key] as string }), {});

  fs.writeFileSync(file, JSON.stringify(sorted, null, 2) + os.EOL, "utf-8");
  console.log(`Sorted ${file}`);
});
