import { Array, Option } from "@swan-io/boxed";
import { useQuery } from "@swan-io/graphql-client";
import { Box } from "@swan-io/lake/src/components/Box";
import {
  FixedListViewEmpty,
  PlainListViewPlaceholder,
} from "@swan-io/lake/src/components/FixedListView";
import { FocusTrapRef } from "@swan-io/lake/src/components/FocusTrap";
import { ListRightPanel } from "@swan-io/lake/src/components/ListRightPanel";
import { Pressable } from "@swan-io/lake/src/components/Pressable";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { breakpoints, spacings } from "@swan-io/lake/src/constants/design";
import { isNotNullish } from "@swan-io/lake/src/utils/nullish";
import { useCallback, useMemo, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import { match } from "ts-pattern";
import { ErrorView } from "../components/ErrorView";
import { TransactionDetail } from "../components/TransactionDetail";
import { TransactionList } from "../components/TransactionList";
import { TransactionListPageDocument } from "../graphql/partner";
import { t } from "../utils/i18n";
import { Router } from "../utils/routes";
import { Connection } from "./Connection";
import {
  TransactionFiltersState,
  TransactionListFilter,
  defaultFiltersDefinition,
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
  canQueryCardOnTransaction: boolean;
  canViewAccount: boolean;
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

export const TransferList = ({
  accountId,
  accountMembershipId,
  params,
  canQueryCardOnTransaction,
  canViewAccount,
}: Props) => {
  const filters: TransactionFiltersState = useMemo(() => {
    return {
      includeRejectedWithFallback: false,
      isAfterUpdatedAt: params.isAfterUpdatedAt,
      isBeforeUpdatedAt: params.isBeforeUpdatedAt,
      paymentProduct: undefined,
      search: params.search,
      status: isNotNullish(params.transactionStatus)
        ? Array.filterMap(params.transactionStatus, item =>
            match(item)
              .with("Booked", "Canceled", "Pending", "Rejected", "Released", item =>
                Option.Some(item),
              )
              .otherwise(() => Option.None()),
          )
        : undefined,
    } as const;
  }, [params.isAfterUpdatedAt, params.isBeforeUpdatedAt, params.search, params.transactionStatus]);

  const hasFilters = Object.values(filters).some(isNotNullish);

  const paymentProduct = useMemo(() => {
    return [
      "SEPACreditTransfer" as const,
      "InternalCreditTransfer" as const,
      "InternationalCreditTransfer" as const,
    ];
  }, []);

  const [data, { isLoading, reload, setVariables }] = useQuery(TransactionListPageDocument, {
    accountId,
    first: NUM_TO_RENDER,
    filters: {
      ...filters,
      paymentProduct,
      status: filters.status ?? DEFAULT_STATUSES,
    },
    canQueryCardOnTransaction,
    canViewAccount,
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
              filters={filters}
              onChange={({ status, ...filters }) =>
                Router.push("AccountPaymentsRoot", {
                  accountMembershipId,
                  transactionStatus: status,
                  ...filters,
                })
              }
              onRefresh={() => {
                reload();
              }}
              large={large}
              available={["isAfterUpdatedAt", "isBeforeUpdatedAt", "status"]}
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
              <PlainListViewPlaceholder
                count={NUM_TO_RENDER}
                rowVerticalSpacing={0}
                groupHeaderHeight={48}
                headerHeight={48}
                rowHeight={48}
              />
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
                            hasFilters ? (
                              <FixedListViewEmpty
                                icon="lake-transfer"
                                borderedIcon={true}
                                title={t("transfer.list.noResults")}
                                subtitle={t("common.list.noResultsSuggestion")}
                              />
                            ) : (
                              <FixedListViewEmpty
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
                              canQueryCardOnTransaction={canQueryCardOnTransaction}
                              canViewAccount={canViewAccount}
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
