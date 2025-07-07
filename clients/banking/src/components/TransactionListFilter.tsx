import { Dict, Future } from "@swan-io/boxed";
import { Box } from "@swan-io/lake/src/components/Box";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { Separator } from "@swan-io/lake/src/components/Separator";
import { Space } from "@swan-io/lake/src/components/Space";
import { emptyToUndefined } from "@swan-io/lake/src/utils/nullish";
import { pick } from "@swan-io/lake/src/utils/object";
import { ReactNode, useMemo, useState } from "react";
import { TransactionStatus } from "../graphql/partner";
import { t } from "../utils/i18n";
import {
  isAfterUpdatedAtSelectable,
  isBeforeUpdatedAtSelectable,
  validateAfterUpdatedAt,
  validateBeforeUpdatedAt,
} from "../utils/validations";
import { filter, Filters, FiltersState } from "./Filters";
import { FiltersContainer } from "./FiltersMobileContainer";
import { SearchInput } from "./SearchInput";

const filtersDefinition = {
  status: filter.checkbox<TransactionStatus>({
    label: t("transactionList.filter.status"),
    items: [
      { value: "Pending", label: t("transactionStatus.pending") },
      { value: "Booked", label: t("transactionStatus.booked") },
      { value: "Rejected", label: t("transactionStatus.rejected") },
      { value: "Canceled", label: t("transactionStatus.canceled") },
    ],
  }),
  paymentProduct: filter.checkbox({
    isInMoreFiltersByDefault: true,
    label: t("transactionList.filter.paymentMethod"),
    items: [
      { value: "Card", label: t("paymentMethod.card") },
      { value: "Check", label: t("paymentMethod.check") },
      { value: "CreditTransfer", label: t("paymentMethod.transfer") },
      { value: "DirectDebit", label: t("paymentMethod.directDebit") },
      { value: "Fees", label: t("paymentMethod.fees") },
    ],
  }),
  isBeforeUpdatedAt: filter.date({
    isInMoreFiltersByDefault: true,
    label: t("transactionList.filter.isBeforeUpdatedAt"),
    validate: validateBeforeUpdatedAt,
    isSelectable: isBeforeUpdatedAtSelectable,
  }),
  isAfterUpdatedAt: filter.date({
    isInMoreFiltersByDefault: true,
    label: t("transactionList.filter.isAfterUpdatedAt"),
    validate: validateAfterUpdatedAt,
    isSelectable: isAfterUpdatedAtSelectable,
  }),
};

export type TransactionFilters = FiltersState<typeof filtersDefinition>;
export type TransactionFilter = keyof TransactionFilters;

type TransactionListFilterProps = {
  available?: TransactionFilter[];
  children?: ReactNode;
  large?: boolean;
  filters: Partial<TransactionFilters>;
  search: string | undefined;
  onChangeFilters: (filters: Partial<TransactionFilters>) => void;
  onRefresh: () => Future<unknown>;
  onChangeSearch: (search: string | undefined) => void;
};

const defaultAvailableFilters = Dict.keys(filtersDefinition);

export const TransactionListFilter = ({
  available = defaultAvailableFilters,
  children,
  large = true,
  filters,
  search,
  onChangeFilters,
  onRefresh,
  onChangeSearch,
}: TransactionListFilterProps) => {
  const definition = useMemo(() => pick(filtersDefinition, available), [available]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  return (
    <>
      <Box direction="row" alignItems="center">
        {children != null && (
          <>
            {children}
            <Separator horizontal={true} space={12} />
          </>
        )}

        <FiltersContainer large={large}>
          <Filters definition={definition} values={filters} onChange={onChangeFilters} />
        </FiltersContainer>

        {large ? (
          <>
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

            <Space width={8} />
          </>
        ) : (
          <Space width={16} />
        )}

        <SearchInput
          initialValue={search ?? ""}
          collapsed={!large}
          onChangeText={text => onChangeSearch(emptyToUndefined(text))}
        />
      </Box>

      <Space height={12} />
    </>
  );
};
