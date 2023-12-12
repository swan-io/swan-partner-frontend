import { Option } from "@swan-io/boxed";
import { createGroup, createRouter } from "@swan-io/chicane";
import { P, match } from "ts-pattern";
import { projectConfiguration } from "./projectId";

const routes = {
  PopupCallback: "/swanpopupcallback",

  ProjectLogin: "/login?:sessionExpired",
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
          ...createGroup("Statements", "/statements", {
            Area: "/*",
            Root: "/monthly",
            Custom: "/custom?:period",
          }),
        },
      ),
      Upcoming: "/upcoming",
    }),

    ...createGroup("Payments", "/payments?:standingOrder&:consentId&:status", {
      Area: "/*",
      Root: "/?:isAfterUpdatedAt&:isBeforeUpdatedAt&:search&:transactionStatus[]",
      New: "/new?:type",
      RecurringTransferList: "/recurring-transfer/list",
      RecurringTransferNew: "/recurring-transfer/new",

      ...createGroup("RecurringTransferDetails", "/recurring-transfer/:recurringTransferId", {
        Area: "/*",
        Root: "/",
        History: "/history",
      }),
    }),

    ...createGroup("Cards", "/cards?:new", {
      Area: "/*",
      List: "/?:search&:status&:type[]",
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
      "/members?:new&:statuses[]&:canInitiatePayments&:canManageAccountMembership&:canViewAccount&:canManageCards&:canManageBeneficiaries&:search&:resourceId&:status",
      {
        Area: "/*",
        List: "/",
        ...createGroup("Details", "/:editingAccountMembershipId?:showInvitationLink", {
          Area: "/*",
          Root: "/",
          Rights: "/rights",
          CardList: "/cards/?:cardSearch&:cardStatus&:cardType[]&:newCard",
        }),
      },
    ),
  }),
} as const;

export type RouteName = keyof typeof routes;

export const accountMinimalRoutes = ["AccountRoot", "AccountProfile"] as const;

export const historyMenuRoutes = ["AccountTransactionsArea", "AccountActivation"] as const;

export const paymentMenuRoutes = ["AccountPaymentsArea"] as const;

export const paymentRoutes = [
  "AccountPaymentsRoot",
  "AccountPaymentsNew",
  "AccountPaymentsRecurringTransferList",
  "AccountPaymentsRecurringTransferDetailsArea",
] as const;

export const accountAreaRoutes = [
  "AccountTransactionsArea",
  "AccountPaymentsArea",
  "AccountCardsArea",
  "AccountMembersArea",
  "AccountDetailsArea",
] as const;

export const accountTransactionsRoutes = [
  "AccountTransactionsListRoot",
  "AccountTransactionsListStatementsArea",
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
      Option.P.Some({ projectId: P.select(), mode: "MultiProject" }),
      projectId => `/projects/${projectId}`,
    )
    .otherwise(() => undefined),
});
