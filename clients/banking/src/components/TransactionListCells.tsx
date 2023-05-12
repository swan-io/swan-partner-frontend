import { Fill } from "@swan-io/lake/src/components/Fill";
import { IconName } from "@swan-io/lake/src/components/Icon";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tag } from "@swan-io/lake/src/components/Tag";
import { colors, spacings } from "@swan-io/lake/src/constants/design";
import dayjs from "dayjs";
import { StyleSheet, View } from "react-native";
import { P, match } from "ts-pattern";
import { TransactionDetailsFragment } from "../graphql/partner";
import { formatCurrency, t } from "../utils/i18n";

type Transaction = TransactionDetailsFragment;

const styles = StyleSheet.create({
  cell: {
    display: "flex",
    paddingHorizontal: spacings[16],
    flexGrow: 1,
    flexDirection: "row",
    alignItems: "center",
    width: 1,
  },
  cellRightAlign: {
    justifyContent: "flex-end",
  },
  paddedCell: {
    paddingVertical: spacings[12],
    minHeight: 72,
  },
  amounts: {
    alignItems: "flex-end",
  },
  overflowingText: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  transactionSummary: {
    flexShrink: 1,
    flexGrow: 1,
  },
});

const getTransactionIcon = (transaction: Transaction): IconName =>
  match(transaction.__typename)
    .with("CardTransaction", () => "payment-regular" as const)
    .with("FeeTransaction", () => "arrow-swap-regular" as const)
    .with(
      "InternalCreditTransfer",
      "InternalDirectDebitTransaction",
      "SEPACreditTransferTransaction",
      "SEPADirectDebitTransaction",
      () => "arrow-swap-regular" as const,
    )
    .otherwise(() => "arrow-swap-regular" as const);

export const getTransactionLabel = (transaction: Transaction): string =>
  match(transaction)
    .with({ __typename: "FeeTransaction" }, ({ feesType }) => {
      return match(feesType)
        .with("CardPaymentsOutsideSEPA", () => t("paymentMethod.fees.cardPaymentsOutsideSEPA"))
        .with("CashWithdrawalsOutsideSEPA", () =>
          t("paymentMethod.fees.cashWithdrawalsOutsideSEPA"),
        )
        .with("CashWithdrawalsWithinSEPA", () => t("paymentMethod.fees.cashWithdrawalsWithinSEPA"))
        .with("CirculationLetterDraftingFee", () =>
          t("paymentMethod.fees.circulationLetterDraftingFee"),
        )
        .with("DirectDebitRejection", () => t("paymentMethod.fees.directDebitRejection"))
        .with("ImproperUseOfAccount", () => t("paymentMethod.fees.improperUseOfAccount"))
        .with("ProcessingJudicialOrAdministrativeSeizure", () =>
          t("paymentMethod.fees.processingJudicialOrAdministrativeSeizure"),
        )
        .with("UnauthorizedOverdraft", () => t("paymentMethod.fees.unauthorizedOverdraft"))
        .with("BankingFee", () => transaction.label)
        .exhaustive();
    })
    //The check number is the first 7 numbers of the cmc7
    .with({ __typename: "CheckTransaction" }, ({ cmc7 }) => `Check N° ${cmc7.slice(0, 7)}`)
    .otherwise(() => transaction.label);

export const TransactionTypeCell = ({ transaction }: { transaction: Transaction }) => {
  return (
    <View style={styles.cell}>
      <Tag
        icon={getTransactionIcon(transaction)}
        color={match(transaction.statusInfo)
          .with({ __typename: "RejectedTransactionStatusInfo" }, () => "negative" as const)
          .with(
            { __typename: "ReleasedTransactionStatusInfo" },
            { __typename: "BookedTransactionStatusInfo" },
            () => (transaction.side === "Debit" ? ("gray" as const) : ("positive" as const)),
          )
          .otherwise(() => "gray" as const)}
      />
    </View>
  );
};

export const TransactionNameCell = ({ transaction }: { transaction: Transaction }) => {
  return (
    <View style={styles.cell}>
      <LakeHeading variant="h5" level={3} style={styles.overflowingText}>
        {getTransactionLabel(transaction)}
      </LakeHeading>

      {match(transaction.statusInfo.__typename)
        .with("PendingTransactionStatusInfo", () => (
          <>
            <Space width={16} />
            <Tag color="warning">{t("transactionStatus.pending")}</Tag>
          </>
        ))
        .with("RejectedTransactionStatusInfo", () => (
          <>
            <Space width={16} />
            <Tag color="negative">{t("transactionStatus.rejected")}</Tag>
          </>
        ))
        .with("CanceledTransactionStatusInfo", () => (
          <>
            <Space width={16} />
            <Tag color="gray">{t("transactionStatus.canceled")}</Tag>
          </>
        ))
        .otherwise(() => null)}
    </View>
  );
};

export const TransactionMethodCell = ({ transaction }: { transaction: Transaction }) => {
  return (
    <View style={[styles.cell, styles.cellRightAlign]}>
      <LakeText align="right" variant="smallMedium" color={colors.gray[600]}>
        {match(transaction)
          .with({ __typename: "CardTransaction" }, () => t("transactions.method.Card"))
          .with({ __typename: "CheckTransaction" }, () => t("transactions.method.Check"))
          .with({ __typename: "FeeTransaction" }, () => t("transactions.method.Fees"))
          .with(
            { __typename: "InternalCreditTransfer" },
            { type: "SepaInstantCreditTransferIn" },
            { type: "SepaInstantCreditTransferOut" },
            () => t("transactions.method.InstantTransfer"),
          )
          .with({ __typename: "SEPACreditTransferTransaction" }, () =>
            t("transactions.method.Transfer"),
          )
          .with(
            { __typename: "InternalDirectDebitTransaction" },
            { __typename: "SEPADirectDebitTransaction" },
            () => t("transactions.method.DirectDebit"),
          )
          .exhaustive()}
      </LakeText>
    </View>
  );
};

export const TransactionExecutionDateCell = ({ transaction }: { transaction: Transaction }) => {
  return (
    <View style={[styles.cell, styles.cellRightAlign]}>
      <LakeText align="right" variant="smallMedium" color={colors.gray[600]}>
        {dayjs(transaction.executionDate).format("LL")}
      </LakeText>
    </View>
  );
};

const TransactionAmount = ({ transaction }: { transaction: Transaction }) => (
  <LakeHeading
    level={4}
    variant="h5"
    color={match(transaction.statusInfo)
      .with({ __typename: "RejectedTransactionStatusInfo" }, () => colors.negative[600])
      .with(
        { __typename: "ReleasedTransactionStatusInfo" },
        { __typename: "BookedTransactionStatusInfo" },
        () => (transaction.side === "Debit" ? colors.gray[900] : colors.positive[600]),
      )
      .otherwise(() => colors.gray[900])}
  >
    {(transaction.side === "Debit" ? "-" : "+") +
      formatCurrency(Number(transaction.amount.value), transaction.amount.currency)}
  </LakeHeading>
);

const TransactionOriginalAmount = ({
  transaction,
}: {
  transaction: Transaction & {
    __typename: "CardTransaction";
    originalAmount: { currency: string; value: string };
  };
}) => {
  return (
    <LakeText
      variant="smallRegular"
      color={match(transaction.statusInfo)
        .with({ __typename: "RejectedTransactionStatusInfo" }, () => colors.negative[400])
        .with(
          { __typename: "ReleasedTransactionStatusInfo" },
          { __typename: "BookedTransactionStatusInfo" },
          () => (transaction.side === "Debit" ? colors.gray[400] : colors.positive[400]),
        )
        .otherwise(() => colors.gray[400])}
    >
      {(transaction.side === "Debit" ? "-" : "+") +
        formatCurrency(
          Number(transaction.originalAmount.value),
          transaction.originalAmount.currency,
        )}
    </LakeText>
  );
};

export const TransactionAmountCell = ({ transaction }: { transaction: Transaction }) => {
  return (
    <View style={[styles.cell, styles.cellRightAlign]}>
      <View style={styles.amounts}>
        <TransactionAmount transaction={transaction} />

        {match(transaction)
          .with(
            {
              __typename: "CardTransaction",
              originalAmount: { value: P.string, currency: P.string },
            },
            transaction =>
              transaction.originalAmount.currency !== transaction.amount.currency ? (
                <TransactionOriginalAmount transaction={transaction} />
              ) : null,
          )
          .otherwise(() => null)}
      </View>
    </View>
  );
};

export const TransactionSummaryCell = ({ transaction }: { transaction: Transaction }) => {
  return (
    <View style={[styles.cell, styles.paddedCell]}>
      <View style={styles.transactionSummary}>
        <LakeText variant="smallRegular" style={styles.overflowingText}>
          {getTransactionLabel(transaction)}
        </LakeText>

        <TransactionAmount transaction={transaction} />
      </View>

      <Fill minWidth={32} />

      <View>
        {match(transaction.statusInfo.__typename)
          .with("PendingTransactionStatusInfo", () => (
            <>
              <Space width={12} />
              <Tag color="warning">{t("transactionStatus.pending")}</Tag>
            </>
          ))
          .with("RejectedTransactionStatusInfo", () => (
            <>
              <Space width={12} />
              <Tag color="negative">{t("transactionStatus.rejected")}</Tag>
            </>
          ))
          .otherwise(() => null)}
      </View>
    </View>
  );
};
