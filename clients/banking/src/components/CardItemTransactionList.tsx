import { AsyncData, Result } from "@swan-io/boxed";
import { useQuery } from "@swan-io/graphql-client";
import { Box } from "@swan-io/lake/src/components/Box";
import { EmptyView } from "@swan-io/lake/src/components/EmptyView";
import { FocusTrapRef } from "@swan-io/lake/src/components/FocusTrap";
import { ListRightPanel } from "@swan-io/lake/src/components/ListRightPanel";
import { PlainListViewPlaceholder } from "@swan-io/lake/src/components/PlainListView";
import { Pressable } from "@swan-io/lake/src/components/Pressable";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { breakpoints, spacings } from "@swan-io/lake/src/constants/design";
import { isNotNullish, nullishOrEmptyToUndefined } from "@swan-io/lake/src/utils/nullish";
import { useCallback, useMemo, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import { isMatching, match, P } from "ts-pattern";
import { CardTransactionsPageDocument } from "../graphql/partner";
import { t } from "../utils/i18n";
import { GetRouteParams, Router } from "../utils/routes";
import { Connection } from "./Connection";
import { ErrorView } from "./ErrorView";
import { TransactionDetail } from "./TransactionDetail";
import { TransactionList } from "./TransactionList";
import { TransactionFilters, TransactionListFilter } from "./TransactionListFilter";

const styles = StyleSheet.create({
  root: {
    flexGrow: 1,
    flexShrink: 1,
  },
  filters: {
    paddingVertical: spacings[12],
    paddingHorizontal: spacings[24],
  },
  filtersLarge: {
    paddingHorizontal: spacings[40],
  },
});

const NUM_TO_RENDER = 20;

type Props = {
  params: GetRouteParams<"AccountCardsItemTransactions">;
};

const availableFilters = [
  "isAfterUpdatedAt",
  "isBeforeUpdatedAt",
  "isBeforeUpdatedAt",
  "status",
] as const;

const DEFAULT_STATUSES = [
  "Booked" as const,
  "Canceled" as const,
  "Pending" as const,
  "Rejected" as const,
];

export const CardItemTransactionList = ({ params }: Props) => {
  const filters = useMemo<TransactionFilters>(
    () => ({
      isAfterUpdatedAt: params.isAfterUpdatedAt,
      isBeforeUpdatedAt: params.isBeforeUpdatedAt,
      paymentProduct: undefined,
      status: params.status?.filter(
        isMatching(P.union("Booked", "Canceled", "Pending", "Rejected", "Released", "Upcoming")),
      ),
    }),
    [params.isAfterUpdatedAt, params.isBeforeUpdatedAt, params.status],
  );

  const search = nullishOrEmptyToUndefined(params.search);
  const hasSearchOrFilters = isNotNullish(search) || Object.values(filters).some(isNotNullish);

  const [data, { isLoading, reload, setVariables }] = useQuery(CardTransactionsPageDocument, {
    cardId: params.cardId,
    first: NUM_TO_RENDER,
    filters: {
      ...filters,
      paymentProduct: undefined,
      search,
      status: filters.status ?? DEFAULT_STATUSES,
    },
    canQueryCardOnTransaction: true,
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
          {match({ hasSearchOrFilters, data })
            .with(
              {
                hasSearchOrFilters: false,
                data: AsyncData.P.Done(Result.P.Ok({ card: { transactions: { totalCount: 0 } } })),
              },
              () => null,
            )
            .otherwise(() => (
              <Box style={[styles.filters, large && styles.filtersLarge]}>
                <TransactionListFilter
                  available={availableFilters}
                  large={large}
                  filters={filters}
                  search={search}
                  onRefresh={reload}
                  onChangeFilters={filters => {
                    Router.replace("AccountCardsItemTransactions", { ...params, ...filters });
                  }}
                  onChangeSearch={search => {
                    Router.replace("AccountCardsItemTransactions", { ...params, search });
                  }}
                />
              </Box>
            ))}

          {data.match({
            NotAsked: () => null,
            Loading: () => (
              <PlainListViewPlaceholder
                count={NUM_TO_RENDER}
                headerHeight={48}
                groupHeaderHeight={48}
                rowHeight={48}
              />
            ),
            Done: result =>
              result.match({
                Error: error => <ErrorView error={error} />,
                Ok: ({ card }) => (
                  <Connection connection={card?.transactions}>
                    {transactions => (
                      <>
                        <TransactionList
                          withStickyTabs={true}
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
                            if (transactions?.pageInfo.hasNextPage ?? false) {
                              setVariables({
                                after: transactions?.pageInfo.endCursor ?? undefined,
                              });
                            }
                          }}
                          renderEmptyList={() =>
                            hasSearchOrFilters ? (
                              <EmptyView
                                icon="lake-transfer"
                                borderedIcon={true}
                                title={t("common.list.noResults")}
                                subtitle={t("common.list.noResultsSuggestion")}
                              />
                            ) : (
                              <EmptyView
                                icon="lake-transfer"
                                borderedIcon={true}
                                title={t("transansactionList.noResults")}
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
                              accountMembershipId={params.accountMembershipId}
                              large={large}
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
