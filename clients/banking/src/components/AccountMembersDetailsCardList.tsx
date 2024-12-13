import { Link } from "@swan-io/chicane";
import { useQuery } from "@swan-io/graphql-client";
import { Box } from "@swan-io/lake/src/components/Box";
import { EmptyView } from "@swan-io/lake/src/components/EmptyView";
import { FullViewportLayer } from "@swan-io/lake/src/components/FullViewportLayer";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { PlainListViewPlaceholder } from "@swan-io/lake/src/components/PlainListView";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { breakpoints, spacings } from "@swan-io/lake/src/constants/design";
import { isNotNullish, nullishOrEmptyToUndefined } from "@swan-io/lake/src/utils/nullish";
import { useMemo } from "react";
import { StyleSheet } from "react-native";
import { isMatching, P } from "ts-pattern";
import { Except } from "type-fest";
import {
  AccountMembershipCardListPageDocument,
  AccountMembershipFragment,
} from "../graphql/partner";
import { usePermissions } from "../hooks/usePermissions";
import { t } from "../utils/i18n";
import { GetRouteParams, Router } from "../utils/routes";
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
});

type Props = {
  currentUserAccountMembershipId: string;
  currentUserAccountMembership: AccountMembershipFragment;
  editingAccountMembership: AccountMembershipFragment;
  params: Except<GetRouteParams<"AccountMembersDetailsCardList">, "accountMembershipId">;
};

const PER_PAGE = 20;

const ACTIVE_STATUSES = ["Processing" as const, "Enabled" as const];
const CANCELED_STATUSES = ["Canceling" as const, "Canceled" as const];

export const AccountMembersDetailsCardList = ({
  currentUserAccountMembershipId,
  currentUserAccountMembership,
  editingAccountMembership,
  params,
}: Props) => {
  const isCardWizardOpen = params.newCard != null;
  const { canAddCard, canAddCardForOtherMemberships } = usePermissions();
  const isUserOwnMembership = currentUserAccountMembership.id === editingAccountMembership.id;

  const showAddCard = canAddCard && (isUserOwnMembership || canAddCardForOtherMemberships);

  const filters = useMemo<CardFilters>(
    () => ({
      type: params.cardType?.filter(
        isMatching(P.union("Virtual", "VirtualAndPhysical", "SingleUseVirtual")),
      ),
    }),
    [params.cardType],
  );

  const search = nullishOrEmptyToUndefined(params.cardSearch);
  const status = params.cardStatus === "Canceled" ? "Canceled" : "Active";

  const hasSearchOrFilters =
    isNotNullish(search) || status === "Canceled" || Object.values(filters).some(isNotNullish);

  const [data, { isLoading, reload, setVariables }] = useQuery(
    AccountMembershipCardListPageDocument,
    {
      first: PER_PAGE,
      accountMembershipId: params.editingAccountMembershipId,
      filters: {
        statuses: status === "Active" ? ACTIVE_STATUSES : CANCELED_STATUSES,
        types: filters.type,
        search,
      },
    },
  );

  const empty = (
    <EmptyView
      icon="lake-card"
      borderedIcon={true}
      title={t("cardList.noResults")}
      subtitle={t("cardList.noResultsDescription")}
    >
      {showAddCard ? (
        <LakeButtonGroup>
          <LakeButton
            size="small"
            icon="add-circle-filled"
            color="current"
            onPress={() =>
              Router.push("AccountMembersDetailsCardList", {
                accountMembershipId: currentUserAccountMembershipId,
                ...params,
                newCard: "",
              })
            }
          >
            {t("common.new")}
          </LakeButton>
        </LakeButtonGroup>
      ) : null}
    </EmptyView>
  );

  return (
    <>
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
                  Router.replace("AccountMembersDetailsCardList", {
                    accountMembershipId: currentUserAccountMembershipId,
                    ...params,
                    cardType: filters.type,
                  });
                }}
                onChangeSearch={cardSearch => {
                  Router.replace("AccountMembersDetailsCardList", {
                    accountMembershipId: currentUserAccountMembershipId,
                    ...params,
                    cardSearch,
                  });
                }}
                onChangeStatus={cardStatus => {
                  Router.replace("AccountMembersDetailsCardList", {
                    accountMembershipId: currentUserAccountMembershipId,
                    ...params,
                    cardStatus,
                  });
                }}
              >
                {showAddCard ? (
                  <LakeButton
                    size="small"
                    icon="add-circle-filled"
                    color="current"
                    onPress={() =>
                      Router.push("AccountMembersDetailsCardList", {
                        accountMembershipId: currentUserAccountMembershipId,
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
                          large={large}
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

      <FullViewportLayer visible={isCardWizardOpen}>
        <CardWizard
          accountMembership={currentUserAccountMembership}
          preselectedAccountMembership={editingAccountMembership}
          onPressClose={() => {
            Router.push("AccountMembersDetailsCardList", {
              accountMembershipId: currentUserAccountMembershipId,
              ...params,
              newCard: undefined,
            });
          }}
        />
      </FullViewportLayer>
    </>
  );
};
