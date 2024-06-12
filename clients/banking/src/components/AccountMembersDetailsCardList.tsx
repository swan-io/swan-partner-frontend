import { Array, Option } from "@swan-io/boxed";
import { Link } from "@swan-io/chicane";
import { useQuery } from "@swan-io/graphql-client";
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
import { isNotNullish } from "@swan-io/lake/src/utils/nullish";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { match } from "ts-pattern";
import {
  AccountMembershipCardListPageDocument,
  AccountMembershipFragment,
} from "../graphql/partner";
import { t } from "../utils/i18n";
import { Router } from "../utils/routes";
import { CardList } from "./CardList";
import { CardFilters, CardListFilter } from "./CardListFilter";
import { CardWizard } from "./CardWizard";
import { Connection } from "./Connection";
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
    cardStatus?: string | undefined;
    cardType?: string[] | undefined;
  };
  isCardWizardOpen: boolean;
  physicalCardOrderVisible: boolean;
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
  physicalCardOrderVisible,
}: Props) => {
  const filters: CardFilters = useMemo(() => {
    return {
      search: params.cardSearch,
      status: match(params.cardStatus)
        .with("Active", "Canceled", item => item)
        .otherwise(() => "Active"),
      type: isNotNullish(params.cardType)
        ? Array.filterMap(params.cardType, item =>
            match(item)
              .with("Virtual", "VirtualAndPhysical", "SingleUseVirtual", item => Option.Some(item))
              .otherwise(() => Option.None()),
          )
        : undefined,
    } as const;
  }, [params.cardSearch, params.cardStatus, params.cardType]);

  const hasFilters = Object.values(filters).some(isNotNullish);

  const statuses = match(filters.status)
    .with("Active", () => ACTIVE_STATUSES)
    .with("Canceled", () => CANCELED_STATUSES)
    .exhaustive();

  const [data, { isLoading, reload, setVariables }] = useQuery(
    AccountMembershipCardListPageDocument,
    {
      first: PER_PAGE,
      filters: { statuses, types: filters.type, search: filters.search },
      accountMembershipId: editingAccountMembershipId,
    },
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
                      cardStatus: filters.status,
                      cardType: filters.type,
                    })
                  }
                  onRefresh={() => {
                    reload();
                  }}
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
                      <Connection connection={accountMembership?.cards}>
                        {cards => (
                          <CardList
                            cards={cards?.edges ?? []}
                            getRowLink={({ item }) => (
                              <Link
                                to={Router.AccountCardsItem({
                                  accountMembershipId: currentUserAccountMembershipId,
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
                              if (cards?.pageInfo.hasNextPage ?? false) {
                                setVariables({
                                  after: cards?.pageInfo.endCursor ?? undefined,
                                });
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
                        )}
                      </Connection>
                    ),
                  }),
              })}
            </>
          )}
        </ResponsiveContainer>
      )}

      <FullViewportLayer visible={isCardWizardOpen}>
        <CardWizard
          physicalCardOrderVisible={physicalCardOrderVisible}
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
