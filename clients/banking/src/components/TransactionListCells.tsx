import { Box } from "@swan-io/lake/src/components/Box";
import { Cell, TextCell } from "@swan-io/lake/src/components/Cells";
import { Fill } from "@swan-io/lake/src/components/Fill";
import { IconName } from "@swan-io/lake/src/components/Icon";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tag } from "@swan-io/lake/src/components/Tag";
import { colors, radii, spacings } from "@swan-io/lake/src/constants/design";
import dayjs from "dayjs";
import { Image, StyleSheet } from "react-native";
import { P, match } from "ts-pattern";
import {
  MerchantCategory,
  MerchantSubCategory,
  TransactionDetailsFragment,
} from "../graphql/partner";
import { formatCurrency, isTranslationKey, t } from "../utils/i18n";

type Transaction = TransactionDetailsFragment;

const styles = StyleSheet.create({
  paddedCell: {
    paddingVertical: spacings[12],
    minHeight: 72,
  },
  merchantLogo: {
    width: spacings[24],
    height: spacings[24],
    borderRadius: radii[4],
  },
});

const merchantCategoryIcons: Record<MerchantCategory, IconName> = {
  Culture: "music-note-2-regular",
  Entertainment: "movies-and-tv-regular",
  Finance: "calculator-regular",
  Groceries: "cart-regular",
  HealthAndBeauty: "heart-pulse-regular",
  HomeAndUtilities: "home-regular",
  Other: "payment-regular",
  ProfessionalServices: "people-team-toolbox-regular",
  PublicAdministrations: "gavel-regular",
  Restaurants: "food-regular",
  Shopping: "shopping-bag-regular",
  Software: "laptop-regular",
  Transport: "vehicle-subway-regular",
  Travel: "airplane-regular",
};

export const getMerchantCategoryIcon = (category: MerchantCategory) =>
  merchantCategoryIcons[category];

export const getMerchantCategorySublabel = (subcategory: MerchantSubCategory) => {
  try {
    return match(`transaction.enriched.subcategory.${subcategory}`)
      .with(P.when(isTranslationKey), key => t(key))
      .exhaustive();
  } catch {
    return subcategory;
  }
};

export const getMerchantCategoryLabel = (category: MerchantCategory) => {
  try {
    return match(`transaction.enriched.category.${category}`)
      .with(P.when(isTranslationKey), key => t(key))
      .exhaustive();
  } catch {
    return category;
  }
};

const getTransactionIcon = (transaction: Transaction): IconName =>
  match(transaction)
    .returnType<IconName>()
    .with(
      { __typename: "CardTransaction", enrichedTransactionInfo: { category: P.select(P.string) } },
      category => getMerchantCategoryIcon(category),
    )
    .with({ __typename: "CardTransaction" }, () => "payment-regular")
    .otherwise(() => "arrow-swap-regular");

export const getTransactionLabel = (transaction: Transaction): string =>
  match(transaction)
    .with({ __typename: "FeeTransaction" }, ({ feesType }) => {
      if (feesType === "BankingFee") {
        return transaction.label;
      }

      try {
        return match(`paymentMethod.fees.${feesType}`)
          .with(P.when(isTranslationKey), key => t(key))
          .exhaustive();
      } catch {
        return transaction.label;
      }
    })
    //The check number is the first 7 numbers of the cmc7
    .with({ __typename: "CheckTransaction" }, ({ cmc7 }) => `Check N° ${cmc7.slice(0, 7)}`)
    .with(
      {
        __typename: "CardTransaction",
        enrichedTransactionInfo: { enrichedMerchantName: P.select(P.string) },
      },
      enrichedMerchantName => enrichedMerchantName,
    )
    .otherwise(() => transaction.label);

const TransactionIcon = ({ transaction }: { transaction: Transaction }) => {
  return match(transaction)
    .with(
      {
        __typename: "CardTransaction",
        enrichedTransactionInfo: { logoUrl: P.select(P.string) },
      },
      logoUrl => <Image source={logoUrl} style={styles.merchantLogo} />,
    )
    .otherwise(() => (
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
    ));
};

export const TransactionLabelCell = ({ transaction }: { transaction: Transaction }) => {
  return (
    <Cell>
      <TransactionIcon transaction={transaction} />
      <Space width={20} />

      <LakeHeading variant="h5" level={3} numberOfLines={1}>
        {getTransactionLabel(transaction)}
      </LakeHeading>

      {match(transaction.statusInfo.__typename)
        .with("PendingTransactionStatusInfo", () => (
          <>
            <Space width={16} />
            <Tag color="shakespear">{t("transactionStatus.pending")}</Tag>
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
    </Cell>
  );
};

const formatTransactionType = (typename: string) => {
  const unprefixed = typename.startsWith("SEPA") ? typename.slice(4) : typename;

  return (
    unprefixed.charAt(0).toUpperCase() +
    unprefixed
      .slice(1)
      .replace(/([A-Z])/g, " $1")
      .toLowerCase()
  );
};

export const TransactionMethodCell = ({
  transaction,
}: {
  transaction: Transaction | { __typename: string };
}) => {
  return (
    <TextCell
      align="right"
      variant="smallMedium"
      color={colors.gray[600]}
      text={match(transaction)
        .with({ __typename: "CardTransaction" }, () => t("transactions.method.Card"))
        .with({ __typename: "CheckTransaction" }, () => t("transactions.method.Check"))
        .with({ __typename: "FeeTransaction" }, () => t("transactions.method.Fees"))
        .with(
          { __typename: "InternalCreditTransfer" },
          { type: "SepaInstantCreditTransferIn" },
          { type: "SepaInstantCreditTransferOut" },
          () => t("transactions.method.InstantTransfer"),
        )
        .with(
          { __typename: "SEPACreditTransferTransaction" },
          { __typename: "InternationalCreditTransferTransaction" },
          () => t("transactions.method.Transfer"),
        )
        .with(
          { __typename: "InternalDirectDebitTransaction" },
          { __typename: "SEPADirectDebitTransaction" },
          () => t("transactions.method.DirectDebit"),
        )
        .otherwise(({ __typename }) => formatTransactionType(__typename))}
    />
  );
};

export const TransactionExecutionDateCell = ({ transaction }: { transaction: Transaction }) => {
  return (
    <TextCell
      variant="smallMedium"
      align="right"
      color={colors.gray[600]}
      text={dayjs(transaction.executionDate).format("LL")}
    />
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
  transaction: Transaction &
    (
      | {
          __typename: "CardTransaction";
          originalAmount: { currency: string; value: string };
        }
      | {
          __typename: "InternationalCreditTransferTransaction";
          internationalCurrencyExchange: {
            targetAmount: { currency: string; value: string };
          };
        }
    );
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
        match(transaction)
          .with({ __typename: "CardTransaction" }, transaction =>
            formatCurrency(
              Number(transaction.originalAmount.value),
              transaction.originalAmount.currency,
            ),
          )
          .with({ __typename: "InternationalCreditTransferTransaction" }, transaction =>
            formatCurrency(
              Number(transaction.internationalCurrencyExchange.targetAmount.value),
              transaction.internationalCurrencyExchange.targetAmount.currency,
            ),
          )
          .exhaustive()}
    </LakeText>
  );
};

export const TransactionAmountCell = ({ transaction }: { transaction: Transaction }) => {
  return (
    <Cell align="right" direction="column">
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
        .with(
          {
            __typename: "InternationalCreditTransferTransaction",
            internationalCurrencyExchange: {
              sourceAmount: { currency: P.string },
              targetAmount: { value: P.string, currency: P.string },
            },
          },
          transaction =>
            transaction.internationalCurrencyExchange.sourceAmount.currency !==
            transaction.internationalCurrencyExchange.targetAmount.currency ? (
              <TransactionOriginalAmount transaction={transaction} />
            ) : null,
        )
        .otherwise(() => null)}
    </Cell>
  );
};

export const TransactionSummaryCell = ({ transaction }: { transaction: Transaction }) => {
  return (
    <Cell style={styles.paddedCell}>
      <TransactionIcon transaction={transaction} />
      <Space width={20} />

      <Box grow={1} shrink={1}>
        <LakeText variant="smallRegular" numberOfLines={1}>
          {getTransactionLabel(transaction)}
        </LakeText>

        <TransactionAmount transaction={transaction} />
      </Box>

      <Fill minWidth={32} />

      {match(transaction.statusInfo.__typename)
        .with("PendingTransactionStatusInfo", () => (
          <>
            <Space width={12} />
            <Tag color="shakespear">{t("transactionStatus.pending")}</Tag>
          </>
        ))
        .with("RejectedTransactionStatusInfo", () => (
          <>
            <Space width={12} />
            <Tag color="negative">{t("transactionStatus.rejected")}</Tag>
          </>
        ))
        .with("CanceledTransactionStatusInfo", () => (
          <>
            <Space width={12} />
            <Tag color="gray">{t("transactionStatus.canceled")}</Tag>
          </>
        ))
        .otherwise(() => null)}
    </Cell>
  );
};
