import { AsyncData, Option, Result } from "@swan-io/boxed";
import { useQuery } from "@swan-io/graphql-client";
import { Breadcrumbs, BreadcrumbsRoot } from "@swan-io/lake/src/components/Breadcrumbs";
import { FullViewportLayer } from "@swan-io/lake/src/components/FullViewportLayer";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LoadingView } from "@swan-io/lake/src/components/LoadingView";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { breakpoints, colors, spacings } from "@swan-io/lake/src/constants/design";
import { isNotNullish, isNullish } from "@swan-io/lake/src/utils/nullish";
import { Suspense, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { P, match } from "ts-pattern";
import { AccountAreaQuery, CardCountDocument } from "../graphql/partner";
import { usePermissions } from "../hooks/usePermissions";
import { CardListPage } from "../pages/CardListPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { t } from "../utils/i18n";
import { Router } from "../utils/routes";
import { CardItemArea } from "./CardItemArea";
import { CardWizard } from "./CardWizard";
import { ErrorView } from "./ErrorView";
import { Redirect } from "./Redirect";

const styles = StyleSheet.create({
  root: {
    ...commonStyles.fill,
  },
  container: {
    ...commonStyles.fill,
  },
  header: {
    paddingHorizontal: spacings[24],
    paddingVertical: spacings[12],
  },
  headerDesktop: {
    paddingHorizontal: spacings[40],
    paddingVertical: spacings[24],
    paddingBottom: spacings[12],
  },
  addButton: {
    paddingHorizontal: spacings[24],
    paddingBottom: spacings[12],
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  addButtonDesktop: {
    paddingHorizontal: spacings[40],
    paddingBottom: spacings[12],
  },
  contents: {
    ...commonStyles.fill,
  },
});

type Props = {
  accountMembership: NonNullable<AccountAreaQuery["accountMembership"]>;
  accountMembershipId: string;
  accountId: string;
  userId: string;
};

const relevantCardsFilter = {
  statuses: ["Enabled" as const, "Processing" as const, "Canceling" as const, "Canceled" as const],
};

export const CardsArea = ({ accountMembership, accountMembershipId, accountId, userId }: Props) => {
  const { canAddCard: canOrderCard } = usePermissions();
  const route = Router.useRoute(["AccountCardsList", "AccountCardsItemArea"]);

  const [data] = useQuery(CardCountDocument, {
    first: 1,
    filters: {
      statuses: relevantCardsFilter.statuses,
      accountId,
    },
  });

  const rootLevelCrumbs = useMemo(
    () => [
      {
        label: t("cards.title"),
        link: Router.AccountCardsList({ accountMembershipId }),
      },
    ],
    [accountMembershipId],
  );

  if (isNullish(route?.name)) {
    return <NotFoundPage />;
  }

  return match(
    data.mapOk(data => ({
      onlyCardId:
        data?.cards.totalCount === 1
          ? Option.fromNullable(data?.cards.edges[0]?.node.id)
          : Option.None(),
      totalDisplayableCardCount: data?.cards.totalCount ?? 0,
    })),
  )
    .with(AsyncData.P.NotAsked, AsyncData.P.Loading, () => <LoadingView />)
    .with(AsyncData.P.Done(Result.P.Error(P.select())), error => <ErrorView error={error} />)
    .with(
      AsyncData.P.Done(Result.P.Ok(P.select())),
      ({ onlyCardId, totalDisplayableCardCount }) => {
        if (onlyCardId.isSome() && route?.name !== "AccountCardsItemArea") {
          return (
            <Redirect
              to={Router.AccountCardsItem({
                accountMembershipId,
                cardId: onlyCardId.value,
              })}
            />
          );
        }

        return (
          <ResponsiveContainer style={styles.root} breakpoint={breakpoints.large}>
            {({ large }) => (
              <BreadcrumbsRoot rootLevelCrumbs={rootLevelCrumbs}>
                <View style={styles.container} role="main">
                  {totalDisplayableCardCount > 1 ? (
                    <View style={[styles.header, large && styles.headerDesktop]}>
                      <Breadcrumbs />
                    </View>
                  ) : null}

                  {onlyCardId.isSome() ? <Space height={24} /> : null}

                  <Suspense fallback={<LoadingView color={colors.current[500]} />}>
                    <View style={styles.contents}>
                      {match(route)
                        .with(
                          { name: "AccountCardsList" },
                          ({ params: { accountMembershipId, new: _, ...params } }) => (
                            <CardListPage
                              accountMembershipId={accountMembershipId}
                              accountId={accountId}
                              totalDisplayableCardCount={totalDisplayableCardCount}
                              params={params}
                            />
                          ),
                        )
                        .with({ name: "AccountCardsItemArea" }, ({ params: { cardId } }) => (
                          <>
                            {canOrderCard && onlyCardId.isSome() ? (
                              <View style={[styles.addButton, large && styles.addButtonDesktop]}>
                                <LakeButton
                                  size="small"
                                  icon="add-circle-filled"
                                  color="current"
                                  onPress={() =>
                                    Router.push("AccountCardsItem", {
                                      cardId,
                                      accountMembershipId,
                                      new: "",
                                    })
                                  }
                                >
                                  {t("common.new")}
                                </LakeButton>
                              </View>
                            ) : null}

                            <CardItemArea
                              data-testid="user-card-item"
                              accountMembershipId={accountMembershipId}
                              userId={userId}
                              cardId={cardId}
                              large={large}
                            />
                          </>
                        ))
                        .with(P.nullish, () => null)
                        .exhaustive()}
                    </View>
                  </Suspense>

                  <FullViewportLayer visible={isNotNullish(route?.params.new)}>
                    <CardWizard
                      accountMembership={accountMembership}
                      onPressClose={() => {
                        match(route)
                          .with({ name: "AccountCardsList" }, ({ params }) => {
                            Router.push("AccountCardsList", { ...params, new: undefined });
                          })
                          .with({ name: "AccountCardsItemArea" }, ({ params }) => {
                            Router.push("AccountCardsItem", { ...params, new: undefined });
                          })
                          .otherwise(() => {});
                      }}
                    />
                  </FullViewportLayer>
                </View>
              </BreadcrumbsRoot>
            )}
          </ResponsiveContainer>
        );
      },
    )
    .exhaustive();
};
