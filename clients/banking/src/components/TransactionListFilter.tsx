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
  FilterDateDef,
  FiltersStack,
  FiltersState,
} from "@swan-io/shared-business/src/components/Filters";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { TransactionStatus } from "../graphql/partner";
import { locale, t } from "../utils/i18n";
import {
  isAfterUpdatedAtSelectable,
  isBeforeUpdatedAtSelectable,
  validateAfterUpdatedAt,
  validateBeforeUpdatedAt,
} from "../utils/validations";

const isAfterUpdatedAtFilter: FilterDateDef = {
  type: "date",
  label: t("transactionList.filter.isAfterUpdatedAt"),
  cancelText: t("common.cancel"),
  submitText: t("common.filters.apply"),
  noValueText: t("common.none"),
  dateFormat: locale.dateFormat,
  validate: validateAfterUpdatedAt,
  isSelectable: isAfterUpdatedAtSelectable,
};

const isBeforeUpdatedAtFilter: FilterDateDef = {
  type: "date",
  label: t("transactionList.filter.isBeforeUpdatedAt"),
  cancelText: t("common.cancel"),
  submitText: t("common.filters.apply"),
  noValueText: t("common.none"),
  dateFormat: locale.dateFormat,
  validate: validateBeforeUpdatedAt,
  isSelectable: isBeforeUpdatedAtSelectable,
};

type SimplifiedPaymentProduct = "Card" | "Check" | "Fees" | "CreditTransfer" | "DirectDebit";

const paymentProductFilter: FilterCheckboxDef<SimplifiedPaymentProduct> = {
  type: "checkbox",
  label: t("transactionList.filter.paymentMethod"),
  checkAllLabel: t("common.filters.all"),
  items: [
    { value: "Card", label: t("paymentMethod.card") },
    { value: "Check", label: t("paymentMethod.check") },
    { value: "CreditTransfer", label: t("paymentMethod.transfer") },
    { value: "DirectDebit", label: t("paymentMethod.directDebit") },
    { value: "Fees", label: t("paymentMethod.fees") },
  ],
};

const statusFilter: FilterCheckboxDef<TransactionStatus> = {
  type: "checkbox",
  label: t("transactionList.filter.status"),
  checkAllLabel: t("common.filters.all"),
  items: [
    { value: "Pending", label: t("transactionStatus.pending") },
    { value: "Booked", label: t("transactionStatus.booked") },
    { value: "Rejected", label: t("transactionStatus.rejected") },
    { value: "Canceled", label: t("transactionStatus.canceled") },
  ],
};

export const defaultFiltersDefinition = {
  isAfterUpdatedAt: isAfterUpdatedAtFilter,
  isBeforeUpdatedAt: isBeforeUpdatedAtFilter,
  paymentProduct: paymentProductFilter,
  status: statusFilter,
};

export type TransactionFilters = FiltersState<typeof defaultFiltersDefinition>;

type TransactionListFilterProps = {
  available?: readonly (keyof TransactionFilters)[];
  children?: ReactNode;
  large?: boolean;
  filters: TransactionFilters;
  search: string | undefined;
  onChangeFilters: (filters: Partial<TransactionFilters>) => void;
  onRefresh: () => Future<unknown>;
  onChangeSearch: (search: string | undefined) => void;
  filtersDefinition?: {
    isAfterUpdatedAt: FilterDateDef;
    isBeforeUpdatedAt: FilterDateDef;
    paymentProduct: FilterCheckboxDef<SimplifiedPaymentProduct>;
    status: FilterCheckboxDef<TransactionStatus>;
  };
};

const defaultAvailableFilters = [
  "isAfterUpdatedAt",
  "isBeforeUpdatedAt",
  "isBeforeUpdatedAt",
  "paymentProduct",
  "status",
] as const;

export const TransactionListFilter = ({
  available = defaultAvailableFilters,
  children,
  large = true,
  filters,
  search,
  onChangeFilters,
  onRefresh,
  onChangeSearch,
  filtersDefinition = defaultFiltersDefinition,
}: TransactionListFilterProps) => {
  const availableSet = useMemo(() => new Set(available), [available]);

  const availableFilters: { name: keyof TransactionFilters; label: string }[] = useMemo(
    () =>
      (
        [
          {
            name: "isAfterUpdatedAt",
            label: t("transactionList.filter.isAfterUpdatedAt"),
          },
          {
            name: "isBeforeUpdatedAt",
            label: t("transactionList.filter.isBeforeUpdatedAt"),
          },
          {
            name: "paymentProduct",
            label: t("transactionList.filter.paymentMethod"),
          },
          {
            name: "status",
            label: t("transactionList.filter.status"),
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
