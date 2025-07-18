import { Option } from "@swan-io/boxed";
import { Link } from "@swan-io/chicane";
import { useDeferredQuery, useQuery } from "@swan-io/graphql-client";
import { Box } from "@swan-io/lake/src/components/Box";
import { FocusTrapRef } from "@swan-io/lake/src/components/FocusTrap";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { ListRightPanel } from "@swan-io/lake/src/components/ListRightPanel";
import { PlainListViewPlaceholder } from "@swan-io/lake/src/components/PlainListView";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { breakpoints, colors, spacings } from "@swan-io/lake/src/constants/design";
import { nullishOrEmptyToUndefined } from "@swan-io/lake/src/utils/nullish";
import { Request } from "@swan-io/request";
import { LakeModal } from "@swan-io/shared-business/src/components/LakeModal";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { StyleSheet, View } from "react-native";
import { P, isMatching, match } from "ts-pattern";
import { Except } from "type-fest";
import {
  AccountCountry,
  AccountMembershipFragment,
  MembersPageDocument,
  MembershipDetailDocument,
} from "../graphql/partner";
import { usePermissions } from "../hooks/usePermissions";
import { locale, t } from "../utils/i18n";
import { projectConfiguration } from "../utils/projectId";
import { RouteParams, Router, membershipsRoutes } from "../utils/routes";
import { Connection } from "./Connection";
import { ErrorView } from "./ErrorView";
import { MembershipDetailArea } from "./MembershipDetailArea";
import { MembershipInvitationLinkModal } from "./MembershipInvitationLinkModal";
import { MembershipList } from "./MembershipList";
import {
  MembershipFilters,
  MembershipListFilter,
  booleanParamToBoolean,
  parseBooleanParam,
} from "./MembershipListFilter";
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
  accountCountry: AccountCountry;
  shouldDisplayIdVerification: boolean;
  params: Except<RouteParams<"AccountMembersArea">, "accountMembershipId">;
  currentUserAccountMembership: AccountMembershipFragment;
  onAccountMembershipUpdate: () => void;
};

const PER_PAGE = 20;

export const MembershipsArea = ({
  accountMembershipId,
  accountId,
  accountCountry,
  shouldDisplayIdVerification,
  params,
  currentUserAccountMembership,
  onAccountMembershipUpdate,
}: Props) => {
  const { canAddAccountMembership } = usePermissions();
  const [, { query: queryLastCreatedMembership }] = useDeferredQuery(MembershipDetailDocument);
  const route = Router.useRoute(membershipsRoutes);

  const filters = useMemo(
    (): MembershipFilters => ({
      statuses: params.statuses?.filter(
        isMatching(P.union("BindingUserError", "Enabled", "InvitationSent", "Suspended")),
      ),
      canViewAccount: parseBooleanParam(params.canViewAccount),
      canManageCards: parseBooleanParam(params.canManageCards),
      canInitiatePayments: parseBooleanParam(params.canInitiatePayments),
      canManageAccountMembership: parseBooleanParam(params.canManageAccountMembership),
      canManageBeneficiaries: parseBooleanParam(params.canManageBeneficiaries),
    }),
    [params],
  );

  const search = nullishOrEmptyToUndefined(params.search);

  const [data, { isLoading, reload, setVariables }] = useQuery(MembersPageDocument, {
    first: PER_PAGE,
    accountId,
    search,
    status: match(filters.statuses)
      .with(undefined, () => [
        "BindingUserError" as const,
        "Enabled" as const,
        "InvitationSent" as const,
        "Suspended" as const,
      ])
      .otherwise(() => filters.statuses),
    canViewAccount: booleanParamToBoolean(filters.canViewAccount),
    canManageCards: booleanParamToBoolean(filters.canManageCards),
    canInitiatePayments: booleanParamToBoolean(filters.canInitiatePayments),
    canManageAccountMembership: booleanParamToBoolean(filters.canManageAccountMembership),
    canManageBeneficiaries: booleanParamToBoolean(filters.canManageBeneficiaries),
  });

  const editingAccountMembershipId = match(route)
    .with(
      { name: "AccountMembersDetailsArea" },
      ({ params: { editingAccountMembershipId } }) => editingAccountMembershipId,
    )
    .otherwise(() => null);

  const panelRef = useRef<FocusTrapRef>(null);

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
          queryLastCreatedMembership({ accountMembershipId: resourceId }).tapOk(membership => {
            const query = new URLSearchParams();

            query.append("inviterAccountMembershipId", accountMembershipId);
            query.append("lang", membership.accountMembership?.language ?? locale.language);

            const url = match(projectConfiguration)
              .with(
                Option.P.Some({ projectId: P.select(), mode: "MultiProject" }),
                projectId =>
                  `/api/projects/${projectId}/invitation/${resourceId}/send?${query.toString()}`,
              )
              .otherwise(() => `/api/invitation/${resourceId}/send?${query.toString()}`);

            Request.make({
              url,
              method: "POST",
              type: "text",
            }).tap(() => {
              Router.replace("AccountMembersList", {
                ...params,
                accountMembershipId,
                resourceId: undefined,
                status: undefined,
              });
            });
          });
        },
      )
      .otherwise(() => {});
  }, [params, accountMembershipId, queryLastCreatedMembership]);

  return (
    <ResponsiveContainer breakpoint={breakpoints.large} style={styles.root}>
      {({ large }) => (
        <>
          <View style={commonStyles.fill} role="main">
            <Box style={[styles.filters, large && styles.filtersLarge]}>
              <MembershipListFilter
                filters={filters}
                search={search}
                onChangeFilters={filters => {
                  Router.replace("AccountMembersList", {
                    accountMembershipId,
                    ...params,
                    ...filters,
                  });
                }}
                onChangeSearch={search => {
                  Router.replace("AccountMembersList", { accountMembershipId, ...params, search });
                }}
                onRefresh={reload}
                totalCount={data.mapOk(data => data.accountMemberships.totalCount ?? 0)}
                large={large}
              >
                {canAddAccountMembership ? (
                  <LakeButton
                    size="small"
                    icon="add-circle-filled"
                    color="current"
                    onPress={() =>
                      Router.push("AccountMembersList", { accountMembershipId, new: "" })
                    }
                  >
                    {large ? t("common.new") : null}
                  </LakeButton>
                ) : null}
              </MembershipListFilter>
            </Box>

            {data.match({
              NotAsked: () => null,
              Loading: () => (
                <PlainListViewPlaceholder count={20} headerHeight={large ? 48 : 0} rowHeight={56} />
              ),
              Done: result =>
                result.match({
                  Error: error => <ErrorView error={error} />,
                  Ok: ({ accountMemberships }) => (
                    <Connection connection={accountMemberships}>
                      {memberships => {
                        return (
                          <>
                            <MembershipList
                              large={large}
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
                                  style={match(item)
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
                                      () => ({
                                        backgroundColor: colors.warning[50],
                                      }),
                                    )
                                    .with(
                                      {
                                        statusInfo: {
                                          __typename: "AccountMembershipBindingUserErrorStatusInfo",
                                        },
                                      },
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
            visible={params.new != null && canAddAccountMembership}
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
