import { Array, Option } from "@swan-io/boxed";
import fs from "node:fs";
import { EOL } from "os";
import path from "pathe";

const icons = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "scripts/fluent-icons/icons.json"), "utf-8"),
) as string[];

const FLUENT_MODULE_NAME = "@fluentui/svg-icons/icons";
const SVG_START = `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="`;
const SVG_END = `"/></svg>`;

const svgs = Array.filterMap(icons, name => {
  const match = /(.+)-(regular|filled)/.exec(name);
  if (match == null) {
    throw new Error(`Invalid icon name: ${name}`);
  }
  const [, icon, variant] = match;
  if (icon != null && variant != null) {
    const fileName = `${icon.replace(/-/g, "_")}_24_${variant}.svg`;
    const svg = fs
      .readFileSync(path.join(process.cwd(), "node_modules", FLUENT_MODULE_NAME, fileName))
      .toString("utf-8");

    const pathString = svg.slice(SVG_START.length, -SVG_END.length).replace(/"\/><path d="/g, "");
    return Option.Some([name, pathString]);
  } else {
    return Option.None();
  }
});

fs.writeFileSync(
  path.join(process.cwd(), "packages/web-common/src/icons/fluent-icons.json"),
  JSON.stringify(Object.fromEntries(svgs), null, 2) + EOL,
  "utf-8",
);
