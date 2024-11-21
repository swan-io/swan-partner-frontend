import { AsyncData, Result } from "@swan-io/boxed";
import { useQuery } from "@swan-io/graphql-client";
import { Box } from "@swan-io/lake/src/components/Box";
import { LakeAlert } from "@swan-io/lake/src/components/LakeAlert";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { ListRightPanelContent } from "@swan-io/lake/src/components/ListRightPanel";
import { LoadingView } from "@swan-io/lake/src/components/LoadingView";
import { ScrollView } from "@swan-io/lake/src/components/ScrollView";
import { Space } from "@swan-io/lake/src/components/Space";
import { useIsSuspendable } from "@swan-io/lake/src/components/Suspendable";
import { TabView } from "@swan-io/lake/src/components/TabView";
import { Tag } from "@swan-io/lake/src/components/Tag";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { colors, negativeSpacings, spacings } from "@swan-io/lake/src/constants/design";
import { isNotNullishOrEmpty } from "@swan-io/lake/src/utils/nullish";
import { CountryCCA3 } from "@swan-io/shared-business/src/constants/countries";
import dayjs from "dayjs";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { P, match } from "ts-pattern";
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
  shouldDisplayIdVerification: boolean;
  onAccountMembershipUpdate: () => void;
  onRefreshRequest: () => void;
  large: boolean;
  params: {
    new?: string | undefined;
    search?: string | undefined;
    statuses?: string[] | undefined;
    canInitiatePayments?: string | undefined;
    canManageAccountMembership?: string | undefined;
    canManageBeneficiaries?: string | undefined;
    resourceId?: string | undefined;
    status?: string | undefined;
  };
};

export const MembershipDetailArea = ({
  editingAccountMembershipId,
  currentUserAccountMembershipId,
  currentUserAccountMembership,
  accountCountry,
  shouldDisplayIdVerification,
  onAccountMembershipUpdate,
  onRefreshRequest,
  large,
  params,
}: Props) => {
  const route = Router.useRoute(membershipsDetailRoutes);

  const suspense = useIsSuspendable();

  const [data, { reload }] = useQuery(
    MembershipDetailDocument,
    {
      accountMembershipId: editingAccountMembershipId,
    },
    { suspense },
  );

  const accountMembership = useMemo(() => {
    return data.mapOk(data =>
      match(data)
        .returnType<AccountMembershipFragment | undefined>()
        .with(
          {
            accountMembership: {
              canManageAccountMembership: false,
              canInitiatePayments: false,
              canManageBeneficiaries: false,
              canViewAccount: false,
              canManageCards: false,
              statusInfo: {
                __typename: "AccountMembershipBindingUserErrorStatusInfo",
                idVerifiedMatchError: true,
              },
            },
            projectInfo: { B2BMembershipIDVerification: false },
          },
          ({ accountMembership }) => ({
            ...accountMembership,
            statusInfo: {
              ...accountMembership.statusInfo,
              idVerifiedMatchError: false,
            },
          }),
        )
        .otherwise(() => data?.accountMembership ?? undefined),
    );
  }, [data]);

  return match(accountMembership)
    .with(AsyncData.P.NotAsked, AsyncData.P.Loading, () => (
      <LoadingView color={colors.current[500]} />
    ))
    .with(AsyncData.P.Done(Result.P.Error(P.select())), error => <ErrorView error={error} />)
    .with(AsyncData.P.Done(Result.P.Ok(P.select())), accountMembership => {
      if (accountMembership == null) {
        return null;
      }

      const requiresIdentityVerification =
        shouldDisplayIdVerification && accountMembership.hasRequiredIdentificationLevel === false;
      return (
        <ScrollView
          contentContainerStyle={
            large ? styles.scrollContainerDesktop : styles.scrollContainerMobile
          }
        >
          <View style={styles.container}>
            <ListRightPanelContent large={large}>
              <Tile
                footer={match(accountMembership)
                  .with(
                    {
                      statusInfo: {
                        __typename: "AccountMembershipBindingUserErrorStatusInfo",
                        emailVerifiedMatchError: true,
                      },
                      user: { verifiedEmails: [] },
                    },
                    () => (
                      <LakeAlert
                        anchored={true}
                        title={t("membershipDetail.emailVerifiedMatchError.description")}
                        variant="warning"
                      />
                    ),
                  )
                  .with(
                    {
                      statusInfo: {
                        __typename: "AccountMembershipBindingUserErrorStatusInfo",
                        idVerifiedMatchError: true,
                      },
                    },
                    () => (
                      <LakeAlert
                        anchored={true}
                        title={t("membershipDetail.idVerifiedMatchError.description")}
                        variant="warning"
                      />
                    ),
                  )
                  .with(
                    { statusInfo: { __typename: "AccountMembershipBindingUserErrorStatusInfo" } },
                    () => (
                      <LakeAlert
                        anchored={true}
                        title={t("membershipDetail.bindingUserError.description")}
                        variant="error"
                      />
                    ),
                  )
                  .otherwise(() => null)}
              >
                <Box alignItems="center">
                  {match(accountMembership)
                    .with(
                      { statusInfo: { __typename: "AccountMembershipEnabledStatusInfo" } },
                      () => <Tag color="positive">{t("memberships.status.active")}</Tag>,
                    )
                    .with(
                      {
                        statusInfo: {
                          __typename: "AccountMembershipBindingUserErrorStatusInfo",
                          idVerifiedMatchError: true,
                        },
                      },
                      {
                        statusInfo: {
                          __typename: "AccountMembershipBindingUserErrorStatusInfo",
                          emailVerifiedMatchError: true,
                        },
                        user: { verifiedEmails: [] },
                      },
                      () => <Tag color="warning">{t("memberships.status.limitedAccess")}</Tag>,
                    )
                    .with(
                      { statusInfo: { __typename: "AccountMembershipBindingUserErrorStatusInfo" } },
                      () => <Tag color="negative">{t("memberships.status.conflict")}</Tag>,
                    )
                    .with(
                      { statusInfo: { __typename: "AccountMembershipInvitationSentStatusInfo" } },
                      () => <Tag color="shakespear">{t("memberships.status.invitationSent")}</Tag>,
                    )
                    .with(
                      { statusInfo: { __typename: "AccountMembershipSuspendedStatusInfo" } },
                      () => <Tag color="warning">{t("memberships.status.temporarilyBlocked")}</Tag>,
                    )
                    .with(
                      { statusInfo: { __typename: "AccountMembershipDisabledStatusInfo" } },
                      () => <Tag color="gray">{t("memberships.status.permanentlyBlocked")}</Tag>,
                    )
                    .with(
                      { statusInfo: { __typename: "AccountMembershipConsentPendingStatusInfo" } },
                      () => null,
                    )
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
                P.intersection(
                  // we're in BindingUserError
                  {
                    statusInfo: {
                      __typename: "AccountMembershipBindingUserErrorStatusInfo",
                    },
                    user: P.nonNullable,
                  },
                  // but not due to the lack of identification
                  P.not({
                    statusInfo: {
                      __typename: "AccountMembershipBindingUserErrorStatusInfo",
                      idVerifiedMatchError: true,
                    },
                  }),
                  // or due to the lack of verified email
                  P.not({
                    statusInfo: {
                      __typename: "AccountMembershipBindingUserErrorStatusInfo",
                      emailVerifiedMatchError: true,
                    },
                    user: {
                      verifiedEmails: [],
                    },
                  }),
                ),
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
                            ...params,
                            accountMembershipId: currentUserAccountMembershipId,
                            editingAccountMembershipId,
                          }),
                        },
                        {
                          label: t("membershipDetail.rights"),
                          url: Router.AccountMembersDetailsRights({
                            ...params,
                            accountMembershipId: currentUserAccountMembershipId,
                            editingAccountMembershipId,
                          }),
                        },
                        ...match({ currentUserAccountMembership, accountMembership })
                          .with(
                            P.union(
                              {
                                currentUserAccountMembership: { canManageCards: true },
                              },
                              {
                                accountMembership: { id: currentUserAccountMembershipId },
                              },
                            ),
                            () => [
                              {
                                label: t("membershipDetail.cards"),
                                url: Router.AccountMembersDetailsCardList({
                                  ...params,
                                  accountMembershipId: currentUserAccountMembershipId,
                                  editingAccountMembershipId,
                                }),
                              },
                            ],
                          )
                          .otherwise(() => []),
                      ]}
                      otherLabel={t("common.tabs.other")}
                    />

                    <ListRightPanelContent large={large} style={styles.contents}>
                      {match({ route, currentUserAccountMembership, accountMembership })
                        .with(
                          { route: { name: "AccountMembersDetailsRoot" } },
                          ({
                            route: {
                              params: { showInvitationLink },
                            },
                          }) => (
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
                        .with({ route: { name: "AccountMembersDetailsRights" } }, () => (
                          <MembershipDetailRights
                            accountCountry={accountCountry}
                            editingAccountMembership={accountMembership}
                            editingAccountMembershipId={editingAccountMembershipId}
                            currentUserAccountMembership={currentUserAccountMembership}
                            currentUserAccountMembershipId={currentUserAccountMembershipId}
                            requiresIdentityVerification={requiresIdentityVerification}
                            onRefreshRequest={() => {
                              reload();
                              onRefreshRequest();
                            }}
                            large={large}
                          />
                        ))
                        .with(
                          P.union(
                            {
                              route: { name: "AccountMembersDetailsCardList" },
                              currentUserAccountMembership: { canManageCards: true },
                            },
                            {
                              route: { name: "AccountMembersDetailsCardList" },
                              accountMembership: { id: currentUserAccountMembershipId },
                            },
                          ),
                          ({
                            route: {
                              params: { accountMembershipId, ...params },
                            },
                          }) => (
                            <View style={large ? styles.cardListLarge : styles.cardList}>
                              <AccountMembersDetailsCardList
                                editingAccountMembership={accountMembership}
                                currentUserAccountMembership={currentUserAccountMembership}
                                currentUserAccountMembershipId={currentUserAccountMembershipId}
                                params={params}
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
    })
    .exhaustive();
};
