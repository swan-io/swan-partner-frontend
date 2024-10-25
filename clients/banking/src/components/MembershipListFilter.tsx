import { AsyncData, Dict, Future, Result } from "@swan-io/boxed";
import { Box } from "@swan-io/lake/src/components/Box";
import { Fill } from "@swan-io/lake/src/components/Fill";
import { FilterChooser } from "@swan-io/lake/src/components/FilterChooser";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeSearchField } from "@swan-io/lake/src/components/LakeSearchField";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tag } from "@swan-io/lake/src/components/Tag";
import { stubFalse, stubTrue } from "@swan-io/lake/src/utils/function";
import { emptyToUndefined, isNotNullish } from "@swan-io/lake/src/utils/nullish";
import {
  FilterCheckboxDef,
  FilterRadioDef,
  FiltersStack,
  FiltersState,
} from "@swan-io/shared-business/src/components/Filters";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { P, match } from "ts-pattern";
import { AccountMembershipStatus } from "../graphql/partner";
import { t } from "../utils/i18n";

const statusFilter: FilterCheckboxDef<AccountMembershipStatus> = {
  type: "checkbox",
  label: t("membershipList.status"),
  checkAllLabel: t("common.filters.all"),
  items: [
    { value: "Enabled", label: t("memberships.status.active") },
    { value: "InvitationSent", label: t("memberships.status.invitationSent") },
    { value: "Suspended", label: t("memberships.status.temporarilyBlocked") },
    { value: "BindingUserError", label: t("memberships.status.conflictAndLimitedAccess") },
  ],
};

const canInitiatePaymentsFilter: FilterRadioDef<boolean | undefined> = {
  type: "radio",
  label: t("membershipList.canInitiatePayments"),
  items: [
    { value: undefined, label: t("common.filters.all") },
    { value: true, label: t("common.true") },
    { value: false, label: t("common.false") },
  ],
};

const canManageAccountMembershipFilter: FilterRadioDef<boolean | undefined> = {
  type: "radio",
  label: t("membershipList.canManageAccountMembership"),
  items: [
    { value: undefined, label: t("common.filters.all") },
    { value: true, label: t("common.true") },
    { value: false, label: t("common.false") },
  ],
};

const canManageBeneficiariesFilter: FilterRadioDef<boolean | undefined> = {
  type: "radio",
  label: t("membershipList.canManageBeneficiaries"),
  items: [
    { value: undefined, label: t("common.filters.all") },
    { value: true, label: t("common.true") },
    { value: false, label: t("common.false") },
  ],
};

const canViewAccountFilter: FilterRadioDef<boolean | undefined> = {
  type: "radio",
  label: t("membershipList.canViewAccount"),
  items: [
    { value: undefined, label: t("common.filters.all") },
    { value: true, label: t("common.true") },
    { value: false, label: t("common.false") },
  ],
};

const canManageCardsFilter: FilterRadioDef<boolean | undefined> = {
  type: "radio",
  label: t("membershipList.canManageCards"),
  items: [
    { value: undefined, label: t("common.filters.all") },
    { value: true, label: t("common.true") },
    { value: false, label: t("common.false") },
  ],
};

const filtersDefinition = {
  statuses: statusFilter,
  canInitiatePayments: canInitiatePaymentsFilter,
  canManageAccountMembership: canManageAccountMembershipFilter,
  canManageBeneficiaries: canManageBeneficiariesFilter,
  canViewAccount: canViewAccountFilter,
  canManageCards: canManageCardsFilter,
};

export type MembershipFilters = FiltersState<typeof filtersDefinition>;

export const parseBooleanParam = (value: string | undefined) =>
  match(value)
    .with("true", stubTrue)
    .with("false", stubFalse)
    .otherwise(() => undefined);

type MembershipListFilterProps = {
  available?: readonly (keyof MembershipFilters)[];
  children?: ReactNode;
  large?: boolean;
  filters: MembershipFilters;
  search: string | undefined;
  totalCount: AsyncData<Result<number, unknown>>;
  onChangeFilters: (filters: Partial<MembershipFilters>) => void;
  onRefresh: () => Future<unknown>;
  onChangeSearch: (search: string | undefined) => void;
};

const defaultAvailableFilters = [
  "statuses",
  "canInitiatePayments",
  "canManageAccountMembership",
  "canManageBeneficiaries",
  "canViewAccount",
  "canManageCards",
] as const;

export const MembershipListFilter = ({
  available = defaultAvailableFilters,
  children,
  large = true,
  filters,
  search,
  totalCount,
  onChangeFilters,
  onRefresh,
  onChangeSearch,
}: MembershipListFilterProps) => {
  const availableSet = useMemo(() => new Set(available), [available]);

  const availableFilters: { name: keyof MembershipFilters; label: string }[] = useMemo(
    () =>
      (
        [
          {
            name: "statuses",
            label: t("membershipList.status"),
          },
          {
            name: "canInitiatePayments",
            label: t("membershipList.canInitiatePayments"),
          },
          {
            name: "canManageAccountMembership",
            label: t("membershipList.canManageAccountMembership"),
          },
          {
            name: "canManageBeneficiaries",
            label: t("membershipList.canManageBeneficiaries"),
          },
          {
            name: "canViewAccount",
            label: t("membershipList.canViewAccount"),
          },
          {
            name: "canManageCards",
            label: t("membershipList.canManageCards"),
          },
        ] as const
      ).filter(item => availableSet.has(item.name)),
    [availableSet],
  );

  const [openFilters, setOpenFilters] = useState(() =>
    Dict.entries(filters)
      .filter(([, value]) => isNotNullish(value))
      .map(([name]) => name),
  );

  useEffect(() => {
    setOpenFilters(openFilters => {
      const currentlyOpenFilters = new Set(openFilters);
      const openFiltersNotYetInState = Dict.entries(filters)
        .filter(([name, value]) => isNotNullish(value) && !currentlyOpenFilters.has(name))
        .map(([name]) => name);
      return [...openFilters, ...openFiltersNotYetInState];
    });
  }, [filters]);

  const [isRefreshing, setIsRefreshing] = useState(false);

  return (
    <>
      <Box direction="row" alignItems="center">
        {children != null ? (
          <>
            {children}

            <Space width={16} />
          </>
        ) : null}

        <FilterChooser
          filters={filters}
          openFilters={openFilters}
          label={t("common.filters")}
          onAddFilter={filter => setOpenFilters(openFilters => [...openFilters, filter])}
          availableFilters={availableFilters}
          large={large}
        />

        {large ? (
          <>
            <Space width={16} />

            <LakeButton
              ariaLabel={t("common.refresh")}
              mode="secondary"
              size="small"
              icon="arrow-counterclockwise-filled"
              loading={isRefreshing}
              onPress={() => {
                setIsRefreshing(true);
                onRefresh().tap(() => setIsRefreshing(false));
              }}
            />
          </>
        ) : null}

        <Fill minWidth={16} />

        <LakeSearchField
          placeholder={t("common.search")}
          initialValue={search ?? ""}
          onChangeText={text => onChangeSearch(emptyToUndefined(text))}
          renderEnd={() =>
            match(totalCount)
              .with(AsyncData.P.Done(Result.P.Ok(P.select())), totalCount => (
                <Tag>{totalCount}</Tag>
              ))
              .otherwise(() => null)
          }
        />
      </Box>

      <Space height={12} />

      <FiltersStack
        definition={filtersDefinition}
        filters={filters}
        openedFilters={openFilters}
        onChangeFilters={onChangeFilters}
        onChangeOpened={setOpenFilters}
      />
    </>
  );
};
