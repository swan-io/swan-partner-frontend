import { Array, Option } from "@swan-io/boxed";
import { Link } from "@swan-io/chicane";
import { Box } from "@swan-io/lake/src/components/Box";
import { PlainListViewPlaceholder } from "@swan-io/lake/src/components/FixedListView";
import { FocusTrapRef } from "@swan-io/lake/src/components/FocusTrap";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeModal } from "@swan-io/lake/src/components/LakeModal";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { ListRightPanel } from "@swan-io/lake/src/components/ListRightPanel";
import { LoadingView } from "@swan-io/lake/src/components/LoadingView";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { breakpoints, colors, spacings } from "@swan-io/lake/src/constants/design";
import { useUrqlPaginatedQuery } from "@swan-io/lake/src/hooks/useUrqlQuery";
import { isNotNullish } from "@swan-io/lake/src/utils/nullish";
import { CountryCCA3 } from "@swan-io/shared-business/src/constants/countries";
import { Suspense, useCallback, useEffect, useMemo, useRef } from "react";
import { StyleSheet } from "react-native";
import { P, match } from "ts-pattern";
import { AccountMembershipFragment, MembersPageDocument } from "../graphql/partner";
import { t } from "../utils/i18n";
import { Router, membershipsRoutes } from "../utils/routes";
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
  canAddNewMembers: boolean;
  canAddCard: boolean;
  canOrderPhysicalCards: boolean;
  accountCountry: CountryCCA3;
  params: {
    new?: string;
    search?: string | undefined;
    statuses?: string[] | undefined;
    canInitiatePayments?: string | undefined;
    canManageAccountMembership?: string | undefined;
    canManageBeneficiaries?: string | undefined;
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
  canAddNewMembers,
  canAddCard,
  canOrderPhysicalCards,
  accountCountry,
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
      search: params.search,
    } as const;
  }, [
    params.search,
    params.statuses,
    params.canInitiatePayments,
    params.canManageAccountMembership,
    params.canManageBeneficiaries,
  ]);

  const { data, nextData, reload, setAfter } = useUrqlPaginatedQuery(
    {
      query: MembersPageDocument,
      variables: {
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
        search: filters.search,
      },
    },
    [accountId, filters],
  );

  const editingAccountMembershipId = match(route)
    .with(
      { name: "AccountMembersDetailsArea" },
      ({ params: { editingAccountMembershipId } }) => editingAccountMembershipId,
    )
    .otherwise(() => null);

  const memberships = data
    .toOption()
    .flatMap(data => data.toOption())
    .flatMap(({ account }) => Option.fromNullable(account?.memberships))
    .map(({ edges }) => edges.map(({ node }) => node))
    .getWithDefault([]);

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
    }).with(
      {
        params: { resourceId: P.string, status: "Accepted" },
        accountMembershipInvitationMode: "EMAIL",
      },
      ({ params: { resourceId } }) => {
        const xhr = new XMLHttpRequest();
        xhr.open(
          "POST",
          `/api/invitation/${resourceId}/send?inviterAccountMembershipId=${accountMembershipId}`,
          true,
        );
        xhr.addEventListener("load", () => {
          Router.replace("AccountMembersList", {
            ...params,
            accountMembershipId,
            resourceId: undefined,
            status: undefined,
          });
        });
        xhr.send(null);
        return () => xhr.abort();
      },
    );
  }, [params, accountMembershipId]);

  return (
    <ResponsiveContainer breakpoint={breakpoints.large} style={styles.root}>
      {({ large }) => (
        <>
          <Box style={[styles.filters, large && styles.filtersLarge]}>
            <MembershipListFilter
              filters={filters}
              onChange={filters =>
                Router.push("AccountMembersList", {
                  accountMembershipId,
                  ...filters,
                })
              }
              onRefresh={reload}
              large={large}
            >
              {canAddNewMembers ? (
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
                  <MembershipList
                    memberships={account?.memberships.edges.map(({ node }) => node) ?? []}
                    accountMembershipId={accountMembershipId}
                    onActiveRowChange={onActiveRowChange}
                    editingAccountMembershipId={editingAccountMembershipId ?? undefined}
                    onEndReached={() => {
                      if (account?.memberships.pageInfo.hasNextPage === true) {
                        setAfter(account?.memberships.pageInfo.endCursor ?? undefined);
                      }
                    }}
                    loading={{
                      isLoading: nextData.isLoading(),
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
                    onRefreshRequest={reload}
                  />
                ),
              }),
          })}

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
            onClose={() => Router.push("AccountMembersList", { accountMembershipId, ...params })}
            items={memberships}
            render={(membership, large) => (
              <Suspense fallback={<LoadingView color={colors.current[500]} />}>
                <MembershipDetailArea
                  currentUserAccountMembershipId={accountMembershipId}
                  currentUserAccountMembership={currentUserAccountMembership}
                  editingAccountMembershipId={membership.id}
                  onAccountMembershipUpdate={onAccountMembershipUpdate}
                  canAddCard={canAddCard}
                  canOrderPhysicalCards={canOrderPhysicalCards}
                  accountCountry={accountCountry}
                  onRefreshRequest={reload}
                  large={large}
                />
              </Suspense>
            )}
            closeLabel={t("common.closeButton")}
            previousLabel={t("common.previous")}
            nextLabel={t("common.next")}
          />

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
              onSuccess={() => {
                Router.push("AccountMembersList", {
                  accountMembershipId,
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
