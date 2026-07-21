import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "react-native": "react-native-web",
    },
  },
  test: {
    environment: "jsdom",
    watch: false,
    include: ["clients/**/*.test.(ts|tsx)", "server/**/*.test.ts"],
    setupFiles: ["scripts/tests/testSetup.ts"],
  },
});
