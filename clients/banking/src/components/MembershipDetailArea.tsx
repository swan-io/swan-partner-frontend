import { Box } from "@swan-io/lake/src/components/Box";
import { LakeAlert } from "@swan-io/lake/src/components/LakeAlert";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { ListRightPanelContent } from "@swan-io/lake/src/components/ListRightPanel";
import { Space } from "@swan-io/lake/src/components/Space";
import { TabView } from "@swan-io/lake/src/components/TabView";
import { Tag } from "@swan-io/lake/src/components/Tag";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { colors, negativeSpacings, spacings } from "@swan-io/lake/src/constants/design";
import { isNotNullishOrEmpty } from "@swan-io/lake/src/utils/nullish";
import { CountryCCA3 } from "@swan-io/shared-business/src/constants/countries";
import dayjs from "dayjs";
import { ScrollView, StyleSheet, View } from "react-native";
import { P, match } from "ts-pattern";
import { useQuery } from "urql";
import { AccountMembershipFragment, MembershipDetailDocument } from "../graphql/partner";
import { getMemberName } from "../utils/accountMembership";
import { t } from "../utils/i18n";
import { Router, membershipsDetailRoutes } from "../utils/routes";
import { AccountMembersDetailsCardList } from "./AccountMembersDetailsCardList";
import { ErrorView } from "./ErrorView";
import { MembershipConflictResolutionEditor } from "./MembershipConflictResolutionEditor";
import { MembershipDetailEditor } from "./MembershipDetailEditor";
import { MembershipDetailRights } from "./MembershipDetailRights";

const styles = StyleSheet.create({
  cardList: {
    ...commonStyles.fill,
    paddingTop: spacings[24],
    marginHorizontal: negativeSpacings[24],
  },
  cardListLarge: {
    ...commonStyles.fill,
    paddingTop: spacings[24],
    marginHorizontal: negativeSpacings[40],
  },
  scrollContainerMobile: {
    // used only for sticky tabs
    minHeight: "100%",
  },
  scrollContainerDesktop: {
    ...commonStyles.fill,
  },
  contents: {
    ...commonStyles.fill,
  },
  container: {
    ...commonStyles.fill,
  },
});

type Props = {
  currentUserAccountMembershipId: string;
  currentUserAccountMembership: AccountMembershipFragment;
  editingAccountMembershipId: string;
  accountCountry: CountryCCA3;
  onAccountMembershipUpdate: () => void;
  canAddCard: boolean;
  canOrderPhysicalCards: boolean;
  onRefreshRequest: () => void;
  large: boolean;
};

export const MembershipDetailArea = ({
  editingAccountMembershipId,
  currentUserAccountMembershipId,
  currentUserAccountMembership,
  accountCountry,
  onAccountMembershipUpdate,
  canAddCard,
  canOrderPhysicalCards,
  onRefreshRequest,
  large,
}: Props) => {
  const route = Router.useRoute(membershipsDetailRoutes);

  const [{ data }, reload] = useQuery({
    query: MembershipDetailDocument,
    variables: { accountMembershipId: editingAccountMembershipId },
  });

  const accountMembership = data?.accountMembership;
  if (accountMembership == null) {
    return null;
  }

  return (
    <ScrollView
      contentContainerStyle={large ? styles.scrollContainerDesktop : styles.scrollContainerMobile}
    >
      <View style={styles.container}>
        <ListRightPanelContent large={large}>
          <Tile
            footer={match(accountMembership.statusInfo)
              .with(
                {
                  __typename: "AccountMembershipBindingUserErrorStatusInfo",
                  idVerifiedMatchError: true,
                },
                () => (
                  <LakeAlert
                    anchored={true}
                    title={t("membershipDetail.idVerifiedMatchError.description")}
                    variant="warning"
                  />
                ),
              )
              .with({ __typename: "AccountMembershipBindingUserErrorStatusInfo" }, () => (
                <LakeAlert
                  anchored={true}
                  title={t("membershipDetail.bindingUserError.description")}
                  variant="error"
                />
              ))
              .otherwise(() => null)}
          >
            <Box alignItems="center">
              {match(accountMembership.statusInfo)
                .with({ __typename: "AccountMembershipEnabledStatusInfo" }, () => (
                  <Tag color="positive">{t("memberships.status.active")}</Tag>
                ))
                .with(
                  {
                    __typename: "AccountMembershipBindingUserErrorStatusInfo",
                    idVerifiedMatchError: true,
                  },
                  () => <Tag color="warning">{t("memberships.status.limitedAccess")}</Tag>,
                )
                .with({ __typename: "AccountMembershipBindingUserErrorStatusInfo" }, () => (
                  <Tag color="negative">{t("memberships.status.conflict")}</Tag>
                ))
                .with({ __typename: "AccountMembershipInvitationSentStatusInfo" }, () => (
                  <Tag color="shakespear">{t("memberships.status.invitationSent")}</Tag>
                ))
                .with({ __typename: "AccountMembershipSuspendedStatusInfo" }, () => (
                  <Tag color="warning">{t("memberships.status.temporarilyBlocked")}</Tag>
                ))
                .with({ __typename: "AccountMembershipDisabledStatusInfo" }, () => (
                  <Tag color="gray">{t("memberships.status.permanentlyBlocked")}</Tag>
                ))
                .with({ __typename: "AccountMembershipConsentPendingStatusInfo" }, () => null)
                .exhaustive()}

              <Space height={12} />

              <LakeHeading level={1} variant={large ? "h1" : "h3"} align="center">
                {getMemberName({ accountMembership })}
              </LakeHeading>

              <Space height={8} />

              <LakeText color={colors.gray[700]}>
                {t("membershipDetail.addedAt", {
                  date: dayjs(accountMembership.createdAt).format("LL"),
                })}
              </LakeText>
            </Box>
          </Tile>
        </ListRightPanelContent>

        <Space height={24} />

        {match(accountMembership)
          .with(
            {
              statusInfo: {
                __typename: "AccountMembershipBindingUserErrorStatusInfo",
                idVerifiedMatchError: P.not(true),
              },
              user: P.not(P.nullish),
            },
            accountMembership => (
              <ListRightPanelContent large={large} style={styles.contents}>
                <MembershipConflictResolutionEditor
                  editingAccountMembershipId={editingAccountMembershipId}
                  accountMembership={accountMembership}
                  currentUserAccountMembershipId={currentUserAccountMembershipId}
                  onAction={() => {
                    onAccountMembershipUpdate();
                    reload();
                  }}
                />
              </ListRightPanelContent>
            ),
          )
          .with(
            {
              statusInfo: {
                __typename: P.union(
                  "AccountMembershipDisabledStatusInfo",
                  "AccountMembershipEnabledStatusInfo",
                  "AccountMembershipBindingUserErrorStatusInfo",
                  "AccountMembershipInvitationSentStatusInfo",
                  "AccountMembershipSuspendedStatusInfo",
                ),
              },
            },
            accountMembership => (
              <>
                <TabView
                  sticky={true}
                  padding={large ? 40 : 24}
                  tabs={[
                    {
                      label: t("membershipDetail.details"),
                      url: Router.AccountMembersDetailsRoot({
                        accountMembershipId: currentUserAccountMembershipId,
                        editingAccountMembershipId,
                      }),
                    },
                    {
                      label: t("membershipDetail.rights"),
                      url: Router.AccountMembersDetailsRights({
                        accountMembershipId: currentUserAccountMembershipId,
                        editingAccountMembershipId,
                      }),
                    },
                    {
                      label: t("membershipDetail.cards"),
                      url: Router.AccountMembersDetailsCardList({
                        accountMembershipId: currentUserAccountMembershipId,
                        editingAccountMembershipId,
                      }),
                    },
                  ]}
                  otherLabel={t("common.tabs.other")}
                />

                <ListRightPanelContent large={large} style={styles.contents}>
                  {match(route)
                    .with(
                      { name: "AccountMembersDetailsRoot" },
                      ({ params: { showInvitationLink } }) => (
                        <MembershipDetailEditor
                          accountCountry={accountCountry}
                          editingAccountMembership={accountMembership}
                          editingAccountMembershipId={editingAccountMembershipId}
                          currentUserAccountMembership={currentUserAccountMembership}
                          currentUserAccountMembershipId={currentUserAccountMembershipId}
                          onRefreshRequest={() => {
                            reload();
                            onRefreshRequest();
                          }}
                          large={large}
                          showInvitationLink={isNotNullishOrEmpty(showInvitationLink)}
                        />
                      ),
                    )
                    .with({ name: "AccountMembersDetailsRights" }, () => (
                      <MembershipDetailRights
                        accountCountry={accountCountry}
                        editingAccountMembership={accountMembership}
                        editingAccountMembershipId={editingAccountMembershipId}
                        currentUserAccountMembership={currentUserAccountMembership}
                        currentUserAccountMembershipId={currentUserAccountMembershipId}
                        onRefreshRequest={() => {
                          reload();
                          onRefreshRequest();
                        }}
                        large={large}
                      />
                    ))
                    .with(
                      { name: "AccountMembersDetailsCardList" },
                      ({
                        params: {
                          accountMembershipId,
                          editingAccountMembershipId,
                          newCard: isCardWizardOpen,
                          ...params
                        },
                      }) => (
                        <View style={large ? styles.cardListLarge : styles.cardList}>
                          <AccountMembersDetailsCardList
                            canAddCard={canAddCard}
                            editingAccountMembershipId={editingAccountMembershipId}
                            editingAccountMembership={accountMembership}
                            currentUserAccountMembership={currentUserAccountMembership}
                            currentUserAccountMembershipId={currentUserAccountMembershipId}
                            totalDisplayableCardCount={accountMembership.allCards.totalCount}
                            params={params}
                            isCardWizardOpen={isCardWizardOpen != null}
                            canOrderPhysicalCards={canOrderPhysicalCards}
                          />
                        </View>
                      ),
                    )
                    .otherwise(() => null)}
                </ListRightPanelContent>
              </>
            ),
          )
          .otherwise(() => (
            <ErrorView />
          ))}
      </View>
    </ScrollView>
  );
};
