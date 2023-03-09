import fs from "fs";
import os from "os";
import path from "path";
import yaml from "yaml";

const graphqlPath = path.join(process.cwd(), "scripts/graphql");
const tmpDir = os.tmpdir();

const codegenConfig = yaml.parse(fs.readFileSync(path.join(graphqlPath, "codegen.yml"), "utf8"));

const defaultSchemaPath = "scripts/graphql/dist";
const currentSchemaPath = process.env.SCHEMA_PATH ?? defaultSchemaPath;

const patchSchemaPath = schema => schema.replace(defaultSchemaPath, currentSchemaPath);

const verifyConfig = {
  ...codegenConfig,
  generates: Object.fromEntries(
    Object.entries(codegenConfig.generates).map(([key, value]) => [
      path.join(tmpDir, path.dirname(key), path.basename(key)),
      {
        ...value,
        schema: Array.isArray(value.schema)
          ? value.schema.map(patchSchemaPath)
          : patchSchemaPath(value.schema),
      },
    ]),
  ),
};

fs.writeFileSync(
  path.join(graphqlPath, "codegen-verify.yml"),
  yaml.stringify(verifyConfig),
  "utf-8",
);
