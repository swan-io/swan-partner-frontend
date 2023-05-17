import { ASTVisitor, Kind, parse, visit } from "graphql";
import fs from "node:fs";
import os from "node:os";
import path from "pathe";

const isStringRecord = (value: unknown): value is Record<string, string> =>
  String(value) === "[object Object]" &&
  value != null &&
  Object.values(value).every(item => typeof item === "string");

const schemasPath = path.resolve(__dirname, "./dist");
const localesPath = path.resolve(__dirname, "./locales");

const keys: string[] = [];

const visitor: ASTVisitor = {
  [Kind.OBJECT_TYPE_DEFINITION]: {
    leave: node => {
      const implementsRejection =
        node.interfaces?.some(value => value.name.value === "Rejection") ?? false;

      if (implementsRejection) {
        const key = `rejection.${node.name.value}`;

        if (!keys.includes(key)) {
          keys.push(key);
        }
      }
    },
  },
};

fs.readdirSync(schemasPath)
  .map(file => path.join(schemasPath, file))
  .map(file => fs.readFileSync(file, "utf-8"))
  .map(schema => parse(schema))
  .forEach(schema => visit(schema, visitor));

keys.sort(); // sort in place

fs.readdirSync(localesPath).map(file => {
  const filePath = path.join(localesPath, file);
  const json: unknown = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  if (!isStringRecord(json)) {
    throw new Error(`Invalid JSON: ${file}`);
  }

  const record = Object.fromEntries(keys.map(key => [key, json[key] ?? ""]));
  fs.writeFileSync(filePath, JSON.stringify(record, null, 2) + os.EOL, "utf-8");
});
