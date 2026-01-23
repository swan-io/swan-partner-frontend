import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "react-native": "react-native-web",
      "node:buffer": "buffer",
    },
  },
  test: {
    environment: "jsdom",
    watch: false,
    include: ["clients/**/*.test.(ts|tsx)"],
    setupFiles: ["scripts/tests/testSetup.ts"],
  },
});
