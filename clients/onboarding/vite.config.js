import legacy from "@vitejs/plugin-legacy";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  root: path.resolve(__dirname, "./src"),
  build: {
    emptyOutDir: true,
    outDir: "../dist",
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
