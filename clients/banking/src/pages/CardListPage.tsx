import { Array, Option } from "@swan-io/boxed";
import { Link } from "@swan-io/chicane";
import { Box } from "@swan-io/lake/src/components/Box";
import {
  FixedListViewEmpty,
  PlainListViewPlaceholder,
} from "@swan-io/lake/src/components/FixedListView";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { breakpoints, spacings } from "@swan-io/lake/src/constants/design";
import { useUrqlPaginatedQuery } from "@swan-io/lake/src/hooks/useUrqlQuery";
import { isNotNullish } from "@swan-io/lake/src/utils/nullish";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { match } from "ts-pattern";
import { CardList } from "../components/CardList";
import { CardFilters, CardListFilter } from "../components/CardListFilter";
import { ErrorView } from "../components/ErrorView";
import {
  CardListPageDataFragment,
  CardListPageWithAccountDocument,
  CardListPageWithoutAccountDocument,
} from "../graphql/partner";
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
  empty: {
    flexGrow: 1,
    justifyContent: "center",
  },
});

type Props = {
  canAddCard: boolean;
  accountMembershipId: string;
  accountId: string | undefined;
  totalDisplayableCardCount: number;
  params: {
    search?: string | undefined;
    statuses?: string[] | undefined;
    type?: string[] | undefined;
  };
};

const PER_PAGE = 20;

const ACTIVE_STATUSES = ["Processing" as const, "Enabled" as const];
const CANCELED_STATUSES = ["Canceling" as const, "Canceled" as const];

const EMPTY_CARD_FRAGMENT: CardListPageDataFragment = {
  __typename: "CardConnection",
  pageInfo: { __typename: "PageInfo", endCursor: null, hasNextPage: false },
  edges: [],
};
// This hook is used to query Query.accountMembership.cards OR Query.cards,
// depending on if we have access to account details (especially its id)
const usePageData = ({
  accountMembershipId,
  accountId,
  filters,
}: {
  accountMembershipId: string;
  accountId: string | undefined;
  filters: CardFilters;
}) => {
  const hasAccountId = isNotNullish(accountId);

  const statuses = match(filters.statuses)
    .with(["Active"], () => ACTIVE_STATUSES)
    .with(["Canceled"], () => CANCELED_STATUSES)
    .otherwise(() => [...ACTIVE_STATUSES, ...CANCELED_STATUSES]);

  const withAccountQuery = useUrqlPaginatedQuery(
    {
      query: CardListPageWithAccountDocument,
      pause: !hasAccountId,
      variables: {
        first: PER_PAGE,
        filters: {
          statuses,
          types: filters.type,
          search: filters.search,
          accountId,
        },
      },
    },
    [filters, accountId],
  );

  const withoutAccountQuery = useUrqlPaginatedQuery(
    {
      query: CardListPageWithoutAccountDocument,
      pause: hasAccountId,
      variables: {
        first: PER_PAGE,
        filters: { statuses, types: filters.type, search: filters.search },
        accountMembershipId,
      },
    },
    [filters, accountMembershipId],
  );

  return hasAccountId
    ? {
        ...withAccountQuery,
        data: withAccountQuery.data.map(result => result.map(data => data.cards)),
        nextData: withAccountQuery.nextData.map(result => result.map(data => data.cards)),
        setAfter: withAccountQuery.setAfter,
      }
    : {
        ...withoutAccountQuery,
        data: withoutAccountQuery.data.map(result =>
          result.map(data => data.accountMembership?.cards ?? EMPTY_CARD_FRAGMENT),
        ),
        nextData: withoutAccountQuery.nextData.map(result =>
          result.map(data => data.accountMembership?.cards ?? EMPTY_CARD_FRAGMENT),
        ),
        setAfter: withoutAccountQuery.setAfter,
      };
};

export const CardListPage = ({
  canAddCard,
  accountMembershipId,
  accountId,
  totalDisplayableCardCount,
  params,
}: Props) => {
  const filters: CardFilters = useMemo(() => {
    return {
      search: params.search,
      statuses: isNotNullish(params.statuses)
        ? Array.filterMap(params.statuses, item =>
            match(item)
              .with("Active", "Canceled", item => Option.Some(item))
              .otherwise(() => Option.None()),
          )
        : undefined,
      type: isNotNullish(params.type)
        ? Array.filterMap(params.type, item =>
            match(item)
              .with("Virtual", "VirtualAndPhysical", "SingleUseVirtual", item => Option.Some(item))
              .otherwise(() => Option.None()),
          )
        : undefined,
    } as const;
  }, [params.search, params.statuses, params.type]);

  const hasFilters = Object.values(filters).some(isNotNullish);

  const { data, nextData, setAfter, reload } = usePageData({
    accountMembershipId,
    accountId,
    filters,
  });

  const empty = (
    <FixedListViewEmpty
      icon="lake-card"
      borderedIcon={true}
      title={t("cardList.noResults")}
      subtitle={t("cardList.noResultsDescription")}
    >
      <LakeButtonGroup>
        <LakeButton
          size="small"
          icon="add-circle-filled"
          color="current"
          onPress={() => Router.push("AccountCardsList", { accountMembershipId, new: "" })}
        >
          {t("common.new")}
        </LakeButton>
      </LakeButtonGroup>
    </FixedListViewEmpty>
  );

  if (totalDisplayableCardCount === 0 && canAddCard) {
    return <View style={styles.empty}>{empty}</View>;
  }

  return (
    <ResponsiveContainer style={styles.root} breakpoint={breakpoints.large}>
      {({ large }) => (
        <>
          <Box style={[styles.filters, large && styles.filtersLarge]}>
            <CardListFilter
              filters={filters}
              onChange={filters =>
                Router.push("AccountCardsList", {
                  accountMembershipId,
                  ...filters,
                })
              }
              onRefresh={reload}
              large={large}
            >
              {canAddCard ? (
                <LakeButton
                  size="small"
                  icon="add-circle-filled"
                  color="current"
                  onPress={() => Router.push("AccountCardsList", { accountMembershipId, new: "" })}
                >
                  {t("common.new")}
                </LakeButton>
              ) : null}
            </CardListFilter>
          </Box>

          {data.match({
            NotAsked: () => null,
            Loading: () => (
              <PlainListViewPlaceholder
                count={20}
                rowVerticalSpacing={0}
                headerHeight={large ? 48 : 0}
                rowHeight={104}
              />
            ),
            Done: result =>
              result.match({
                Error: error => <ErrorView error={error} />,
                Ok: cards => (
                  <CardList
                    cards={cards.edges}
                    getRowLink={({ item }) => (
                      <Link
                        to={Router.AccountCardsItem({
                          accountMembershipId,
                          cardId: item.id,
                        })}
                      />
                    )}
                    loading={{
                      isLoading: nextData.isLoading(),
                      count: 20,
                    }}
                    onRefreshRequest={reload}
                    onEndReached={() => {
                      if (cards.pageInfo.hasNextPage ?? false) {
                        setAfter(cards.pageInfo.endCursor ?? undefined);
                      }
                    }}
                    renderEmptyList={() =>
                      hasFilters ? (
                        <FixedListViewEmpty
                          icon="lake-card"
                          borderedIcon={true}
                          title={t("cardList.noResultsWithFilters")}
                          subtitle={t("common.list.noResultsSuggestion")}
                        />
                      ) : (
                        empty
                      )
                    }
                  />
                ),
              }),
          })}
        </>
      )}
    </ResponsiveContainer>
  );
};
