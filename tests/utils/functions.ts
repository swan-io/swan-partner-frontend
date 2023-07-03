import fs from "node:fs/promises";
import { testResultsDir } from "../../playwright.config";

export const seconds = (value: number) => value * 1000;
export const minutes = (value: number) => value * seconds(60);

export const log = {
  success: (text: string) => console.log(`[${new Date().toISOString()}] ✓ ${text}`),
  info: (text: string) => console.info(`[${new Date().toISOString()}] ℹ ${text}`),
  debug: (text: string) => console.debug(`[${new Date().toISOString()}] ℹ ${text}`),
  error: (text: string) => console.error(`[${new Date().toISOString()}] ✕ ${text}`),
};

const isObject = (value: unknown) =>
  value != null && typeof value === "object" && !Array.isArray(value);

export const deepMerge = <T extends Record<PropertyKey, unknown>>(target: T, source: T): T => {
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      if (isObject(source[key])) {
        if (target[key] == null) {
          Object.assign(target, { [key]: {} });
        }

        // @ts-expect-error
        deepMerge(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return target;
};

export const fetchOk = (input: string, init?: RequestInit) =>
  fetch(input, init).then(async response => {
    if (!response.ok) {
      throw new Error(`Fetch failed (${response.status}): ${await response.text()}`);
    }

    return response;
  });

export const wait = (ms: number) =>
  new Promise<void>(resolve => {
    setTimeout(resolve, ms);
  });

export const retry = <T>(
  getPromise: () => Promise<T>,
  { attempts = 30, delay = seconds(2) }: { attempts?: number; delay?: number } = {},
): Promise<T> => {
  const safeAttempts = Math.max(attempts, 1);

  return getPromise().catch((error: unknown) =>
    safeAttempts > 1
      ? wait(delay).then(() => retry(getPromise, { attempts: safeAttempts - 1, delay }))
      : Promise.reject(error),
  );
};

export const createTestResultsDir = () => fs.mkdir(testResultsDir);
export const deleteTestResultsDir = () => fs.rm(testResultsDir, { force: true, recursive: true });

export function assertIsDefined<T>(value: T): asserts value is NonNullable<T> {
  if (value == null) {
    throw new Error(`Expected value to be defined, but received ${JSON.stringify(value, null, 2)}`);
  }
}

export function assertTypename<T extends string, E extends T>(
  input: { __typename: T } | null | undefined,
  expected: E,
): asserts input is { __typename: E } {
  if (input != null && input.__typename !== expected) {
    throw new Error(`__typename is not "${expected}":\n${JSON.stringify(input, null, 2)}`);
  }
}
