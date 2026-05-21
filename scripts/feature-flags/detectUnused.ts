import deepEqual from "fast-deep-equal";
import glob from "fast-glob";
import fs from "node:fs";
import path from "pathe";

const TGGL_SERVER_KEY = process.env.TGGL_SERVER_KEY;

if (TGGL_SERVER_KEY == null) {
  throw new Error("TGGL_SERVER_KEY is not defined");
}

const findFeatureFlagsUsage = (code: string): { line: number; flag: string }[] => {
  // Remove newlines between useFlag and its arguments to simplify regex matching by line
  // Because formatter could split the line between useFlag and its arguments
  const simplifiedCode = code.replace(/useFlag\(\n/g, "useFlag\(").replace(/ /g, "");

  const usage: { line: number; flag: string }[] = [];
  const lines = simplifiedCode.split("\n");
  const regex = /useFlag\("(.+)"/g;

  lines.forEach((line, index) => {
    const matches = [...line.matchAll(regex)];
    if (matches[0]?.[1] != null) {
      const flagName = matches[0][1];
      usage.push({ line: index + 1, flag: flagName });
    }
  });

  return usage;
};

const listFiles = (): string[] => {
  const repositoryRoot = path.resolve(__dirname, "../../");
  const codeSrc = path.resolve(__dirname, "../../clients");
  const filePaths = glob.sync(`${codeSrc}/**/*.{ts,tsx}`);

  return filePaths.map(filePath => path.relative(repositoryRoot, filePath));
};

const findRepositoryUsage = (): { filename: string; line: number; flag: string }[] => {
  const fileList = listFiles();
  const usageList: { filename: string; line: number; flag: string }[] = [];

  fileList.forEach(filePath => {
    const code = fs.readFileSync(filePath, "utf-8");
    const usage = findFeatureFlagsUsage(code);
    usage.forEach(u => {
      usageList.push({ filename: filePath, line: u.line, flag: u.flag });
    });
  });

  return usageList;
};

type TgglFlagConfigVariation<T> = {
  active: boolean;
  value: T;
};

type TgglFlagConfig<T> = {
  slug: string;
  conditions: {
    rules: unknown[]; // we don't need to type this as we won't use it
    variation: TgglFlagConfigVariation<T>;
  }[];
  defaultVariation: TgglFlagConfigVariation<T>;
};

const getFeatureFlagsConfig = async (): Promise<TgglFlagConfig<unknown>[]> => {
  const response = await fetch("https://api.tggl.io/config", {
    headers: {
      "x-tggl-api-key": TGGL_SERVER_KEY,
    },
  });

  return response.json();
};

const hasFeatureFlagVariations = (config: TgglFlagConfig<unknown>): boolean => {
  return config.conditions.some(
    condition =>
      condition.variation.active &&
      !deepEqual(condition.variation.value, config.defaultVariation.value),
  );
};

const main = async () => {
  const usageList = findRepositoryUsage();
  const ffConfig = await getFeatureFlagsConfig();
  const flagsWithoutVariations = ffConfig
    .filter(config => !hasFeatureFlagVariations(config))
    .map(config => config.slug);

  const unusedFlags = usageList
    .filter(usage => flagsWithoutVariations.includes(usage.flag))
    .map(usage => ({
      defaultValue: JSON.stringify(
        ffConfig.find(config => config.slug === usage.flag)?.defaultVariation.value,
      ),
      filename: usage.filename,
      line: usage.line,
      flag: usage.flag,
    }));

  if (unusedFlags.length === 0) {
    console.log("No unused feature flag found. All good!");
  } else {
    console.log("Found some feature flags without variations:");
    unusedFlags.forEach(usage => {
      console.log(
        `- ${usage.filename}:${usage.line} | ${usage.flag} (default value: ${usage.defaultValue})`,
      );
    });
  }
};

main().catch(error => {
  console.error("Error:", error);
  process.exit(1);
});
