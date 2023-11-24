import { createRouter } from "@swan-io/chicane";

export const Router = createRouter({
  PaymentLink: "/payment/:paymentLinkId",
  Success: "/payment/success",
  Error: "/payment/error",
});
