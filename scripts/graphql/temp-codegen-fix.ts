// TODO: Remove this once https://github.com/dotansimha/graphql-code-generator-community/pull/297 is merged
import fs from "fs/promises";
import path from "path";

const brokenImport = "import { IntrospectionData } from '@urql/exchange-graphcache/dist/types/ast'";
const [, , ...files] = process.argv;

void Promise.all(
  files.map(async file => {
    const filePath = path.resolve(process.cwd(), file);
    const content = await fs.readFile(filePath, "utf-8");

    if (!content.includes(brokenImport)) {
      return;
    }

    return fs.writeFile(
      filePath,
      content
        .replace(brokenImport, "import { CacheExchangeOpts } from '@urql/exchange-graphcache'")
        .replace("schema?: IntrospectionData", "schema?: CacheExchangeOpts['schema']"),
    );
  }),
);
