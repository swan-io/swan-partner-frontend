import { AsyncData, Dict, Option, Result } from "@swan-io/boxed";
import { Link } from "@swan-io/chicane";
import { useForwardPagination, useQuery } from "@swan-io/graphql-client";
import { Box, BoxProps } from "@swan-io/lake/src/components/Box";
import { Fill } from "@swan-io/lake/src/components/Fill";
import { FilterChooser } from "@swan-io/lake/src/components/FilterChooser";
import {
  FilterCheckboxDef,
  FilterRadioDef,
  FiltersStack,
  FiltersState,
} from "@swan-io/lake/src/components/Filters";
import {
  FixedListViewEmpty,
  PlainListViewPlaceholder,
} from "@swan-io/lake/src/components/FixedListView";
import {
  CellAction,
  EndAlignedCell,
  SimpleHeaderCell,
} from "@swan-io/lake/src/components/FixedListViewCells";
import { Flag } from "@swan-io/lake/src/components/Flag";
import { FocusTrapRef } from "@swan-io/lake/src/components/FocusTrap";
import { Icon, IconName } from "@swan-io/lake/src/components/Icon";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeSearchField } from "@swan-io/lake/src/components/LakeSearchField";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { ListRightPanel } from "@swan-io/lake/src/components/ListRightPanel";
import { ColumnConfig, PlainListView } from "@swan-io/lake/src/components/PlainListView";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tag } from "@swan-io/lake/src/components/Tag";
import { Toggle } from "@swan-io/lake/src/components/Toggle";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { breakpoints, colors, spacings } from "@swan-io/lake/src/constants/design";
import { deriveUnion } from "@swan-io/lake/src/utils/function";
import {
  emptyToUndefined,
  isNotNullish,
  isNotNullishOrEmpty,
} from "@swan-io/lake/src/utils/nullish";
import { omit } from "@swan-io/lake/src/utils/object";
import { GetNode } from "@swan-io/lake/src/utils/types";
import { printFormat } from "iban";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import { P, match } from "ts-pattern";
import {
  BeneficiariesListPageDocument,
  BeneficiariesListPageQuery,
  BeneficiariesListPageQueryVariables,
  BeneficiaryType,
} from "../graphql/partner";
import { currencies, currencyFlags, currencyResolver, isSupportedCurrency, t } from "../utils/i18n";
import { GetRouteParams, Router } from "../utils/routes";
import { BeneficiaryDetail } from "./BeneficiaryDetail";
import { ErrorView } from "./ErrorView";

const NUM_TO_RENDER = 20;

const styles = StyleSheet.create({
  fill: {
    ...commonStyles.fill,
  },
  header: {
    paddingHorizontal: spacings[24],
  },
  headerLarge: {
    paddingHorizontal: spacings[40],
  },
  cell: {
    paddingHorizontal: spacings[16],
  },
});

type Account = NonNullable<BeneficiariesListPageQuery["account"]>;
type Beneficiaries = NonNullable<Account["trustedBeneficiaries"]>;
type Beneficiary = GetNode<Beneficiaries>;
type RouteParams = GetRouteParams<"AccountPaymentsBeneficiariesList">;

const Cell = (props: BoxProps) => (
  <Box
    direction="row"
    alignItems="center"
    grow={1}
    shrink={1}
    {...props}
    style={[styles.cell, props.style]}
  />
);

export const getBeneficiaryIdentifier = (beneficiary: Beneficiary) =>
  match(beneficiary)
    .returnType<{ label: string; text: string }>()
    .with({ __typename: "TrustedInternalBeneficiary" }, ({ accountId }) => ({
      label: t("beneficiaries.accountIdentifier.accountId"),
      text: accountId,
    }))
    .with({ __typename: "TrustedSepaBeneficiary" }, ({ iban }) => ({
      label: t("beneficiaries.accountIdentifier.iban"),
      text: printFormat(iban),
    }))
    .with({ __typename: "TrustedInternationalBeneficiary" }, ({ details }) =>
      match(Object.fromEntries(details.map(({ key, value }): [string, string] => [key, value])))
        .with({ accountNumber: P.select(P.string) }, value => ({
          label: t("beneficiaries.accountIdentifier.accountNumber"),
          text: value,
        }))
        .with({ IBAN: P.select(P.string) }, value => ({
          label: t("beneficiaries.accountIdentifier.iban"),
          text: printFormat(value),
        }))
        .with({ customerReferenceNumber: P.select(P.string) }, value => ({
          label: t("beneficiaries.accountIdentifier.customerReferenceNumber"),
          text: value,
        }))
        .with({ clabe: P.select(P.string) }, value => ({
          label: t("beneficiaries.accountIdentifier.clabe"),
          text: value,
        }))
        .with({ interacAccount: P.select(P.string) }, value => ({
          label: t("beneficiaries.accountIdentifier.interacAccount"),
          text: value,
        }))
        .otherwise(() => ({
          label: "",
          text: "",
        })),
    )
    .otherwise(() => ({
      label: "",
      text: "",
    }));

const smallColumns: ColumnConfig<Beneficiary, undefined>[] = [
  {
    id: "name",
    title: t("beneficiaries.name.title"),
    width: "grow",
    renderTitle: ({ title }) => <SimpleHeaderCell text={title} />,
    renderCell: ({ item }) => {
      const identifier = getBeneficiaryIdentifier(item);

      return (
        <Cell>
          <Tag
            color="gray"
            icon={match(item.type)
              .returnType<IconName>()
              .with("International", () => "earth-regular")
              .otherwise(() => "person-regular")}
          />

          <Space width={16} />

          <Box>
            <LakeText variant="smallRegular" color={colors.gray[600]} numberOfLines={1}>
              {item.label || item.name}
            </LakeText>

            <LakeText variant="smallMedium" color={colors.gray[700]}>
              {identifier.text}
            </LakeText>
          </Box>
        </Cell>
      );
    },
  },
];

const columns: ColumnConfig<Beneficiary, undefined>[] = [
  {
    id: "name",
    title: t("beneficiaries.name.title"),
    width: "grow",
    renderTitle: ({ title }) => <SimpleHeaderCell text={title} />,
    renderCell: ({ item }) => (
      <Cell>
        <Tag
          color="gray"
          icon={match(item.type)
            .returnType<IconName>()
            .with("International", () => "earth-regular")
            .otherwise(() => "person-regular")}
        />

        <Space width={24} />

        <LakeText variant="medium" color={colors.gray[900]} numberOfLines={1}>
          {item.label || item.name}
        </LakeText>

        {item.statusInfo.status === "Canceled" && (
          <>
            <Space width={16} />
            <Tag color="negative">{t("beneficiaries.status.canceled")}</Tag>
          </>
        )}
      </Cell>
    ),
  },
  {
    id: "identifier",
    title: t("beneficiaries.accountIdentifier.title"),
    width: "grow",
    renderTitle: ({ title }) => <SimpleHeaderCell text={title} />,
    renderCell: ({ item }) => {
      const identifier = getBeneficiaryIdentifier(item);

      return (
        <Cell>
          <LakeText variant="smallRegular" color={colors.gray[400]} numberOfLines={1}>
            {identifier.label}:{" "}
            <LakeText variant="smallMedium" color={colors.gray[700]}>
              {identifier.text}
            </LakeText>
          </LakeText>
        </Cell>
      );
    },
  },
  {
    id: "currency",
    title: t("beneficiaries.currency.title"),
    width: 200,
    renderTitle: ({ title }) => <SimpleHeaderCell text={title} />,
    renderCell: ({ item }) => {
      const currency = match(item)
        .with({ __typename: "TrustedInternationalBeneficiary" }, ({ currency }) => currency)
        .otherwise(() => "EUR");

      return (
        <Cell>
          {isSupportedCurrency(currency) && (
            <>
              <Flag code={currencyFlags[currency]} width={14} />
              <Space width={8} />
            </>
          )}

          <LakeText variant="smallMedium" color={colors.gray[700]} numberOfLines={1}>
            {currency}

            {isNotNullish(currencyResolver) && (
              <>
                {" "}
                <LakeText variant="smallRegular" color={colors.gray[400]}>
                  ({currencyResolver.of(currency)})
                </LakeText>
              </>
            )}
          </LakeText>
        </Cell>
      );
    },
  },
  {
    id: "type",
    title: t("beneficiaries.type.title"),
    width: 200,
    renderTitle: ({ title }) => <SimpleHeaderCell text={title} />,
    renderCell: ({ item }) => (
      <Cell>
        <LakeText variant="smallMedium" color={colors.gray[700]} numberOfLines={1}>
          {match(item.__typename)
            .with("TrustedInternalBeneficiary", () => t("beneficiaries.type.internal"))
            .with("TrustedInternationalBeneficiary", () => t("beneficiaries.type.international"))
            .with("TrustedSepaBeneficiary", () => t("beneficiaries.type.sepa"))
            .otherwise(() => null)}
        </LakeText>
      </Cell>
    ),
  },
  {
    id: "actions",
    width: 48,
    title: "",
    renderTitle: () => null,
    renderCell: ({ isHovered }) => (
      <EndAlignedCell>
        <CellAction>
          <Icon
            name="chevron-right-filled"
            color={isHovered ? colors.gray[900] : colors.gray[500]}
            size={16}
          />
        </CellAction>
      </EndAlignedCell>
    ),
  },
];

const beneficiaryTypes = deriveUnion<Exclude<BeneficiaryType, "Internal">>({
  International: true,
  Sepa: true,
});

const currencyFilter: FilterRadioDef<string | undefined> = {
  type: "radio",
  label: t("beneficiaries.currency.title"),
  items: [
    { value: undefined, label: t("common.filters.all") },
    ...currencies.map(value => {
      const name = currencyResolver?.of(value);
      return { value, label: isNotNullish(name) ? `${value} (${name})` : value };
    }),
  ],
};

const typeFilter: FilterCheckboxDef<BeneficiaryType> = {
  type: "checkbox",
  label: t("beneficiaries.type.title"),
  checkAllLabel: t("common.filters.all"),
  submitText: t("common.filters.apply"),
  items: [
    { value: "International", label: t("beneficiaries.type.international") },
    { value: "Sepa", label: t("beneficiaries.type.sepa") },
  ],
};

const filtersDefinition = {
  type: typeFilter,
  currency: currencyFilter,
};

type Filters = FiltersState<typeof filtersDefinition>;

const BeneficiaryListImpl = ({
  hasFilters,
  rowHeight,
  beneficiaries,
  isLoading,
  activeBeneficiaryId,
  params,
  setVariables,
}: {
  hasFilters: boolean;
  rowHeight: number;
  beneficiaries: Beneficiaries;
  isLoading: boolean;
  params: RouteParams;
  activeBeneficiaryId?: string;
  setVariables: (variables: Partial<BeneficiariesListPageQueryVariables>) => void;
}) => {
  const { edges, pageInfo } = useForwardPagination(beneficiaries);
  const nodes = useMemo(() => edges.map(edge => edge.node), [edges]);
  const panelRef = useRef<FocusTrapRef | null>(null);

  const onActiveRowChange = useCallback(
    (element: HTMLElement) => panelRef.current?.setInitiallyFocusedElement(element),
    [],
  );

  return (
    <>
      <PlainListView
        data={nodes}
        keyExtractor={item => item.id}
        rowHeight={rowHeight}
        groupHeaderHeight={0}
        extraInfo={undefined}
        columns={columns}
        smallColumns={smallColumns}
        headerHeight={48}
        activeRowId={activeBeneficiaryId}
        onActiveRowChange={onActiveRowChange}
        loading={{
          isLoading,
          count: NUM_TO_RENDER,
        }}
        getRowLink={({ item }) => (
          <Link
            to={Router.AccountPaymentsBeneficiariesDetails({
              ...params,
              beneficiaryId: item.id,
            })}
          />
        )}
        onEndReached={() => {
          if (pageInfo.hasNextPage ?? false) {
            setVariables({ after: pageInfo.endCursor ?? undefined });
          }
        }}
        renderEmptyList={() => (
          <FixedListViewEmpty
            icon="lake-person-arrow-swap"
            borderedIcon={true}
            borderedIconPadding={16}
            title={hasFilters ? t("common.list.noResults") : t("beneficiaries.empty.title")}
            subtitle={
              hasFilters ? t("common.list.noResultsSuggestion") : t("beneficiaries.empty.subtitle")
            }
          />
        )}
      />

      <ListRightPanel
        ref={panelRef}
        closeLabel={t("common.closeButton")}
        nextLabel={t("common.next")}
        previousLabel={t("common.previous")}
        keyExtractor={item => item.id}
        activeId={activeBeneficiaryId ?? null}
        onActiveIdChange={beneficiaryId =>
          Router.push("AccountPaymentsBeneficiariesDetails", {
            ...params,
            beneficiaryId,
          })
        }
        onClose={() => Router.push("AccountPaymentsBeneficiariesList", params)}
        items={nodes}
        render={(item, large) => <BeneficiaryDetail id={item.id} large={large} />}
      />
    </>
  );
};

export const BeneficiaryList = ({
  accountId,
  params,
  canManageBeneficiaries,
  activeBeneficiaryId,
}: {
  accountId: string;
  params: RouteParams;
  canManageBeneficiaries: boolean;
  activeBeneficiaryId?: string;
}) => {
  const { filters, canceled, label, hasFilters } = useMemo(() => {
    const filters: Filters = {
      currency: params.currency,
      type: params.type?.filter(beneficiaryTypes.is),
    };

    const canceled = params.canceled === "true";
    const { label } = params;

    const hasFilters =
      Object.values(filters).some(isNotNullish) || canceled || isNotNullishOrEmpty(label);

    return { filters, canceled, label, hasFilters };
  }, [params]);

  const availableFilters = useMemo<{ name: keyof Filters; label: string }[]>(
    () => [
      { name: "type", label: t("beneficiaries.type.title") },
      { name: "currency", label: t("beneficiaries.currency.title") },
    ],
    [],
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

  const [data, { isLoading, reload, setVariables }] = useQuery(BeneficiariesListPageDocument, {
    accountId,
    first: NUM_TO_RENDER,
    filters: {
      currency: filters.currency,
      label,
      type: filters.type,
      status: canceled ? ["Canceled"] : ["Enabled"],
    },
  });

  const beneficiaries = data.mapOkToResult(data =>
    Option.fromNullable(data.account?.trustedBeneficiaries).toResult(undefined),
  );

  return (
    <ResponsiveContainer breakpoint={breakpoints.large} style={styles.fill}>
      {({ large }) => {
        const rowHeight = large ? 56 : 72;

        return (
          <>
            <Box style={[styles.header, large && styles.headerLarge]}>
              <Box direction="row" alignItems="center">
                {canManageBeneficiaries && (
                  <>
                    <LakeButton
                      icon="add-circle-filled"
                      size="small"
                      color="current"
                      onPress={() =>
                        Router.push("AccountPaymentsBeneficiariesNew", {
                          accountMembershipId: params.accountMembershipId,
                        })
                      }
                    >
                      {t("common.add")}
                    </LakeButton>

                    <Space width={16} />
                  </>
                )}

                <FilterChooser
                  large={large}
                  filters={filters}
                  availableFilters={availableFilters}
                  openFilters={openFilters}
                  label={t("common.filters")}
                  onAddFilter={filter => {
                    setOpenFilters(openFilters => [...openFilters, filter]);
                  }}
                />

                {large && (
                  <>
                    <Space width={16} />

                    <LakeButton
                      ariaLabel={t("common.refresh")}
                      mode="secondary"
                      size="small"
                      icon="arrow-counterclockwise-filled"
                      loading={beneficiaries.isLoading()}
                      onPress={() => {
                        reload();
                      }}
                    />
                  </>
                )}

                <Fill minWidth={16} />

                <Box grow={0} shrink={1} direction="row" alignItems="center" justifyContent="end">
                  <Toggle
                    mode={large ? "desktop" : "mobile"}
                    value={!canceled}
                    onLabel={t("beneficiaries.status.enabled")}
                    offLabel={t("beneficiaries.status.canceled")}
                    onToggle={on => {
                      Router.push("AccountPaymentsBeneficiariesList", {
                        ...omit(params, ["canceled"]),
                        canceled: !on ? "true" : undefined,
                      });
                    }}
                  />

                  <Space width={16} />

                  <LakeSearchField
                    placeholder={t("common.search")}
                    initialValue={label ?? ""}
                    onChangeText={label => {
                      Router.push("AccountPaymentsBeneficiariesList", {
                        ...params,
                        label: emptyToUndefined(label),
                      });
                    }}
                    renderEnd={() =>
                      match(beneficiaries.mapOk(({ totalCount }) => totalCount))
                        .with(AsyncData.P.Done(Result.P.Ok(P.select())), totalCount => (
                          <Tag>{totalCount}</Tag>
                        ))
                        .otherwise(() => null)
                    }
                  />
                </Box>
              </Box>

              <Space height={12} />

              <FiltersStack
                definition={filtersDefinition}
                filters={filters}
                openedFilters={openFilters}
                onChangeOpened={setOpenFilters}
                onChangeFilters={filters => {
                  Router.push("AccountPaymentsBeneficiariesList", {
                    ...params,
                    ...filters,
                  });
                }}
              />
            </Box>

            <Space height={24} />

            {match(beneficiaries)
              .with(AsyncData.P.NotAsked, () => null)
              .with(AsyncData.P.Loading, () => (
                <PlainListViewPlaceholder
                  count={NUM_TO_RENDER}
                  headerHeight={48}
                  paddingHorizontal={24}
                  rowHeight={rowHeight}
                  rowVerticalSpacing={0}
                />
              ))
              .with(AsyncData.P.Done(Result.P.Ok(P.select())), beneficiaries => (
                <BeneficiaryListImpl
                  hasFilters={hasFilters}
                  rowHeight={rowHeight}
                  beneficiaries={beneficiaries}
                  isLoading={isLoading}
                  params={params}
                  activeBeneficiaryId={activeBeneficiaryId}
                  setVariables={setVariables}
                />
              ))
              .with(AsyncData.P.Done(Result.P.Error(P.select())), error => (
                <ErrorView error={error} />
              ))
              .exhaustive()}
          </>
        );
      }}
    </ResponsiveContainer>
  );
};
