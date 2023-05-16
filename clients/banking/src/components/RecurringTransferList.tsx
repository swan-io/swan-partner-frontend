import { AsyncData, Dict, Result } from "@swan-io/boxed";
import { BorderedIcon } from "@swan-io/lake/src/components/BorderedIcon";
import { Box } from "@swan-io/lake/src/components/Box";
import { FilterChooser } from "@swan-io/lake/src/components/FilterChooser";
import { FilterBooleanDef, FiltersStack, FiltersState } from "@swan-io/lake/src/components/Filters";
import {
  FixedListViewEmpty,
  PlainListViewPlaceholder,
} from "@swan-io/lake/src/components/FixedListView";
import {
  EndAlignedCell,
  SimpleHeaderCell,
  SimpleRegularTextCell,
  StartAlignedCell,
} from "@swan-io/lake/src/components/FixedListViewCells";
import { Icon } from "@swan-io/lake/src/components/Icon";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeModal } from "@swan-io/lake/src/components/LakeModal";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { ListRightPanel, ListRightPanelContent } from "@swan-io/lake/src/components/ListRightPanel";
import { ColumnConfig, PlainListView } from "@swan-io/lake/src/components/PlainListView";
import { Pressable } from "@swan-io/lake/src/components/Pressable";
import { ReadOnlyFieldList } from "@swan-io/lake/src/components/ReadOnlyFieldList";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { TabView } from "@swan-io/lake/src/components/TabView";
import { Tag } from "@swan-io/lake/src/components/Tag";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { breakpoints, colors } from "@swan-io/lake/src/constants/design";
import { useResponsive } from "@swan-io/lake/src/hooks/useResponsive";
import { useUrqlMutation } from "@swan-io/lake/src/hooks/useUrqlMutation";
import { useUrqlPaginatedQuery } from "@swan-io/lake/src/hooks/useUrqlQuery";
import { showToast } from "@swan-io/lake/src/state/toasts";
import { isNotNullish } from "@swan-io/lake/src/utils/nullish";
import { GetNode } from "@swan-io/lake/src/utils/types";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { P, match } from "ts-pattern";
import {
  CancelStandingOrderDocument,
  GetStandingOrdersDocument,
  GetStandingOrdersQuery,
  StandingOrdersHistoryPageDocument,
  TransactionDetailsFragment,
} from "../graphql/partner";
import { formatCurrency, formatDateTime, locale, t } from "../utils/i18n";
import { Router } from "../utils/routes";
import { ErrorView } from "./ErrorView";
import { RightPanelTransactionList } from "./RightPanelTransactionList";

const styles = StyleSheet.create({
  filters: {
    paddingHorizontal: 24,
  },
  filtersDesktop: {
    paddingHorizontal: 40,
  },
  cancelButton: {
    alignSelf: "flex-start",
  },
  overflowingText: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  rightPanelMobile: {
    // used only for sticky tabs
    minHeight: "100%",
  },
  rightPanelDesktop: {
    ...commonStyles.fill,
  },
});

const NUM_TO_RENDER = 20;

type Props = {
  accountId: string;
  accountMembershipId: string;
  canQueryCardOnTransaction: boolean;
};

type Node = GetNode<NonNullable<GetStandingOrdersQuery["account"]>["standingOrders"]>;

type ExtraInfo = {
  onCancel: (id: string) => void;
};

type RecurringTransferHistoryProps = {
  canQueryCardOnTransaction: boolean;
  recurringTransferId: string;
  large: boolean;
};

const RecurringTransferHistory = ({
  canQueryCardOnTransaction,
  recurringTransferId,
  large,
}: RecurringTransferHistoryProps) => {
  const { data, nextData, isForceReloading, reload, setAfter } = useUrqlPaginatedQuery(
    {
      query: StandingOrdersHistoryPageDocument,
      variables: {
        standingOrderId: recurringTransferId,
        orderBy: { field: "createdAt", direction: "Desc" },
        first: NUM_TO_RENDER,
        canQueryCardOnTransaction,
      },
    },
    [],
  );

  const transactions = data
    .toOption()
    .flatMap(result => result.toOption())
    .map(({ standingOrder }) => standingOrder?.payments.edges ?? [])
    .map(edges =>
      edges
        .filter(({ node }) => Boolean(node.transactions?.totalCount))
        .reduce<{ node: TransactionDetailsFragment }[]>(
          (list, { node }) => [...list, ...(node.transactions?.edges ?? [])],
          [],
        ),
    )
    .getWithDefault([]);

  return (
    <>
      <Space height={24} />

      <ListRightPanelContent large={large}>
        <LakeButton
          ariaLabel={t("common.refresh")}
          mode="secondary"
          size="small"
          icon="arrow-counterclockwise-filled"
          loading={isForceReloading}
          onPress={reload}
        />
      </ListRightPanelContent>

      <Space height={24} />

      {data.match({
        NotAsked: () => null,
        Loading: () => (
          <PlainListViewPlaceholder
            count={5}
            rowVerticalSpacing={0}
            groupHeaderHeight={48}
            rowHeight={56}
          />
        ),
        Done: result =>
          result.match({
            Error: error => <ErrorView error={error} />,
            Ok: data => (
              <RightPanelTransactionList
                withoutScroll={!large}
                transactions={transactions}
                pageSize={NUM_TO_RENDER}
                onEndReached={() => {
                  if (data.standingOrder?.payments.pageInfo.hasNextPage ?? false) {
                    setAfter(data.standingOrder?.payments.pageInfo.endCursor ?? undefined);
                  }
                }}
                loading={{
                  isLoading: nextData.isLoading(),
                  count: 5,
                }}
                renderEmptyList={() => (
                  <FixedListViewEmpty
                    icon="lake-transfer"
                    borderedIcon={true}
                    title={t("transansactionList.noResults")}
                  />
                )}
              />
            ),
          }),
      })}
    </>
  );
};

type RecurringTransferPanelProps = {
  large: boolean;
  recurringTransfer: Node;
  accountMembershipId: string;
  canQueryCardOnTransaction: boolean;
  onCancel: (id: string) => void;
};

const RecurringTransferPanel = ({
  large,
  recurringTransfer,
  accountMembershipId,
  canQueryCardOnTransaction,
  onCancel,
}: RecurringTransferPanelProps) => {
  const routes = Router.useRoute([
    "AccountPaymentsRecurringTransferDetailsRoot",
    "AccountPaymentsRecurringTransferDetailsHistory",
  ]);
  const recurringTransferId = recurringTransfer.id;

  const tabs = useMemo(
    () => [
      {
        label: t("recurringTransfer.details.tabs.details"),
        url: Router.AccountPaymentsRecurringTransferDetailsRoot({
          accountMembershipId,
          recurringTransferId,
        }),
      },
      {
        label: t("recurringTransfer.details.tabs.history"),
        url: Router.AccountPaymentsRecurringTransferDetailsHistory({
          accountMembershipId,
          recurringTransferId,
        }),
      },
    ],
    [recurringTransferId, accountMembershipId],
  );

  const isFullBalance = recurringTransfer.targetAvailableBalance != null;

  return (
    <>
      <ScrollView
        contentContainerStyle={large ? styles.rightPanelDesktop : styles.rightPanelMobile}
      >
        <ListRightPanelContent large={large}>
          <Tile>
            <Space height={8} />

            <LakeHeading level={1} variant={large ? "h1" : "h3"} align="center">
              {isFullBalance
                ? t("recurringTransfer.table.fullBalanceTransfer")
                : recurringTransfer?.amount
                ? formatCurrency(
                    Number(recurringTransfer.amount.value),
                    recurringTransfer.amount.currency,
                  )
                : "-"}
            </LakeHeading>

            <Space height={12} />

            {recurringTransfer.nextExecutionDate != null && (
              <LakeText color={colors.gray[700]} align="center">
                {t("recurringTransfer.details.nextExecutionDate", {
                  date: formatDateTime(new Date(recurringTransfer.nextExecutionDate), "LLL"),
                })}
              </LakeText>
            )}
          </Tile>
        </ListRightPanelContent>

        <Space height={24} />

        <TabView
          sticky={true}
          padding={large ? 40 : 24}
          tabs={tabs}
          otherLabel={t("common.tabs.other")}
        />

        {match(routes)
          .with({ name: "AccountPaymentsRecurringTransferDetailsRoot" }, () => (
            <ListRightPanelContent large={large} style={commonStyles.fill}>
              <ScrollView style={commonStyles.fill} contentContainerStyle={commonStyles.fill}>
                <Space height={24} />

                <ReadOnlyFieldList>
                  {isFullBalance && (
                    <LakeLabel
                      type="viewSmall"
                      label={t("recurringTransfer.details.label.targetAfterTransfer")}
                      render={() => (
                        <LakeText variant="regular" color={colors.gray[900]}>
                          {recurringTransfer.targetAvailableBalance
                            ? formatCurrency(
                                Number(recurringTransfer.targetAvailableBalance.value),
                                recurringTransfer.targetAvailableBalance.currency,
                              )
                            : "-"}
                        </LakeText>
                      )}
                    />
                  )}

                  <LakeLabel
                    type="viewSmall"
                    label={t("recurringTransfer.details.label.shortExplanation")}
                    render={() => (
                      <LakeText variant="regular" color={colors.gray[900]}>
                        {recurringTransfer.label ?? "-"}
                      </LakeText>
                    )}
                  />

                  <LakeLabel
                    type="viewSmall"
                    label={t("recurringTransfer.details.label.reference")}
                    render={() => (
                      <LakeText variant="regular" color={colors.gray[900]}>
                        {recurringTransfer.reference ?? "-"}
                      </LakeText>
                    )}
                  />

                  <LakeLabel
                    type="viewSmall"
                    label={t("recurringTransfer.details.label.recurrance")}
                    render={() => (
                      <LakeText variant="regular" color={colors.gray[900]}>
                        {match(recurringTransfer.period)
                          .with("Daily", () => t("payments.new.standingOrder.details.daily"))
                          .with("Weekly", () => t("payments.new.standingOrder.details.weekly"))
                          .with("Monthly", () => t("payments.new.standingOrder.details.monthly"))
                          .exhaustive()}
                      </LakeText>
                    )}
                  />

                  <LakeLabel
                    type="viewSmall"
                    label={t("recurringTransfer.details.label.beneficiary")}
                    render={() => (
                      <LakeText variant="regular" color={colors.gray[900]}>
                        {recurringTransfer.sepaBeneficiary.name}
                      </LakeText>
                    )}
                  />

                  <LakeLabel
                    type="viewSmall"
                    label={t("recurringTransfer.details.label.firstExecutionDate")}
                    render={() => (
                      <LakeText variant="regular" color={colors.gray[900]}>
                        {recurringTransfer.firstExecutionDate != null
                          ? formatDateTime(new Date(recurringTransfer.firstExecutionDate), "LLL")
                          : "-"}
                      </LakeText>
                    )}
                  />

                  <LakeLabel
                    type="viewSmall"
                    label={t("recurringTransfer.details.label.lastExecutionDate")}
                    render={() => (
                      <LakeText variant="regular" color={colors.gray[900]}>
                        {recurringTransfer.lastExecutionDate != null
                          ? formatDateTime(new Date(recurringTransfer.lastExecutionDate), "LLL")
                          : "-"}
                      </LakeText>
                    )}
                  />

                  <LakeLabel
                    type="viewSmall"
                    label={t("recurringTransfer.details.label.nextExecutionDate")}
                    render={() => (
                      <LakeText variant="regular" color={colors.gray[900]}>
                        {recurringTransfer.nextExecutionDate != null
                          ? formatDateTime(new Date(recurringTransfer.nextExecutionDate), "LLL")
                          : "-"}
                      </LakeText>
                    )}
                  />

                  <LakeLabel
                    type="viewSmall"
                    label={t("recurringTransfer.details.label.createdBy")}
                    render={() => (
                      <LakeText variant="regular" color={colors.gray[900]}>
                        {[
                          recurringTransfer.createdBy.firstName,
                          recurringTransfer.createdBy.lastName,
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      </LakeText>
                    )}
                  />
                </ReadOnlyFieldList>
              </ScrollView>
            </ListRightPanelContent>
          ))
          .with({ name: "AccountPaymentsRecurringTransferDetailsHistory" }, () => (
            <RecurringTransferHistory
              recurringTransferId={recurringTransferId}
              canQueryCardOnTransaction={canQueryCardOnTransaction}
              large={large}
            />
          ))
          .otherwise(() => null)}
      </ScrollView>

      {recurringTransfer.statusInfo.status === "Enabled" && (
        <>
          <Space height={24} />

          <ListRightPanelContent large={large}>
            <LakeButton
              mode="secondary"
              color="negative"
              icon="subtract-circle-regular"
              onPress={() => onCancel(recurringTransferId)}
              style={styles.cancelButton}
            >
              {t("common.cancel")}
            </LakeButton>
          </ListRightPanelContent>
        </>
      )}
    </>
  );
};

const columns: ColumnConfig<Node, ExtraInfo>[] = [
  {
    id: "recipient",
    title: t("recurringTransfer.table.recipient"),
    width: "grow",
    renderTitle: ({ title }) => <SimpleHeaderCell text={title} />,
    renderCell: ({ item: { sepaBeneficiary } }) => (
      <StartAlignedCell>
        <BorderedIcon name="clock-regular" color="gray" size={32} padding={8} />
        <Space width={24} />

        <LakeText variant="medium" color={colors.gray[900]}>
          {sepaBeneficiary.name}
        </LakeText>
      </StartAlignedCell>
    ),
  },
  {
    id: "label",
    title: t("recurringTransfer.table.explanation"),
    width: "grow",
    renderTitle: ({ title }) => <SimpleHeaderCell text={title} />,
    renderCell: ({ item: { label } }) => <SimpleRegularTextCell text={label ?? "-"} />,
  },
  {
    id: "period",
    title: t("recurringTransfer.table.period"),
    width: 150,
    renderTitle: ({ title }) => <SimpleHeaderCell text={title} />,
    renderCell: ({ item: { period } }) => (
      <SimpleRegularTextCell
        text={match(period)
          .with("Daily", () => t("payments.new.standingOrder.details.daily"))
          .with("Weekly", () => t("payments.new.standingOrder.details.weekly"))
          .with("Monthly", () => t("payments.new.standingOrder.details.monthly"))
          .exhaustive()}
      />
    ),
  },
  {
    id: "nextExecutionDate",
    title: t("recurringTransfer.table.nextExecution"),
    width: 200,
    renderTitle: ({ title }) => <SimpleHeaderCell justifyContent="flex-end" text={title} />,
    renderCell: ({ item: { nextExecutionDate, statusInfo } }) =>
      match(statusInfo)
        .with({ status: "Canceled" }, () => (
          <EndAlignedCell>
            <Tag color="negative">{t("recurringTransfer.filters.status.canceled")}</Tag>
          </EndAlignedCell>
        ))
        .with({ status: P.union("Enabled", "ConsentPending") }, () => (
          <SimpleRegularTextCell
            textAlign="right"
            text={
              nextExecutionDate != null
                ? dayjs(nextExecutionDate).format(`${locale.dateFormat} ${locale.timeFormat}`)
                : "-"
            }
          />
        ))
        .exhaustive(),
  },
  {
    id: "amount",
    title: t("recurringTransfer.table.amount"),
    width: 200,
    renderTitle: ({ title }) => <SimpleHeaderCell text={title} />,
    renderCell: ({ item: { amount } }) => (
      <SimpleRegularTextCell
        variant="medium"
        text={
          amount != null
            ? formatCurrency(Number(amount.value), amount.currency)
            : t("recurringTransfer.table.fullBalanceTransfer")
        }
      />
    ),
  },
  {
    id: "actions",
    title: t("recurringTransfer.table.actions"),
    width: 100,
    renderTitle: ({ title }) => <SimpleHeaderCell justifyContent="flex-end" text={title} />,
    renderCell: ({ item, extraInfo: { onCancel } }) => (
      <EndAlignedCell>
        {item.statusInfo.status === "Enabled" && (
          <Pressable onPress={() => onCancel(item.id)}>
            {({ hovered }) => (
              <Icon
                name="subtract-circle-regular"
                size={16}
                color={hovered ? colors.negative[500] : colors.gray[500]}
              />
            )}
          </Pressable>
        )}

        <Space width={8} />
        <Icon name="chevron-right-filled" size={16} color={colors.gray[500]} />
      </EndAlignedCell>
    ),
  },
];

const smallColumns: ColumnConfig<Node, ExtraInfo>[] = [
  {
    id: "recipient",
    title: t("recurringTransfer.table.recipient"),
    width: "grow",
    renderTitle: ({ title }) => <SimpleHeaderCell text={title} />,
    renderCell: ({ item: { sepaBeneficiary, amount } }) => (
      <StartAlignedCell>
        <BorderedIcon name="clock-regular" color="gray" size={32} padding={8} />
        <Space width={12} />

        <View style={commonStyles.fill}>
          <LakeText variant="smallRegular" style={styles.overflowingText}>
            {sepaBeneficiary.name}
          </LakeText>

          <LakeText variant="medium" color={colors.gray[900]} style={styles.overflowingText}>
            {amount != null
              ? formatCurrency(Number(amount.value), amount.currency)
              : t("recurringTransfer.table.fullBalanceTransfer")}
          </LakeText>
        </View>
      </StartAlignedCell>
    ),
  },
  {
    id: "actions",
    title: t("recurringTransfer.table.actions"),
    width: 36,
    renderTitle: ({ title }) => <SimpleHeaderCell justifyContent="flex-end" text={title} />,
    renderCell: () => (
      <EndAlignedCell>
        <Icon name="chevron-right-filled" size={16} color={colors.gray[500]} />
      </EndAlignedCell>
    ),
  },
];

const keyExtractor = (item: Node) => item.id;

const PAGE_SIZE = 20;

const canceledFilter: FilterBooleanDef = {
  type: "boolean",
  label: t("recurringTransfer.filters.status.canceled"),
};

// Once we add more filters, we should update translation key `recurringTransfer.emptyWithFilters.subtitle` to:
// "You can adjust your filters or search again."
const filtersDefinition = {
  canceled: canceledFilter,
};

type RecurringTransferFilters = FiltersState<typeof filtersDefinition>;

export const RecurringTransferList = ({
  accountId,
  accountMembershipId,
  canQueryCardOnTransaction,
}: Props) => {
  // use useResponsive to fit with scroll behavior set in AccountArea
  const { desktop } = useResponsive();

  const route = Router.useRoute(["AccountPaymentsRecurringTransferDetailsArea"]);
  const [cancelResult, cancelRecurringTransfer] = useUrqlMutation(CancelStandingOrderDocument);

  const [filters, setFilters] = useState<RecurringTransferFilters>(() => ({
    canceled: undefined,
  }));

  const hasFilters = Dict.values(filters).some(isNotNullish);

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

  const { data, nextData, reload, isForceReloading, setAfter } = useUrqlPaginatedQuery(
    {
      query: GetStandingOrdersDocument,
      variables: {
        status: filters.canceled === true ? "Canceled" : "Enabled",
        accountId,
        first: PAGE_SIZE,
      },
    },
    [filters],
  );

  const { endCursor, hasNextPage } = useMemo(
    () =>
      match(data)
        .with(AsyncData.P.Done(Result.P.Ok(P.select())), ({ account }) => ({
          endCursor: account?.standingOrders.pageInfo.endCursor ?? null,
          hasNextPage: account?.standingOrders.pageInfo.hasNextPage ?? false,
        }))
        .otherwise(() => ({ endCursor: null, hasNextPage: false })),
    [data],
  );

  const onEndReached = useCallback(() => {
    if (hasNextPage && endCursor != null) {
      setAfter(endCursor);
    }
  }, [hasNextPage, endCursor, setAfter]);

  const activeRecurringTransferId =
    route?.name === "AccountPaymentsRecurringTransferDetailsArea"
      ? route.params.recurringTransferId
      : null;

  const closeRightPanel = () => Router.push("AccountPaymentsRoot", { accountMembershipId });

  const openStandingOrderDetails = (recurringTransferId: string) =>
    Router.push("AccountPaymentsRecurringTransferDetailsRoot", {
      accountMembershipId,
      recurringTransferId,
    });

  const [recurringTransferToCancelId, setRecurringTransferToCancelId] = useState<string | null>(
    null,
  );

  const onCancelRecurringTransfer = () => {
    if (recurringTransferToCancelId != null) {
      cancelRecurringTransfer({ id: recurringTransferToCancelId })
        .mapOkToResult(({ cancelStandingOrder }) =>
          match(cancelStandingOrder)
            .with({ __typename: "CancelStandingOrderSuccessPayload" }, result => Result.Ok(result))
            .otherwise(error => Result.Error(error)),
        )
        .tapOk(() => {
          closeRightPanel();
          setRecurringTransferToCancelId(null);
          reload();
        })
        .tapError(() => {
          showToast({ variant: "error", title: t("error.generic") });
        });
    }
  };

  const recurringTransfers = data.mapOk(
    result => result.account?.standingOrders.edges.map(({ node }) => node) ?? [],
  );

  const recurringTransferList = recurringTransfers
    .toOption()
    .flatMap(result => result.toOption())
    .getWithDefault([]);

  const extraInfo = useMemo<ExtraInfo>(
    () => ({
      onCancel: setRecurringTransferToCancelId,
    }),
    [],
  );

  return (
    <ResponsiveContainer breakpoint={breakpoints.large} style={commonStyles.fill}>
      {({ large }) => (
        <>
          <Box direction="row" style={[styles.filters, large && styles.filtersDesktop]}>
            <FilterChooser
              filters={filters}
              availableFilters={[
                { label: t("recurringTransfer.filters.status.canceled"), name: "canceled" },
              ]}
              openFilters={openFilters}
              label={t("common.filters")}
              title={t("common.chooseFilter")}
              onAddFilter={filter => setOpenFilters(openFilters => [...openFilters, filter])}
              large={large}
            />

            <Space width={8} />

            <LakeButton
              ariaLabel={t("common.refresh")}
              mode="secondary"
              size="small"
              icon="arrow-counterclockwise-filled"
              loading={isForceReloading}
              onPress={reload}
            />

            <Space width={8} />
          </Box>

          <Space height={12} />

          <View style={[styles.filters, large && styles.filtersDesktop]}>
            <FiltersStack
              definition={filtersDefinition}
              filters={filters}
              openedFilters={openFilters}
              onChangeFilters={setFilters}
              onChangeOpened={setOpenFilters}
            />
          </View>

          <Space height={24} />

          {recurringTransfers.match({
            NotAsked: () => null,
            Loading: () => (
              <PlainListViewPlaceholder
                headerHeight={48}
                rowHeight={56}
                rowVerticalSpacing={0}
                count={PAGE_SIZE}
              />
            ),
            Done: result =>
              result.match({
                Error: () => <ErrorView />,
                Ok: recurringTransfers => (
                  <PlainListView
                    withoutScroll={!desktop}
                    keyExtractor={keyExtractor}
                    groupHeaderHeight={48}
                    headerHeight={48}
                    rowHeight={56}
                    data={recurringTransfers}
                    activeRowId={activeRecurringTransferId ?? undefined}
                    extraInfo={extraInfo}
                    getRowLink={({ item }) => (
                      <Pressable onPress={() => openStandingOrderDetails(item.id)} />
                    )}
                    columns={columns}
                    smallColumns={smallColumns}
                    onEndReached={onEndReached}
                    renderEmptyList={() => (
                      <>
                        <BorderedIcon
                          name="lake-calendar-arrow-swap"
                          color="current"
                          size={100}
                          padding={16}
                        />

                        <Space height={24} />

                        <LakeText align="center" variant="medium" color={colors.gray[900]}>
                          {hasFilters
                            ? t("recurringTransfer.emptyWithFilters.title")
                            : t("recurringTransfer.empty.title")}
                        </LakeText>

                        <Space height={12} />

                        <LakeText align="center" variant="smallRegular" color={colors.gray[700]}>
                          {hasFilters
                            ? t("recurringTransfer.emptyWithFilters.subtitle")
                            : t("recurringTransfer.empty.subtitle")}
                        </LakeText>
                      </>
                    )}
                    loading={{
                      isLoading: nextData.isLoading(),
                      count: PAGE_SIZE,
                    }}
                  />
                ),
              }),
          })}

          <ListRightPanel
            keyExtractor={keyExtractor}
            items={recurringTransferList}
            activeId={activeRecurringTransferId}
            onActiveIdChange={openStandingOrderDetails}
            onClose={closeRightPanel}
            closeLabel={t("common.closeButton")}
            previousLabel={t("common.previous")}
            nextLabel={t("common.next")}
            render={(item, large) => (
              <RecurringTransferPanel
                large={large}
                accountMembershipId={accountMembershipId}
                recurringTransfer={item}
                canQueryCardOnTransaction={canQueryCardOnTransaction}
                onCancel={setRecurringTransferToCancelId}
              />
            )}
          />

          <LakeModal
            visible={recurringTransferToCancelId != null}
            icon="subtract-circle-regular"
            color="negative"
            onPressClose={() => setRecurringTransferToCancelId(null)}
            title={t("recurringTransfer.confirmCancel.title")}
          >
            <LakeText>{t("recurringTransfer.confirmCancel.message")}</LakeText>
            <Space height={48} />

            <LakeButton
              color="negative"
              loading={cancelResult.isLoading()}
              onPress={onCancelRecurringTransfer}
            >
              {t("recurringTransfer.confirmCancel.cta")}
            </LakeButton>
          </LakeModal>
        </>
      )}
    </ResponsiveContainer>
  );
};
