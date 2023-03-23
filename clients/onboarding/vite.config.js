import legacy from "@vitejs/plugin-legacy";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { defineConfig } from "vite";

const root = path.resolve(__dirname, "./src");

const getAllowedPaths = () => {
  try {
    const localeConfig = require("../../locale.config");
    const lakePath = localeConfig.default.lake;

    return typeof lakePath === "string" ? [root, lakePath] : undefined;
  } catch (e) {
    // if locale-config.js is not present `server.fs.allow` will be undefined
  }
};

export default defineConfig({
  root,
  build: {
    emptyOutDir: true,
    outDir: "../dist",
  },
  server: {
    fs: {
      // gives the possibility to load assets from lake repository
      allow: getAllowedPaths(),
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
