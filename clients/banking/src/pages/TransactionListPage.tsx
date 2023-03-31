import { Array, AsyncData, Option, Result } from "@swan-io/boxed";
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
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { breakpoints, spacings } from "@swan-io/lake/src/constants/design";
import { useFirstMountState } from "@swan-io/lake/src/hooks/useFirstMountState";
import { useUrqlPaginatedQuery } from "@swan-io/lake/src/hooks/useUrqlQuery";
import { showToast } from "@swan-io/lake/src/state/toasts";
import { noop } from "@swan-io/lake/src/utils/function";
import { isNotNullish } from "@swan-io/lake/src/utils/nullish";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import { P, match } from "ts-pattern";
import { ErrorView } from "../components/ErrorView";
import { TransactionDetail } from "../components/TransactionDetail";
import { TransactionList } from "../components/TransactionList";
import {
  TransactionFiltersState,
  TransactionListFilter,
} from "../components/TransactionListFilter";
import { Amount } from "../graphql/graphcache";
import { TransactionListPageDocument } from "../graphql/partner";
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
});

const NUM_TO_RENDER = 20;

type Props = {
  accountId: string;
  accountMembershipId: string;
  canQueryCardOnTransaction: boolean;
  onBalanceReceive: (amount: Amount) => void;
  transferConsent: Option<{ status: string; isStandingOrder: boolean }>;
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
  onBalanceReceive,
  transferConsent,
  params,
  canQueryCardOnTransaction,
}: Props) => {
  const isFirstMount = useFirstMountState();

  useEffect(() => {
    if (isFirstMount) {
      const newTransferConsent = transferConsent.toUndefined();

      match(newTransferConsent)
        .with({ status: "Accepted", isStandingOrder: true }, () => {
          showToast({
            variant: "success",
            title: t("recurringTransfer.consent.success.title"),
            description: t("recurringTransfer.consent.success.description"),
            autoClose: false,
          });
        })
        .with({ status: "Accepted", isStandingOrder: false }, () => {
          showToast({
            variant: "success",
            title: t("transfer.consent.success.title"),
            description: t("transfer.consent.success.description"),
            autoClose: false,
          });
        })
        .with({ status: "Canceled", isStandingOrder: true }, () => {
          showToast({
            variant: "error",
            title: t("recurringTransfer.consent.error.canceled.title"),
          });
        })
        .with({ status: "Canceled", isStandingOrder: false }, () => {
          showToast({
            variant: "error",
            title: t("transfer.consent.error.canceled.title"),
          });
        })
        .with({ isStandingOrder: true }, () => {
          showToast({
            variant: "error",
            title: t("recurringTransfer.consent.error.rejected.title"),
            description: t("recurringTransfer.consent.error.rejected.description"),
          });
        })
        .with({ isStandingOrder: false }, () => {
          showToast({
            variant: "error",
            title: t("transfer.consent.error.rejected.title"),
            description: t("transfer.consent.error.rejected.description"),
          });
        })
        .with(P.nullish, noop)
        .exhaustive();

      if (transferConsent.isSome()) {
        Router.replace("AccountTransactionsListRoot", { accountMembershipId });
      }
    }
  }, [isFirstMount, transferConsent, accountMembershipId]);

  const filters: TransactionFiltersState = useMemo(() => {
    return {
      isAfterUpdatedAt: params.isAfterUpdatedAt,
      isBeforeUpdatedAt: params.isBeforeUpdatedAt,
      paymentProduct: isNotNullish(params.paymentProduct)
        ? Array.keepMap(params.paymentProduct, item =>
            match(item)
              .with(
                "Card",
                "Fees",
                "InternalCreditTransfer",
                "InternalDirectDebit",
                "SEPACreditTransfer",
                "SEPADirectDebit",
                value => Option.Some(value),
              )
              .otherwise(() => Option.None()),
          )
        : undefined,
      search: params.search,
      status: isNotNullish(params.transactionStatus)
        ? Array.keepMap(params.transactionStatus, item =>
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
    params.search,
    params.transactionStatus,
  ]);

  const hasFilters = Object.values(filters).some(isNotNullish);

  const { data, nextData, reload, setAfter } = useUrqlPaginatedQuery(
    {
      query: TransactionListPageDocument,
      variables: {
        accountId,
        first: 20,
        filters: {
          ...filters,
          status: filters.status ?? DEFAULT_STATUSES,
        },
        canQueryCardOnTransaction,
      },
    },
    [filters, canQueryCardOnTransaction],
  );

  const [activeTransactionId, setActiveTransactionId] = useState<string | null>(null);

  const transactions = data
    .toOption()
    .flatMap(result => result.toOption())
    .flatMap(data => Option.fromNullable(data.account?.transactions))
    .map(({ edges }) => edges.map(({ node }) => node))
    .getWithDefault([]);

  const panelRef = useRef<FocusTrapRef | null>(null);

  const onActiveRowChange = useCallback(
    (element: HTMLElement) => panelRef.current?.setInitiallyFocusedElement(element),
    [],
  );

  useEffect(() => {
    match(data)
      .with(
        AsyncData.pattern.Done(
          Result.pattern.Ok({
            account: {
              balances: {
                available: P.select(),
              },
            },
          }),
        ),
        availableBalance => onBalanceReceive(availableBalance),
      )
      .otherwise(() => {});
  }, [data, onBalanceReceive]);

  return (
    <ResponsiveContainer style={styles.root} breakpoint={breakpoints.large}>
      {({ large }) => (
        <>
          <Box style={[styles.filters, large && styles.filtersLarge]}>
            <TransactionListFilter
              filters={filters}
              onChange={({ status, ...filters }) =>
                Router.push("AccountTransactionsListRoot", {
                  accountMembershipId,
                  transactionStatus: status,
                  ...filters,
                })
              }
              onRefresh={reload}
              large={large}
            >
              <LakeButton
                onPress={() =>
                  Router.push("AccountTransactionsListStatements", {
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
            </TransactionListFilter>
          </Box>

          {data.match({
            NotAsked: () => null,
            Loading: () => (
              <PlainListViewPlaceholder
                count={20}
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
                  <TransactionList
                    withStickyTabs={true}
                    transactions={data.account?.transactions?.edges ?? []}
                    getRowLink={({ item }) => (
                      <Pressable onPress={() => setActiveTransactionId(item.id)} />
                    )}
                    pageSize={NUM_TO_RENDER}
                    activeRowId={activeTransactionId ?? undefined}
                    onActiveRowChange={onActiveRowChange}
                    loading={{
                      isLoading: nextData.isLoading(),
                      count: 20,
                    }}
                    onEndReached={() => {
                      if (data.account?.transactions?.pageInfo.hasNextPage ?? false) {
                        setAfter(data.account?.transactions?.pageInfo.endCursor ?? undefined);
                      }
                    }}
                    renderEmptyList={() =>
                      hasFilters ? (
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
                ),
              }),
          })}

          <ListRightPanel
            ref={panelRef}
            keyExtractor={item => item.id}
            activeId={activeTransactionId}
            onActiveIdChange={setActiveTransactionId}
            onClose={() => setActiveTransactionId(null)}
            items={transactions}
            render={(transaction, large) => (
              <TransactionDetail large={large} transaction={transaction} />
            )}
            closeLabel={t("common.closeButton")}
            previousLabel={t("common.previous")}
            nextLabel={t("common.next")}
          />
        </>
      )}
    </ResponsiveContainer>
  );
};
