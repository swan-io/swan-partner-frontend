import { Cell, CopyableTextCell, HeaderCell, TextCell } from "@swan-io/lake/src/components/Cells";
import { Icon } from "@swan-io/lake/src/components/Icon";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import {
  ColumnConfig,
  LinkConfig,
  PlainListView,
} from "@swan-io/lake/src/components/PlainListView";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Tag } from "@swan-io/lake/src/components/Tag";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { breakpoints, colors } from "@swan-io/lake/src/constants/design";
import { isNotNullishOrEmpty } from "@swan-io/lake/src/utils/nullish";
import dayjs from "dayjs";
import { ReactElement, ReactNode } from "react";
import { match } from "ts-pattern";
import { MerchantPaymentFragment } from "../graphql/partner";
import { formatCurrency, t } from "../utils/i18n";

type ExtraInfo = undefined;

const PaymentCell = ({ payment }: { payment: MerchantPaymentFragment }) => {
  return (
    <Cell direction="column">
      <LakeText variant="smallRegular" color={colors.gray[900]}>
        {match(payment.paymentMethod.type)
          .with("Card", () => t("merchantProfile.paymentLink.paymentMethod.card"))
          .with("Check", () => t("merchantProfile.paymentLink.paymentMethod.check"))
          .with("InternalDirectDebitB2b", "InternalDirectDebitStandard", () =>
            t("merchantProfile.paymentLink.paymentMethod.internalDirectDebit"),
          )
          .with("SepaDirectDebitB2b", "SepaDirectDebitCore", () =>
            t("merchantProfile.paymentLink.paymentMethod.sepaDirectDebit"),
          )
          .exhaustive()}
      </LakeText>

      <LakeText variant="regular" color={colors.gray[900]}>
        {formatCurrency(Number(payment.amount.value), payment.amount.currency)}
      </LakeText>
    </Cell>
  );
};

const columns: ColumnConfig<MerchantPaymentFragment, ExtraInfo>[] = [
  {
    id: "customLabel",
    width: "grow",
    title: t("merchantProfile.payments.customLabel"),
    renderTitle: ({ title }) => <HeaderCell text={title} />,
    renderCell: ({ item }) => (
      <TextCell
        variant="medium"
        color={colors.gray[900]}
        text={isNotNullishOrEmpty(item.label) ? item.label : "-"}
      />
    ),
  },
  {
    id: "date",
    width: "grow",
    title: t("merchantProfile.payments.date"),
    renderTitle: ({ title }) => <HeaderCell text={title} />,
    renderCell: ({ item }) => (
      <Cell>
        <LakeText align="right" variant="smallMedium" color={colors.gray[900]}>
          {dayjs(item.statusInfo.createdAt).format("LLL")}
        </LakeText>
      </Cell>
    ),
  },
  {
    id: "paymentMethod",
    width: "grow",
    title: t("merchantProfile.payments.paymentMethod"),
    renderTitle: ({ title }) => <HeaderCell text={title} />,
    renderCell: ({ item: { paymentMethod } }) => (
      <TextCell
        variant="medium"
        color={colors.gray[900]}
        text={match(paymentMethod.type)
          .with("Card", () => t("merchantProfile.paymentLink.paymentMethod.card"))
          .with("Check", () => t("merchantProfile.paymentLink.paymentMethod.check"))
          .with("InternalDirectDebitB2b", "InternalDirectDebitStandard", () =>
            t("merchantProfile.paymentLink.paymentMethod.internalDirectDebit"),
          )
          .with("SepaDirectDebitB2b", "SepaDirectDebitCore", () =>
            t("merchantProfile.paymentLink.paymentMethod.sepaDirectDebit"),
          )
          .exhaustive()}
      />
    ),
  },
  {
    id: "externalReference",
    width: "grow",
    title: t("merchantProfile.payments.externalReference"),
    renderTitle: ({ title }) => <HeaderCell text={title} />,
    renderCell: ({ item }) =>
      isNotNullishOrEmpty(item.externalReference) ? (
        <CopyableTextCell
          text={item.externalReference}
          textToCopy={item.externalReference}
          copyWording={t("copyButton.copyTooltip")}
          copiedWording={t("copyButton.copiedTooltip")}
        />
      ) : (
        <TextCell variant="regular" color={colors.gray[900]} text="-" />
      ),
  },
  {
    id: "status",
    width: 120,
    title: t("merchantProfile.payments.status"),
    renderTitle: ({ title }) => <HeaderCell text={title} align="center" />,
    renderCell: ({ item }) => (
      <Cell align="center">
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
          .with("Disputed", () => (
            <Tag color="sunglow"> {t("merchantProfile.payments.status.disputed")} </Tag>
          ))
          .with("PartiallyDisputed", () => (
            <Tag color="sunglow"> {t("merchantProfile.payments.status.partiallyDisputed")} </Tag>
          ))
          .with("Canceled", () => (
            <Tag color="gray"> {t("merchantProfile.payments.status.canceled")} </Tag>
          ))
          .exhaustive()}
      </Cell>
    ),
  },
  {
    id: "amount",
    width: 100,
    title: t("merchantProfile.payments.list.amount"),
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
    width: 40,
    id: "actions",
    title: "",
    renderTitle: () => null,
    renderCell: ({ isHovered }) => (
      <Cell align="right">
        <Icon
          name="chevron-right-filled"
          color={isHovered ? colors.gray[900] : colors.gray[500]}
          size={16}
        />
      </Cell>
    ),
  },
];

const smallColumns: ColumnConfig<MerchantPaymentFragment, ExtraInfo>[] = [
  {
    id: "paymentMethod",
    width: "grow",
    title: t("merchantProfile.payments.paymentMethod"),
    renderTitle: () => null,
    renderCell: ({ item }) => <PaymentCell payment={item} />,
  },
  {
    id: "status",
    width: 120,
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
          .with("Disputed", () => (
            <Tag color="sunglow"> {t("merchantProfile.payments.status.disputed")} </Tag>
          ))
          .with("PartiallyDisputed", () => (
            <Tag color="sunglow"> {t("merchantProfile.payments.status.partiallyDisputed")} </Tag>
          ))
          .with("Canceled", () => (
            <Tag color="gray"> {t("merchantProfile.payments.status.canceled")} </Tag>
          ))
          .exhaustive()}
      </Cell>
    ),
  },
  {
    width: 40,
    id: "actions",
    title: "",
    renderTitle: () => null,
    renderCell: ({ isHovered }) => (
      <Cell align="right">
        <Icon
          name="chevron-right-filled"
          color={isHovered ? colors.gray[700] : colors.gray[200]}
          size={16}
        />
      </Cell>
    ),
  },
];

type Props = {
  payments: MerchantPaymentFragment[];
  getRowLink: (item: LinkConfig<MerchantPaymentFragment, ExtraInfo>) => ReactElement;
  activeRowId: string | undefined;
  onActiveRowChange: (element: HTMLElement) => void;
  onEndReached: () => void;
  isLoading: boolean;
  renderEmptyList: () => ReactNode;
};

export const MerchantProfilePaymentList = ({
  payments,
  onEndReached,
  getRowLink,
  activeRowId,
  onActiveRowChange,
  isLoading,
  renderEmptyList,
}: Props) => {
  return (
    <ResponsiveContainer style={commonStyles.fill} breakpoint={breakpoints.large}>
      {({ large }) => (
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
          renderEmptyList={renderEmptyList}
        />
      )}
    </ResponsiveContainer>
  );
};
