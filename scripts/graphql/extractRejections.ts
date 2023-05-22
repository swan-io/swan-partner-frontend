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
  .filter(file => file.endsWith(".gql"))
  .map(file => parse(fs.readFileSync(path.join(schemasPath, file), "utf-8")))
  .forEach(schema => visit(schema, visitor));

keys.sort(); // sort in place

fs.readdirSync(localesPath).map(file => {
  const filePath = path.join(localesPath, file);
  const currentText = fs.readFileSync(filePath, "utf-8");
  const currentJson: unknown = JSON.parse(currentText);

  if (!isStringRecord(currentJson)) {
    throw new Error(`Invalid JSON: ${file}`);
  }

  const filteredKeys =
    file === "en.json"
      ? keys
      : keys.filter(key => {
          const value = currentJson[key];
          return value != null && value.trim() !== "";
        });

  const nextJson = Object.fromEntries(filteredKeys.map(key => [key, currentJson[key] ?? ""]));
  const nextText = JSON.stringify(nextJson, null, 2) + os.EOL;

  if (nextText !== currentText) {
    fs.writeFileSync(filePath, nextText, "utf-8");
  }
});
