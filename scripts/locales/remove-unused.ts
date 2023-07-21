import { Result } from "@swan-io/boxed";
import glob from "fast-glob";
import { readFileSync, writeFileSync } from "fs";
import path from "pathe";
import { match } from "ts-pattern";

const clients = ["banking", "onboarding"] as const;

const isStringRecord = (value: unknown): value is Record<string, string> =>
  String(value) === "[object Object]" &&
  value != null &&
  Object.values(value).every(item => typeof item === "string");

const parseJsonSafe = (json: string) =>
  Result.fromExecution(() => JSON.parse(json) as unknown)
    .map(object =>
      match(object)
        .when(isStringRecord, record => record)
        .otherwise(() => ({})),
    )
    .match({
      Ok: record => record,
      Error: () => ({}),
    });

const readJsonFile = (filePath: string) => {
  const content = readFileSync(filePath, "utf-8");
  return parseJsonSafe(content);
};

const writeJsonFile = (filePath: string, json: Record<string, string>) => {
  writeFileSync(filePath, JSON.stringify(json, null, 2) + "\n", "utf-8");
};

const getKeysNotExistingInReference = (
  referenceLocale: Record<string, string>,
  locale: Record<string, string>,
) => {
  const keys = Object.keys(locale);
  return keys.filter(key => referenceLocale[key] == null);
};

const isKeyInCode = (key: string, code: string) => {
  // when the last part is variable
  const variantKey1 = key.split(".").slice(0, -1).join(".") + ".${";
  // when the 2 last parts are variable
  const variantKey2 = key.split(".").slice(0, -2).join(".") + ".${";

  return (
    code.includes(`"${key}"`) ||
    code.includes(`\`${key}\``) ||
    code.includes(`'${key}'`) ||
    code.includes(`\`${variantKey1}`) ||
    code.includes(`\`${variantKey2}`)
  );
};

const removeKeys = (object: Record<string, string>, keys: string[]): Record<string, string> => {
  const newObject = { ...object };
  for (const key of keys) {
    delete newObject[key];
  }
  return newObject;
};

const removeUnusedKeysInClient = (client: (typeof clients)[number]) => {
  const localePath = path.resolve(__dirname, `../../clients/${client}/src/locales`);
  const englishTranslations = readJsonFile(`${localePath}/en.json`);
  const keys = Object.keys(englishTranslations);

  const codeSrc = path.resolve(__dirname, `../../clients/${client}/src`);
  const filePaths = glob.sync(`${codeSrc}/**/*.{ts,tsx}`);

  let unusedKeys = [...keys];
  // Check in each file contains code
  for (const filePath of filePaths) {
    if (unusedKeys.length === 0) {
      break;
    }

    const code = readFileSync(filePath, "utf-8");
    // if key is in code, we return false to remove it from unusedKeys
    unusedKeys = unusedKeys.filter(key => !isKeyInCode(key, code));
  }

  if (unusedKeys.length === 0) {
    console.log(`No unused keys in ${client}`);
    return;
  }

  const englishTranslationsWithoutUnusedKeys = removeKeys(englishTranslations, unusedKeys);

  const localesGlob = glob.sync(`${localePath}/*.json`);
  const localesPaths = localesGlob.filter(path => !path.endsWith("en.json"));

  // Remove unused keys in other locales
  for (const localePath of localesPaths) {
    const locale = readJsonFile(localePath);
    // Check based on english translations
    const keysToRemove = getKeysNotExistingInReference(
      englishTranslationsWithoutUnusedKeys,
      locale,
    );

    // Avoid to write file if there isn't any key to remove
    if (keysToRemove.length === 0) {
      continue;
    }

    const localeWithoutUnusedKeys = removeKeys(locale, keysToRemove);
    writeJsonFile(localePath, localeWithoutUnusedKeys);
  }

  // Remove unused keys in english
  writeJsonFile(`${localePath}/en.json`, englishTranslationsWithoutUnusedKeys);
  console.log(`Removed ${unusedKeys.length} unused keys in ${client}`);
};

for (const client of clients) {
  removeUnusedKeysInClient(client);
}
