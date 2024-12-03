import { AsyncData, Result } from "@swan-io/boxed";
import { useMutation, useQuery } from "@swan-io/graphql-client";
import { BorderedIcon } from "@swan-io/lake/src/components/BorderedIcon";
import { Box } from "@swan-io/lake/src/components/Box";
import { Cell, HeaderCell, TextCell } from "@swan-io/lake/src/components/Cells";
import { EmptyView } from "@swan-io/lake/src/components/EmptyView";
import { Fill } from "@swan-io/lake/src/components/Fill";
import { Icon } from "@swan-io/lake/src/components/Icon";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { ListRightPanel, ListRightPanelContent } from "@swan-io/lake/src/components/ListRightPanel";
import {
  ColumnConfig,
  PlainListView,
  PlainListViewPlaceholder,
} from "@swan-io/lake/src/components/PlainListView";
import { Pressable } from "@swan-io/lake/src/components/Pressable";
import { ReadOnlyFieldList } from "@swan-io/lake/src/components/ReadOnlyFieldList";
import { ScrollView } from "@swan-io/lake/src/components/ScrollView";
import { Space } from "@swan-io/lake/src/components/Space";
import { TabView } from "@swan-io/lake/src/components/TabView";
import { Tag } from "@swan-io/lake/src/components/Tag";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { Toggle } from "@swan-io/lake/src/components/Toggle";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { colors, spacings } from "@swan-io/lake/src/constants/design";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { GetNode } from "@swan-io/lake/src/utils/types";
import { LakeModal } from "@swan-io/shared-business/src/components/LakeModal";
import { showToast } from "@swan-io/shared-business/src/state/toasts";
import { translateError } from "@swan-io/shared-business/src/utils/i18n";
import { useCallback, useMemo, useState } from "react";
import { StyleSheet } from "react-native";
import { P, match } from "ts-pattern";
import {
  CancelStandingOrderDocument,
  GetStandingOrdersDocument,
  GetStandingOrdersQuery,
  StandingOrdersHistoryPageDocument,
  TransactionDetailsFragment,
} from "../graphql/partner";
import { usePermissions } from "../hooks/usePermissions";
import { formatCurrency, formatDateTime, t } from "../utils/i18n";
import { Router } from "../utils/routes";
import { Connection } from "./Connection";
import { ErrorView } from "./ErrorView";
import { RightPanelTransactionList } from "./RightPanelTransactionList";

const styles = StyleSheet.create({
  paddedCell: {
    paddingVertical: spacings[12],
    minHeight: 72,
  },
  filters: {
    paddingHorizontal: 24,
  },
  filtersDesktop: {
    paddingHorizontal: 40,
  },
  cancelButton: {
    alignSelf: "flex-start",
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
  large: boolean;
};

type Node = GetNode<NonNullable<GetStandingOrdersQuery["account"]>["standingOrders"]>;

type ExtraInfo = {
  onCancel: (id: string) => void;
  canCancelStandingOrder: boolean;
};

type RecurringTransferHistoryProps = {
  recurringTransferId: string;
  large: boolean;
};

const RecurringTransferHistory = ({
  recurringTransferId,
  large,
}: RecurringTransferHistoryProps) => {
  const { canReadOtherMembersCards: canQueryCardOnTransaction } = usePermissions();
  const [data, { isLoading, reload, setVariables }] = useQuery(StandingOrdersHistoryPageDocument, {
    standingOrderId: recurringTransferId,
    orderBy: { field: "createdAt", direction: "Desc" },
    first: NUM_TO_RENDER,
    canQueryCardOnTransaction,
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  return (
    <>
      <Space height={24} />

      <ListRightPanelContent large={large}>
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
      </ListRightPanelContent>

      <Space height={24} />

      {data.match({
        NotAsked: () => null,
        Loading: () => <PlainListViewPlaceholder count={5} groupHeaderHeight={48} rowHeight={56} />,
        Done: result =>
          result.match({
            Error: error => <ErrorView error={error} />,
            Ok: data => (
              <Connection connection={data.standingOrder?.payments}>
                {payments => {
                  const transactions = (payments?.edges ?? [])
                    .filter(({ node }) => Boolean(node.transactions?.totalCount))
                    .reduce<
                      { node: TransactionDetailsFragment }[]
                    >((list, { node }) => [...list, ...(node.transactions?.edges ?? [])], []);

                  return (
                    <RightPanelTransactionList
                      withoutScroll={!large}
                      transactions={transactions}
                      pageSize={NUM_TO_RENDER}
                      onEndReached={() => {
                        if (data.standingOrder?.payments.pageInfo.hasNextPage ?? false) {
                          setVariables({
                            after: data.standingOrder?.payments.pageInfo.endCursor ?? undefined,
                          });
                        }
                      }}
                      loading={{
                        isLoading,
                        count: 5,
                      }}
                      renderEmptyList={() => (
                        <EmptyView
                          icon="lake-transfer"
                          borderedIcon={true}
                          title={t("transansactionList.noResults")}
                        />
                      )}
                    />
                  );
                }}
              </Connection>
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
  onCancel: (id: string) => void;
};

const RecurringTransferPanel = ({
  large,
  recurringTransfer,
  accountMembershipId,
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
  const isCancelled = recurringTransfer.statusInfo.status === "Canceled";

  return (
    <>
      <ScrollView
        contentContainerStyle={large ? styles.rightPanelDesktop : styles.rightPanelMobile}
      >
        <ListRightPanelContent large={large}>
          <Tile>
            {isCancelled ? (
              <Box alignItems="center">
                <Tag color="negative">{t("recurringTransfer.filters.status.canceled")}</Tag>
              </Box>
            ) : null}

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
                  date: formatDateTime(recurringTransfer.nextExecutionDate, "LLL"),
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
                          ? formatDateTime(recurringTransfer.firstExecutionDate, "LLL")
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
                          ? formatDateTime(recurringTransfer.lastExecutionDate, "LLL")
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
                          ? formatDateTime(recurringTransfer.nextExecutionDate, "LLL")
                          : "-"}
                      </LakeText>
                    )}
                  />

                  <LakeLabel
                    type="viewSmall"
                    label={t("recurringTransfer.details.label.createdBy")}
                    render={() => (
                      <LakeText variant="regular" color={colors.gray[900]}>
                        {recurringTransfer.createdBy.fullName}
                      </LakeText>
                    )}
                  />
                </ReadOnlyFieldList>
              </ScrollView>
            </ListRightPanelContent>
          ))
          .with({ name: "AccountPaymentsRecurringTransferDetailsHistory" }, () => (
            <RecurringTransferHistory recurringTransferId={recurringTransferId} large={large} />
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
    renderTitle: ({ title }) => <HeaderCell text={title} />,
    renderCell: ({ item: { sepaBeneficiary } }) => (
      <Cell>
        <BorderedIcon name="clock-regular" color="gray" size={32} padding={8} />
        <Space width={24} />

        <LakeHeading variant="h5" level={3} numberOfLines={1}>
          {sepaBeneficiary.name}
        </LakeHeading>
      </Cell>
    ),
  },
  {
    id: "label",
    title: t("recurringTransfer.table.explanation"),
    width: "grow",
    renderTitle: ({ title }) => <HeaderCell text={title} />,
    renderCell: ({ item: { label } }) => <TextCell text={label ?? "-"} />,
  },
  {
    id: "period",
    title: t("recurringTransfer.table.period"),
    width: 150,
    renderTitle: ({ title }) => <HeaderCell text={title} />,
    renderCell: ({ item: { period } }) => (
      <TextCell
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
    width: 260,
    renderTitle: ({ title }) => <HeaderCell align="right" text={title} />,
    renderCell: ({ item: { nextExecutionDate, statusInfo } }) =>
      match(statusInfo)
        .with({ status: "Canceled" }, () => (
          <Cell align="right">
            <Tag color="negative">{t("recurringTransfer.filters.status.canceled")}</Tag>
          </Cell>
        ))
        .with({ status: P.union("Enabled", "ConsentPending") }, () => (
          <TextCell
            align="right"
            text={nextExecutionDate != null ? formatDateTime(nextExecutionDate, "LLL") : "-"}
          />
        ))
        .exhaustive(),
  },
  {
    id: "amount",
    title: t("recurringTransfer.table.amount"),
    width: 150,
    renderTitle: ({ title }) => <HeaderCell text={title} />,
    renderCell: ({ item: { amount } }) => (
      <TextCell
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
    width: 40,
    id: "actions",
    title: "",
    renderTitle: () => null,
    renderCell: ({ item, extraInfo: { onCancel, canCancelStandingOrder } }) => (
      <Cell align="right">
        {item.statusInfo.status === "Enabled" && canCancelStandingOrder && (
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
      </Cell>
    ),
  },
];

const smallColumns: ColumnConfig<Node, ExtraInfo>[] = [
  {
    id: "recipient",
    title: t("recurringTransfer.table.recipient"),
    width: "grow",
    renderTitle: ({ title }) => <HeaderCell text={title} />,
    renderCell: ({ item: { sepaBeneficiary, amount, statusInfo } }) => (
      <Cell style={styles.paddedCell}>
        <BorderedIcon
          name="clock-regular"
          color={statusInfo.status === "Canceled" ? "negative" : "gray"}
          size={32}
          padding={8}
        />

        <Space width={12} />

        <Box grow={1} shrink={1}>
          <LakeText variant="smallRegular" numberOfLines={1}>
            {sepaBeneficiary.name}
          </LakeText>

          <LakeText variant="medium" numberOfLines={1} color={colors.gray[900]}>
            {amount != null
              ? formatCurrency(Number(amount.value), amount.currency)
              : t("recurringTransfer.table.fullBalanceTransfer")}
          </LakeText>
        </Box>
      </Cell>
    ),
  },
  {
    id: "nextExecutionDate",
    title: t("recurringTransfer.table.nextExecution"),
    width: 36,
    renderTitle: ({ title }) => <HeaderCell align="right" text={title} />,
    renderCell: ({ item: { statusInfo } }) =>
      match(statusInfo)
        .with({ status: "Canceled" }, () => (
          <Cell align="right">
            <BorderedIcon name="subtract-circle-regular" color="negative" size={32} padding={8} />
          </Cell>
        ))
        .otherwise(() => null),
  },
];

const keyExtractor = (item: Node) => item.id;

const PAGE_SIZE = 20;

export const RecurringTransferList = ({ accountId, accountMembershipId, large }: Props) => {
  const route = Router.useRoute(["AccountPaymentsRecurringTransferDetailsArea"]);
  const { canCancelStandingOrder } = usePermissions();
  const [cancelRecurringTransfer, cancelResult] = useMutation(CancelStandingOrderDocument);

  const [canceled, setCanceled] = useState(false);
  const hasFilters = canceled;

  const [data, { isLoading, reload, setVariables }] = useQuery(GetStandingOrdersDocument, {
    status: canceled ? "Canceled" : "Enabled",
    accountId,
    first: PAGE_SIZE,
  });

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
      setVariables({ after: endCursor });
    }
  }, [hasNextPage, endCursor, setVariables]);

  const activeRecurringTransferId =
    route?.name === "AccountPaymentsRecurringTransferDetailsArea"
      ? route.params.recurringTransferId
      : null;

  const closeRightPanel = () =>
    Router.push("AccountPaymentsRecurringTransferList", { accountMembershipId });

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
        .mapOk(data => data.cancelStandingOrder)
        .mapOkToResult(filterRejectionsToResult)
        .tapOk(() => {
          closeRightPanel();
          setRecurringTransferToCancelId(null);
          reload();
        })
        .tapError(error => {
          showToast({ variant: "error", error, title: translateError(error) });
        });
    }
  };

  const extraInfo = useMemo<ExtraInfo>(
    () => ({
      onCancel: setRecurringTransferToCancelId,
      canCancelStandingOrder,
    }),
    [canCancelStandingOrder],
  );

  const [isRefreshing, setIsRefreshing] = useState(false);

  return (
    <>
      <Box
        direction="row"
        alignItems="center"
        style={[styles.filters, large && styles.filtersDesktop]}
      >
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

        <Fill minWidth={24} />

        <Toggle
          mode={large ? "desktop" : "mobile"}
          value={!canceled}
          onToggle={value => setCanceled(!value)}
          onLabel={t("recurringTransfer.filters.status.active")}
          offLabel={t("recurringTransfer.filters.status.canceled")}
        />
      </Box>

      <Space height={24} />

      {data.match({
        NotAsked: () => null,
        Loading: () => (
          <PlainListViewPlaceholder count={PAGE_SIZE} headerHeight={48} rowHeight={56} />
        ),
        Done: result =>
          result.match({
            Error: error => <ErrorView error={error} />,
            Ok: data => (
              <Connection connection={data.account?.standingOrders}>
                {standingOrders => (
                  <>
                    <PlainListView
                      withoutScroll={!large}
                      keyExtractor={keyExtractor}
                      groupHeaderHeight={48}
                      headerHeight={48}
                      rowHeight={56}
                      data={standingOrders?.edges.map(item => item.node) ?? []}
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
                        isLoading,
                        count: PAGE_SIZE,
                      }}
                    />

                    <ListRightPanel
                      keyExtractor={keyExtractor}
                      items={standingOrders?.edges?.map(item => item.node) ?? []}
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
                          onCancel={setRecurringTransferToCancelId}
                        />
                      )}
                    />
                  </>
                )}
              </Connection>
            ),
          }),
      })}

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
  );
};
