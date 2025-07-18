import { AsyncData, Option, Result } from "@swan-io/boxed";
import { Link } from "@swan-io/chicane";
import { useForwardPagination, useQuery } from "@swan-io/graphql-client";
import { Box } from "@swan-io/lake/src/components/Box";
import { Cell, HeaderCell } from "@swan-io/lake/src/components/Cells";
import { EmptyView } from "@swan-io/lake/src/components/EmptyView";
import { FocusTrapRef } from "@swan-io/lake/src/components/FocusTrap";
import { IconName } from "@swan-io/lake/src/components/Icon";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { ListRightPanel } from "@swan-io/lake/src/components/ListRightPanel";
import {
  ColumnConfig,
  PlainListView,
  PlainListViewPlaceholder,
} from "@swan-io/lake/src/components/PlainListView";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Separator } from "@swan-io/lake/src/components/Separator";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tag } from "@swan-io/lake/src/components/Tag";
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
import { Flag } from "@swan-io/shared-business/src/components/Flag";
import { printFormat } from "iban";
import { useCallback, useMemo, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import { match, P } from "ts-pattern";
import {
  AccountCountry,
  BeneficiariesListDocument,
  BeneficiariesListQuery,
  BeneficiariesListQueryVariables,
  BeneficiaryType,
} from "../graphql/partner";
import { usePermissions } from "../hooks/usePermissions";
import { currencies, currencyFlags, currencyResolver, isSupportedCurrency, t } from "../utils/i18n";
import { RouteParams, Router } from "../utils/routes";
import { BeneficiaryDetail } from "./BeneficiaryDetail";
import { ErrorView } from "./ErrorView";
import { filter, Filters, FiltersState } from "./Filters";
import { FiltersContainer } from "./FiltersMobileContainer";
import { SearchInput } from "./SearchInput";
import { Toggle } from "./Toggle";

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
});

type Account = NonNullable<BeneficiariesListQuery["account"]>;
type Beneficiaries = NonNullable<Account["trustedBeneficiaries"]>;
type Beneficiary = GetNode<Beneficiaries>;

export const getBeneficiaryIdentifier = (beneficiary: Beneficiary) =>
  match(beneficiary)
    .returnType<Option<{ label: string; text: string }>>()
    .with({ __typename: "TrustedInternalBeneficiary" }, ({ accountId }) =>
      Option.Some({
        label: t("beneficiaries.details.accountId"),
        text: accountId,
      }),
    )
    .with({ __typename: "TrustedSepaBeneficiary" }, ({ iban }) =>
      Option.Some({
        label: t("beneficiaries.details.iban"),
        text: printFormat(iban),
      }),
    )
    .with({ __typename: "TrustedInternationalBeneficiary" }, ({ details }) =>
      match(Object.fromEntries(details.map(({ key, value }): [string, string] => [key, value])))
        .with({ accountNumber: P.select(P.string) }, value =>
          Option.Some({
            label: t("beneficiaries.details.accountNumber"),
            text: value,
          }),
        )
        .with({ IBAN: P.select(P.string) }, value =>
          Option.Some({
            label: t("beneficiaries.details.iban"),
            text: printFormat(value),
          }),
        )
        .with({ customerReferenceNumber: P.select(P.string) }, value =>
          Option.Some({
            label: t("beneficiaries.details.customerReferenceNumber"),
            text: value,
          }),
        )
        .with({ clabe: P.select(P.string) }, value =>
          Option.Some({
            label: t("beneficiaries.details.clabe"),
            text: value,
          }),
        )
        .with({ interacAccount: P.select(P.string) }, value =>
          Option.Some({
            label: t("beneficiaries.details.interacAccount"),
            text: value,
          }),
        )
        .otherwise(() => Option.None()),
    )
    .otherwise(() => Option.None());

const smallColumns: ColumnConfig<Beneficiary, undefined>[] = [
  {
    id: "name",
    title: t("beneficiaries.label.title"),
    width: "grow",
    renderTitle: ({ title }) => <HeaderCell text={title} />,
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
              {item.label}
            </LakeText>

            {match(identifier)
              .with(Option.P.Some(P.select()), ({ text }) => (
                <LakeText variant="smallMedium" color={colors.gray[700]}>
                  {text}
                </LakeText>
              ))
              .otherwise(() => null)}
          </Box>
        </Cell>
      );
    },
  },
];

const columns: ColumnConfig<Beneficiary, undefined>[] = [
  {
    id: "name",
    title: t("beneficiaries.label.title"),
    width: "grow",
    renderTitle: ({ title }) => <HeaderCell text={title} />,
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
          {item.label}
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
    title: t("beneficiaries.details.title"),
    width: "grow",
    renderTitle: ({ title }) => <HeaderCell text={title} />,
    renderCell: ({ item }) => {
      const identifier = getBeneficiaryIdentifier(item);

      return (
        <Cell>
          {match(identifier)
            .with(Option.P.Some(P.select()), ({ label, text }) => (
              <LakeText variant="smallRegular" color={colors.gray[400]} numberOfLines={1}>
                {label}:{" "}
                <LakeText variant="smallMedium" color={colors.gray[700]}>
                  {text}
                </LakeText>
              </LakeText>
            ))
            .otherwise(() => null)}
        </Cell>
      );
    },
  },
  {
    id: "currency",
    title: t("beneficiaries.currency.title"),
    width: 200,
    renderTitle: ({ title }) => <HeaderCell text={title} />,
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
    renderTitle: ({ title }) => <HeaderCell text={title} />,
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
];

const beneficiaryTypes = deriveUnion<Exclude<BeneficiaryType, "Internal">>({
  International: true,
  Sepa: true,
});

const filtersDefinition = {
  currency: filter.radio<string>({
    label: t("beneficiaries.currency.title"),
    items: currencies.map(value => {
      const name = currencyResolver?.of(value);
      return { value, label: isNotNullish(name) ? `${value} (${name})` : value };
    }),
  }),
  type: filter.checkbox<BeneficiaryType>({
    label: t("beneficiaries.type.title"),
    items: [
      { value: "International", label: t("beneficiaries.type.international") },
      { value: "Sepa", label: t("beneficiaries.type.sepa") },
    ],
  }),
};

const BeneficiaryListImpl = ({
  accountId,
  accountCountry,
  hasSearchOrFilters,
  rowHeight,
  beneficiaries,
  isLoading,
  params,
  setVariables,
}: {
  accountId: string;
  accountCountry: AccountCountry;
  hasSearchOrFilters: boolean;
  rowHeight: number;
  beneficiaries: Beneficiaries;
  isLoading: boolean;
  params: RouteParams<"AccountPaymentsBeneficiariesList">;
  setVariables: (variables: Partial<BeneficiariesListQueryVariables>) => void;
}) => {
  const route = Router.useRoute(["AccountPaymentsBeneficiariesDetails"]);

  const { edges, pageInfo } = useForwardPagination(beneficiaries);
  const nodes = useMemo(() => edges.map(edge => edge.node), [edges]);
  const panelRef = useRef<FocusTrapRef>(null);

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
        activeRowId={route?.params.beneficiaryId}
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
          <EmptyView
            icon="lake-person-arrow-swap"
            borderedIcon={true}
            borderedIconPadding={16}
            title={hasSearchOrFilters ? t("common.list.noResults") : t("beneficiaries.empty.title")}
            subtitle={
              hasSearchOrFilters
                ? t("common.list.noResultsSuggestion")
                : t("beneficiaries.empty.subtitle")
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
        activeId={route?.params.beneficiaryId ?? null}
        onActiveIdChange={beneficiaryId =>
          Router.push("AccountPaymentsBeneficiariesDetails", {
            ...params,
            beneficiaryId,
          })
        }
        onClose={() => {
          Router.push("AccountPaymentsBeneficiariesList", params);
        }}
        items={nodes}
        render={(item, large) =>
          route != null && (
            <BeneficiaryDetail
              id={item.id}
              accountCountry={accountCountry}
              accountId={accountId}
              large={large}
              params={route.params}
            />
          )
        }
      />
    </>
  );
};

export const BeneficiaryList = ({
  accountId,
  accountCountry,
  params,
}: {
  accountId: string;
  accountCountry: AccountCountry;
  params: RouteParams<"AccountPaymentsBeneficiariesList">;
}) => {
  const { canCreateTrustedBeneficiary } = usePermissions();

  const { filters, canceled, label, hasSearchOrFilters } = useMemo(() => {
    const filters: FiltersState<typeof filtersDefinition> = {
      currency: params.currency,
      type: params.type?.filter(beneficiaryTypes.is),
    };

    const canceled = params.canceled === "true";
    const { label } = params;

    const hasSearchOrFilters =
      isNotNullishOrEmpty(label) || canceled || Object.values(filters).some(isNotNullish);

    return { filters, canceled, label, hasSearchOrFilters };
  }, [params]);

  const [data, { isLoading, reload, setVariables }] = useQuery(BeneficiariesListDocument, {
    accountId,
    first: NUM_TO_RENDER,
    filters: {
      currency: filters.currency,
      label,
      type: filters.type ?? ["International", "Sepa"],
      status: canceled ? ["Canceled"] : ["Enabled"],
    },
  });

  const beneficiaries = data.mapOkToResult(data =>
    Option.fromNullable(data.account?.trustedBeneficiaries).toResult(undefined),
  );

  const [isRefreshing, setIsRefreshing] = useState(false);

  return (
    <ResponsiveContainer breakpoint={breakpoints.large} style={styles.fill}>
      {({ large }) => {
        const rowHeight = large ? 56 : 72;

        return (
          <>
            <Box style={[styles.header, large && styles.headerLarge]}>
              <Box direction="row" alignItems="center">
                {canCreateTrustedBeneficiary && (
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
                      {large ? t("common.new") : null}
                    </LakeButton>

                    <Separator horizontal={true} space={12} />
                  </>
                )}

                <FiltersContainer large={large}>
                  <Filters
                    definition={filtersDefinition}
                    values={filters}
                    onChange={filters => {
                      Router.replace("AccountPaymentsBeneficiariesList", {
                        ...params,
                        ...filters,
                      });
                    }}
                    toggle={
                      <Toggle
                        compact={!large}
                        value={!canceled}
                        labelOn={t("beneficiaries.status.enabled")}
                        labelOff={t("beneficiaries.status.canceled")}
                        onToggle={on => {
                          Router.push("AccountPaymentsBeneficiariesList", {
                            ...omit(params, ["canceled"]),
                            canceled: !on ? "true" : undefined,
                          });
                        }}
                      />
                    }
                  />
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
                        reload().tap(() => setIsRefreshing(false));
                      }}
                    />

                    <Space width={8} />
                  </>
                ) : (
                  <Space width={16} />
                )}

                <SearchInput
                  initialValue={label ?? ""}
                  collapsed={!large}
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

              <Space height={12} />
            </Box>

            <Space height={24} />

            {match(beneficiaries)
              .with(AsyncData.P.NotAsked, () => null)
              .with(AsyncData.P.Loading, () => (
                <PlainListViewPlaceholder
                  count={NUM_TO_RENDER}
                  headerHeight={48}
                  rowHeight={rowHeight}
                />
              ))
              .with(AsyncData.P.Done(Result.P.Ok(P.select())), beneficiaries => (
                <BeneficiaryListImpl
                  accountId={accountId}
                  accountCountry={accountCountry}
                  hasSearchOrFilters={hasSearchOrFilters}
                  rowHeight={rowHeight}
                  beneficiaries={beneficiaries}
                  isLoading={isLoading}
                  params={params}
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
