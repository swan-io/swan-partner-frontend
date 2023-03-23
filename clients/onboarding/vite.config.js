import { Result } from "@swan-io/boxed";
import legacy from "@vitejs/plugin-legacy";
import react from "@vitejs/plugin-react-swc";
import fs from "fs";
import os from "os";
import path from "path";
import { defineConfig } from "vite";

const getLakeAbsolutePath = () => {
  try {
    const filePath = path.resolve(process.cwd(), "lake-path.txt");
    const file = fs.readFileSync(filePath, "utf-8").split(os.EOL)[0];
    const absolutePath = path.resolve(process.cwd(), file);

    return Result.Ok(absolutePath);
  } catch (e) {
    return Result.Error(e);
  }
};

const root = path.resolve(__dirname, "./src");

export default defineConfig({
  root,
  build: {
    emptyOutDir: true,
    outDir: "../dist",
  },
  server: {
    fs: {
      // gives the possibility to load assets from lake repository
      allow: getLakeAbsolutePath()
        .map(p => [root, p])
        .toOption()
        .toUndefined(),
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
