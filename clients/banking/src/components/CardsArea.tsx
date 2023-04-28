import { Option } from "@swan-io/boxed";
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
import { useQuery } from "urql";
import {
  AccountAreaQuery,
  CardCountWithAccountDocument,
  CardCountWithoutAccountDocument,
} from "../graphql/partner";
import { CardListPage } from "../pages/CardListPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { t } from "../utils/i18n";
import { Router } from "../utils/routes";
import { CardItemArea } from "./CardItemArea";
import { CardWizard } from "./CardWizard";
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
  accountId: string | undefined;
  canAddCard: boolean;
  canManageAccountMembership: boolean;
  canOrderPhysicalCards: boolean;
  idVerified: boolean;
  refetchAccountAreaQuery: () => void;
  userId: string;
  userStatusIsProcessing: boolean;
};

const relevantCardsFilter = {
  statuses: ["Enabled" as const, "Processing" as const, "Canceling" as const, "Canceled" as const],
};
// This hook is used to query Query.accountMembership.cards OR Query.cards,
// depending on if we have access to account details (especially its id)
const useDisplayableCardsInformation = ({
  accountMembershipId,
  accountId,
}: {
  accountMembershipId: string;
  accountId: string | undefined;
}) => {
  const hasAccountId = isNotNullish(accountId);

  const filtersWithAccount = useMemo(() => {
    return {
      statuses: relevantCardsFilter.statuses,
      accountId,
    } as const;
  }, [accountId]);

  const [withAccountQuery] = useQuery({
    query: CardCountWithAccountDocument,
    pause: !hasAccountId,
    variables: {
      first: 1,
      filters: filtersWithAccount,
    },
  });

  const [withoutAccountQuery] = useQuery({
    query: CardCountWithoutAccountDocument,
    pause: hasAccountId,
    variables: {
      accountMembershipId,
      first: 1,
      filters: relevantCardsFilter,
    },
  });

  if (hasAccountId) {
    return {
      onlyCardId:
        withAccountQuery.data?.cards.totalCount === 1
          ? Option.fromNullable(withAccountQuery.data?.cards.edges[0]?.node.id)
          : Option.None(),
      totalDisplayableCardCount: withAccountQuery.data?.cards.totalCount ?? 0,
    };
  } else {
    return {
      onlyCardId:
        withoutAccountQuery.data?.accountMembership?.cards.totalCount === 1
          ? Option.fromNullable(
              withoutAccountQuery.data?.accountMembership?.cards.edges[0]?.node.id,
            )
          : Option.None(),
      totalDisplayableCardCount: withoutAccountQuery.data?.accountMembership?.cards.totalCount ?? 0,
    };
  }
};

export const CardsArea = ({
  accountMembership,
  accountMembershipId,
  accountId,
  canAddCard,
  canManageAccountMembership,
  canOrderPhysicalCards,
  idVerified,
  refetchAccountAreaQuery,
  userId,
  userStatusIsProcessing,
}: Props) => {
  const route = Router.useRoute(["AccountCardsList", "AccountCardsItemArea"]);

  const { onlyCardId, totalDisplayableCardCount } = useDisplayableCardsInformation({
    accountMembershipId,
    accountId,
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

  if (isNullish(route?.name)) {
    return <NotFoundPage />;
  }

  return (
    <ResponsiveContainer style={styles.root} breakpoint={breakpoints.large}>
      {({ large }) => (
        <BreadcrumbsRoot rootLevelCrumbs={rootLevelCrumbs}>
          <View style={styles.container}>
            {totalDisplayableCardCount > 1 ? (
              <View style={[styles.header, large && styles.headerDesktop]}>
                <Breadcrumbs />
              </View>
            ) : null}

            {onlyCardId.isSome() ? <Space height={24} /> : null}

            <Suspense fallback={<LoadingView color={colors.partner.primary} />}>
              <View style={styles.contents}>
                {match(route)
                  .with(
                    { name: "AccountCardsList" },
                    ({ params: { accountMembershipId, new: _, ...params } }) => (
                      <CardListPage
                        accountMembershipId={accountMembershipId}
                        accountId={accountId}
                        canAddCard={canAddCard}
                        totalDisplayableCardCount={totalDisplayableCardCount}
                        params={params}
                      />
                    ),
                  )
                  .with({ name: "AccountCardsItemArea" }, ({ params: { cardId } }) => (
                    <>
                      {canAddCard && onlyCardId.isSome() ? (
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
                        accountMembershipId={accountMembershipId}
                        userId={userId}
                        cardId={cardId}
                        refetchAccountAreaQuery={refetchAccountAreaQuery}
                        idVerified={idVerified}
                        userStatusIsProcessing={userStatusIsProcessing}
                        canManageAccountMembership={canManageAccountMembership}
                        canOrderPhysicalCards={canOrderPhysicalCards}
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
                canOrderPhysicalCards={canOrderPhysicalCards}
                accountMembership={accountMembership}
                onPressClose={() => {
                  match(route)
                    .with({ name: P.string }, ({ name, params }) => {
                      Router.push(name === "AccountCardsItemArea" ? "AccountCardsItem" : name, {
                        ...params,
                        new: undefined,
                      });
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
};
