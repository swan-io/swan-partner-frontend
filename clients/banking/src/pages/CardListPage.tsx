import { Link } from "@swan-io/chicane";
import { useQuery } from "@swan-io/graphql-client";
import { Box } from "@swan-io/lake/src/components/Box";
import { EmptyView } from "@swan-io/lake/src/components/EmptyView";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { PlainListViewPlaceholder } from "@swan-io/lake/src/components/PlainListView";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { breakpoints, spacings } from "@swan-io/lake/src/constants/design";
import { isNotNullish, nullishOrEmptyToUndefined } from "@swan-io/lake/src/utils/nullish";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { isMatching, P } from "ts-pattern";
import { Except } from "type-fest";
import { CardList } from "../components/CardList";
import { CardFilters, CardListFilter } from "../components/CardListFilter";
import { Connection } from "../components/Connection";
import { ErrorView } from "../components/ErrorView";
import { CardListPageDocument } from "../graphql/partner";
import { usePermissions } from "../hooks/usePermissions";
import { t } from "../utils/i18n";
import { GetRouteParams, Router } from "../utils/routes";

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
  accountMembershipId: string;
  accountId: string | undefined;
  totalDisplayableCardCount: number;
  params: Except<GetRouteParams<"AccountCardsList">, "accountMembershipId">;
};

const PER_PAGE = 20;

const ACTIVE_STATUSES = ["Processing" as const, "Enabled" as const];
const CANCELED_STATUSES = ["Canceling" as const, "Canceled" as const];

export const CardListPage = ({
  accountMembershipId,
  accountId,
  totalDisplayableCardCount,
  params,
}: Props) => {
  const { canAddCard: canOrderCard } = usePermissions();

  const filters = useMemo<CardFilters>(
    () => ({
      type: params.type?.filter(
        isMatching(P.union("Virtual", "VirtualAndPhysical", "SingleUseVirtual")),
      ),
    }),
    [params.type],
  );

  const search = nullishOrEmptyToUndefined(params.search);
  const status = params.status === "Canceled" ? "Canceled" : "Active";

  const hasSearchOrFilters =
    isNotNullish(search) || status === "Canceled" || Object.values(filters).some(isNotNullish);

  const [data, { isLoading, setVariables, reload }] = useQuery(CardListPageDocument, {
    first: PER_PAGE,
    filters: {
      statuses: status === "Active" ? ACTIVE_STATUSES : CANCELED_STATUSES,
      types: filters.type,
      search,
      accountId,
    },
  });

  const empty = (
    <EmptyView
      icon="lake-card"
      borderedIcon={true}
      title={t("cardList.noResults")}
      subtitle={t("cardList.noResultsDescription")}
    >
      {canOrderCard ? (
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
      ) : null}
    </EmptyView>
  );

  const cards = data.mapOk(data => data.cards);

  if (totalDisplayableCardCount === 0 && canOrderCard) {
    return <View style={styles.empty}>{empty}</View>;
  }

  return (
    <ResponsiveContainer style={styles.root} breakpoint={breakpoints.large}>
      {({ large }) => (
        <>
          <Box style={[styles.filters, large && styles.filtersLarge]}>
            <CardListFilter
              large={large}
              filters={filters}
              search={search}
              status={status}
              onRefresh={reload}
              onChangeFilters={filters => {
                Router.replace("AccountCardsList", { accountMembershipId, ...params, ...filters });
              }}
              onChangeSearch={search => {
                Router.replace("AccountCardsList", { accountMembershipId, ...params, search });
              }}
              onChangeStatus={status => {
                Router.replace("AccountCardsList", { accountMembershipId, ...params, status });
              }}
            >
              {canOrderCard ? (
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

          {cards.match({
            NotAsked: () => null,
            Loading: () => (
              <PlainListViewPlaceholder count={20} headerHeight={large ? 48 : 0} rowHeight={104} />
            ),
            Done: result =>
              result.match({
                Error: error => <ErrorView error={error} />,
                Ok: cards => (
                  <Connection connection={cards}>
                    {cards => (
                      <CardList
                        large={large}
                        cards={cards.edges}
                        getRowLink={({ item }) => (
                          <Link
                            data-testid="user-card-item"
                            to={Router.AccountCardsItem({
                              accountMembershipId,
                              cardId: item.id,
                            })}
                          />
                        )}
                        loading={{
                          isLoading,
                          count: 20,
                        }}
                        onRefreshRequest={() => {
                          reload();
                        }}
                        onEndReached={() => {
                          if (cards.pageInfo.hasNextPage ?? false) {
                            setVariables({ after: cards.pageInfo.endCursor ?? undefined });
                          }
                        }}
                        renderEmptyList={() =>
                          hasSearchOrFilters ? (
                            <EmptyView
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
