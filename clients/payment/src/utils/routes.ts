import { Option } from "@swan-io/boxed";
import { createGroup, createRouter } from "@swan-io/chicane";
import { P, match } from "ts-pattern";
import { projectConfiguration } from "./projectId";

export const routes = {
  ...createGroup("PaymentLink", "/payment", {
    Root: "/",
    Area: "/*",
  }),
} as const;

export const Router = createRouter(routes, {
  basePath: match(projectConfiguration)
    .with(
      Option.P.Some({ projectId: P.select(), mode: "MultiProject" }),
      projectId => `/projects/${projectId}`,
    )
    .otherwise(() => undefined),
});
