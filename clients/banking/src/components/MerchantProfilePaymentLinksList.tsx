import { Cell, CopyableTextCell, HeaderCell, TextCell } from "@swan-io/lake/src/components/Cells";
import { EmptyView } from "@swan-io/lake/src/components/EmptyView";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { ColumnConfig, PlainListView } from "@swan-io/lake/src/components/PlainListView";
import { Tag } from "@swan-io/lake/src/components/Tag";
import { LinkConfig } from "@swan-io/lake/src/components/VirtualizedList";
import { colors, spacings } from "@swan-io/lake/src/constants/design";
import { isNullishOrEmpty } from "@swan-io/lake/src/utils/nullish";
import { ReactElement } from "react";
import { StyleSheet } from "react-native";
import { match } from "ts-pattern";
import { PaymentLinkFragment } from "../graphql/partner";
import { formatCurrency, t } from "../utils/i18n";

const styles = StyleSheet.create({
  paddedCell: {
    paddingVertical: spacings[12],
    minHeight: 72,
  },
});

type ExtraInfo = undefined;

const PaymentLinkCell = ({ paymentLink }: { paymentLink: PaymentLinkFragment }) => {
  return (
    <Cell direction="column" style={styles.paddedCell}>
      {isNullishOrEmpty(paymentLink.label) ? (
        <LakeText variant="smallRegular" color={colors.gray[500]}>
          {"-"}
        </LakeText>
      ) : (
        <LakeText variant="smallRegular" color={colors.gray[900]} numberOfLines={1}>
          {paymentLink.label}
        </LakeText>
      )}

      <LakeText variant="regular" color={colors.gray[900]}>
        {formatCurrency(Number(paymentLink.amount.value), paymentLink.amount.currency)}
      </LakeText>
    </Cell>
  );
};
const columns: ColumnConfig<PaymentLinkFragment, ExtraInfo>[] = [
  {
    id: "label",
    width: 300,
    title: t("merchantProfile.paymentLink.list.label"),
    renderTitle: ({ title }) => <HeaderCell text={title} />,
    renderCell: ({ item }) =>
      isNullishOrEmpty(item.label) ? (
        <TextCell variant="smallRegular" color={colors.gray[300]} text={"-"} />
      ) : (
        <TextCell variant="medium" color={colors.gray[900]} text={item.label} />
      ),
  },
  {
    id: "link",
    width: "grow",
    title: t("merchantProfile.paymentLink.list.link"),
    renderTitle: ({ title }) => <HeaderCell text={title} />,
    renderCell: ({ item }) => (
      <CopyableTextCell
        text={item.url}
        textToCopy={item.url}
        copyWording={t("copyButton.copyTooltip")}
        copiedWording={t("copyButton.copiedTooltip")}
      />
    ),
  },
  {
    id: "status",
    width: 150,
    title: t("merchantProfile.paymentLink.list.status"),
    renderTitle: ({ title }) => <HeaderCell text={title} align="right" />,
    renderCell: ({ item }) => (
      <Cell align="right">
        {match(item.statusInfo.status)
          .with("Active", () => (
            <Tag color="shakespear"> {t("merchantProfile.paymentLink.status.active")} </Tag>
          ))
          .with("Completed", () => (
            <Tag color="positive"> {t("merchantProfile.paymentLink.status.completed")} </Tag>
          ))
          .with("Expired", () => (
            <Tag color="gray"> {t("merchantProfile.paymentLink.status.expired")} </Tag>
          ))
          .exhaustive()}
      </Cell>
    ),
  },
  {
    id: "amount",
    width: 200,
    title: t("transactions.amount"),
    renderTitle: ({ title }) => <HeaderCell text={title} align="right" />,
    renderCell: ({ item }) => (
      <TextCell
        variant="regular"
        align="right"
        text={formatCurrency(Number(item.amount.value), item.amount.currency)}
      />
    ),
  },
];

const smallColumns: ColumnConfig<PaymentLinkFragment, ExtraInfo>[] = [
  {
    id: "label",
    width: "grow",
    title: t("merchantProfile.paymentLink.list.label"),
    renderTitle: () => null,
    renderCell: ({ item }) => <PaymentLinkCell paymentLink={item} />,
  },
  {
    id: "status",
    width: 120,
    title: t("merchantProfile.paymentLink.list.status"),
    renderTitle: ({ title }) => <HeaderCell text={title} align="right" />,
    renderCell: ({ item }) => (
      <Cell align="right">
        {match(item.statusInfo.status)
          .with("Active", () => (
            <Tag color="shakespear"> {t("merchantProfile.paymentLink.status.active")} </Tag>
          ))
          .with("Completed", () => (
            <Tag color="positive"> {t("merchantProfile.paymentLink.status.completed")} </Tag>
          ))
          .with("Expired", () => (
            <Tag color="gray"> {t("merchantProfile.paymentLink.status.expired")} </Tag>
          ))
          .exhaustive()}
      </Cell>
    ),
  },
];

type Props = {
  paymentLinks: PaymentLinkFragment[];
  getRowLink: (item: LinkConfig<PaymentLinkFragment, ExtraInfo>) => ReactElement;
  activeRowId: string | undefined;
  onActiveRowChange: (element: HTMLElement) => void;
  onEndReached: () => void;
  isLoading: boolean;
  large: boolean;
};

export const MerchantProfilePaymentLinksList = ({
  paymentLinks,
  onEndReached,
  large,
  getRowLink,
  activeRowId,
  onActiveRowChange,
  isLoading,
}: Props) => {
  return (
    <PlainListView
      withoutScroll={!large}
      data={paymentLinks}
      keyExtractor={item => item.id}
      headerHeight={48}
      rowHeight={56}
      groupHeaderHeight={48}
      extraInfo={undefined}
      columns={columns}
      smallColumns={smallColumns}
      getRowLink={getRowLink}
      onActiveRowChange={onActiveRowChange}
      activeRowId={activeRowId}
      onEndReached={onEndReached}
      loading={{
        isLoading,
        count: 5,
      }}
      renderEmptyList={() => (
        <EmptyView
          icon="lake-transfer"
          borderedIcon={true}
          title={t("merchantProfile.paymentLink.noResults")}
        />
      )}
    />
  );
};
