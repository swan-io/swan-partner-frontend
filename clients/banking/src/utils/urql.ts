import { Option } from "@swan-io/boxed";
import { getLocation } from "@swan-io/chicane";
import { last } from "@swan-io/lake/src/utils/array";
import { isNotNullish, isNullish } from "@swan-io/lake/src/utils/nullish";
import { CombinedError, Operation, OperationContext, OperationResult } from "@urql/core";
import { cacheExchange } from "@urql/exchange-graphcache";
import { relayPagination } from "@urql/exchange-graphcache/extras";
import { IntrospectionQuery } from "graphql";
import { P, match } from "ts-pattern";
import { Except, SetRequired } from "type-fest";
import {
  AnyVariables,
  Client,
  UseQueryArgs,
  UseQueryResponse,
  UseQueryState,
  dedupExchange,
  errorExchange,
  fetchExchange,
  useQuery,
} from "urql";
import { GraphCacheConfig } from "../graphql/graphcache";
import schema from "../graphql/introspection.json";
import { requestIdExchange } from "./exchanges/requestIdExchange";
import { logBackendError } from "./logger";
import { projectConfiguration } from "./projectId";
import { Router } from "./routes";

const cache = cacheExchange<GraphCacheConfig>({
  schema: schema as unknown as IntrospectionQuery,
  keys: {
    // TODO: Check for cache keys identifiers
    // https://studio.apollographql.com/graph/swan-io-admin/schema/reference/objects
    AccountBalances: _data => null,
    AccountHolderCompanyInfo: _data => null,
    AccountHolderIndividualInfo: _data => null,
    AccountMembershipBindingUserErrorStatusInfo: _data => null,
    AccountMembershipConsentPendingStatusInfo: _data => null,
    AccountMembershipDisabledStatusInfo: _data => null,
    AccountMembershipEnabledStatusInfo: _data => null,
    AccountMembershipInvitationSentStatusInfo: _data => null,
    AccountOpenedStatus: _data => null,
    Address: _data => null,
    AddressInfo: _data => null,
    Amount: _data => null,
    Authenticator: _data => null,
    Bank: _data => null,
    BookedTransactionStatusInfo: _data => null,
    CanceledTransactionStatusInfo: _data => null,
    CardCanceledStatusInfo: _data => null,
    CardConsentPendingStatusInfo: _data => null,
    CardEnabledStatusInfo: _data => null,
    IdentificationLevels: _data => null,
    InvalidIban: ({ iban }) => iban ?? null,
    PdfStatement: _data => null,
    PendingTransactionStatusInfo: _data => null,
    PhysicalCard: _data => null,
    PhysicalCardToActivateStatusInfo: _data => null,
    Reachability: _data => null,
    RejectedTransactionStatusInfo: _data => null,
    ReleasedTransactionStatusInfo: _data => null,
    RestrictedTo: _data => null,
    SEPABeneficiary: _data => null, // contains an ID by it's always null
    SEPADirectDebitOutCreditor: _data => null,
    SEPACreditTransferInCreditor: _data => null,
    SEPACreditTransferInDebtor: _data => null,
    SEPACreditTransferOutCreditor: _data => null,
    SEPACreditTransferOutDebtor: _data => null,
    Spending: _data => null,
    SpendingLimit: _data => null,
    StandingOrderCanceledStatusInfo: _data => null,
    StandingOrderEnabledStatusInfo: _data => null,
    SupportingDocumentCollectionApprovedStatusInfo: _data => null,
    SupportingDocumentCollectionPendingReviewStatusInfo: _data => null,
    SupportingDocumentPurpose: _data => null,
    SupportingDocumentSettings: _data => null,
    ValidIban: ({ iban }) => iban ?? null,
    WebBankingSettings: _data => null,
  },

  resolvers: {
    Query: {
      accounts: relayPagination({ mergeMode: "inwards" }),
      accountMemberships: relayPagination({ mergeMode: "inwards" }),
      cards: relayPagination({ mergeMode: "inwards" }),
    },
    AccountMembership: {
      cards: relayPagination({ mergeMode: "inwards" }),
    },
    Account: {
      invoices: relayPagination({ mergeMode: "inwards" }),
      memberships: relayPagination({ mergeMode: "inwards" }),
      statements: relayPagination({ mergeMode: "inwards" }),
      // TODO Uncomment for transfert section revamp
      // standingOrders: relayPagination({ mergeMode: "inwards" }),
      transactions: relayPagination({ mergeMode: "inwards" }),
      virtualIbanEntries: relayPagination({ mergeMode: "inwards" }),
    },
    Card: {
      transactions: relayPagination({ mergeMode: "inwards" }),
    },
    StandingOrder: {
      payments: relayPagination({ mergeMode: "inwards" }),
    },
    User: {
      accountMemberships: relayPagination({ mergeMode: "inwards" }),
    },
  },
});

const onError = (error: CombinedError, operation: Operation) => {
  const response = error.response as Partial<Response> | undefined;
  const is401 = response?.status === 401;

  if (is401) {
    const { path } = getLocation();

    if (last(path) === "login") {
      return;
    }

    Router.push("ProjectLogin");
  } else {
    logBackendError(error, operation);
  }
};

export const unauthenticatedContext: OperationContext = {
  url: `/api/unauthenticated`,
  requestPolicy: "network-only",
  suspense: true,
  fetchOptions: () => ({ credentials: "include" }),
};

export const partnerApiClient = new Client({
  url: `/api/partner`,
  requestPolicy: "network-only",
  suspense: true,
  fetchOptions: {
    credentials: "include",
    headers: match(projectConfiguration)
      .with(Option.pattern.Some({ projectId: P.select(), mode: "MultiProject" }), projectId => ({
        "impersonated-project-id": projectId,
      }))
      .otherwise(() => ({})),
  },
  exchanges: [dedupExchange, cache, requestIdExchange, errorExchange({ onError }), fetchExchange],
});

export const parseOperationResult = <T>({ error, data }: OperationResult<T>): T => {
  if (isNotNullish(error)) {
    throw error;
  }

  if (isNullish(data)) {
    throw new CombinedError({
      networkError: new Error("No Content"),
    });
  }

  return data;
};

export const useQueryWithErrorBoundary = <
  Data = unknown,
  Variables extends AnyVariables = AnyVariables,
>(
  options: UseQueryArgs<Variables, Data>,
): [
  SetRequired<Except<UseQueryState<Data, Variables>, "fetching" | "error">, "data">,
  UseQueryResponse[1],
] => {
  const [{ fetching, data, error, ...rest }, reexecuteQuery] = useQuery<Data, Variables>(options);

  if (isNotNullish(error)) {
    throw error;
  }

  if (isNullish(data)) {
    throw new CombinedError({
      networkError: new Error("No Content"),
    });
  }

  return [{ data, ...rest }, reexecuteQuery];
};
