import { createGroup, createRouter, InferRoutes } from "@swan-io/chicane";

export const Router = createRouter({
  Preview:
    "/preview/?:accentColor&:logo&:amount&:currency&:label&:card&:sepaDirectDebit&:merchantName&:cancelUrl",
  ...createGroup("Payment", "/:paymentLinkId", {
    Area: "/*",
    Form: "/?:error{true}",
    Success: "/success",
    Expired: "/expired",
  }),
});

type Routes = InferRoutes<typeof Router>;

export type RouteName = keyof Routes;
export type GetRouteParams<T extends RouteName> = Routes[T];
