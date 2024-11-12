import { CellAction, EndAlignedCell, HeaderCell } from "@swan-io/lake/src/components/Cells";
import { Icon } from "@swan-io/lake/src/components/Icon";
import { ColumnConfig, PlainListView } from "@swan-io/lake/src/components/PlainListView";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { tabsViewHeight } from "@swan-io/lake/src/components/TabView";
import { LinkConfig } from "@swan-io/lake/src/components/VirtualizedList";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { breakpoints, colors } from "@swan-io/lake/src/constants/design";
import { capitalize } from "@swan-io/lake/src/utils/string";
import dayjs from "dayjs";
import { ReactElement, ReactNode } from "react";
import { TransactionDetailsFragment } from "../graphql/partner";
import { t } from "../utils/i18n";
import {
  TransactionAmountCell,
  TransactionExecutionDateCell,
  TransactionMethodCell,
  TransactionNameCell,
  TransactionSummaryCell,
  TransactionTypeCell,
} from "./TransactionListCells";

type Props = {
  pageSize: number;
  transactions: { node: TransactionDetailsFragment }[];
  onEndReached: () => void;
  getRowLink: (item: LinkConfig<TransactionDetailsFragment, ExtraInfo>) => ReactElement;
  onActiveRowChange: (element: HTMLElement) => void;
  activeRowId?: string;
  renderEmptyList: () => ReactNode;
  loading?: {
    isLoading: boolean;
    count: number;
  };
  withStickyTabs?: boolean;
  withGrouping?: boolean;
};

type ExtraInfo = undefined;

const columns: ColumnConfig<TransactionDetailsFragment, ExtraInfo>[] = [
  {
    id: "type",
    width: 48,
    title: t("transactions.transaction"),
    renderTitle: ({ title }) => <HeaderCell text={title} />,
    renderCell: ({ item }) => <TransactionTypeCell transaction={item} />,
  },
  {
    id: "label",
    width: "grow",
    title: "label",
    renderTitle: () => null,
    renderCell: ({ item }) => <TransactionNameCell transaction={item} />,
  },
  {
    id: "method",
    width: 180,
    title: t("transactions.method"),
    renderTitle: ({ title }) => <HeaderCell text={title} align="right" />,
    renderCell: ({ item }) => <TransactionMethodCell transaction={item} />,
  },
  {
    id: "date",
    width: 200,
    title: t("transactions.date"),
    renderTitle: ({ title }) => <HeaderCell text={title} align="right" />,
    renderCell: ({ item }) => <TransactionExecutionDateCell transaction={item} />,
  },
  {
    id: "amount",
    width: 160,
    title: t("transactions.amount"),
    renderTitle: ({ title }) => <HeaderCell text={title} align="right" />,
    renderCell: ({ item }) => <TransactionAmountCell transaction={item} />,
  },
  {
    width: 48,
    id: "actions",
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

const smallColumns: ColumnConfig<TransactionDetailsFragment, ExtraInfo>[] = [
  {
    id: "type",
    width: 48,
    title: t("transactions.transaction"),
    renderTitle: ({ title }) => <HeaderCell text={title} />,
    renderCell: ({ item }) => <TransactionTypeCell transaction={item} />,
  },
  {
    id: "label",
    width: "grow",
    title: "label",
    renderTitle: ({ title }) => <HeaderCell text={title} />,
    renderCell: ({ item }) => <TransactionSummaryCell transaction={item} />,
  },
  {
    width: 48,
    id: "actions",
    title: "",
    renderTitle: () => null,
    renderCell: ({ isHovered }) => (
      <EndAlignedCell>
        <CellAction>
          <Icon
            name="chevron-right-filled"
            color={isHovered ? colors.gray[700] : colors.gray[200]}
            size={16}
          />
        </CellAction>
      </EndAlignedCell>
    ),
  },
];

export const TransactionList = ({
  transactions,
  loading,
  onEndReached,
  onActiveRowChange,
  getRowLink,
  renderEmptyList,
  activeRowId,
  withStickyTabs = false,
  withGrouping = true,
}: Props) => {
  const headerHeight = 48;

  return (
    <ResponsiveContainer style={commonStyles.fill} breakpoint={breakpoints.large}>
      {({ large }) => (
        <PlainListView
          withoutScroll={!large}
          stickyOffset={!withStickyTabs || large ? 0 : tabsViewHeight - 1}
          data={transactions.map(({ node }) => node)}
          keyExtractor={item => item.id}
          groupBy={
            withGrouping
              ? item =>
                  large
                    ? capitalize(dayjs(item.executionDate).format("MMMM YYYY"))
                    : dayjs(item.executionDate).format("LL")
              : undefined
          }
          headerHeight={headerHeight}
          groupHeaderHeight={headerHeight}
          rowHeight={56}
          extraInfo={undefined}
          columns={columns}
          onActiveRowChange={onActiveRowChange}
          activeRowId={activeRowId}
          smallColumns={smallColumns}
          onEndReached={onEndReached}
          getRowLink={getRowLink}
          loading={loading}
          renderEmptyList={renderEmptyList}
        />
      )}
    </ResponsiveContainer>
  );
};
