import { LinkConfig } from "@swan-io/lake/src/components/FixedListView";
import {
  CellAction,
  EndAlignedCell,
  SimpleHeaderCell,
} from "@swan-io/lake/src/components/FixedListViewCells";
import { Icon } from "@swan-io/lake/src/components/Icon";
import { ColumnConfig, PlainListView } from "@swan-io/lake/src/components/PlainListView";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { tabsViewHeight } from "@swan-io/lake/src/components/TabView";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { breakpoints, colors } from "@swan-io/lake/src/constants/design";
import { useResponsive } from "@swan-io/lake/src/hooks/useResponsive";
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
};

type ExtraInfo = undefined;

const columns: ColumnConfig<TransactionDetailsFragment, ExtraInfo>[] = [
  {
    id: "type",
    width: 48,
    title: t("transactions.transaction"),
    renderTitle: ({ title }) => <SimpleHeaderCell text={title} />,
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
    width: 160,
    title: t("transactions.method"),
    renderTitle: ({ title }) => <SimpleHeaderCell text={title} justifyContent="flex-end" />,
    renderCell: ({ item }) => <TransactionMethodCell transaction={item} />,
  },
  {
    id: "date",
    width: 200,
    title: t("transactions.date"),
    renderTitle: ({ title }) => <SimpleHeaderCell text={title} justifyContent="flex-end" />,
    renderCell: ({ item }) => <TransactionExecutionDateCell transaction={item} />,
  },
  {
    id: "amount",
    width: 160,
    title: t("transactions.amount"),
    renderTitle: ({ title }) => <SimpleHeaderCell text={title} justifyContent="flex-end" />,
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
    renderTitle: ({ title }) => <SimpleHeaderCell text={title} />,
    renderCell: ({ item }) => <TransactionTypeCell transaction={item} />,
  },
  {
    id: "label",
    width: "grow",
    title: "label",
    renderTitle: ({ title }) => <SimpleHeaderCell text={title} />,
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
}: Props) => {
  // use useResponsive to fit with scroll behavior set in AccountArea
  const { desktop } = useResponsive();

  return (
    <ResponsiveContainer style={commonStyles.fill} breakpoint={breakpoints.large}>
      {({ large }) => (
        <PlainListView
          withoutScroll={!desktop}
          stickyOffset={!withStickyTabs || desktop ? 0 : tabsViewHeight - 1}
          data={transactions.map(({ node }) => node)}
          keyExtractor={item => item.id}
          groupBy={item =>
            large
              ? capitalize(dayjs(item.executionDate).format("MMMM YYYY"))
              : dayjs(item.executionDate).format("LL")
          }
          headerHeight={48}
          rowHeight={56}
          groupHeaderHeight={48}
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
