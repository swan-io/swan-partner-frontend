import { useCrumb } from "@swan-io/lake/src/components/Breadcrumbs";
import { LakeAlert } from "@swan-io/lake/src/components/LakeAlert";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LoadingView } from "@swan-io/lake/src/components/LoadingView";
import { Space } from "@swan-io/lake/src/components/Space";
import { TabView } from "@swan-io/lake/src/components/TabView";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { colors, spacings } from "@swan-io/lake/src/constants/design";
import { useResponsive } from "@swan-io/lake/src/hooks/useResponsive";
import { useQueryWithErrorBoundary } from "@swan-io/lake/src/utils/urql";
import { Suspense, useMemo } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { P, match } from "ts-pattern";
import { CardPageDocument } from "../graphql/partner";
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
  refetchAccountAreaQuery: () => void;
  idVerified: boolean;
  userStatusIsProcessing: boolean;
  canManageAccountMembership: boolean;
  physicalCardOrderVisible: boolean;
  canViewAccount: boolean;
  canManageCards: boolean;
  large?: boolean;
};

export const CardItemArea = ({
  accountMembershipId,
  userId,
  cardId,
  refetchAccountAreaQuery,
  canManageAccountMembership,
  physicalCardOrderVisible,
  canViewAccount,
  canManageCards,
  large = true,
}: Props) => {
  // use useResponsive to fit with scroll behavior set in AccountArea
  const { desktop } = useResponsive();

  const route = Router.useRoute([
    "AccountCardsItem",
    "AccountCardsItemPhysicalCard",
    "AccountCardsItemMobilePayment",
    "AccountCardsItemTransactions",
    "AccountCardsItemSettings",
    "AccountCardsItemOrder",
    "AccountCardsItemOrderAddress",
  ]);

  const [
    {
      data: {
        card,
        projectInfo: { id: projectId, B2BMembershipIDVerification },
      },
    },
    reexecuteQuery,
  ] = useQueryWithErrorBoundary({
    query: CardPageDocument,
    variables: { cardId },
  });

  useCrumb(
    useMemo(() => {
      if (card == null) {
        return undefined;
      }
      const accountMembership = card.accountMembership;
      const cardHolderName = getMemberName({ accountMembership });
      return {
        label: card.name != null ? `${cardHolderName} - ${card.name}` : cardHolderName,
        link: Router.AccountCardsItem({ accountMembershipId, cardId }),
      };
    }, [card, accountMembershipId, cardId]),
  );

  const shouldShowPhysicalCardTab = match({ physicalCardOrderVisible, card })
    .with(
      {
        physicalCardOrderVisible: true,
        card: { cardProduct: { applicableToPhysicalCards: true }, type: P.not("SingleUseVirtual") },
      },
      () => true,
    )
    .with({ card: { type: "VirtualAndPhysical" } }, () => true)
    .otherwise(() => false);

  const isCurrentUserCardOwner = userId === card?.accountMembership.user?.id;

  const membershipStatus = card?.accountMembership.statusInfo;

  const cardRequiresIdentityVerification =
    B2BMembershipIDVerification === true &&
    membershipStatus?.__typename === "AccountMembershipBindingUserErrorStatusInfo" &&
    membershipStatus.idVerifiedMatchError;

  const bindingUserError =
    membershipStatus?.__typename === "AccountMembershipBindingUserErrorStatusInfo" &&
    (membershipStatus.birthDateMatchError ||
      membershipStatus.firstNameMatchError ||
      membershipStatus.lastNameMatchError ||
      membershipStatus.phoneNumberMatchError);

  const identificationStatus = card?.accountMembership.user?.identificationStatus ?? undefined;

  if (card == null) {
    return <ErrorView />;
  }

  return (
    <>
      <TabView
        padding={desktop ? 40 : 24}
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
          ...match({ isCurrentUserCardOwner, card })
            .with(
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
                  __typename: P.not(P.union("CardCanceledStatusInfo", "CardCancelingStatusInfo")),
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
              {bindingUserError && B2BMembershipIDVerification === true && (
                <>
                  <Space height={24} />

                  <LakeAlert title={t("card.alert.informationConflict.title")} variant="error">
                    <LakeText color={colors.gray[500]} variant="regular">
                      {t("card.alert.informationConflict")}
                    </LakeText>
                  </LakeAlert>
                </>
              )}

              <CardItemVirtualDetails
                bindingUserError={bindingUserError}
                projectId={projectId}
                cardId={cardId}
                accountMembershipId={accountMembershipId}
                card={card}
                isCurrentUserCardOwner={isCurrentUserCardOwner}
                cardRequiresIdentityVerification={cardRequiresIdentityVerification}
                onRefreshAccountRequest={refetchAccountAreaQuery}
                identificationStatus={identificationStatus}
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
                {bindingUserError && B2BMembershipIDVerification === true && (
                  <>
                    <Space height={24} />

                    <LakeAlert title={t("card.alert.informationConflict.title")} variant="error">
                      <LakeText color={colors.gray[500]} variant="regular">
                        {t("card.alert.informationConflict")}
                      </LakeText>
                    </LakeAlert>
                  </>
                )}

                <CardItemPhysicalDetails
                  bindingUserError={bindingUserError}
                  projectId={projectId}
                  card={card}
                  cardId={cardId}
                  accountMembershipId={accountMembershipId}
                  isCurrentUserCardOwner={isCurrentUserCardOwner}
                  canManageAccountMembership={canManageAccountMembership}
                  onRefreshRequest={reexecuteQuery}
                  cardRequiresIdentityVerification={cardRequiresIdentityVerification}
                  onRefreshAccountRequest={refetchAccountAreaQuery}
                  identificationStatus={identificationStatus}
                  physicalCardOrderVisible={physicalCardOrderVisible}
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
                projectId={projectId}
                card={card}
                onRefreshRequest={reexecuteQuery}
                isCurrentUserCardOwner={isCurrentUserCardOwner}
                cardRequiresIdentityVerification={cardRequiresIdentityVerification}
                onRefreshAccountRequest={refetchAccountAreaQuery}
                identificationStatus={identificationStatus}
              />

              <Space height={24} />
            </ScrollView>
          ))
          .with(
            { name: "AccountCardsItemTransactions" },
            ({ params: { cardId, accountMembershipId, ...params } }) => (
              <CardItemTransactionList
                projectId={projectId}
                card={card}
                accountMembershipId={accountMembershipId}
                cardId={cardId}
                params={params}
                isCurrentUserCardOwner={isCurrentUserCardOwner}
                cardRequiresIdentityVerification={cardRequiresIdentityVerification}
                onRefreshAccountRequest={refetchAccountAreaQuery}
                identificationStatus={identificationStatus}
                canViewAccount={canViewAccount}
              />
            ),
          )
          .with({ name: "AccountCardsItemSettings" }, ({ params: { cardId } }) => (
            <ScrollView
              style={styles.container}
              contentContainerStyle={[styles.contents, large && styles.contentsLarge]}
            >
              <Space height={24} />

              <CardItemSettings
                projectId={projectId}
                accountMembershipId={accountMembershipId}
                cardId={cardId}
                card={card}
                isCurrentUserCardOwner={isCurrentUserCardOwner}
                cardRequiresIdentityVerification={cardRequiresIdentityVerification}
                onRefreshAccountRequest={refetchAccountAreaQuery}
                identificationStatus={identificationStatus}
                canManageCards={canManageCards}
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
};
