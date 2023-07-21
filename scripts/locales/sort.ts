import fs from "node:fs";
import os from "node:os";

const isStringRecord = (value: unknown): value is Record<string, string> =>
  String(value) === "[object Object]" &&
  value != null &&
  Object.values(value).every(item => typeof item === "string");

// Arg automatically provided by lint-staged
const filePath = process.argv[2];

if (filePath == null) {
  throw new Error("Missing file path");
}

const content = fs.readFileSync(filePath, "utf-8");
const json: unknown = JSON.parse(content);

if (!isStringRecord(json)) {
  throw new Error(`Invalid JSON: ${filePath}`);
}

const sorted = Object.keys(json)
  .sort()
  .reduce<Record<string, string>>((acc, key) => ({ ...acc, [key]: json[key] as string }), {});

fs.writeFileSync(filePath, JSON.stringify(sorted, null, 2) + os.EOL, "utf-8");
console.log(`Sorted ${filePath}`);
