import fs from "node:fs/promises";

/**
 * The goal of this script is fixing tggl keys containing `-`
 * Because there are some keys containing `-` and the tggl codegen generates keys with `-` without wrapping them in quotes, which causes syntax errors in the generated code.
 */

const TGGL_TYPEDEFS_PATHS = ["types/tggl/index.d.ts", "server/types/tggl/index.d.ts"];

const main = async () => {
  for (const path of TGGL_TYPEDEFS_PATHS) {
    const fileContent = await fs.readFile(path, "utf-8");

    const fixedContent = fileContent
      .split("\n")
      .map(line => {
        if (!line.includes(":")) {
          return line;
        }

        const [key, value] = line.split(":").map(part => part.trim());
        if (key != null && !key.includes('"') && key.includes("-")) {
          return `"${key}": ${value}`;
        }
        return line;
      })
      .join("\n");

    await fs.writeFile(path, fixedContent, "utf-8");
  }
};

main();
