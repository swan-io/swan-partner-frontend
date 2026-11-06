import { cleanup } from "@testing-library/react";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import localizedFormat from "dayjs/plugin/localizedFormat";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";
import dotenv from "dotenv";
import path from "pathe";
import { afterEach } from "vitest";

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

// mirrors the `window.__env` sent by the server (see server/src/app.ts `/env.js`):
// only the keys it exposes, never the server-only ones
// @ts-expect-error
globalThis.__env = {
  VERSION: "0.0.0",
  SWAN_ENVIRONMENT: "SANDBOX",
  ACCOUNT_MEMBERSHIP_INVITATION_MODE: "SWAN_EMAIL",
  BANKING_URL: env.BANKING_URL,
  PAYMENT_URL: env.PAYMENT_URL,
  SWAN_PROJECT_ID: undefined,
  IS_SWAN_MODE: true,
  ...Object.fromEntries(Object.entries(env).filter(([key]) => key.startsWith("CLIENT_"))),
};

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

// jsdom doesn't implement ResizeObserver / IntersectionObserver (used by Lake's VirtualizedList)
class NoopObserver {
  root = null;
  rootMargin = "";
  thresholds = [];
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

globalThis.ResizeObserver ??= NoopObserver;
// @ts-expect-error partial implementation
globalThis.IntersectionObserver ??= NoopObserver;

// Vitest `globals` is disabled, so React Testing Library can't register its auto-cleanup
afterEach(() => {
  cleanup();
});
