import fs from "node:fs";
import path from "node:path";

const packages = ["banking", "onboarding"];

const isRecord = (value: unknown): value is Record<string, string> => {
  return value != null && Object.values(value).every(v => typeof v === "string");
};

const sortJson = (json: Record<string, string>) => {
  const keys = Object.keys(json).sort();
  const sortedJson: Record<string, string> = {};
  keys.forEach(key => {
    sortedJson[key] = json[key] as string;
  });
  return sortedJson;
};

packages.forEach(packageName => {
  const dirPath = `clients/${packageName}/src/locales`;
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const content = fs.readFileSync(filePath, "utf8");
    const json: unknown = JSON.parse(content);

    if (!isRecord(json)) {
      throw new Error(`Invalid JSON: ${filePath}`);
    }

    const sorted = sortJson(json);

    fs.writeFileSync(filePath, JSON.stringify(sorted, null, 2));
    console.log(`Sorted ${filePath}`);
  });
});
