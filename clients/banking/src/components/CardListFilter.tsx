import { Future } from "@swan-io/boxed";
import { Box } from "@swan-io/lake/src/components/Box";
import { Fill } from "@swan-io/lake/src/components/Fill";
import { FilterChooser } from "@swan-io/lake/src/components/FilterChooser";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeSearchField } from "@swan-io/lake/src/components/LakeSearchField";
import { Space } from "@swan-io/lake/src/components/Space";
import { Toggle } from "@swan-io/lake/src/components/Toggle";
import { emptyToUndefined } from "@swan-io/lake/src/utils/nullish";
import {
  filter,
  FiltersStack,
  FiltersState,
  useFiltersProps,
} from "@swan-io/shared-business/src/components/Filters";
import { ReactNode, useState } from "react";
import { StyleSheet } from "react-native";
import { CardType } from "../graphql/partner";
import { t } from "../utils/i18n";

const styles = StyleSheet.create({
  endFilters: {
    flexGrow: 0,
    flexShrink: 1,
  },
});

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
  const filtersProps = useFiltersProps({ filtersDefinition, filters });
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

        <FilterChooser {...filtersProps.chooser} large={large} />

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

        <Box direction="row" alignItems="center" justifyContent="end" style={styles.endFilters}>
          <Toggle
            mode={large ? "desktop" : "mobile"}
            value={status === "Active"}
            onToggle={status => onChangeStatus(status ? "Active" : "Canceled")}
            onLabel={t("cardList.status.Active")}
            offLabel={t("cardList.status.Canceled")}
          />

          <Space width={16} />

          <LakeSearchField
            key={String(large)}
            placeholder={t("common.search")}
            initialValue={search ?? ""}
            onChangeText={text => onChangeSearch(emptyToUndefined(text))}
          />
        </Box>
      </Box>

      <Space height={12} />
      <FiltersStack {...filtersProps.stack} onChangeFilters={onChangeFilters} />
    </>
  );
};
