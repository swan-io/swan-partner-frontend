import { Array, Option } from "@swan-io/boxed";
import { Link } from "@swan-io/chicane";
import { Box } from "@swan-io/lake/src/components/Box";
import {
  FixedListViewEmpty,
  PlainListViewPlaceholder,
} from "@swan-io/lake/src/components/FixedListView";
import { FullViewportLayer } from "@swan-io/lake/src/components/FullViewportLayer";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { breakpoints, spacings } from "@swan-io/lake/src/constants/design";
import { useUrqlPaginatedQuery } from "@swan-io/lake/src/hooks/useUrqlQuery";
import { isNotNullish } from "@swan-io/lake/src/utils/nullish";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { match } from "ts-pattern";
import { AccountMembershipFragment, CardListPageWithoutAccountDocument } from "../graphql/partner";
import { t } from "../utils/i18n";
import { Router } from "../utils/routes";
import { CardList } from "./CardList";
import { CardFilters, CardListFilter } from "./CardListFilter";
import { CardWizard } from "./CardWizard";
import { ErrorView } from "./ErrorView";

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
  currentUserAccountMembershipId: string;
  currentUserAccountMembership: AccountMembershipFragment;
  editingAccountMembershipId: string;
  editingAccountMembership: AccountMembershipFragment;
  totalDisplayableCardCount: number;
  params: {
    cardSearch?: string | undefined;
    cardStatuses?: string[] | undefined;
    cardType?: string[] | undefined;
  };
  isCardWizardOpen: boolean;
  canOrderPhysicalCards: boolean;
};

const PER_PAGE = 20;

const ACTIVE_STATUSES = ["Processing" as const, "Enabled" as const];
const CANCELED_STATUSES = ["Canceling" as const, "Canceled" as const];

export const AccountMembersDetailsCardList = ({
  canAddCard,
  currentUserAccountMembershipId,
  currentUserAccountMembership,
  editingAccountMembershipId,
  editingAccountMembership,
  totalDisplayableCardCount,
  params,
  isCardWizardOpen,
  canOrderPhysicalCards,
}: Props) => {
  const filters: CardFilters = useMemo(() => {
    return {
      search: params.cardSearch,
      statuses: isNotNullish(params.cardStatuses)
        ? Array.filterMap(params.cardStatuses, item =>
            match(item)
              .with("Active", "Canceled", item => Option.Some(item))
              .otherwise(() => Option.None()),
          )
        : undefined,
      type: isNotNullish(params.cardType)
        ? Array.filterMap(params.cardType, item =>
            match(item)
              .with("Virtual", "VirtualAndPhysical", "SingleUseVirtual", item => Option.Some(item))
              .otherwise(() => Option.None()),
          )
        : undefined,
    } as const;
  }, [params.cardSearch, params.cardStatuses, params.cardType]);

  const hasFilters = Object.values(filters).some(isNotNullish);

  const statuses = match(filters.statuses)
    .with(["Active"], () => ACTIVE_STATUSES)
    .with(["Canceled"], () => CANCELED_STATUSES)
    .otherwise(() => [...ACTIVE_STATUSES, ...CANCELED_STATUSES]);

  const { data, nextData, reload, setAfter } = useUrqlPaginatedQuery(
    {
      query: CardListPageWithoutAccountDocument,
      variables: {
        first: PER_PAGE,
        filters: { statuses, types: filters.type, search: filters.search },
        accountMembershipId: editingAccountMembershipId,
      },
    },
    [filters],
  );

  const empty = (
    <FixedListViewEmpty
      icon="lake-card"
      borderedIcon={true}
      title={t("cardList.noResults")}
      subtitle={t("cardList.noResultsDescription")}
    >
      {canAddCard ? (
        <LakeButtonGroup>
          <LakeButton
            size="small"
            icon="add-circle-filled"
            color="current"
            onPress={() =>
              Router.push("AccountMembersDetailsCardList", {
                accountMembershipId: currentUserAccountMembershipId,
                editingAccountMembershipId,
                ...params,
                newCard: "",
              })
            }
          >
            {t("common.new")}
          </LakeButton>
        </LakeButtonGroup>
      ) : null}
    </FixedListViewEmpty>
  );

  return (
    <>
      {totalDisplayableCardCount === 0 ? (
        <View style={styles.empty}>{empty}</View>
      ) : (
        <ResponsiveContainer style={styles.root} breakpoint={breakpoints.large}>
          {({ large }) => (
            <>
              <Box style={[styles.filters, large && styles.filtersLarge]}>
                <CardListFilter
                  filters={filters}
                  onChange={filters =>
                    Router.push("AccountMembersDetailsCardList", {
                      accountMembershipId: currentUserAccountMembershipId,
                      editingAccountMembershipId,
                      ...params,
                      cardSearch: filters.search,
                      cardStatuses: filters.statuses,
                      cardType: filters.type,
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
                      onPress={() =>
                        Router.push("AccountMembersDetailsCardList", {
                          accountMembershipId: currentUserAccountMembershipId,
                          editingAccountMembershipId,
                          ...params,
                          newCard: "",
                        })
                      }
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
                    Ok: ({ accountMembership }) => (
                      <CardList
                        cards={accountMembership?.cards?.edges ?? []}
                        getRowLink={({ item }) => (
                          <Link
                            to={Router.AccountCardsItem({
                              accountMembershipId: currentUserAccountMembershipId,
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
                          if (accountMembership?.cards.pageInfo.hasNextPage ?? false) {
                            setAfter(accountMembership?.cards.pageInfo.endCursor ?? undefined);
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
      )}

      <FullViewportLayer visible={isCardWizardOpen}>
        <CardWizard
          canOrderPhysicalCards={canOrderPhysicalCards}
          accountMembership={currentUserAccountMembership}
          preselectedAccountMembership={editingAccountMembership}
          onPressClose={() => {
            Router.push("AccountMembersDetailsCardList", {
              accountMembershipId: currentUserAccountMembershipId,
              editingAccountMembershipId,
              ...params,
              newCard: undefined,
            });
          }}
        />
      </FullViewportLayer>
    </>
  );
};
