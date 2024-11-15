import { ActionCell, Cell, CopyableTextCell, HeaderCell } from "@swan-io/lake/src/components/Cells";
import { Icon } from "@swan-io/lake/src/components/Icon";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import {
  ColumnConfig,
  LinkConfig,
  PlainListView,
} from "@swan-io/lake/src/components/PlainListView";
import { Tag } from "@swan-io/lake/src/components/Tag";
import { colors, spacings } from "@swan-io/lake/src/constants/design";
import { isNotNullish, isNullishOrEmpty } from "@swan-io/lake/src/utils/nullish";
import dayjs from "dayjs";
import { ReactElement } from "react";
import { StyleSheet, View } from "react-native";
import { match } from "ts-pattern";
import { MerchantPaymentFragment } from "../graphql/partner";
import { formatCurrency, t } from "../utils/i18n";
import { GetRouteParams } from "../utils/routes";
import { MerchantProfilePaymentPicker } from "./MerchantProfilePaymentPicker";

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

const PaymentCell = ({ payment }: { payment: MerchantPaymentFragment }) => {
  return (
    <View style={[styles.cell, styles.paddedCell]}>
      <View style={styles.transactionSummary}>
        {isNullishOrEmpty(payment.label) ? (
          <LakeText variant="smallRegular" color={colors.gray[500]}>
            {"-"}
          </LakeText>
        ) : (
          <LakeText variant="smallRegular" color={colors.gray[900]} style={styles.overflowingText}>
            {payment.label}
          </LakeText>
        )}

        <LakeText variant="regular" color={colors.gray[900]}>
          {formatCurrency(Number(payment.amount.value), payment.amount.currency)}
        </LakeText>
      </View>
    </View>
  );
};

const columns: ColumnConfig<MerchantPaymentFragment, ExtraInfo>[] = [
  {
    id: "customLabel",
    width: "grow",
    title: t("merchantProfile.payments.customLabel"),
    renderTitle: ({ title }) => <HeaderCell text={title} />,
    renderCell: ({ item }) => (
      <Cell align="left">
        {isNullishOrEmpty(item.label) ? (
          <LakeText variant="smallRegular" color={colors.gray[300]}>
            {"-"}
          </LakeText>
        ) : (
          <LakeText variant="medium" color={colors.gray[900]}>
            {item.label}
          </LakeText>
        )}
      </Cell>
    ),
  },
  {
    id: "date",
    width: 250,
    title: t("merchantProfile.payments.date"),
    renderTitle: ({ title }) => <HeaderCell text={title} />,
    renderCell: ({ item }) => (
      <View style={styles.cell}>
        <LakeText align="right" variant="smallMedium" color={colors.gray[600]}>
          {dayjs(item.createdAt).format("LLL")}
        </LakeText>
      </View>
    ),
  },
  {
    id: "externalReference",
    width: 200,
    title: t("merchantProfile.payments.externalReference"),
    renderTitle: ({ title }) => <HeaderCell text={title} />,
    renderCell: ({ item }) =>
      isNotNullish(item.externalReference) ? (
        <CopyableTextCell
          text={item.externalReference}
          textToCopy={item.externalReference}
          copyWording={t("copyButton.copyTooltip")}
          copiedWording={t("copyButton.copiedTooltip")}
        />
      ) : (
        <Cell>
          <LakeText variant="regular" color={colors.gray[900]}>
            {"-"}
          </LakeText>
        </Cell>
      ),
  },
  {
    id: "status",
    width: 100,
    title: t("merchantProfile.payments.status"),
    renderTitle: ({ title }) => <HeaderCell text={title} align="right" />,
    renderCell: ({ item }) => (
      <Cell align="right">
        {match(item.statusInfo.status)
          .with("Authorized", () => (
            <Tag color="shakespear"> {t("merchantProfile.payments.status.authorized")} </Tag>
          ))
          .with("Captured", () => (
            <Tag color="positive"> {t("merchantProfile.payments.status.captured")} </Tag>
          ))
          .with("Initiated", () => (
            <Tag color="gray"> {t("merchantProfile.payments.status.initiated")} </Tag>
          ))
          .with("Rejected", () => (
            <Tag color="negative"> {t("merchantProfile.payments.status.rejected")} </Tag>
          ))
          .exhaustive()}
      </Cell>
    ),
  },
  {
    id: "amount",
    width: 150,
    title: t("transactions.amount"),
    renderTitle: ({ title }) => <HeaderCell text={title} align="right" />,
    renderCell: ({ item }) => (
      <Cell align="right">
        <LakeText variant="regular" color={colors.gray[900]}>
          {formatCurrency(Number(item.amount.value), item.amount.currency)}
        </LakeText>
      </Cell>
    ),
  },
  {
    width: 48,
    id: "actions",
    title: "",
    renderTitle: () => null,
    renderCell: ({ isHovered }) => (
      <Cell align="right">
        <ActionCell>
          <Icon
            name="chevron-right-filled"
            color={isHovered ? colors.gray[900] : colors.gray[500]}
            size={16}
          />
        </ActionCell>
      </Cell>
    ),
  },
];

const smallColumns: ColumnConfig<MerchantPaymentFragment, ExtraInfo>[] = [
  {
    id: "label",
    width: "grow",
    title: t("merchantProfile.paymentLink.list.label"),
    renderTitle: () => null,
    renderCell: ({ item }) => <PaymentCell payment={item} />,
  },
  {
    id: "status",
    width: 120,
    title: t("merchantProfile.paymentLink.list.status"),
    renderTitle: ({ title }) => <HeaderCell text={title} align="right" />,
    renderCell: ({ item }) => (
      <Cell align="right">
        {match(item.statusInfo.status)
          .with("Authorized", () => (
            <Tag color="shakespear"> {t("merchantProfile.payments.status.authorized")} </Tag>
          ))
          .with("Captured", () => (
            <Tag color="positive"> {t("merchantProfile.payments.status.captured")} </Tag>
          ))
          .with("Initiated", () => (
            <Tag color="gray"> {t("merchantProfile.payments.status.initiated")} </Tag>
          ))
          .with("Rejected", () => (
            <Tag color="negative"> {t("merchantProfile.payments.status.rejected")} </Tag>
          ))
          .exhaustive()}
      </Cell>
    ),
  },
  {
    width: 48,
    id: "actions",
    title: "",
    renderTitle: () => null,
    renderCell: ({ isHovered }) => (
      <Cell align="right">
        <ActionCell>
          <Icon
            name="chevron-right-filled"
            color={isHovered ? colors.gray[700] : colors.gray[200]}
            size={16}
          />
        </ActionCell>
      </Cell>
    ),
  },
];

type Props = {
  params: GetRouteParams<"AccountMerchantsProfilePaymentsArea">;
  payments: MerchantPaymentFragment[];
  getRowLink: (item: LinkConfig<MerchantPaymentFragment, ExtraInfo>) => ReactElement;
  activeRowId: string | undefined;
  onActiveRowChange: (element: HTMLElement) => void;
  onEndReached: () => void;
  isLoading: boolean;
  large: boolean;
};

export const MerchantProfilePaymentList = ({
  params,
  payments,
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
      data={payments}
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
      renderEmptyList={() => <MerchantProfilePaymentPicker params={params} />}
    />
  );
};
