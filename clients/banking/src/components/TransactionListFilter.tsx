import { Dict } from "@swan-io/boxed";
import { Box } from "@swan-io/lake/src/components/Box";
import { Fill } from "@swan-io/lake/src/components/Fill";
import { FilterChooser } from "@swan-io/lake/src/components/FilterChooser";
import {
  FilterCheckboxDef,
  FilterDateDef,
  FiltersStack,
  FiltersState,
} from "@swan-io/lake/src/components/Filters";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeSearchField } from "@swan-io/lake/src/components/LakeSearchField";
import { Space } from "@swan-io/lake/src/components/Space";
import { isNotNullish } from "@swan-io/lake/src/utils/nullish";
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
  submitText: t("common.filters.apply"),
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
  submitText: t("common.filters.apply"),
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

export type TransactionFiltersState = Omit<
  FiltersState<typeof defaultFiltersDefinition>,
  "paymentProduct"
> & {
  search: string | undefined;
  paymentProduct: SimplifiedPaymentProduct[] | undefined;
};

type TransactionListFilterProps = {
  filters: TransactionFiltersState;
  onChange: (values: Partial<TransactionFiltersState>) => void;
  onRefresh: () => void;
  available?: readonly (keyof TransactionFiltersState)[];
  children?: ReactNode;
  large?: boolean;
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
  filters,
  children,
  onChange,
  onRefresh,
  large = true,
  available = defaultAvailableFilters,
  filtersDefinition = defaultFiltersDefinition,
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
