import { createGroup, createRouter } from "@swan-io/chicane";

export const Router = createRouter(
  createGroup("Payment", "/:paymentLinkId", {
    Area: "/*",
    Form: "/?:error{true}",
    Success: "/success",
    Error: "/error",
    Expired: "/expired",
  }),
);
