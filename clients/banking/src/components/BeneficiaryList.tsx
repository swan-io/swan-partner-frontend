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
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { breakpoints, colors, spacings } from "@swan-io/lake/src/constants/design";
import { deriveUnion } from "@swan-io/lake/src/utils/function";
import { emptyToUndefined, isNotNullish } from "@swan-io/lake/src/utils/nullish";
import { omit } from "@swan-io/lake/src/utils/object";
import { GetNode } from "@swan-io/lake/src/utils/types";
import { printFormat } from "iban";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { P, match } from "ts-pattern";
import { Merge } from "type-fest";
import {
  BeneficiariesListPageDocument,
  BeneficiariesListPageQuery,
  BeneficiariesListPageQueryVariables,
  BeneficiaryType,
  TrustedBeneficiaryStatus,
} from "../graphql/partner";
import { currencies, currencyFlags, currencyResolver, isSupportedCurrency, t } from "../utils/i18n";
import { GetRouteParams, Router } from "../utils/routes";
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
type Params = GetRouteParams<"AccountPaymentsBeneficiariesList">;

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

const smallColumns: ColumnConfig<GetNode<Beneficiaries>, undefined>[] = [
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

        <Space width={16} />

        <Box>
          <LakeText variant="smallRegular" color={colors.gray[600]} numberOfLines={1}>
            {item.label || item.name}
          </LakeText>

          <LakeText variant="smallMedium" color={colors.gray[700]}>
            {match(item)
              .returnType<string>()
              .with({ __typename: "TrustedInternalBeneficiary" }, ({ accountId }) => accountId)
              .with({ __typename: "TrustedInternationalBeneficiary" }, () => "TODO")
              .with({ __typename: "TrustedSepaBeneficiary" }, ({ iban }) => printFormat(iban))
              .otherwise(() => "")}
          </LakeText>
        </Box>
      </Cell>
    ),
  },
];

const columns: ColumnConfig<GetNode<Beneficiaries>, undefined>[] = [
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
      </Cell>
    ),
  },
  {
    id: "identifier",
    title: t("beneficiaries.accountIdentifier.title"),
    width: "grow",
    renderTitle: ({ title }) => <SimpleHeaderCell text={title} />,
    renderCell: ({ item }) => {
      const [text, value] = match(item)
        .returnType<[string, string]>()
        .with({ __typename: "TrustedInternalBeneficiary" }, ({ accountId }) => [
          t("beneficiaries.accountIdentifier.accountId"),
          accountId,
        ])
        .with({ __typename: "TrustedInternationalBeneficiary" }, ({ details }) =>
          match(Object.fromEntries(details.map(({ key, value }): [string, string] => [key, value])))
            .returnType<[string, string]>()
            .with({ accountNumber: P.select(P.string) }, value => [
              t("beneficiaries.accountIdentifier.accountNumber"),
              value,
            ])
            .with({ IBAN: P.select(P.string) }, value => [
              t("beneficiaries.accountIdentifier.iban"),
              printFormat(value),
            ])
            .with({ customerReferenceNumber: P.select(P.string) }, value => [
              t("beneficiaries.accountIdentifier.customerReferenceNumber"),
              value,
            ])
            .with({ clabe: P.select(P.string) }, value => [
              t("beneficiaries.accountIdentifier.clabe"),
              value,
            ])
            .with({ interacAccount: P.select(P.string) }, value => [
              t("beneficiaries.accountIdentifier.interacAccount"),
              value,
            ])
            .otherwise(() => ["", ""]),
        )
        .with({ __typename: "TrustedSepaBeneficiary" }, ({ iban }) => [
          t("beneficiaries.accountIdentifier.iban"),
          printFormat(iban),
        ])
        .otherwise(() => ["", ""]);

      return (
        <Cell>
          <LakeText variant="smallRegular" color={colors.gray[400]} numberOfLines={1}>
            {text}:{" "}
            <LakeText variant="smallMedium" color={colors.gray[700]}>
              {value}
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
            .otherwise(() => "")}
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

const beneficiaryStatuses = deriveUnion<TrustedBeneficiaryStatus>({
  Enabled: true,
  ConsentPending: true,
  Canceled: true,
});

const beneficiaryTypes = deriveUnion<Exclude<BeneficiaryType, "Internal">>({
  International: true,
  Sepa: true,
});

const statusFilter: FilterCheckboxDef<TrustedBeneficiaryStatus> = {
  type: "checkbox",
  label: "Status", // TODO: update
  checkAllLabel: t("common.filters.all"),
  submitText: t("common.filters.apply"),
  items: [
    { value: "Enabled", label: "Enabled" }, // TODO: update
    { value: "ConsentPending", label: "ConsentPending" }, // TODO: update
    { value: "Canceled", label: "Canceled" }, // TODO: update
  ],
};

const currencyFilter: FilterRadioDef<string | undefined> = {
  type: "radio",
  label: "Currency", // TODO: update
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
  label: "Type", // TODO: update
  checkAllLabel: t("common.filters.all"),
  submitText: t("common.filters.apply"),
  items: [
    { value: "International", label: "International" }, // TODO: update
    { value: "Sepa", label: "Sepa" }, // TODO: update
  ],
};

const filtersDefinition = {
  statuses: statusFilter,
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
  params: Params;
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
        render={(item, _large) => (
          <View>
            <Text>{item.name}</Text>
          </View>
        )}
      />
    </>
  );
};

export const BeneficiaryList = ({
  accountId,
  params,
  activeBeneficiaryId,
}: {
  accountId: string;
  params: Params;
  activeBeneficiaryId?: string;
}) => {
  const { filters, filtersWithoutLabel, hasFilters, otherParams } = useMemo(() => {
    const filters: Merge<Filters, { label: string | undefined }> = {
      currency: params.currency,
      label: params.label,
      statuses: params.statuses?.filter(beneficiaryStatuses.is),
      type: params.type?.filter(beneficiaryTypes.is),
    };

    const { label, ...filtersWithoutLabel } = filters;
    const hasFilters = Object.values(filters).some(isNotNullish);
    const otherParams = omit(params, Dict.keys(filters));

    return { filters, filtersWithoutLabel, hasFilters, otherParams };
  }, [params]);

  const availableFilters = useMemo<{ name: keyof Filters; label: string }[]>(
    () => [
      {
        name: "statuses",
        label: "Status", // TODO: Replace text
      },
      {
        name: "type",
        label: "Type", // TODO: Replace text
      },
      {
        name: "currency",
        label: "Currency", // TODO: Replace text
      },
    ],
    [],
  );

  const [openFilters, setOpenFilters] = useState(() =>
    Dict.entries(filtersWithoutLabel)
      .filter(([, value]) => isNotNullish(value))
      .map(([name]) => name),
  );

  useEffect(() => {
    setOpenFilters(openFilters => {
      const currentlyOpenFilters = new Set(openFilters);

      const openFiltersNotYetInState = Dict.entries(filtersWithoutLabel)
        .filter(([name, value]) => isNotNullish(value) && !currentlyOpenFilters.has(name))
        .map(([name]) => name);

      return [...openFilters, ...openFiltersNotYetInState];
    });
  }, [filtersWithoutLabel]);

  const [data, { isLoading, reload, setVariables }] = useQuery(BeneficiariesListPageDocument, {
    accountId,
    first: NUM_TO_RENDER,
    filters: {
      currency: filters.currency,
      label: filters.label,
      status: filters.statuses,
      type: filters.type,
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
              <Box alignItems="center" direction="row">
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

                <FilterChooser
                  large={large}
                  filters={filtersWithoutLabel}
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

                <LakeSearchField
                  placeholder={t("common.search")}
                  initialValue={filters.label ?? ""}
                  onChangeText={label => {
                    Router.push("AccountPaymentsBeneficiariesList", {
                      ...otherParams,
                      label: emptyToUndefined(label),
                    });
                  }}
                  renderEnd={() =>
                    match(beneficiaries.mapOk(({ edges }) => edges.length))
                      .with(AsyncData.P.Done(Result.P.Ok(P.select())), totalCount => (
                        <Tag>{totalCount}</Tag>
                      ))
                      .otherwise(() => null)
                  }
                />
              </Box>

              <Space height={12} />

              <FiltersStack
                definition={filtersDefinition}
                filters={filtersWithoutLabel}
                openedFilters={openFilters}
                onChangeOpened={setOpenFilters}
                onChangeFilters={filters => {
                  Router.push("AccountPaymentsBeneficiariesList", { ...otherParams, ...filters });
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
