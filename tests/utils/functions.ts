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

export const resolveAfter = (ms: number) =>
  new Promise<void>(resolve => {
    setTimeout(resolve, ms);
  });

export const createTestResultsDir = () => fs.mkdir(testResultsDir);
export const deleteTestResultsDir = () => fs.rm(testResultsDir, { force: true, recursive: true });
