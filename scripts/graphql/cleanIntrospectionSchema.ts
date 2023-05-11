import { getIntrospectedSchema, minifyIntrospectionQuery } from "@urql/introspection";
import fs from "node:fs";
import path from "pathe";

const filepath = path.resolve(process.argv[2] ?? "");
const schema = fs.readFileSync(filepath, "utf-8");
const minified = minifyIntrospectionQuery(getIntrospectedSchema(schema));

fs.writeFileSync(filepath, JSON.stringify(minified, null, 2));
