// jest-dom adds custom jest matchers for asserting on DOM nodes
// learn more: https://github.com/testing-library/jest-dom
import matchers from "@testing-library/jest-dom/matchers";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import localizedFormat from "dayjs/plugin/localizedFormat";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";
import * as dotenv from "dotenv";
import path from "path";
import { expect } from "vitest";

// @ts-expect-error
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
expect.extend(matchers);

// https://day.js.org/docs/en/plugin/plugin
dayjs.extend(utc);
dayjs.extend(customParseFormat);
dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);

const { parsed: env = {} } = dotenv.config({
  path: path.resolve(__dirname, "../../.env.example"),
});

Object.assign(
  globalThis,
  Object.keys(env).reduce(
    (acc, key) => ({
      ...acc,
      [`__SWAN_ENV_${key}__`]: env[key],
    }),
    {},
  ),
);

// https://jestjs.io/docs/en/manual-mocks#mocking-methods-which-are-not-implemented-in-jsdom
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: unknown) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    addListener: () => {}, // deprecated
    dispatchEvent: () => {},
    removeEventListener: () => {},
    removeListener: () => {}, // deprecated
  }),
});
