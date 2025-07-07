import { Future } from "@swan-io/boxed";
import { Box } from "@swan-io/lake/src/components/Box";
import { Fill } from "@swan-io/lake/src/components/Fill";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { Separator } from "@swan-io/lake/src/components/Separator";
import { Space } from "@swan-io/lake/src/components/Space";
import { emptyToUndefined } from "@swan-io/lake/src/utils/nullish";
import { ReactNode, useState } from "react";
import { CardType } from "../graphql/partner";
import { t } from "../utils/i18n";
import { filter, Filters, FiltersState } from "./Filters";
import { SearchInput } from "./SearchInput";
import { Toggle } from "./Toggle";

const filtersDefinition = {
  type: filter.checkbox<CardType>({
    label: t("cardList.type"),
    items: [
      { value: "Virtual", label: t("cards.format.virtual") },
      { value: "VirtualAndPhysical", label: t("cards.format.virtualAndPhysical") },
      { value: "SingleUseVirtual", label: t("cards.format.singleUse") },
    ],
  }),
};

export type CardFilters = FiltersState<typeof filtersDefinition>;

type TransactionListFilterProps = {
  children?: ReactNode;
  large?: boolean;
  filters: CardFilters;
  search: string | undefined;
  status: "Active" | "Canceled";
  onChangeFilters: (filters: Partial<CardFilters>) => void;
  onRefresh: () => Future<unknown>;
  onChangeSearch: (search: string | undefined) => void;
  onChangeStatus: (status: "Active" | "Canceled") => void;
};

export const CardListFilter = ({
  children,
  large = true,
  filters,
  search,
  status,
  onChangeFilters,
  onRefresh,
  onChangeSearch,
  onChangeStatus,
}: TransactionListFilterProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  return (
    <>
      <Box direction="row" alignItems="center">
        {children != null ? (
          <>
            {children}
            <Separator horizontal={true} space={12} />
          </>
        ) : null}

        <Filters
          definition={filtersDefinition}
          values={filters}
          onChange={onChangeFilters}
          toggle={
            <Toggle
              compact={!large}
              value={status === "Active"}
              onToggle={status => onChangeStatus(status ? "Active" : "Canceled")}
              labelOn={t("cardList.status.Active")}
              labelOff={t("cardList.status.Canceled")}
            />
          }
        />

        <Fill minWidth={16} />

        {large && (
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
