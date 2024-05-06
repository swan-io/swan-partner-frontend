import { writeFileSync } from "node:fs";
import pathe from "pathe";
import localazy from "../../localazy.json";

const map = new Map<string, Map<string, string>>();

localazy.upload.files.forEach(item => {
  const locales = map.get(item.group) ?? new Map<string, string>();
  locales.set(item.lang, item.pattern.replace(/clients\/\w+\/src\//, ""));
  map.set(item.group, locales);
});

writeFileSync(
  pathe.resolve(process.cwd(), "server/src/locales.json"),
  JSON.stringify(
    Object.fromEntries([...map.entries()].map(([key, value]) => [key, Object.fromEntries(value)])),
    null,
    2,
  ),
  "utf8",
);
