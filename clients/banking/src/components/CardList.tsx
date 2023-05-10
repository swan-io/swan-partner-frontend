import { Option } from "@swan-io/boxed";
import { LinkConfig } from "@swan-io/lake/src/components/FixedListView";
import { SimpleHeaderCell } from "@swan-io/lake/src/components/FixedListViewCells";
import { ColumnConfig, PlainListView } from "@swan-io/lake/src/components/PlainListView";
import { colors } from "@swan-io/lake/src/constants/design";
import { useResponsive } from "@swan-io/lake/src/hooks/useResponsive";
import { ReactElement, ReactNode, useState } from "react";
import { StyleSheet } from "react-native";
import { match } from "ts-pattern";
import { CardListItemFragment } from "../graphql/partner";
import { t } from "../utils/i18n";
import { CardCancelConfirmationModal } from "./CardCancelConfirmationModal";
import {
  CardActionsCell,
  CardNameCell,
  CardSpendingLimitCell,
  CardStatusCell,
  CardSummaryCell,
  FullNameAndCardTypeCell,
} from "./CardListCells";

const styles = StyleSheet.create({
  canceledRow: {
    backgroundColor: colors.gray[50],
  },
});

type Props = {
  cards: { node: CardListItemFragment }[];
  onRefreshRequest: () => void;
  onEndReached: () => void;
  getRowLink: (item: LinkConfig<CardListItemFragment, ExtraInfo>) => ReactElement;
  activeRowId?: string;
  renderEmptyList: () => ReactNode;
  loading?: {
    isLoading: boolean;
    count: number;
  };
};

type ExtraInfo = {
  onPressCancel: ({ cardId }: { cardId: string }) => void;
};

const columns: ColumnConfig<CardListItemFragment, ExtraInfo>[] = [
  {
    id: "type",
    width: "grow",
    title: t("cardList.fullNameAndCardType"),
    renderTitle: ({ title }) => <SimpleHeaderCell text={title} />,
    renderCell: ({ item }) => <FullNameAndCardTypeCell card={item} />,
  },
  {
    id: "name",
    width: 150,
    title: t("cardList.cardName"),
    renderTitle: ({ title }) => <SimpleHeaderCell text={title} />,
    renderCell: ({ item }) => <CardNameCell card={item} />,
  },
  {
    id: "spendingLimit",
    width: 200,
    title: t("cardList.spendingLimit"),
    renderTitle: ({ title }) => <SimpleHeaderCell text={title} justifyContent="flex-end" />,
    renderCell: ({ item }) => <CardSpendingLimitCell card={item} />,
  },
  {
    id: "status",
    width: 120,
    title: "",
    renderTitle: () => null,
    renderCell: ({ item }) => <CardStatusCell card={item} />,
  },
  {
    id: "actions",
    width: 64,
    title: "",
    renderTitle: () => null,
    renderCell: ({ item, extraInfo: { onPressCancel }, isHovered }) => (
      <CardActionsCell card={item} isHovered={isHovered} onPressCancel={onPressCancel} />
    ),
  },
];

const smallColumns: ColumnConfig<CardListItemFragment, ExtraInfo>[] = [
  {
    id: "card",
    width: "grow",
    title: "",
    renderTitle: () => null,
    renderCell: ({ item }) => <CardSummaryCell card={item} />,
  },
];

export const CardList = ({
  cards,
  loading,
  onEndReached,
  onRefreshRequest,
  getRowLink,
  renderEmptyList,
  activeRowId,
}: Props) => {
  // use useResponsive to fit with scroll behavior set in AccountArea
  const { desktop } = useResponsive();
  const [cancelConfirmationModalModal, setCancelConfirmationModalModal] = useState<Option<string>>(
    Option.None(),
  );

  const onCancelSuccess = () => {
    setCancelConfirmationModalModal(Option.None());
    onRefreshRequest();
  };

  return (
    <>
      <PlainListView
        withoutScroll={!desktop}
        data={cards.map(({ node }) => node)}
        keyExtractor={item => item.id}
        headerHeight={48}
        rowHeight={104}
        groupHeaderHeight={48}
        extraInfo={{
          onPressCancel: ({ cardId }) => setCancelConfirmationModalModal(Option.Some(cardId)),
        }}
        columns={columns}
        activeRowId={activeRowId}
        smallColumns={smallColumns}
        onEndReached={onEndReached}
        rowStyle={({ statusInfo }) =>
          match(statusInfo.status)
            .with("Canceling", "Canceled", () => styles.canceledRow)
            .otherwise(() => null)
        }
        getRowLink={getRowLink}
        loading={loading}
        renderEmptyList={renderEmptyList}
      />

      <CardCancelConfirmationModal
        visible={cancelConfirmationModalModal.isSome()}
        onPressClose={() => setCancelConfirmationModalModal(Option.None())}
        cardId={cancelConfirmationModalModal.toUndefined()}
        onSuccess={onCancelSuccess}
      />
    </>
  );
};
