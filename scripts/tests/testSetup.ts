import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import localizedFormat from "dayjs/plugin/localizedFormat";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";
import dotenv from "dotenv";
import path from "pathe";

// @ts-expect-error
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

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
