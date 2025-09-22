import { FastifyInstance, RouteHandlerMethod } from "fastify";
import fs from "node:fs/promises";
import path from "pathe";
import { match, P } from "ts-pattern";
import { PackageJson } from "type-fest";
import { CorsOptions } from "vite";
import { AppName, getAppNameByHostName } from "../app";

export const startDevServer = async (app: FastifyInstance, corsOptions: CorsOptions) => {
  const { createServer, searchForWorkspaceRoot } = await import("vite");
  const jsonc = await import("jsonc-parser");
  const react = await import("@vitejs/plugin-react-swc").then(_ => _.default);

  const workspaceRoot = searchForWorkspaceRoot(process.cwd());
  const tsConfigPath = path.join(workspaceRoot, "tsconfig.json");
  const tsConfig = await fs.readFile(tsConfigPath, "utf-8");

  const extraConfig = await match(process.env.LAKE_PATH)
    .returnType<Promise<{ allow: string[]; alias: Record<string, string> }>>()
    .with(P.string, async LAKE_PATH => {
      const lakeRepositoryRoot = path.resolve(process.cwd(), LAKE_PATH);
      const lakeModulesRoot = path.join(lakeRepositoryRoot, "node_modules");
      const lakePackageRoot = path.join(lakeRepositoryRoot, "packages", "lake");

      const sharedBusinessPackageRoot = path.join(
        lakeRepositoryRoot,
        "packages",
        "shared-business",
      );

      const dependencies = Object.keys(
        await Promise.all([
          import(path.join(lakePackageRoot, "package.json")),
          import(path.join(sharedBusinessPackageRoot, "package.json")),
        ]).then(([lake, sharedBusiness]: [PackageJson, PackageJson]) => ({
          ...lake.dependencies,
          ...sharedBusiness.dependencies,
        })),
      );

      return {
        allow: [lakeModulesRoot, lakePackageRoot, sharedBusinessPackageRoot],
        alias: {
          "@swan-io/lake": lakePackageRoot,
          "@swan-io/shared-business": sharedBusinessPackageRoot,
          ...Object.fromEntries(dependencies.map(name => [name, path.join(lakeModulesRoot, name)])),
          // Extra imports paths
          "@placekit/client-js/lite": path.join(lakeModulesRoot, "@placekit/client-js"),
        },
      };
    })
    .otherwise(async () => ({
      allow: [],
      alias: {},
    }));

  const tsConfigEdits = jsonc.modify(
    tsConfig,
    ["compilerOptions", "paths"],
    match(process.env.LAKE_PATH)
      .with(P.string, LAKE_PATH => ({
        "@swan-io/lake/*": [`${LAKE_PATH}/packages/lake/*`],
        "@swan-io/shared-business/*": [`${LAKE_PATH}/packages/shared-business/*`],
      }))
      .otherwise(() => ({})),
    { formattingOptions: { insertSpaces: true, tabSize: 2 } },
  );

  await fs.writeFile(tsConfigPath, jsonc.applyEdits(tsConfig, tsConfigEdits), "utf-8");

  const vite = await createServer({
    plugins: [react()],
    logLevel: "warn",
    appType: "custom",
    optimizeDeps: { force: true },
    resolve: {
      alias: {
        "react-native": "react-native-web",
        ...extraConfig.alias,
      },
    },
    server: {
      allowedHosts: [".swan.local"],
      cors: corsOptions,
      middlewareMode: true,
      hmr: { server: app.server },
      fs: {
        allow: [
          path.join(workspaceRoot, "node_modules"),
          path.join(workspaceRoot, "clients"),
          path.join(workspaceRoot, "scripts", "graphql", "dist"),
          ...extraConfig.allow,
        ],
      },
    },
  });

  const { root } = vite.config;
  app.use(vite.middlewares);

  const getTemplate = async (appName: AppName) => {
    const template = await fs.readFile(path.join(root, "clients", appName, "index.html"), "utf-8");
    return template.replace("/src/", `/clients/${appName}/src/`);
  };

  const templates: Record<AppName, string> = {
    banking: await getTemplate("banking"),
    onboarding: await getTemplate("onboarding"),
    payment: await getTemplate("payment"),
  };

  const handler: RouteHandlerMethod = async (request, reply) => {
    const appName = getAppNameByHostName(request.hostname);

    if (appName == null) {
      return reply.notFound();
    }

    try {
      const html = await vite.transformIndexHtml(request.originalUrl, templates[appName]);
      return reply.type("text/html").send(html);
    } catch (error) {
      vite.ssrFixStacktrace(error as Error);
      return reply.internalServerError((error as Error).message);
    }
  };

  app.get("/*", handler);
  app.post("/*", handler);
};
