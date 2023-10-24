import legacy from "@vitejs/plugin-legacy";
import react from "@vitejs/plugin-react-swc";
import path from "pathe";
import { searchForWorkspaceRoot } from "vite";
import { defineConfig } from "vitest/config";

const root = path.resolve(__dirname, "./src");

const getLakePaths = () => {
  try {
    const { lake } = require("../../locale.config");
    return typeof lake === "string" ? [lake] : [];
  } catch {
    return []; // locale-config.js doesn't exist
  }
};

/** @type {import('vitest/config').UserConfigFn} */
export default defineConfig({
  root,
  build: {
    emptyOutDir: true,
    outDir: "../dist",
  },
  server: {
    fs: {
      allow: [
        // search up for workspace root
        searchForWorkspaceRoot(process.cwd()),
        // get assets from lake repository
        ...getLakePaths(),
      ],
    },
  },
  logLevel: "warn",
  plugins: [
    legacy({
      targets: ["defaults", "not IE 11"],
      polyfills: ["es.object.from-entries"],
    }),
    react(),
  ],
  resolve: {
    alias: {
      "react-native": "react-native-web",
    },
  },
  test: {
    environment: "jsdom",
    watch: false,
    threads: false,
  },
  envDir: path.resolve(__dirname, "../../env"),
  publicDir: "../public",
});
