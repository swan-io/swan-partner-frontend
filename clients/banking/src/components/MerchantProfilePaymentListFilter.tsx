import { Dict, Future } from "@swan-io/boxed";
import { Box } from "@swan-io/lake/src/components/Box";
import { Fill } from "@swan-io/lake/src/components/Fill";
import { FilterChooser } from "@swan-io/lake/src/components/FilterChooser";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeSearchField } from "@swan-io/lake/src/components/LakeSearchField";
import { Space } from "@swan-io/lake/src/components/Space";
import { emptyToUndefined, isNotNullish } from "@swan-io/lake/src/utils/nullish";
import {
  FilterCheckboxDef,
  FiltersStack,
  FiltersState,
} from "@swan-io/shared-business/src/components/Filters";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { MerchantPaymentStatus } from "../graphql/partner";
import { t } from "../utils/i18n";

type SimplifiedPaymentMethod =
  | "Card"
  | "Check"
  | "SepaDirectDebitB2b"
  | "SepaDirectDebitCore"
  | "InternalDirectDebitStandard"
  | "InternalDirectDebitB2b";

const paymentMethodFilter: FilterCheckboxDef<SimplifiedPaymentMethod> = {
  type: "checkbox",
  label: t("merchantProfile.payments.filter.paymentMethod"),
  checkAllLabel: t("common.filters.all"),
  items: [
    { value: "Card", label: t("paymentMethod.card") },
    { value: "Check", label: t("paymentMethod.check") },
    { value: "SepaDirectDebitB2b", label: t("paymentMethod.directDebit") },
    { value: "SepaDirectDebitCore", label: t("paymentMethod.directDebit") },
    { value: "InternalDirectDebitStandard", label: t("paymentMethod.directDebit") },
    { value: "InternalDirectDebitB2b", label: t("paymentMethod.directDebit") },
  ],
};

const statusFilter: FilterCheckboxDef<MerchantPaymentStatus> = {
  type: "checkbox",
  label: t("merchantProfile.payments.filter.status"),
  checkAllLabel: t("common.filters.all"),
  items: [
    { value: "Authorized", label: t("merchantProfile.payments.filter.status.authorized") },
    { value: "Captured", label: t("merchantProfile.payments.filter.status.captured") },
    { value: "Initiated", label: t("merchantProfile.payments.filter.status.initiated") },
    { value: "Rejected", label: t("merchantProfile.payments.filter.status.rejected") },
  ],
};

const defaultFiltersDefinition = {
  paymentMethod: paymentMethodFilter,
  status: statusFilter,
};

const defaultAvailableFilters = ["paymentMethod", "status"] as const;

export type MerchantPaymentFilters = FiltersState<typeof defaultFiltersDefinition>;

type MerchantProfilePaymentListFilterProps = {
  available?: readonly (keyof MerchantPaymentFilters)[];
  children?: ReactNode;
  large?: boolean;
  filters: MerchantPaymentFilters;
  search: string | undefined;
  onChangeFilters: (filters: Partial<MerchantPaymentFilters>) => void;
  onRefresh: () => Future<unknown>;
  onChangeSearch: (search: string | undefined) => void;
  filtersDefinition?: {
    paymentMethod: FilterCheckboxDef<SimplifiedPaymentMethod>;
    status: FilterCheckboxDef<MerchantPaymentStatus>;
  };
};

export const MerchantProfilePaymentListFilter = ({
  available = defaultAvailableFilters,
  children,
  large = true,
  filters,
  search,
  onChangeFilters,
  onRefresh,
  onChangeSearch,
  filtersDefinition = defaultFiltersDefinition,
}: MerchantProfilePaymentListFilterProps) => {
  const availableSet = useMemo(() => new Set(available), [available]);

  const availableFilters: { name: keyof MerchantPaymentFilters; label: string }[] = useMemo(
    () =>
      (
        [
          {
            name: "paymentMethod",
            label: t("merchantProfile.payments.filter.paymentMethod"),
          },
          {
            name: "status",
            label: t("merchantProfile.payments.filter.status"),
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
