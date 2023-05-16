import { Array, AsyncData, Option, Result } from "@swan-io/boxed";
import { Box } from "@swan-io/lake/src/components/Box";
import {
  FixedListViewEmpty,
  PlainListViewPlaceholder,
} from "@swan-io/lake/src/components/FixedListView";
import { FocusTrapRef } from "@swan-io/lake/src/components/FocusTrap";
import { ListRightPanel } from "@swan-io/lake/src/components/ListRightPanel";
import { Pressable } from "@swan-io/lake/src/components/Pressable";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { breakpoints, spacings } from "@swan-io/lake/src/constants/design";
import { useUrqlPaginatedQuery } from "@swan-io/lake/src/hooks/useUrqlQuery";
import { isNotNullish } from "@swan-io/lake/src/utils/nullish";
import { useCallback, useMemo, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import { match } from "ts-pattern";
import {
  CardPageQuery,
  CardTransactionsPageDocument,
  IdentificationStatus,
} from "../graphql/partner";
import { getMemberName } from "../utils/accountMembership";
import { t } from "../utils/i18n";
import { Router } from "../utils/routes";
import { CardItemIdentityVerificationGate } from "./CardItemIdentityVerificationGate";
import { ErrorView } from "./ErrorView";
import { TransactionDetail } from "./TransactionDetail";
import { TransactionList } from "./TransactionList";
import { TransactionFiltersState, TransactionListFilter } from "./TransactionListFilter";

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
  card: Card;
  projectId: string;
  accountMembershipId: string;

  cardId: string;

  isCurrentUserCardOwner: boolean;
  cardRequiresIdentityVerification: boolean;
  onRefreshAccountRequest: () => void;
  identificationStatus?: IdentificationStatus;

  params: {
    isAfterUpdatedAt?: string | undefined;
    isBeforeUpdatedAt?: string | undefined;
    search?: string | undefined;
    status?: string[] | undefined;
  };
};

const availableFilters = [
  "isAfterUpdatedAt",
  "isBeforeUpdatedAt",
  "isBeforeUpdatedAt",
  "search",
  "status",
] as const;

const DEFAULT_STATUSES = [
  "Booked" as const,
  "Canceled" as const,
  "Pending" as const,
  "Rejected" as const,
];

type Card = NonNullable<CardPageQuery["card"]>;

export const CardItemTransactionList = ({
  card: cardFromProps,
  cardId,
  projectId,
  accountMembershipId,
  params,
  isCurrentUserCardOwner,
  cardRequiresIdentityVerification,
  onRefreshAccountRequest,
  identificationStatus,
}: Props) => {
  const filters: TransactionFiltersState = useMemo(() => {
    return {
      isAfterUpdatedAt: params.isAfterUpdatedAt,
      isBeforeUpdatedAt: params.isBeforeUpdatedAt,
      search: params.search,
      paymentProduct: undefined,
      status: isNotNullish(params.status)
        ? Array.filterMap(params.status, item =>
            match(item)
              .with("Booked", "Canceled", "Pending", "Rejected", "Released", "Upcoming", item =>
                Option.Some(item),
              )
              .otherwise(() => Option.None()),
          )
        : undefined,
    } as const;
  }, [params.isAfterUpdatedAt, params.isBeforeUpdatedAt, params.search, params.status]);

  const hasFilters = Object.values(filters).some(isNotNullish);

  const { data, nextData, reload, setAfter } = useUrqlPaginatedQuery(
    {
      query: CardTransactionsPageDocument,
      variables: {
        cardId,
        first: NUM_TO_RENDER,
        filters: {
          ...filters,
          status: filters.status ?? DEFAULT_STATUSES,
        },
        canQueryCardOnTransaction: true,
      },
    },
    [cardId, filters],
  );

  const [activeTransactionId, setActiveTransactionId] = useState<string | null>(null);

  const transactions = data
    .toOption()
    .flatMap(result => result.toOption())
    .flatMap(data => Option.fromNullable(data.card?.transactions))
    .map(({ edges }) => edges.map(({ node }) => node))
    .getWithDefault([]);

  const panelRef = useRef<FocusTrapRef | null>(null);

  const onActiveRowChange = useCallback(
    (element: HTMLElement) => panelRef.current?.setInitiallyFocusedElement(element),
    [],
  );

  return (
    <ResponsiveContainer style={styles.root} breakpoint={breakpoints.large}>
      {({ large }) => (
        <>
          {match({ hasFilters, data })
            .with(
              {
                hasFilters: false,
                data: AsyncData.P.Done(Result.P.Ok({ card: { transactions: { totalCount: 0 } } })),
              },
              () => null,
            )
            .otherwise(() => (
              <Box style={[styles.filters, large && styles.filtersLarge]}>
                <TransactionListFilter
                  filters={filters}
                  onChange={filters =>
                    Router.push("AccountCardsItemTransactions", {
                      accountMembershipId,
                      cardId,
                      ...filters,
                    })
                  }
                  available={availableFilters}
                  onRefresh={reload}
                  large={large}
                />
              </Box>
            ))}

          {data.match({
            NotAsked: () => null,
            Loading: () => (
              <PlainListViewPlaceholder
                count={NUM_TO_RENDER}
                rowVerticalSpacing={0}
                headerHeight={48}
                groupHeaderHeight={48}
                rowHeight={48}
              />
            ),
            Done: result =>
              result.match({
                Error: error => <ErrorView error={error} />,
                Ok: ({ card }) => (
                  <TransactionList
                    withStickyTabs={true}
                    transactions={card?.transactions?.edges ?? []}
                    getRowLink={({ item }) => (
                      <Pressable onPress={() => setActiveTransactionId(item.id)} />
                    )}
                    pageSize={NUM_TO_RENDER}
                    activeRowId={activeTransactionId ?? undefined}
                    onActiveRowChange={onActiveRowChange}
                    loading={{
                      isLoading: nextData.isLoading(),
                      count: 2,
                    }}
                    onEndReached={() => {
                      if (card?.transactions?.pageInfo.hasNextPage ?? false) {
                        setAfter(card?.transactions?.pageInfo.endCursor ?? undefined);
                      }
                    }}
                    renderEmptyList={() =>
                      hasFilters ? (
                        <FixedListViewEmpty
                          icon="lake-transfer"
                          borderedIcon={true}
                          title={t("common.list.noResults")}
                          subtitle={t("common.list.noResultsSuggestion")}
                        />
                      ) : (
                        <FixedListViewEmpty
                          icon="lake-transfer"
                          borderedIcon={true}
                          title={t("transansactionList.noResults")}
                        >
                          {cardRequiresIdentityVerification ? (
                            <>
                              <Space height={24} />

                              <CardItemIdentityVerificationGate
                                recommendedIdentificationLevel={
                                  card?.accountMembership.recommendedIdentificationLevel ?? "Expert"
                                }
                                isCurrentUserCardOwner={isCurrentUserCardOwner}
                                projectId={projectId}
                                description={t("card.identityVerification.transactions")}
                                descriptionForOtherMember={t(
                                  "card.identityVerification.transactions.otherMember",
                                  {
                                    name: getMemberName({
                                      accountMembership: cardFromProps.accountMembership,
                                    }),
                                  },
                                )}
                                onComplete={onRefreshAccountRequest}
                                identificationStatus={identificationStatus}
                              />
                            </>
                          ) : null}
                        </FixedListViewEmpty>
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
