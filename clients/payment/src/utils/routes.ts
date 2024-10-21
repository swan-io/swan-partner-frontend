import { createGroup, createRouter } from "@swan-io/chicane";

export const Router = createRouter({
  Preview:
    "/preview/?:accentColor&:logo&:amount&:currency&:label&:card&:sepaDirectDebit&:merchantName",
  ...createGroup("Payment", "/:paymentLinkId", {
    Area: "/*",
    Form: "/?:error{true}",
    Success: "/success",
    Expired: "/expired",
  }),
});
