import { Array, Option } from "@swan-io/boxed";
import { useQuery } from "@swan-io/graphql-client";
import { Box } from "@swan-io/lake/src/components/Box";
import {
  FixedListViewEmpty,
  PlainListViewPlaceholder,
} from "@swan-io/lake/src/components/FixedListView";
import { FocusTrapRef } from "@swan-io/lake/src/components/FocusTrap";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { ListRightPanel } from "@swan-io/lake/src/components/ListRightPanel";
import { Pressable } from "@swan-io/lake/src/components/Pressable";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { RightPanel } from "@swan-io/lake/src/components/RightPanel";
import { Space } from "@swan-io/lake/src/components/Space";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { breakpoints, spacings } from "@swan-io/lake/src/constants/design";
import { isNotNullish, nullishOrEmptyToUndefined } from "@swan-io/lake/src/utils/nullish";
import { useCallback, useMemo, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import { match } from "ts-pattern";
import { Connection } from "../components/Connection";
import { ErrorView } from "../components/ErrorView";
import { TransactionDetail } from "../components/TransactionDetail";
import { TransactionList } from "../components/TransactionList";
import { TransactionFilters, TransactionListFilter } from "../components/TransactionListFilter";
import { PaymentProduct, TransactionListPageDocument } from "../graphql/partner";
import { useTransferToastWithRedirect } from "../hooks/useTransferToastWithRedirect";
import { t } from "../utils/i18n";
import { Router } from "../utils/routes";

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
  button: {
    paddingHorizontal: spacings[24],
    paddingVertical: spacings[12],
  },
  buttonLarge: {
    paddingHorizontal: spacings[40],
    paddingVertical: spacings[12],
  },
});

const PAGE_SIZE = 20;

type Props = {
  accountId: string;
  accountMembershipId: string;
  canQueryCardOnTransaction: boolean;
  accountStatementsVisible: boolean;
  canViewAccount: boolean;
  transferConsent: Option<{ kind: "transfer" | "standingOrder" | "beneficiary"; status: string }>;
  params: {
    isAfterUpdatedAt?: string | undefined;
    isBeforeUpdatedAt?: string | undefined;
    paymentProduct?: string[] | undefined;
    search?: string | undefined;
    transactionStatus?: string[] | undefined;
    statements?: string | undefined;
  };
};

const DEFAULT_STATUSES = [
  "Booked" as const,
  "Canceled" as const,
  "Pending" as const,
  "Rejected" as const,
];

export const TransactionListPage = ({
  accountId,
  accountMembershipId,
  transferConsent,
  params,
  canQueryCardOnTransaction,
  accountStatementsVisible,
  canViewAccount,
}: Props) => {
  useTransferToastWithRedirect(transferConsent, () =>
    Router.replace("AccountTransactionsListRoot", { accountMembershipId }),
  );
  const route = Router.useRoute(["AccountTransactionsListDetail"]);

  const filters: TransactionFilters = useMemo(() => {
    return {
      includeRejectedWithFallback: false,
      isAfterUpdatedAt: params.isAfterUpdatedAt,
      isBeforeUpdatedAt: params.isBeforeUpdatedAt,
      paymentProduct: isNotNullish(params.paymentProduct)
        ? Array.filterMap(params.paymentProduct, item =>
            match(item)
              .with("CreditTransfer", "DirectDebit", "Card", "Fees", "Check", value =>
                Option.Some(value),
              )
              .otherwise(() => Option.None()),
          )
        : undefined,
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
  }, [
    params.isAfterUpdatedAt,
    params.isBeforeUpdatedAt,
    params.paymentProduct,
    params.transactionStatus,
  ]);

  const paymentProduct = useMemo(() => {
    const actualPaymentProduct: PaymentProduct[] = [];
    filters.paymentProduct?.forEach(item => {
      const items = match(item)
        .returnType<PaymentProduct[]>()
        .with("Card", "Fees", "Check", value => [value])
        .with("CreditTransfer", () => ["SEPACreditTransfer", "InternalCreditTransfer"])
        .with("DirectDebit", () => ["SEPADirectDebit", "InternalDirectDebit"])
        .exhaustive();
      actualPaymentProduct.push(...items);
    });
    return actualPaymentProduct.length > 0 ? actualPaymentProduct : undefined;
  }, [filters]);

  const search = nullishOrEmptyToUndefined(params.search);
  const hasSearchOrFilters = isNotNullish(search) || Object.values(filters).some(isNotNullish);

  const [data, { isLoading, reload, setVariables }] = useQuery(TransactionListPageDocument, {
    accountId,
    first: PAGE_SIZE,
    filters: {
      ...filters,
      paymentProduct,
      search,
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
              large={large}
              filters={filters}
              search={search}
              onRefresh={() => {
                reload();
              }}
              onChangeFilters={({ status, ...filters }) => {
                Router.replace("AccountTransactionsListRoot", {
                  ...params,
                  accountMembershipId,
                  transactionStatus: status,
                  ...filters,
                });
              }}
              onChangeSearch={search => {
                Router.replace("AccountTransactionsListRoot", {
                  ...params,
                  accountMembershipId,
                  search,
                });
              }}
            >
              {accountStatementsVisible ? (
                <LakeButton
                  onPress={() =>
                    Router.push("AccountTransactionsListStatementsRoot", {
                      accountMembershipId,
                    })
                  }
                  size="small"
                  color="current"
                  icon="arrow-download-filled"
                  ariaLabel={t("accountStatements.title")}
                >
                  {large ? t("accountStatements.title") : null}
                </LakeButton>
              ) : null}
            </TransactionListFilter>
          </Box>

          {data.match({
            NotAsked: () => null,
            Loading: () => (
              <PlainListViewPlaceholder
                count={PAGE_SIZE}
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
                          transactions={transactions?.edges ?? []}
                          getRowLink={({ item }) => (
                            <Pressable onPress={() => setActiveTransactionId(item.id)} />
                          )}
                          pageSize={PAGE_SIZE}
                          activeRowId={activeTransactionId ?? undefined}
                          onActiveRowChange={onActiveRowChange}
                          loading={{
                            isLoading,
                            count: PAGE_SIZE,
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
                              <FixedListViewEmpty
                                icon="lake-transfer"
                                borderedIcon={true}
                                title={t("transansactionList.noResults")}
                                subtitle={t("common.list.noResultsSuggestion")}
                              />
                            ) : (
                              <FixedListViewEmpty
                                icon="lake-transfer"
                                borderedIcon={true}
                                title={t("transansactionList.noResults")}
                              />
                            )
                          }
                        />

                        {match(route)
                          .with(
                            { name: "AccountTransactionsListDetail" },
                            ({ params: { transactionId } }) => (
                              <RightPanel
                                visible={true}
                                onPressClose={() => {
                                  setActiveTransactionId(null);
                                  Router.push("AccountTransactionsListRoot", {
                                    accountMembershipId,
                                  });
                                }}
                              >
                                {({ large }) => (
                                  <>
                                    <Box style={large ? styles.buttonLarge : styles.button}>
                                      <LakeButton
                                        mode="tertiary"
                                        icon="lake-close"
                                        ariaLabel={t("common.closeButton")}
                                        onPress={() => {
                                          setActiveTransactionId(null);
                                          Router.push("AccountTransactionsListRoot", {
                                            accountMembershipId,
                                          });
                                        }}
                                        children={null}
                                      />
                                    </Box>

                                    <TransactionDetail
                                      accountMembershipId={accountMembershipId}
                                      large={large}
                                      transactionId={transactionId}
                                      canQueryCardOnTransaction={canQueryCardOnTransaction}
                                      canViewAccount={canViewAccount}
                                    />

                                    <Space height={24} />
                                  </>
                                )}
                              </RightPanel>
                            ),
                          )
                          .otherwise(() => (
                            <ListRightPanel
                              ref={panelRef}
                              keyExtractor={item => item.id}
                              activeId={activeTransactionId}
                              onActiveIdChange={setActiveTransactionId}
                              onClose={() => setActiveTransactionId(null)}
                              items={transactions?.edges.map(item => item.node) ?? []}
                              render={(transaction, large) => (
                                <TransactionDetail
                                  accountMembershipId={accountMembershipId}
                                  large={large}
                                  transactionId={transaction.id}
                                  canQueryCardOnTransaction={canQueryCardOnTransaction}
                                  canViewAccount={canViewAccount}
                                />
                              )}
                              closeLabel={t("common.closeButton")}
                              previousLabel={t("common.previous")}
                              nextLabel={t("common.next")}
                            />
                          ))}
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
