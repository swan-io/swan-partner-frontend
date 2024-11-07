import react from "@vitejs/plugin-react-swc";
import fs from "node:fs";
import path from "pathe";
import { searchForWorkspaceRoot } from "vite";
import { defineConfig } from "vitest/config";

const root = path.resolve(__dirname, "./src");

const getLakePaths = () => {
  if (!fs.existsSync(path.resolve(__dirname, "../../.linked"))) {
    return []; // .linked doesn't exist
  }

  return [
    path.resolve(__dirname, "../../../lake/packages/lake"),
    path.resolve(__dirname, "../../../lake/packages/shared-business"),
  ];
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
  plugins: [react()],
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
