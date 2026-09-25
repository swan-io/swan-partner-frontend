import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, normalize, resolve } from "node:path";

const REFERENCE_FILE = "en.json";

/**
 * Sanitizes and validates the locales directory path
 */
function sanitizeLocalesPath(path: string): string {
  if (path.trim() === "") {
    throw new Error("Path must be a non-empty string");
  }

  // Normalize and resolve to absolute path
  const sanitizedPath = normalize(resolve(path.trim()));

  if (!existsSync(sanitizedPath)) {
    throw new Error(`Directory does not exist: ${sanitizedPath}`);
  }

  const stats = statSync(sanitizedPath);
  if (!stats.isDirectory()) {
    throw new Error(`Path is not a directory: ${sanitizedPath}`);
  }

  return sanitizedPath;
}

/**
 * Validates that all translation files have the same keys as the reference file
 * and that no values are empty
 */
function validateTranslations(localesDir: string): void {
  const referenceFilePath = join(localesDir, REFERENCE_FILE);
  const referenceKeys = JSON.parse(readFileSync(referenceFilePath, "utf-8"));
  const referenceKeySet = new Set(Object.keys(referenceKeys));

  console.log(`🔑 Total keys in reference ${REFERENCE_FILE}: ${referenceKeySet.size}\n`);

  // Get all locale files except the reference
  const files = readdirSync(localesDir).filter(
    file => file.endsWith(".json") && file !== REFERENCE_FILE,
  );

  if (files.length === 0) {
    console.log("⚠️  No other locale files found to validate");
    return;
  }

  let hasErrors = false;

  for (const file of files) {
    const filePath = join(localesDir, file);
    const translations = JSON.parse(readFileSync(filePath, "utf-8"));
    const translationsSet = new Set(Object.keys(translations));

    console.log(`\n Validating ${file}...`);

    // Check for missing keys
    const missingKeys: string[] = [];
    for (const refKey of referenceKeySet) {
      if (!translationsSet.has(refKey)) {
        missingKeys.push(refKey);
      }
    }

    // Check for empty values
    const emptyKeys: string[] = [];
    for (const [key, value] of Object.entries(translations)) {
      if (typeof value === "string" && value.trim() === "") {
        emptyKeys.push(key);
      }
    }

    // Check for extra keys (keys that don't exist in reference)
    const extraKeys: string[] = [];
    for (const key of translationsSet) {
      if (!referenceKeySet.has(key)) {
        extraKeys.push(key);
      }
    }

    // Report results for this file
    if (missingKeys.length === 0 && emptyKeys.length === 0 && extraKeys.length === 0) {
      console.log(`  ✅ All keys present and valid (${translationsSet.size} keys)`);
    } else {
      hasErrors = true;

      if (missingKeys.length > 0) {
        console.log(`  ❌ Missing keys: ${missingKeys.length}`);
        missingKeys.forEach(key => {
          console.log(`     - ${key}`);
        });
      }

      if (emptyKeys.length > 0) {
        console.log(`  ❌ Empty values: ${emptyKeys.length}`);
        emptyKeys.forEach(key => {
          console.log(`     - ${key}`);
        });
      }

      if (extraKeys.length > 0) {
        console.log(`  ⚠️  Extra keys (not in ${REFERENCE_FILE}): ${extraKeys.length}`);
        extraKeys.forEach(key => {
          console.log(`     - ${key}`);
        });
      }
    }
  }

  if (hasErrors) {
    process.exit(1);
  }
}

// Main execution
if (require.main === module) {
  const rawPath = process.argv[2];

  if (!rawPath) {
    console.error("❌ Error: Locales directory is required");
    process.exit(1);
  }

  try {
    const localesDir = sanitizeLocalesPath(rawPath);

    console.log("🚀 Translation Validator\n");
    console.log(`📂 Locales directory: ${localesDir}\n`);

    validateTranslations(localesDir);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`❌ Error: ${error.message}`);
    } else {
      console.error("❌ Error during validation:", error);
    }
    process.exit(1);
  }
}

export { validateTranslations };
