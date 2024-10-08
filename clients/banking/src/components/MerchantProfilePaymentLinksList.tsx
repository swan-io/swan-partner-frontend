import {
  CellAction,
  CopyableRegularTextCell,
  EndAlignedCell,
  SimpleHeaderCell,
  StartAlignedCell,
} from "@swan-io/lake/src/components/Cells";
import { EmptyView } from "@swan-io/lake/src/components/EmptyView";
import { Icon } from "@swan-io/lake/src/components/Icon";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { ColumnConfig, PlainListView } from "@swan-io/lake/src/components/PlainListView";
import { Tag } from "@swan-io/lake/src/components/Tag";
import { LinkConfig } from "@swan-io/lake/src/components/VirtualizedList";
import { colors, spacings } from "@swan-io/lake/src/constants/design";
import { isNullishOrEmpty } from "@swan-io/lake/src/utils/nullish";
import { ReactElement } from "react";
import { StyleSheet, View } from "react-native";
import { match } from "ts-pattern";
import { PaymentLinkFragment } from "../graphql/partner";
import { formatCurrency, t } from "../utils/i18n";

const styles = StyleSheet.create({
  cell: {
    display: "flex",
    paddingHorizontal: spacings[16],
    flexGrow: 1,
    flexDirection: "row",
    alignItems: "center",
    width: 1,
  },
  paddedCell: {
    paddingVertical: spacings[12],
    minHeight: 72,
  },
  transactionSummary: {
    flexShrink: 1,
    flexGrow: 1,
  },
  overflowingText: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
});

type ExtraInfo = undefined;

const PaymentLinkCell = ({ paymentLink }: { paymentLink: PaymentLinkFragment }) => {
  return (
    <View style={[styles.cell, styles.paddedCell]}>
      <View style={styles.transactionSummary}>
        {isNullishOrEmpty(paymentLink.label) ? (
          <LakeText variant="smallRegular" color={colors.gray[500]}>
            {"-"}
          </LakeText>
        ) : (
          <LakeText variant="smallRegular" color={colors.gray[900]} style={styles.overflowingText}>
            {paymentLink.label}
          </LakeText>
        )}

        <LakeText variant="regular" color={colors.gray[900]}>
          {formatCurrency(Number(paymentLink.amount.value), paymentLink.amount.currency)}
        </LakeText>
      </View>
    </View>
  );
};
const columns: ColumnConfig<PaymentLinkFragment, ExtraInfo>[] = [
  {
    id: "label",
    width: 300,
    title: t("merchantProfile.paymentLink.list.label"),
    renderTitle: ({ title }) => <SimpleHeaderCell text={title} />,
    renderCell: ({ item }) => (
      <StartAlignedCell>
        {isNullishOrEmpty(item.label) ? (
          <LakeText variant="smallRegular" color={colors.gray[300]}>
            {"-"}
          </LakeText>
        ) : (
          <LakeText variant="medium" color={colors.gray[900]}>
            {item.label}
          </LakeText>
        )}
      </StartAlignedCell>
    ),
  },
  {
    id: "link",
    width: "grow",
    title: t("merchantProfile.paymentLink.list.link"),
    renderTitle: ({ title }) => <SimpleHeaderCell text={title} />,
    renderCell: ({ item }) => (
      <CopyableRegularTextCell
        text={item.url}
        textToCopy={item.url}
        copyWording={t("copyButton.copyTooltip")}
        copiedWording={t("copyButton.copiedTooltip")}
      />
    ),
  },
  // {
  //   id: "creationDate",
  //   width: 200,
  //   title: t("merchantProfile.paymentLink.list.creationDate"),
  //   renderTitle: ({ title }) => <SimpleHeaderCell text={title} justifyContent="flex-end" />,
  //   renderCell: ({ item }) => <SimpleRegularTextCell text={item.requestedExecutionAt} />,
  // },
  {
    id: "status",
    width: 150,
    title: t("merchantProfile.paymentLink.list.status"),
    renderTitle: ({ title }) => <SimpleHeaderCell text={title} justifyContent="flex-end" />,
    renderCell: ({ item }) => (
      <EndAlignedCell>
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
      </EndAlignedCell>
    ),
  },
  {
    id: "amount",
    width: 200,
    title: t("transactions.amount"),
    renderTitle: ({ title }) => <SimpleHeaderCell text={title} justifyContent="flex-end" />,
    renderCell: ({ item }) => (
      <EndAlignedCell>
        <LakeText variant="regular" color={colors.gray[900]}>
          {formatCurrency(Number(item.amount.value), item.amount.currency)}
        </LakeText>
      </EndAlignedCell>
    ),
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
    width: 150,
    title: t("merchantProfile.paymentLink.list.status"),
    renderTitle: ({ title }) => <SimpleHeaderCell text={title} justifyContent="flex-end" />,
    renderCell: ({ item }) => (
      <EndAlignedCell>
        {match(item.statusInfo.status)
          .with("Active", () => (
            <Tag color="positive"> {t("merchantProfile.paymentLink.status.active")} </Tag>
          ))
          .with("Completed", () => (
            <Tag color="negative"> {t("merchantProfile.paymentLink.status.completed")} </Tag>
          ))
          .with("Expired", () => (
            <Tag color="negative"> {t("merchantProfile.paymentLink.status.expired")} </Tag>
          ))
          .exhaustive()}
      </EndAlignedCell>
    ),
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
          title={t("merchantProfile.paymentLinks.noResults")}
        />
      )}
    />
  );
};
