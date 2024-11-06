import { Option } from "@swan-io/boxed";
import { InferRoutes, createGroup, createRouter } from "@swan-io/chicane";
import { P, match } from "ts-pattern";
import { projectConfiguration } from "./projectId";

const routes = {
  PopupCallback: "/swanpopupcallback?:redirectTo",

  ProjectLogin: "/login?:sessionExpired&:redirectTo",
  ProjectRootRedirect: "/?:to&:source",

  AccountClose: "/accounts/:accountId/close?:resourceId&:status",

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
        "/?:isAfterUpdatedAt&:isBeforeUpdatedAt&:paymentProduct[]&:search&:transactionStatus[]&:kind{transfer|standingOrder|beneficiary}&:consentId&:status",
        {
          Area: "/*",
          Root: "/",
          Detail: "/:transactionId",
          ...createGroup("Statements", "/statements", {
            Area: "/*",
            Root: "/monthly",
            Custom: "/custom?:period",
          }),
        },
      ),
      Upcoming: "/upcoming",
    }),

    ...createGroup(
      "Payments",
      "/payments?:kind{transfer|standingOrder|beneficiary}&:consentId&:status",
      {
        Area: "/*",
        Root: "/?:isAfterUpdatedAt&:isBeforeUpdatedAt&:search&:transactionStatus[]",
        New: "/new?:type{transfer|recurring|international|bulk}",
        RecurringTransferList: "/recurring-transfer/list",
        RecurringTransferNew: "/recurring-transfer/new",

        BeneficiariesNew: "/beneficiaries/new?:type{sepa|international}",

        // share filters
        ...createGroup("Beneficiaries", "/beneficiaries?:canceled{true}&:currency&:label&:type[]", {
          List: "/",
          Details: "/:beneficiaryId?:tab{details|transfers}&:new{transfer|international}&:search",
        }),

        ...createGroup("RecurringTransferDetails", "/recurring-transfer/:recurringTransferId", {
          Area: "/*",
          Root: "/",
          History: "/history",
        }),
      },
    ),

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

    ...createGroup("Merchants", "/merchants?:new", {
      Area: "/*",
      Root: "/?:new{true}",
      List: "/profiles?:status{Active|Inactive}",

      ...createGroup("Profile", "/:merchantProfileId", {
        Area: "/*",
        Settings: "/settings?:check{declare|next}",
        ...createGroup("PaymentLink", "/payment-links?:status{Active|Archived}&:search", {
          Area: "/*",
          List: "/",
          Details: "/:paymentLinkId",
        }),
      }),
    }),
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

type Routes = InferRoutes<typeof Router>;

export type RouteName = keyof Routes;
export type GetRouteParams<T extends RouteName> = Routes[T];

export const accountRoutes = [
  "AccountRoot",
  "AccountProfile",
  "AccountActivation",
  "AccountTransactionsArea",
  "AccountDetailsArea",
  "AccountPaymentsArea",
  "AccountCardsArea",
  "AccountMembersArea",
  "AccountMerchantsArea",
] as const satisfies RouteName[];

export const paymentRoutes = [
  "AccountPaymentsRoot",
  "AccountPaymentsNew",
  "AccountPaymentsRecurringTransferList",
  "AccountPaymentsRecurringTransferDetailsArea",
  "AccountPaymentsBeneficiariesList",
  "AccountPaymentsBeneficiariesDetails",
  "AccountPaymentsBeneficiariesNew",
] as const satisfies RouteName[];

export const accountTransactionsRoutes = [
  "AccountTransactionsListRoot",
  "AccountTransactionsListStatementsArea",
  "AccountTransactionsUpcoming",
  "AccountTransactionsListDetail",
] as const satisfies RouteName[];

export const membershipsRoutes = [
  "AccountMembersList",
  "AccountMembersDetailsArea",
] as const satisfies RouteName[];

export const membershipsDetailRoutes = [
  "AccountMembersDetailsRoot",
  "AccountMembersDetailsRights",
  "AccountMembersDetailsCardList",
] as const satisfies RouteName[];
