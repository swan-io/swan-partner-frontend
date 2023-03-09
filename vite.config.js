import { defineConfig } from "vite";

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
