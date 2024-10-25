import { Dict, Future } from "@swan-io/boxed";
import { Box } from "@swan-io/lake/src/components/Box";
import { Fill } from "@swan-io/lake/src/components/Fill";
import { FilterChooser } from "@swan-io/lake/src/components/FilterChooser";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeSearchField } from "@swan-io/lake/src/components/LakeSearchField";
import { Space } from "@swan-io/lake/src/components/Space";
import { Toggle } from "@swan-io/lake/src/components/Toggle";
import { emptyToUndefined, isNotNullish } from "@swan-io/lake/src/utils/nullish";
import {
  FilterCheckboxDef,
  FiltersStack,
  FiltersState,
} from "@swan-io/shared-business/src/components/Filters";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { StyleSheet } from "react-native";
import { CardType } from "../graphql/partner";
import { t } from "../utils/i18n";

const typeFilter: FilterCheckboxDef<CardType> = {
  type: "checkbox",
  checkAllLabel: t("common.filters.all"),
  items: [
    { value: "Virtual", label: t("cards.format.virtual") },
    { value: "VirtualAndPhysical", label: t("cards.format.virtualAndPhysical") },
    { value: "SingleUseVirtual", label: t("cards.format.singleUse") },
  ],
  label: t("cardList.type"),
};

const styles = StyleSheet.create({
  endFilters: {
    flexGrow: 0,
    flexShrink: 1,
  },
});

const filtersDefinition = {
  type: typeFilter,
};

export type CardFilters = FiltersState<typeof filtersDefinition>;

type TransactionListFilterProps = {
  available?: readonly (keyof CardFilters)[];
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

const defaultAvailableFilters = ["type"] as const;

export const CardListFilter = ({
  available = defaultAvailableFilters,
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
  const availableSet = useMemo(() => new Set(available), [available]);

  const availableFilters: { name: keyof CardFilters; label: string }[] = useMemo(
    () =>
      (
        [
          {
            name: "type",
            label: t("cardList.type"),
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
