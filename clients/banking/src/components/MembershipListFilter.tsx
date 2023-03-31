import { Dict } from "@swan-io/boxed";
import { Box } from "@swan-io/lake/src/components/Box";
import { Fill } from "@swan-io/lake/src/components/Fill";
import { FilterChooser } from "@swan-io/lake/src/components/FilterChooser";
import {
  FilterCheckboxDef,
  FilterRadioDef,
  FiltersStack,
  FiltersState,
} from "@swan-io/lake/src/components/Filters";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeSearchField } from "@swan-io/lake/src/components/LakeSearchField";
import { Space } from "@swan-io/lake/src/components/Space";
import { isNotNullish } from "@swan-io/lake/src/utils/nullish";
import { ReactNode, useEffect, useMemo, useState } from "react";
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
  submitText: t("common.filters.apply"),
};

const canInitiatePaymentsFilter: FilterRadioDef<"true" | "false" | undefined> = {
  type: "radio",
  label: t("membershipList.canInitiatePayments"),
  items: [
    { value: undefined, label: t("common.filters.all") },
    { value: "true", label: t("common.true") },
    { value: "false", label: t("common.false") },
  ],
};

const canManageAccountMembershipFilter: FilterRadioDef<"true" | "false" | undefined> = {
  type: "radio",
  label: t("membershipList.canManageAccountMembership"),
  items: [
    { value: undefined, label: t("common.filters.all") },
    { value: "true", label: t("common.true") },
    { value: "false", label: t("common.false") },
  ],
};

const canManageBeneficiariesFilter: FilterRadioDef<"true" | "false" | undefined> = {
  type: "radio",
  label: t("membershipList.canManageBeneficiaries"),
  items: [
    { value: undefined, label: t("common.filters.all") },
    { value: "true", label: t("common.true") },
    { value: "false", label: t("common.false") },
  ],
};

const filtersDefinition = {
  statuses: statusFilter,
  canInitiatePayments: canInitiatePaymentsFilter,
  canManageAccountMembership: canManageAccountMembershipFilter,
  canManageBeneficiaries: canManageBeneficiariesFilter,
};

export type MembershipFilters = FiltersState<typeof filtersDefinition> & {
  search: string | undefined;
};

type TransactionListFilterProps = {
  filters: MembershipFilters;
  onChange: (values: Partial<MembershipFilters>) => void;
  onRefresh: () => void;
  available?: readonly (keyof MembershipFilters)[];
  children?: ReactNode;
  large?: boolean;
};

const defaultAvailableFilters = [
  "statuses",
  "canInitiatePayments",
  "canManageAccountMembership",
  "canManageBeneficiaries",
] as const;

export const MembershipListFilter = ({
  filters,
  children,
  onChange,
  onRefresh,
  large = true,
  available = defaultAvailableFilters,
}: TransactionListFilterProps) => {
  const filtersWithoutSearch = useMemo(() => {
    const { search, ...filtersWithoutSearch } = filters;
    return filtersWithoutSearch;
  }, [filters]);
  const availableSet = useMemo(() => new Set(available), [available]);
  const availableFilters: { name: keyof typeof filtersWithoutSearch; label: string }[] = useMemo(
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
        ] as const
      ).filter(item => availableSet.has(item.name)),
    [availableSet],
  );

  const [openFilters, setOpenFilters] = useState(() =>
    Dict.entries(filtersWithoutSearch)
      .filter(([, value]) => isNotNullish(value))
      .map(([name]) => name),
  );

  useEffect(() => {
    setOpenFilters(openFilters => {
      const currentlyOpenFilters = new Set(openFilters);
      const openFiltersNotYetInState = Dict.entries(filtersWithoutSearch)
        .filter(([name, value]) => isNotNullish(value) && !currentlyOpenFilters.has(name))
        .map(([name]) => name);
      return [...openFilters, ...openFiltersNotYetInState];
    });
  }, [filtersWithoutSearch]);

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
          filters={filtersWithoutSearch}
          openFilters={openFilters}
          label={t("common.filters")}
          title={t("common.chooseFilter")}
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
              onPress={onRefresh}
            />
          </>
        ) : null}

        <Fill minWidth={16} />

        <LakeSearchField
          placeholder={t("common.search")}
          initialValue={filters.search ?? ""}
          onChangeText={search => onChange({ ...filters, search })}
        />
      </Box>

      <Space height={12} />

      <FiltersStack
        definition={filtersDefinition}
        filters={filtersWithoutSearch}
        openedFilters={openFilters}
        onChangeFilters={value => onChange({ ...value, search: filters.search })}
        onChangeOpened={setOpenFilters}
      />
    </>
  );
};
