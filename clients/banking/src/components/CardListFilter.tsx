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
import { isNotNullish } from "@swan-io/lake/src/utils/nullish";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { CardType } from "../graphql/partner";
import { t } from "../utils/i18n";

type SimplifiedCardStatus = "Active" | "Canceled";

const statusFilter: FilterCheckboxDef<SimplifiedCardStatus> = {
  type: "checkbox",
  checkAllLabel: t("common.filters.all"),
  items: [
    { value: "Active", label: t("cardList.status.Active") },
    { value: "Canceled", label: t("cardList.status.Canceled") },
  ],
  label: t("cardList.status"),
  submitText: t("common.filters.apply"),
};

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

const filtersDefinition = {
  statuses: statusFilter,
  type: typeFilter,
};

export type CardFilters = FiltersState<typeof filtersDefinition> & {
  search: string | undefined;
};

type TransactionListFilterProps = {
  filters: CardFilters;
  onChange: (values: Partial<CardFilters>) => void;
  onRefresh: () => void;
  available?: readonly (keyof CardFilters)[];
  children?: ReactNode;
  large?: boolean;
};

const defaultAvailableFilters = ["statuses", "type"] as const;

export const CardListFilter = ({
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
            label: t("cardList.status"),
          },
          {
            name: "type",
            label: t("cardList.type"),
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
