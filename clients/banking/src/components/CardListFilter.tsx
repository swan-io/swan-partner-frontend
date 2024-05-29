import { Dict } from "@swan-io/boxed";
import { Box } from "@swan-io/lake/src/components/Box";
import { Fill } from "@swan-io/lake/src/components/Fill";
import { FilterChooser } from "@swan-io/lake/src/components/FilterChooser";
import {
  FilterCheckboxDef,
  FiltersStack,
  FiltersState,
} from "@swan-io/lake/src/components/Filters";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeSearchField } from "@swan-io/lake/src/components/LakeSearchField";
import { Space } from "@swan-io/lake/src/components/Space";
import { Toggle } from "@swan-io/lake/src/components/Toggle";
import { isNotNullish } from "@swan-io/lake/src/utils/nullish";
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
  submitText: t("common.filters.apply"),
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

export type CardFilters = FiltersState<typeof filtersDefinition> & {
  search: string | undefined;
  status: "Active" | "Canceled";
};

type TransactionListFilterProps = {
  filters: CardFilters;
  onChange: (values: Partial<CardFilters>) => void;
  onRefresh: () => void;
  available?: readonly (keyof CardFilters)[];
  children?: ReactNode;
  large?: boolean;
};

const defaultAvailableFilters = ["type"] as const;

export const CardListFilter = ({
  filters,
  children,
  onChange,
  onRefresh,
  large = true,
  available = defaultAvailableFilters,
}: TransactionListFilterProps) => {
  const filtersWithoutSearchAndStatus = useMemo(() => {
    const { search, status, ...filtersWithoutSearch } = filters;
    return filtersWithoutSearch;
  }, [filters]);

  const availableSet = useMemo(() => new Set(available), [available]);
  const availableFilters: { name: keyof typeof filtersWithoutSearchAndStatus; label: string }[] =
    useMemo(
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
    Dict.entries(filtersWithoutSearchAndStatus)
      .filter(([, value]) => isNotNullish(value))
      .map(([name]) => name),
  );

  useEffect(() => {
    setOpenFilters(openFilters => {
      const currentlyOpenFilters = new Set(openFilters);
      const openFiltersNotYetInState = Dict.entries(filtersWithoutSearchAndStatus)
        .filter(([name, value]) => isNotNullish(value) && !currentlyOpenFilters.has(name))
        .map(([name]) => name);
      return [...openFilters, ...openFiltersNotYetInState];
    });
  }, [filtersWithoutSearchAndStatus]);

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
          filters={filtersWithoutSearchAndStatus}
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
              onPress={onRefresh}
            />
          </>
        ) : null}

        <Fill minWidth={16} />

        <Box direction="row" alignItems="center" justifyContent="end" style={styles.endFilters}>
          <Toggle
            mode={large ? "desktop" : "mobile"}
            value={filters.status === "Active"}
            onToggle={status => onChange({ ...filters, status: status ? "Active" : "Canceled" })}
            onLabel={t("cardList.status.Active")}
            offLabel={t("cardList.status.Canceled")}
          />

          <Space width={16} />

          <LakeSearchField
            key={String(large)}
            placeholder={t("common.search")}
            initialValue={filters.search ?? ""}
            onChangeText={search => onChange({ ...filters, search })}
          />
        </Box>
      </Box>

      <Space height={12} />

      <FiltersStack
        definition={filtersDefinition}
        filters={filtersWithoutSearchAndStatus}
        openedFilters={openFilters}
        onChangeFilters={value =>
          onChange({ ...value, search: filters.search, status: filters.status })
        }
        onChangeOpened={setOpenFilters}
      />
    </>
  );
};
