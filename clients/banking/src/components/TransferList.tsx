import { useQuery } from "@swan-io/graphql-client";
import { Box } from "@swan-io/lake/src/components/Box";
import { EmptyView } from "@swan-io/lake/src/components/EmptyView";
import { FocusTrapRef } from "@swan-io/lake/src/components/FocusTrap";
import { ListRightPanel } from "@swan-io/lake/src/components/ListRightPanel";
import { PlainListViewPlaceholder } from "@swan-io/lake/src/components/PlainListView";
import { Pressable } from "@swan-io/lake/src/components/Pressable";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { breakpoints, spacings } from "@swan-io/lake/src/constants/design";
import { isNotNullish, nullishOrEmptyToUndefined } from "@swan-io/lake/src/utils/nullish";
import { useCallback, useMemo, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import { isMatching, P } from "ts-pattern";
import { ErrorView } from "../components/ErrorView";
import { TransactionDetail } from "../components/TransactionDetail";
import { TransactionList } from "../components/TransactionList";
import { TransactionListPageDocument } from "../graphql/partner";
import { usePermissions } from "../hooks/usePermissions";
import { t } from "../utils/i18n";
import { Router } from "../utils/routes";
import { Connection } from "./Connection";
import {
  defaultFiltersDefinition,
  TransactionFilters,
  TransactionListFilter,
} from "./TransactionListFilter";

const styles = StyleSheet.create({
  root: {
    ...commonStyles.fill,
  },
  filters: {
    paddingHorizontal: spacings[24],
    paddingBottom: spacings[12],
  },
  filtersLarge: {
    paddingHorizontal: spacings[40],
  },
});

const NUM_TO_RENDER = 20;

type Props = {
  accountId: string;
  accountMembershipId: string;
  params: {
    isAfterUpdatedAt?: string | undefined;
    isBeforeUpdatedAt?: string | undefined;
    search?: string | undefined;
    transactionStatus?: string[] | undefined;
  };
};

const DEFAULT_STATUSES = [
  "Booked" as const,
  "Canceled" as const,
  "Pending" as const,
  "Rejected" as const,
];

export const TransferList = ({ accountId, accountMembershipId, params }: Props) => {
  const filters = useMemo<TransactionFilters>(
    () => ({
      includeRejectedWithFallback: false,
      isAfterUpdatedAt: params.isAfterUpdatedAt,
      isBeforeUpdatedAt: params.isBeforeUpdatedAt,
      paymentProduct: undefined,
      status: params.transactionStatus?.filter(
        isMatching(P.union("Booked", "Canceled", "Pending", "Rejected", "Released")),
      ),
    }),
    [params.isAfterUpdatedAt, params.isBeforeUpdatedAt, params.transactionStatus],
  );

  const paymentProduct = useMemo(() => {
    return [
      "SEPACreditTransfer" as const,
      "InternalCreditTransfer" as const,
      "InternationalCreditTransfer" as const,
    ];
  }, []);

  const search = nullishOrEmptyToUndefined(params.search);
  const hasSearchOrFilters = isNotNullish(search) || Object.values(filters).some(isNotNullish);

  const { canReadOtherMembersCards: canQueryCardOnTransaction } = usePermissions();
  const [data, { isLoading, reload, setVariables }] = useQuery(TransactionListPageDocument, {
    accountId,
    first: NUM_TO_RENDER,
    filters: {
      ...filters,
      paymentProduct,
      search,
      status: filters.status ?? DEFAULT_STATUSES,
    },
    canQueryCardOnTransaction,
  });

  const [activeTransactionId, setActiveTransactionId] = useState<string | null>(null);

  const panelRef = useRef<FocusTrapRef | null>(null);

  const onActiveRowChange = useCallback(
    (element: HTMLElement) => panelRef.current?.setInitiallyFocusedElement(element),
    [],
  );

  return (
    <ResponsiveContainer style={styles.root} breakpoint={breakpoints.large}>
      {({ large }) => (
        <>
          <Box style={[styles.filters, large && styles.filtersLarge]}>
            <TransactionListFilter
              available={["isAfterUpdatedAt", "isBeforeUpdatedAt", "status"]}
              large={large}
              filters={filters}
              search={search}
              onRefresh={reload}
              onChangeFilters={({ status, ...filters }) =>
                Router.replace("AccountPaymentsRoot", {
                  ...params,
                  accountMembershipId,
                  transactionStatus: status,
                  ...filters,
                })
              }
              onChangeSearch={search => {
                Router.replace("AccountPaymentsRoot", {
                  ...params,
                  accountMembershipId,
                  search,
                });
              }}
              filtersDefinition={{
                ...defaultFiltersDefinition,
                paymentProduct: {
                  ...defaultFiltersDefinition.paymentProduct,
                  items: defaultFiltersDefinition.paymentProduct.items.filter(({ value }) =>
                    ["CreditTransfer"].includes(value),
                  ),
                },
              }}
            />
          </Box>

          {data.match({
            NotAsked: () => null,
            Loading: () => (
              <PlainListViewPlaceholder count={NUM_TO_RENDER} headerHeight={48} rowHeight={56} />
            ),
            Done: result =>
              result.match({
                Error: error => <ErrorView error={error} />,
                Ok: data => (
                  <Connection connection={data.account?.transactions}>
                    {transactions => (
                      <>
                        <TransactionList
                          withStickyTabs={true}
                          withGrouping={false}
                          transactions={transactions?.edges ?? []}
                          getRowLink={({ item }) => (
                            <Pressable onPress={() => setActiveTransactionId(item.id)} />
                          )}
                          pageSize={NUM_TO_RENDER}
                          activeRowId={activeTransactionId ?? undefined}
                          onActiveRowChange={onActiveRowChange}
                          loading={{
                            isLoading,
                            count: 2,
                          }}
                          onEndReached={() => {
                            if (data.account?.transactions?.pageInfo.hasNextPage ?? false) {
                              setVariables({
                                after: data.account?.transactions?.pageInfo.endCursor ?? undefined,
                              });
                            }
                          }}
                          renderEmptyList={() =>
                            hasSearchOrFilters ? (
                              <EmptyView
                                icon="lake-transfer"
                                borderedIcon={true}
                                title={t("transfer.list.noResults")}
                                subtitle={t("common.list.noResultsSuggestion")}
                              />
                            ) : (
                              <EmptyView
                                borderedIcon={true}
                                icon="lake-transfer"
                                title={t("transfer.list.noResults")}
                              />
                            )
                          }
                        />

                        <ListRightPanel
                          ref={panelRef}
                          keyExtractor={item => item.id}
                          activeId={activeTransactionId}
                          onActiveIdChange={setActiveTransactionId}
                          onClose={() => setActiveTransactionId(null)}
                          items={transactions?.edges.map(item => item.node) ?? []}
                          render={(transaction, large) => (
                            <TransactionDetail
                              large={large}
                              accountMembershipId={accountMembershipId}
                              transactionId={transaction.id}
                            />
                          )}
                          closeLabel={t("common.closeButton")}
                          previousLabel={t("common.previous")}
                          nextLabel={t("common.next")}
                        />
                      </>
                    )}
                  </Connection>
                ),
              }),
          })}
        </>
      )}
    </ResponsiveContainer>
  );
};
