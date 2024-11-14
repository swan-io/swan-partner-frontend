import { HeaderCell } from "@swan-io/lake/src/components/Cells";
import { ColumnConfig, PlainListView } from "@swan-io/lake/src/components/PlainListView";
import { breakpoints } from "@swan-io/lake/src/constants/design";
import { ReactNode } from "react";
import { TransactionDetailsFragment } from "../graphql/partner";
import { t } from "../utils/i18n";
import {
  TransactionAmountCell,
  TransactionExecutionDateCell,
  TransactionLabelCell,
  TransactionSummaryCell,
} from "./TransactionListCells";

type Props = {
  pageSize: number;
  transactions: { node: TransactionDetailsFragment }[];
  onEndReached: () => void;
  renderEmptyList: () => ReactNode;
  loading?: {
    isLoading: boolean;
    count: number;
  };
  withoutScroll?: boolean;
};

type ExtraInfo = undefined;

const columns: ColumnConfig<TransactionDetailsFragment, ExtraInfo>[] = [
  {
    id: "label",
    width: "grow",
    title: t("transactions.transaction"),
    renderTitle: ({ title }) => <HeaderCell text={title} />,
    renderCell: ({ item }) => <TransactionLabelCell transaction={item} />,
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
];

const smallColumns: ColumnConfig<TransactionDetailsFragment, ExtraInfo>[] = [
  {
    id: "label",
    width: "grow",
    title: t("transactions.transaction"),
    renderTitle: ({ title }) => <HeaderCell text={title} />,
    renderCell: ({ item }) => <TransactionSummaryCell transaction={item} />,
  },
];

export const RightPanelTransactionList = ({
  transactions,
  loading,
  onEndReached,
  renderEmptyList,
  withoutScroll,
}: Props) => {
  return (
    <PlainListView
      withoutScroll={withoutScroll}
      data={transactions.map(({ node }) => node)}
      keyExtractor={item => item.id}
      headerHeight={0}
      rowHeight={56}
      groupHeaderHeight={48}
      extraInfo={undefined}
      columns={columns}
      smallColumns={smallColumns}
      onEndReached={onEndReached}
      loading={loading}
      renderEmptyList={renderEmptyList}
      breakpoint={breakpoints.small} // Must be the same as in RightPanel
    />
  );
};
