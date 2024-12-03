import { Option } from "@swan-io/boxed";
import { HeaderCell, TextCell } from "@swan-io/lake/src/components/Cells";
import { ColumnConfig, PlainListView } from "@swan-io/lake/src/components/PlainListView";
import { LinkConfig } from "@swan-io/lake/src/components/VirtualizedList";
import { colors } from "@swan-io/lake/src/constants/design";
import { ReactElement, ReactNode, useState } from "react";
import { CardListItemFragment } from "../graphql/partner";
import { t } from "../utils/i18n";
import { CardCancelConfirmationModal } from "./CardCancelConfirmationModal";
import {
  CardActionsCell,
  CardSpendingLimitCell,
  CardStatusCell,
  CardSummaryCell,
  FullNameAndCardTypeCell,
} from "./CardListCells";

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
  large: boolean;
};

type ExtraInfo = {
  onPressCancel: ({ cardId }: { cardId: string }) => void;
};

const columns: ColumnConfig<CardListItemFragment, ExtraInfo>[] = [
  {
    id: "type",
    width: "grow",
    title: t("cardList.fullNameAndCardType"),
    renderTitle: ({ title }) => <HeaderCell text={title} />,
    renderCell: ({ item }) => <FullNameAndCardTypeCell card={item} />,
  },
  {
    id: "name",
    width: 150,
    title: t("cardList.cardName"),
    renderTitle: ({ title }) => <HeaderCell text={title} />,
    renderCell: ({ item }) => <TextCell color={colors.gray[600]} text={item.name ?? "-"} />,
  },
  {
    id: "spendingLimit",
    width: 200,
    title: t("cardList.spendingLimit"),
    renderTitle: ({ title }) => <HeaderCell text={title} align="right" />,
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
    width: 40,
    id: "actions",
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
  large,
}: Props) => {
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
        withoutScroll={!large}
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
