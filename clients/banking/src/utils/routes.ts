import { Option } from "@swan-io/boxed";
import { createGroup, createRouter } from "@swan-io/chicane";
import { match, P } from "ts-pattern";
import { projectConfiguration } from "./projectId";

const routes = {
  PopupCallback: "/swanpopupcallback",

  ProjectLogin: "/login",
  ProjectRootRedirect: "/?:to&:source",

  ...createGroup("Account", "/:accountMembershipId", {
    Area: "/*",
    Root: "/",
    Profile: "/profile",
    Activation: "/activation",

    ...createGroup("Details", "/details", {
      Area: "/*",
      Iban: "/iban",
      VirtualIbans: "/virtual-ibans",
      Settings: "/settings",
      Billing: "/billing",
    }),

    ...createGroup("Transactions", "/transactions", {
      Area: "/*",
      ...createGroup(
        "List",
        // transactionStatus[] is for filters
        // status is the consent status automatically set by consent redirection
        "/?:isAfterUpdatedAt&:isBeforeUpdatedAt&:paymentProduct[]&:search&:transactionStatus[]&:standingOrder&:consentId&:status",
        {
          Area: "/*",
          Root: "/",
          Statements: "/statements",
        },
      ),
      Upcoming: "/upcoming",
    }),

    ...createGroup("PaymentsV2", "/v2/payments", {
      Area: "/*",
      Root: "/",
      New: "/new",
      StandingOrderNew: "/standing-orders/new",

      ...createGroup("StandingOrdersDetails", "/standing-orders/:standingOrderId", {
        Area: "/*",
        Root: "/",
        History: "/history",
      }),
    }),

    PaymentsArea: "/payments/*",
    Payments: "/payments",
    PaymentsNew: "/payments/new",
    PaymentsSuccess: "/payments/:paymentId/success",
    PaymentsFailure: "/payments/:paymentId/failure",
    PaymentsConsent: "/payments/consent/callback?:standingOrder&:consentId",
    PaymentsStandingOrderSuccess: "/payments/:standingOrderId/success",
    PaymentsStandingOrderFailure: "/payments/:standingOrderId/failure",
    PaymentsStandingOrderNew: "/payments/standing-order/new",

    StandingOrdersArea: "/standing-orders/*",
    StandingOrders: "/standing-orders",
    StandingOrdersEdit: "/standing-orders/edit/:standingOrderId",
    StandingOrdersHistory: "/standing-orders/history/:standingOrderId",

    ...createGroup("Cards", "/cards?:new", {
      Area: "/*",
      List: "/?:search&:statuses[]&:type[]",
      ItemArea: "/:cardId/*",
      Item: "/:cardId",
      ItemPhysicalCard: "/:cardId/physical-card",
      ItemMobilePayment: "/:cardId/mobile-payment",
      ItemTransactions:
        "/:cardId/transactions?:isAfterUpdatedAt&:isBeforeUpdatedAt&:search&:status[]",
      ItemSettings: "/:cardId/settings",
      ItemOrder: "/:cardId/order",
      ItemOrderAddress: "/:cardId/order/address",
    }),

    ...createGroup(
      "Members",
      "/members?:new&:statuses[]&:canInitiatePayments&:canManageAccountMembership&:canManageBeneficiaries&:search&:resourceId&:status",
      {
        Area: "/*",
        List: "/",
        ...createGroup("Details", "/:editingAccountMembershipId?:showInvitationLink", {
          Area: "/*",
          Root: "/",
          Rights: "/rights",
          CardList: "/cards/?:cardSearch&:cardStatuses[]&:cardType[]&:newCard",
        }),
      },
    ),
  }),
} as const;

export type RouteName = keyof typeof routes;

export const accountMinimalRoutes = [
  "AccountRoot",
  "AccountProfile",
  "AccountStandingOrders",
  "AccountStandingOrdersEdit",
  "AccountStandingOrdersHistory",
] as const;

export const historyMenuRoutes = ["AccountTransactionsArea", "AccountActivation"] as const;

export const paymentMenuRoutes = [
  "AccountPayments",
  "AccountPaymentsNew",
  "AccountPaymentsSuccess",
  "AccountPaymentsFailure",
  "AccountPaymentsConsent",
  "AccountPaymentsStandingOrderSuccess",
  "AccountPaymentsStandingOrderFailure",

  "AccountPaymentsV2Area",
] as const;

export const paymentRoutesV2 = [
  "AccountPaymentsV2Root",
  "AccountPaymentsV2New",
  "AccountPaymentsV2StandingOrderNew",
] as const;

export const memberMenuRoutes = [
  "AccountMembers",
  "AccountMembersNew",
  "AccountMembersEdit",
] as const;

export const accountAreaRoutes = [
  "AccountTransactionsArea",
  "AccountPaymentsArea",
  "AccountStandingOrdersArea",
  "AccountCardsArea",
  "AccountMembersArea",
  "AccountDetailsArea",
] as const;

export const accountTransactionsRoutes = [
  "AccountTransactionsListRoot",
  "AccountTransactionsListStatements",
  "AccountTransactionsUpcoming",
] as const;

export const membershipsRoutes = ["AccountMembersList", "AccountMembersDetailsArea"] as const;

export const membershipsDetailRoutes = [
  "AccountMembersDetailsRoot",
  "AccountMembersDetailsRights",
  "AccountMembersDetailsCardList",
] as const;

export const Router = createRouter(routes, {
  basePath: match(projectConfiguration)
    .with(
      Option.pattern.Some({ projectId: P.select(), mode: "MultiProject" }),
      projectId => `/projects/${projectId}`,
    )
    .otherwise(() => undefined),
});
