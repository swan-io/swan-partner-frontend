import { createGroup, createRouter } from "@swan-io/chicane";

export const Router = createRouter(
  createGroup("Payment", "/:paymentLinkId", {
    Area: "/*",
    Form: "/",
    Success: "/success",
    Error: "/error",
  }),
);
