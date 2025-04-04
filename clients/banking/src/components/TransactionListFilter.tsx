import { Future } from "@swan-io/boxed";
import { Box } from "@swan-io/lake/src/components/Box";
import { Fill } from "@swan-io/lake/src/components/Fill";
import { FilterChooser } from "@swan-io/lake/src/components/FilterChooser";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeSearchField } from "@swan-io/lake/src/components/LakeSearchField";
import { Space } from "@swan-io/lake/src/components/Space";
import { emptyToUndefined } from "@swan-io/lake/src/utils/nullish";
import {
  filter,
  FilterCheckboxDef,
  FilterDateDef,
  FiltersStack,
  FiltersState,
  useFiltersProps,
} from "@swan-io/shared-business/src/components/Filters";
import { ReactNode, useState } from "react";
import { TransactionStatus } from "../graphql/partner";
import { t } from "../utils/i18n";
import {
  isAfterUpdatedAtSelectable,
  isBeforeUpdatedAtSelectable,
  validateAfterUpdatedAt,
  validateBeforeUpdatedAt,
} from "../utils/validations";

type SimplifiedPaymentProduct = "Card" | "Check" | "Fees" | "CreditTransfer" | "DirectDebit";

export const defaultFiltersDefinition = {
  isAfterUpdatedAt: filter.date({
    label: t("transactionList.filter.isAfterUpdatedAt"),
    validate: validateAfterUpdatedAt,
    isSelectable: isAfterUpdatedAtSelectable,
  }),
  isBeforeUpdatedAt: filter.date({
    label: t("transactionList.filter.isBeforeUpdatedAt"),
    validate: validateBeforeUpdatedAt,
    isSelectable: isBeforeUpdatedAtSelectable,
  }),
  paymentProduct: filter.checkbox<SimplifiedPaymentProduct>({
    label: t("transactionList.filter.paymentMethod"),
    items: [
      { value: "Card", label: t("paymentMethod.card") },
      { value: "Check", label: t("paymentMethod.check") },
      { value: "CreditTransfer", label: t("paymentMethod.transfer") },
      { value: "DirectDebit", label: t("paymentMethod.directDebit") },
      { value: "Fees", label: t("paymentMethod.fees") },
    ],
  }),
  status: filter.checkbox<TransactionStatus>({
    label: t("transactionList.filter.status"),
    items: [
      { value: "Pending", label: t("transactionStatus.pending") },
      { value: "Booked", label: t("transactionStatus.booked") },
      { value: "Rejected", label: t("transactionStatus.rejected") },
      { value: "Canceled", label: t("transactionStatus.canceled") },
    ],
  }),
};

export type TransactionFilters = FiltersState<typeof defaultFiltersDefinition>;
export type TransactionFilter = keyof TransactionFilters;

type TransactionListFilterProps = {
  available?: TransactionFilter[];
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

const defaultAvailableFilters: TransactionFilter[] = [
  "isAfterUpdatedAt",
  "isBeforeUpdatedAt",
  "paymentProduct",
  "status",
];

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
  const filtersProps = useFiltersProps({ filtersDefinition, filters, available });
  const [isRefreshing, setIsRefreshing] = useState(false);

  return (
    <>
      <Box direction="row" alignItems="center">
        {children != null ? (
          <>
            {children}

            <Space width={8} />
          </>
        ) : null}

        <FilterChooser {...filtersProps.chooser} large={large} />

        {large ? (
          <>
            <Space width={8} />

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
      <FiltersStack {...filtersProps.stack} onChangeFilters={onChangeFilters} />
    </>
  );
};
