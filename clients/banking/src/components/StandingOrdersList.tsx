import { AsyncData, Result } from "@swan-io/boxed";
import { BorderedIcon } from "@swan-io/lake/src/components/BorderedIcon";
import { Box } from "@swan-io/lake/src/components/Box";
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
import { LakeScrollView } from "@swan-io/lake/src/components/LakeScrollView";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { ListRightPanel } from "@swan-io/lake/src/components/ListRightPanel";
import { ColumnConfig, PlainListView } from "@swan-io/lake/src/components/PlainListView";
import { Pressable } from "@swan-io/lake/src/components/Pressable";
import { ReadOnlyFieldList } from "@swan-io/lake/src/components/ReadOnlyFieldList";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { TabView } from "@swan-io/lake/src/components/TabView";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { breakpoints, colors } from "@swan-io/lake/src/constants/design";
import { useUrqlMutation } from "@swan-io/lake/src/hooks/useUrqlMutation";
import { useUrqlPaginatedQuery } from "@swan-io/lake/src/hooks/useUrqlQuery";
import { showToast } from "@swan-io/lake/src/state/toasts";
import { GetNode } from "@swan-io/lake/src/utils/types";
import dayjs from "dayjs";
import { useCallback, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { match, P } from "ts-pattern";
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

type StandingOrderHistoryProps = {
  canQueryCardOnTransaction: boolean;
  standingOrderId: string;
};

const StandingOrderHistory = ({
  canQueryCardOnTransaction,
  standingOrderId,
}: StandingOrderHistoryProps) => {
  const { data, nextData, isForceReloading, reload, setAfter } = useUrqlPaginatedQuery(
    {
      query: StandingOrdersHistoryPageDocument,
      variables: {
        standingOrderId,
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

      <LakeButton
        accessibilityLabel={t("common.refresh")}
        mode="secondary"
        size="small"
        icon="arrow-counterclockwise-filled"
        loading={isForceReloading}
        onPress={reload}
      />

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

type StandingOrderPanelProps = {
  large: boolean;
  standingOrder: Node;
  accountMembershipId: string;
  canQueryCardOnTransaction: boolean;
  onCancel: (id: string) => void;
};

const StandingOrderPanel = ({
  large,
  standingOrder,
  accountMembershipId,
  canQueryCardOnTransaction,
  onCancel,
}: StandingOrderPanelProps) => {
  const routes = Router.useRoute([
    "AccountPaymentsV2StandingOrdersDetailsRoot",
    "AccountPaymentsV2StandingOrdersDetailsHistory",
  ]);
  const standingOrderId = standingOrder.id;

  const tabs = useMemo(
    () => [
      {
        label: t("recurringTransfer.details.tabs.details"),
        url: Router.AccountPaymentsV2StandingOrdersDetailsRoot({
          accountMembershipId,
          standingOrderId,
        }),
      },
      {
        label: t("recurringTransfer.details.tabs.history"),
        url: Router.AccountPaymentsV2StandingOrdersDetailsHistory({
          accountMembershipId,
          standingOrderId,
        }),
      },
    ],
    [standingOrderId, accountMembershipId],
  );

  const isFullBalance = standingOrder.targetAvailableBalance != null;

  return (
    <View style={commonStyles.fill}>
      <Tile>
        <Space height={8} />

        <LakeHeading level={1} variant={large ? "h1" : "h3"} align="center">
          {isFullBalance
            ? t("recurringTransfer.table.fullBalanceTransfer")
            : standingOrder?.amount
            ? formatCurrency(Number(standingOrder.amount.value), standingOrder.amount.currency)
            : "-"}
        </LakeHeading>

        <Space height={12} />

        {standingOrder.nextExecutionDate != null && (
          <LakeText color={colors.gray[700]} align="center">
            {t("recurringTransfer.details.nextExecutionDate", {
              date: formatDateTime(new Date(standingOrder.nextExecutionDate), "LLL"),
            })}
          </LakeText>
        )}
      </Tile>

      <Space height={24} />
      <TabView tabs={tabs} otherLabel={t("common.tabs.other")} />

      {match(routes)
        .with({ name: "AccountPaymentsV2StandingOrdersDetailsRoot" }, () => (
          <LakeScrollView style={commonStyles.fill} contentContainerStyle={commonStyles.fill}>
            <Space height={24} />

            <ReadOnlyFieldList>
              {isFullBalance && (
                <LakeLabel
                  type="viewSmall"
                  label={t("recurringTransfer.details.label.targetAfterTransfer")}
                  render={() => (
                    <LakeText variant="regular" color={colors.gray[900]}>
                      {standingOrder.targetAvailableBalance
                        ? formatCurrency(
                            Number(standingOrder.targetAvailableBalance.value),
                            standingOrder.targetAvailableBalance.currency,
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
                    {standingOrder.label ?? "-"}
                  </LakeText>
                )}
              />

              <LakeLabel
                type="viewSmall"
                label={t("recurringTransfer.details.label.reference")}
                render={() => (
                  <LakeText variant="regular" color={colors.gray[900]}>
                    {standingOrder.reference ?? "-"}
                  </LakeText>
                )}
              />

              <LakeLabel
                type="viewSmall"
                label={t("recurringTransfer.details.label.recurrance")}
                render={() => (
                  <LakeText variant="regular" color={colors.gray[900]}>
                    {match(standingOrder.period)
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
                    {standingOrder.sepaBeneficiary.name}
                  </LakeText>
                )}
              />

              <LakeLabel
                type="viewSmall"
                label={t("recurringTransfer.details.label.firstExecutionDate")}
                render={() => (
                  <LakeText variant="regular" color={colors.gray[900]}>
                    {standingOrder.firstExecutionDate != null
                      ? formatDateTime(new Date(standingOrder.firstExecutionDate), "LLL")
                      : "-"}
                  </LakeText>
                )}
              />

              <LakeLabel
                type="viewSmall"
                label={t("recurringTransfer.details.label.lastExecutionDate")}
                render={() => (
                  <LakeText variant="regular" color={colors.gray[900]}>
                    {standingOrder.lastExecutionDate != null
                      ? formatDateTime(new Date(standingOrder.lastExecutionDate), "LLL")
                      : "-"}
                  </LakeText>
                )}
              />

              <LakeLabel
                type="viewSmall"
                label={t("recurringTransfer.details.label.nextExecutionDate")}
                render={() => (
                  <LakeText variant="regular" color={colors.gray[900]}>
                    {standingOrder.nextExecutionDate != null
                      ? formatDateTime(new Date(standingOrder.nextExecutionDate), "LLL")
                      : "-"}
                  </LakeText>
                )}
              />

              <LakeLabel
                type="viewSmall"
                label={t("recurringTransfer.details.label.createdBy")}
                render={() => (
                  <LakeText variant="regular" color={colors.gray[900]}>
                    {[standingOrder.createdBy.firstName, standingOrder.createdBy.lastName]
                      .filter(Boolean)
                      .join(" ")}
                  </LakeText>
                )}
              />
            </ReadOnlyFieldList>
          </LakeScrollView>
        ))
        .with({ name: "AccountPaymentsV2StandingOrdersDetailsHistory" }, () => (
          <StandingOrderHistory
            standingOrderId={standingOrderId}
            canQueryCardOnTransaction={canQueryCardOnTransaction}
          />
        ))
        .otherwise(() => null)}

      <Space height={24} />

      <Box>
        <LakeButton
          mode="secondary"
          color="negative"
          icon="subtract-circle-regular"
          onPress={() => onCancel(standingOrderId)}
          style={styles.cancelButton}
        >
          {t("common.cancel")}
        </LakeButton>
      </Box>
    </View>
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
    renderTitle: ({ title }) => <SimpleHeaderCell text={title} />,
    renderCell: ({ item: { nextExecutionDate } }) => (
      <SimpleRegularTextCell
        text={
          nextExecutionDate != null
            ? dayjs(nextExecutionDate).format(`${locale.dateFormat} ${locale.timeFormat}`)
            : "-"
        }
      />
    ),
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
        <Pressable onPress={() => onCancel(item.id)}>
          {({ hovered }) => (
            <Icon
              name="subtract-circle-regular"
              size={16}
              color={hovered ? colors.negative[500] : colors.gray[500]}
            />
          )}
        </Pressable>

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
    renderCell: ({ item: { sepaBeneficiary } }) => (
      <StartAlignedCell>
        <BorderedIcon name="clock-regular" color="gray" size={32} padding={8} />
        <Space width={12} />

        <LakeText variant="medium" color={colors.gray[900]}>
          {sepaBeneficiary.name}
        </LakeText>
      </StartAlignedCell>
    ),
  },
  {
    id: "amount",
    title: t("recurringTransfer.table.amount"),
    width: 150,
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

export const StandingOrdersList = ({
  accountId,
  accountMembershipId,
  canQueryCardOnTransaction,
}: Props) => {
  const route = Router.useRoute(["AccountPaymentsV2StandingOrdersDetailsArea"]);
  const [cancelResult, cancelStandingOrder] = useUrqlMutation(CancelStandingOrderDocument);
  const { data, nextData, reload, isForceReloading, setAfter } = useUrqlPaginatedQuery(
    {
      query: GetStandingOrdersDocument,
      variables: {
        status: "Enabled",
        accountId,
        first: PAGE_SIZE,
      },
    },
    [],
  );

  const { endCursor, hasNextPage } = useMemo(
    () =>
      match(data)
        .with(AsyncData.pattern.Done(Result.pattern.Ok(P.select())), ({ account }) => ({
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

  const activeStandingOrderId =
    route?.name === "AccountPaymentsV2StandingOrdersDetailsArea"
      ? route.params.standingOrderId
      : null;

  const closeRightPanel = () => Router.push("AccountPaymentsV2Root", { accountMembershipId });

  const openStandingOrderDetails = (standingOrderId: string) =>
    Router.push("AccountPaymentsV2StandingOrdersDetailsRoot", {
      accountMembershipId,
      standingOrderId,
    });

  const [standingOrderToCancelId, setStandingOrderToCancelId] = useState<string | null>(null);

  const onCancelStandingOrder = () => {
    if (standingOrderToCancelId != null) {
      cancelStandingOrder({ id: standingOrderToCancelId })
        .mapResult(({ cancelStandingOrder }) =>
          match(cancelStandingOrder)
            .with({ __typename: "CancelStandingOrderSuccessPayload" }, result => Result.Ok(result))
            .otherwise(error => Result.Error(error)),
        )
        .tapOk(() => {
          closeRightPanel();
          setStandingOrderToCancelId(null);
          reload();
        })
        .tapError(() => {
          showToast({ variant: "error", title: t("error.generic") });
        });
    }
  };

  const standingOrders = data.mapResult(result =>
    Result.Ok(result.account?.standingOrders.edges.map(({ node }) => node) ?? []),
  );

  const standingOrdersList = standingOrders
    .toOption()
    .flatMap(result => result.toOption())
    .getWithDefault([]);

  const extraInfo = useMemo<ExtraInfo>(
    () => ({
      onCancel: setStandingOrderToCancelId,
    }),
    [],
  );

  return (
    <ResponsiveContainer breakpoint={breakpoints.large} style={commonStyles.fill}>
      {({ large }) => (
        <>
          <View style={[styles.filters, large && styles.filtersDesktop]}>
            <LakeButton
              accessibilityLabel={t("common.refresh")}
              mode="secondary"
              size="small"
              icon="arrow-counterclockwise-filled"
              loading={isForceReloading}
              onPress={reload}
            />
          </View>

          <Space height={24} />

          {standingOrders.match({
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
                Ok: standingOrders => (
                  <PlainListView
                    keyExtractor={keyExtractor}
                    groupHeaderHeight={48}
                    headerHeight={48}
                    rowHeight={56}
                    data={standingOrders}
                    activeRowId={activeStandingOrderId ?? undefined}
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

                        <LakeText variant="medium" color={colors.gray[900]}>
                          {t("recurringTransfer.empty.title")}
                        </LakeText>

                        <Space height={12} />

                        <LakeText variant="smallRegular" color={colors.gray[700]}>
                          {t("recurringTransfer.empty.subtitle")}
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
            items={standingOrdersList}
            activeId={activeStandingOrderId}
            onActiveIdChange={openStandingOrderDetails}
            onClose={closeRightPanel}
            closeLabel={t("common.closeButton")}
            previousLabel={t("common.previous")}
            nextLabel={t("common.next")}
            render={item => (
              <StandingOrderPanel
                large={large}
                accountMembershipId={accountMembershipId}
                standingOrder={item}
                canQueryCardOnTransaction={canQueryCardOnTransaction}
                onCancel={setStandingOrderToCancelId}
              />
            )}
          />

          <LakeModal
            visible={standingOrderToCancelId != null}
            icon="subtract-circle-regular"
            color="negative"
            onPressClose={() => setStandingOrderToCancelId(null)}
            title={t("recurringTransfer.confirmCancel.title")}
          >
            <LakeText>{t("recurringTransfer.confirmCancel.message")}</LakeText>
            <Space height={48} />

            <LakeButton
              color="negative"
              loading={cancelResult.isLoading()}
              onPress={onCancelStandingOrder}
            >
              {t("common.cancel")}
            </LakeButton>
          </LakeModal>
        </>
      )}
    </ResponsiveContainer>
  );
};
