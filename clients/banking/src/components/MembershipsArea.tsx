import { Array, Option } from "@swan-io/boxed";
import { Link } from "@swan-io/chicane";
import { useQuery } from "@swan-io/graphql-client";
import { Box } from "@swan-io/lake/src/components/Box";
import { PlainListViewPlaceholder } from "@swan-io/lake/src/components/FixedListView";
import { FocusTrapRef } from "@swan-io/lake/src/components/FocusTrap";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { ListRightPanel } from "@swan-io/lake/src/components/ListRightPanel";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { breakpoints, colors, spacings } from "@swan-io/lake/src/constants/design";
import { isNotNullish } from "@swan-io/lake/src/utils/nullish";
import { Request } from "@swan-io/request";
import { LakeModal } from "@swan-io/shared-business/src/components/LakeModal";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { StyleSheet, View } from "react-native";
import { P, match } from "ts-pattern";
import { AccountCountry, AccountMembershipFragment, MembersPageDocument } from "../graphql/partner";
import { locale, t } from "../utils/i18n";
import { projectConfiguration } from "../utils/projectId";
import { Router, membershipsRoutes } from "../utils/routes";
import { Connection } from "./Connection";
import { ErrorView } from "./ErrorView";
import { MembershipDetailArea } from "./MembershipDetailArea";
import { MembershipInvitationLinkModal } from "./MembershipInvitationLinkModal";
import { MembershipList } from "./MembershipList";
import { MembershipFilters, MembershipListFilter } from "./MembershipListFilter";
import { NewMembershipWizard } from "./NewMembershipWizard";

const styles = StyleSheet.create({
  root: {
    ...commonStyles.fill,
    marginTop: spacings[24],
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
  accountMembershipId: string;
  accountId: string;
  memberCreationVisible: boolean;
  canAddCard: boolean;
  cardOrderVisible: boolean;
  physicalCardOrderVisible: boolean;
  accountCountry: AccountCountry;
  shouldDisplayIdVerification: boolean;
  params: {
    new?: string;
    search?: string | undefined;
    statuses?: string[] | undefined;
    canInitiatePayments?: string | undefined;
    canManageAccountMembership?: string | undefined;
    canManageBeneficiaries?: string | undefined;
    canViewAccount?: string | undefined;
    canManageCards?: string | undefined;
    // Params added after consent
    resourceId?: string | undefined;
    status?: string | undefined;
  };
  currentUserAccountMembership: AccountMembershipFragment;
  onAccountMembershipUpdate: () => void;
};

const PER_PAGE = 20;

const statusList = ["BindingUserError", "Enabled", "InvitationSent", "Suspended"] as const;

export const MembershipsArea = ({
  accountMembershipId,
  accountId,
  memberCreationVisible,
  canAddCard,
  cardOrderVisible,
  physicalCardOrderVisible,
  accountCountry,
  shouldDisplayIdVerification,
  params,
  currentUserAccountMembership,
  onAccountMembershipUpdate,
}: Props) => {
  const route = Router.useRoute(membershipsRoutes);

  const filters: MembershipFilters = useMemo(() => {
    return {
      statuses: isNotNullish(params.statuses)
        ? Array.filterMap(params.statuses, item =>
            match(item)
              .with(...statusList, value => Option.Some(value))
              .otherwise(() => Option.None()),
          )
        : undefined,
      canInitiatePayments: match(params.canInitiatePayments)
        .with("true", "false", value => value)
        .otherwise(() => undefined),
      canManageAccountMembership: match(params.canManageAccountMembership)
        .with("true", "false", value => value)
        .otherwise(() => undefined),
      canManageBeneficiaries: match(params.canManageBeneficiaries)
        .with("true", "false", value => value)
        .otherwise(() => undefined),
      canManageCards: match(params.canManageCards)
        .with("true", "false", value => value)
        .otherwise(() => undefined),
      canViewAccount: match(params.canViewAccount)
        .with("true", "false", value => value)
        .otherwise(() => undefined),
      search: params.search,
    } as const;
  }, [
    params.search,
    params.statuses,
    params.canInitiatePayments,
    params.canManageAccountMembership,
    params.canManageBeneficiaries,
    params.canViewAccount,
    params.canManageCards,
  ]);

  const [data, { isLoading, reload, setVariables }] = useQuery(MembersPageDocument, {
    first: PER_PAGE,
    accountId,
    status: match(filters.statuses)
      .with(undefined, () => [
        "BindingUserError" as const,
        "Enabled" as const,
        "InvitationSent" as const,
        "Suspended" as const,
      ])
      .otherwise(() => filters.statuses),
    canInitiatePayments: match(filters.canInitiatePayments)
      .with("true", () => true)
      .with("false", () => false)
      .otherwise(() => undefined),
    canManageAccountMembership: match(filters.canManageAccountMembership)
      .with("true", () => true)
      .with("false", () => false)
      .otherwise(() => undefined),
    canManageBeneficiaries: match(filters.canManageBeneficiaries)
      .with("true", () => true)
      .with("false", () => false)
      .otherwise(() => undefined),
    canManageCards: match(filters.canManageCards)
      .with("true", () => true)
      .with("false", () => false)
      .otherwise(() => undefined),
    canViewAccount: match(filters.canViewAccount)
      .with("true", () => true)
      .with("false", () => false)
      .otherwise(() => undefined),
    search: filters.search,
  });

  const editingAccountMembershipId = match(route)
    .with(
      { name: "AccountMembersDetailsArea" },
      ({ params: { editingAccountMembershipId } }) => editingAccountMembershipId,
    )
    .otherwise(() => null);

  const panelRef = useRef<FocusTrapRef | null>(null);

  const onActiveRowChange = useCallback(
    (element: HTMLElement) => panelRef.current?.setInitiallyFocusedElement(element),
    [],
  );

  const invitationToShow = match({
    params,
    accountMembershipInvitationMode: __env.ACCOUNT_MEMBERSHIP_INVITATION_MODE,
  })
    .with(
      {
        params: { resourceId: P.string, status: "Accepted" },
        accountMembershipInvitationMode: "LINK",
      },
      ({ params: { resourceId } }) => resourceId,
    )
    .otherwise(() => undefined);

  useEffect(() => {
    match({
      params,
      accountMembershipInvitationMode: __env.ACCOUNT_MEMBERSHIP_INVITATION_MODE,
    })
      .with(
        {
          params: { resourceId: P.string, status: "Accepted" },
          accountMembershipInvitationMode: "EMAIL",
        },
        ({ params: { resourceId } }) => {
          const query = new URLSearchParams();

          query.append("inviterAccountMembershipId", accountMembershipId);
          query.append("lang", locale.language);

          const url = match(projectConfiguration)
            .with(
              Option.P.Some({ projectId: P.select(), mode: "MultiProject" }),
              projectId =>
                `/api/projects/${projectId}/invitation/${resourceId}/send?${query.toString()}`,
            )
            .otherwise(() => `/api/invitation/${resourceId}/send?${query.toString()}`);

          const request = Request.make({
            url,
            method: "POST",
          }).tap(() => {
            Router.replace("AccountMembersList", {
              ...params,
              accountMembershipId,
              resourceId: undefined,
              status: undefined,
            });
          });

          return () => request.cancel();
        },
      )
      .otherwise(() => {});
  }, [params, accountMembershipId]);

  return (
    <ResponsiveContainer breakpoint={breakpoints.large} style={styles.root}>
      {({ large }) => (
        <>
          <View style={commonStyles.fill} role="main">
            <Box style={[styles.filters, large && styles.filtersLarge]}>
              <MembershipListFilter
                filters={filters}
                onChange={filters =>
                  Router.push("AccountMembersList", {
                    accountMembershipId,
                    ...filters,
                  })
                }
                onRefresh={() => {
                  reload();
                }}
                totalCount={data.mapOk(data => data.account?.memberships.totalCount ?? 0)}
                large={large}
              >
                {memberCreationVisible ? (
                  <LakeButton
                    size="small"
                    icon="add-circle-filled"
                    color="current"
                    onPress={() =>
                      Router.push("AccountMembersList", { accountMembershipId, new: "" })
                    }
                  >
                    {t("common.new")}
                  </LakeButton>
                ) : null}
              </MembershipListFilter>
            </Box>

            {data.match({
              NotAsked: () => null,
              Loading: () => (
                <PlainListViewPlaceholder
                  count={20}
                  rowVerticalSpacing={0}
                  headerHeight={large ? 48 : 0}
                  rowHeight={56}
                />
              ),
              Done: result =>
                result.match({
                  Error: error => <ErrorView error={error} />,
                  Ok: ({ account }) => (
                    <Connection connection={account?.memberships}>
                      {memberships => {
                        return (
                          <>
                            <MembershipList
                              memberships={memberships?.edges.map(({ node }) => node) ?? []}
                              accountMembershipId={accountMembershipId}
                              onActiveRowChange={onActiveRowChange}
                              editingAccountMembershipId={editingAccountMembershipId ?? undefined}
                              onEndReached={() => {
                                if (memberships?.pageInfo.hasNextPage === true) {
                                  setVariables({
                                    after: memberships.pageInfo.endCursor ?? undefined,
                                  });
                                }
                              }}
                              loading={{
                                isLoading,
                                count: PER_PAGE,
                              }}
                              getRowLink={({ item }) => (
                                <Link
                                  style={match(item.statusInfo)
                                    .with(
                                      {
                                        __typename: "AccountMembershipBindingUserErrorStatusInfo",
                                        idVerifiedMatchError: true,
                                      },
                                      () => ({
                                        backgroundColor: colors.warning[50],
                                      }),
                                    )
                                    .with(
                                      { __typename: "AccountMembershipBindingUserErrorStatusInfo" },
                                      () => ({
                                        backgroundColor: colors.negative[50],
                                      }),
                                    )
                                    .otherwise(() => undefined)}
                                  to={Router.AccountMembersDetailsRoot({
                                    accountMembershipId,
                                    ...params,
                                    editingAccountMembershipId: item.id,
                                  })}
                                />
                              )}
                              onRefreshRequest={() => {
                                reload();
                              }}
                            />

                            <ListRightPanel
                              ref={panelRef}
                              keyExtractor={item => item.id}
                              activeId={editingAccountMembershipId}
                              onActiveIdChange={editingAccountMembershipId =>
                                Router.push("AccountMembersDetailsRoot", {
                                  accountMembershipId,
                                  editingAccountMembershipId,
                                  ...params,
                                })
                              }
                              onClose={() =>
                                Router.push("AccountMembersList", {
                                  accountMembershipId,
                                  ...params,
                                })
                              }
                              items={memberships?.edges.map(item => item.node) ?? []}
                              render={(membership, large) => (
                                <MembershipDetailArea
                                  params={params}
                                  currentUserAccountMembershipId={accountMembershipId}
                                  currentUserAccountMembership={currentUserAccountMembership}
                                  editingAccountMembershipId={membership.id}
                                  onAccountMembershipUpdate={onAccountMembershipUpdate}
                                  canAddCard={cardOrderVisible && canAddCard}
                                  physicalCardOrderVisible={physicalCardOrderVisible}
                                  accountCountry={accountCountry}
                                  shouldDisplayIdVerification={shouldDisplayIdVerification}
                                  onRefreshRequest={() => {
                                    reload();
                                  }}
                                  large={large}
                                />
                              )}
                              closeLabel={t("common.closeButton")}
                              previousLabel={t("common.previous")}
                              nextLabel={t("common.next")}
                            />
                          </>
                        );
                      }}
                    </Connection>
                  ),
                }),
            })}
          </View>

          <LakeModal
            visible={params.new != null}
            icon="add-circle-regular"
            maxWidth={breakpoints.medium}
            title={t("membershipList.newMember.title")}
          >
            <LakeText color={colors.gray[500]}>
              {t("membershipList.newMember.description")}
            </LakeText>

            <Space height={16} />

            <NewMembershipWizard
              accountId={accountId}
              accountMembershipId={accountMembershipId}
              accountCountry={accountCountry}
              currentUserAccountMembership={currentUserAccountMembership}
              onSuccess={editingAccountMembershipId => {
                Router.push("AccountMembersDetailsRoot", {
                  accountMembershipId,
                  editingAccountMembershipId,
                  showInvitationLink:
                    __env.ACCOUNT_MEMBERSHIP_INVITATION_MODE === "LINK" ? "true" : undefined,
                  ...params,
                  new: undefined,
                });
                reload();
              }}
              onPressCancel={() =>
                Router.push("AccountMembersList", {
                  accountMembershipId,
                  ...params,
                  new: undefined,
                })
              }
            />
          </LakeModal>

          <MembershipInvitationLinkModal
            accountMembershipId={invitationToShow}
            onPressClose={() =>
              Router.push("AccountMembersList", {
                ...params,
                accountMembershipId,
                resourceId: undefined,
                status: undefined,
              })
            }
          />
        </>
      )}
    </ResponsiveContainer>
  );
};
