import { defineConfig } from "vitest/config";

/** @type {import('vitest/config').UserConfigFn} */
export default defineConfig({
  resolve: {
    alias: {
      "react-native": "react-native-web",
    },
  },
  test: {
    setupFiles: ["scripts/tests/testSetup.ts"],
    environment: "jsdom",
    watch: false,
    threads: false,
  },
});
