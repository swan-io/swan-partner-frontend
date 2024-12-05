import { AsyncData, Option, Result } from "@swan-io/boxed";
import { useQuery } from "@swan-io/graphql-client";
import { useCrumb } from "@swan-io/lake/src/components/Breadcrumbs";
import { LoadingView } from "@swan-io/lake/src/components/LoadingView";
import { ScrollView } from "@swan-io/lake/src/components/ScrollView";
import { Space } from "@swan-io/lake/src/components/Space";
import { TabView } from "@swan-io/lake/src/components/TabView";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { colors, spacings } from "@swan-io/lake/src/constants/design";
import { Suspense, useMemo } from "react";
import { StyleSheet } from "react-native";
import { P, match } from "ts-pattern";
import { CardPageDocument } from "../graphql/partner";
import { usePermissions } from "../hooks/usePermissions";
import { getMemberName } from "../utils/accountMembership";
import { t } from "../utils/i18n";
import { Router } from "../utils/routes";
import { CardItemMobilePayment } from "./CardItemMobilePayment";
import { CardItemPhysicalDetails } from "./CardItemPhysicalDetails";
import { CardItemSettings } from "./CardItemSettings";
import { CardItemTransactionList } from "./CardItemTransactionList";
import { CardItemVirtualDetails } from "./CardItemVirtualDetails";
import { ErrorView } from "./ErrorView";

const styles = StyleSheet.create({
  container: {
    ...commonStyles.fill,
  },
  contents: {
    ...commonStyles.fill,
    paddingHorizontal: spacings[24],
  },
  contentsLarge: {
    ...commonStyles.fill,
    paddingHorizontal: spacings[40],
  },
});

type Props = {
  accountMembershipId: string;
  userId: string;
  cardId: string;
  large?: boolean;
};

export const CardItemArea = ({ accountMembershipId, userId, cardId, large = true }: Props) => {
  const route = Router.useRoute([
    "AccountCardsItem",
    "AccountCardsItemPhysicalCard",
    "AccountCardsItemMobilePayment",
    "AccountCardsItemTransactions",
    "AccountCardsItemSettings",
    "AccountCardsItemOrder",
    "AccountCardsItemOrderAddress",
  ]);

  const { canPrintPhysicalCard, canReadOtherMembersCards } = usePermissions();
  const [data, { refresh }] = useQuery(CardPageDocument, { cardId });

  useCrumb(
    useMemo(() => {
      return data
        .toOption()
        .flatMap(result => result.toOption())
        .flatMap(({ card }) => Option.fromNullable(card))
        .map(card => {
          const accountMembership = card.accountMembership;
          const cardHolderName = getMemberName({ accountMembership });
          return {
            label: card.name != null ? `${cardHolderName} - ${card.name}` : cardHolderName,
            link: Router.AccountCardsItem({ accountMembershipId, cardId }),
          };
        })
        .toUndefined();
    }, [data, accountMembershipId, cardId]),
  );

  return match(data)
    .with(AsyncData.P.NotAsked, AsyncData.P.Loading, () => <LoadingView />)
    .with(AsyncData.P.Done(Result.P.Error(P.select())), error => <ErrorView error={error} />)
    .with(AsyncData.P.Done(Result.P.Error(P.select())), error => <ErrorView error={error} />)
    .with(AsyncData.P.Done(Result.P.Ok(P.select())), ({ card }) => {
      const shouldShowPhysicalCardTab = match({ canPrintPhysicalCard, card })
        .with(
          {
            canPrintPhysicalCard: true,
            card: {
              cardProduct: { applicableToPhysicalCards: true },
              type: P.not("SingleUseVirtual"),
            },
          },
          () => true,
        )
        .with({ card: { type: "VirtualAndPhysical" } }, () => true)
        .otherwise(() => false);

      const isCurrentUserCardOwner = userId === card?.accountMembership.user?.id;

      if (card == null) {
        return <ErrorView />;
      }

      //don't display the previousPhysicalCards if a physicalCard has a "ToRenew" status
      const cardToDisplay = match(card.physicalCard)
        .with(
          {
            statusInfo: { status: "ToRenew" },
            previousPhysicalCards: [{ isExpired: true }, ...P.array(P._)],
          },
          physicalCard => ({
            ...card,
            physicalCard: { ...physicalCard, previousPhysicalCards: [] },
          }),
        )
        .otherwise(() => ({ ...card }));

      return (
        <>
          <TabView
            padding={large ? 40 : 24}
            sticky={true}
            tabs={[
              {
                label: t("cardDetail.virtualCard"),
                url: Router.AccountCardsItem({ accountMembershipId, cardId }),
              },
              ...(shouldShowPhysicalCardTab
                ? [
                    {
                      label: t("cardDetail.physicalCard"),
                      url: Router.AccountCardsItemPhysicalCard({
                        accountMembershipId,
                        cardId,
                      }),
                    },
                  ]
                : []),
              ...match({ isCurrentUserCardOwner, card, canReadOtherMembersCards })
                .with(
                  {
                    canReadOtherMembersCards: true,
                    card: { type: P.not("SingleUseVirtual") },
                  },
                  { isCurrentUserCardOwner: true, card: { type: P.not("SingleUseVirtual") } },
                  () => [
                    {
                      label: t("cardDetail.mobilePayment"),
                      url: Router.AccountCardsItemMobilePayment({
                        accountMembershipId,
                        cardId,
                      }),
                    },
                  ],
                )
                .otherwise(() => []),
              {
                label: t("cardDetail.transactions"),
                url: Router.AccountCardsItemTransactions({ accountMembershipId, cardId }),
              },
              ...match(card)
                .with(
                  {
                    statusInfo: {
                      __typename: P.not(
                        P.union("CardCanceledStatusInfo", "CardCancelingStatusInfo"),
                      ),
                    },
                  },
                  () => [
                    {
                      label: t("cardDetail.settings"),
                      url: Router.AccountCardsItemSettings({
                        accountMembershipId,
                        cardId,
                      }),
                    },
                  ],
                )
                .otherwise(() => []),
            ]}
            otherLabel={t("common.tabs.other")}
          />

          <Suspense fallback={<LoadingView color={colors.current[500]} />}>
            {match(route)
              .with({ name: "AccountCardsItem" }, ({ params: { cardId } }) => (
                <ScrollView
                  style={styles.container}
                  contentContainerStyle={[styles.contents, large && styles.contentsLarge]}
                >
                  <CardItemVirtualDetails
                    hasBindingUserError={
                      card.accountMembership.statusInfo.status === "BindingUserError"
                    }
                    cardId={cardId}
                    accountMembershipId={accountMembershipId}
                    card={card}
                    isCurrentUserCardOwner={isCurrentUserCardOwner}
                  />

                  <Space height={24} />
                </ScrollView>
              ))
              .with(
                { name: "AccountCardsItemPhysicalCard" },
                ({ params: { cardId, accountMembershipId } }) => (
                  <ScrollView
                    style={styles.container}
                    contentContainerStyle={[styles.contents, large && styles.contentsLarge]}
                  >
                    <CardItemPhysicalDetails
                      hasBindingUserError={
                        card.accountMembership.statusInfo.status === "BindingUserError"
                      }
                      card={cardToDisplay}
                      cardId={cardId}
                      accountMembershipId={accountMembershipId}
                      isCurrentUserCardOwner={isCurrentUserCardOwner}
                      onRefreshRequest={() => {
                        refresh();
                      }}
                    />

                    <Space height={24} />
                  </ScrollView>
                ),
              )
              .with({ name: "AccountCardsItemMobilePayment" }, () => (
                <ScrollView
                  style={styles.container}
                  contentContainerStyle={[styles.contents, large && styles.contentsLarge]}
                >
                  <Space height={24} />

                  <CardItemMobilePayment
                    isCurrentUserCardOwner={isCurrentUserCardOwner}
                    card={card}
                    onRefreshRequest={() => {
                      refresh();
                    }}
                  />

                  <Space height={24} />
                </ScrollView>
              ))
              .with({ name: "AccountCardsItemTransactions" }, ({ params }) => (
                <CardItemTransactionList params={params} />
              ))
              .with({ name: "AccountCardsItemSettings" }, ({ params: { cardId } }) => (
                <ScrollView
                  style={styles.container}
                  contentContainerStyle={[styles.contents, large && styles.contentsLarge]}
                >
                  <Space height={24} />

                  <CardItemSettings
                    accountMembershipId={accountMembershipId}
                    cardId={cardId}
                    card={card}
                  />

                  <Space height={24} />
                </ScrollView>
              ))
              .otherwise(() => (
                <ErrorView />
              ))}
          </Suspense>
        </>
      );
    })
    .otherwise(() => <ErrorView />);
};
