import { Box } from "@swan-io/lake/src/components/Box";
import { Icon } from "@swan-io/lake/src/components/Icon";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tag } from "@swan-io/lake/src/components/Tag";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { colors } from "@swan-io/lake/src/constants/design";
import { typography } from "@swan-io/lake/src/constants/typography";
import { useResponsive } from "@swan-io/lake/src/hooks/useResponsive";
import { useCallback } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Except } from "type-fest";
import { useLegacyAccentColor } from "../contexts/legacyAccentColor";
import { Scalars } from "../graphql/partner";
import { PaymentMethodIcon, TransactionVariant } from "../types";
import { AmountLine } from "./AmountLine";
import { Touchable } from "./Touchable";

const styles = StyleSheet.create({
  root: {
    ...commonStyles.fill,
  },
  container: {
    ...commonStyles.fill,
  },
  contents: {
    ...commonStyles.fill,
  },
  ok: {
    color: colors.positive[500],
  },
  rejected: {
    color: colors.negative[500],
  },
  base: {
    flexGrow: 1,
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  desktop: {
    paddingHorizontal: 80,
  },
  selectedRow: {
    backgroundColor: colors.gray[50],
  },
  selectedIndicator: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  label: {
    ...typography.bodyLarge,
    flexShrink: 1,
    fontWeight: typography.fontWeights.demi,
  },
  method: {
    ...commonStyles.fill,
  },
  paymentMethod: {
    ...typography.bodySmall,
    color: colors.gray[400],
  },
  amount: {
    ...typography.bodyLarge,
    fontWeight: typography.fontWeights.demi,
  },
  originalAmount: {
    ...typography.bodyLarge,
    fontWeight: typography.fontWeights.demi,
    color: colors.gray[400],
  },
});

type Props = {
  amount: number;
  currency: Scalars["Currency"];
  id: string;
  isCredit: boolean;
  label: string;
  originalAmount?: number;
  originalAmountCurrency?: string;
  paymentMethodIcon: PaymentMethodIcon;
  paymentMethodName: string;
  selected?: boolean;
  statusName: string;
  variant: TransactionVariant;
  onPress?: (id: string) => void;
};

type TransactionProps = Except<Props, "id" | "onPress">;

export const Transaction = ({
  amount,
  currency,
  isCredit,
  label,
  originalAmount = 0,
  originalAmountCurrency = "",
  paymentMethodName,
  paymentMethodIcon,
  statusName,
  variant,
}: TransactionProps) => {
  const isRejected = variant === "rejected";
  const isPending = variant === "pending";
  const isCanceled = variant === "canceled";
  const isLocalPayment = originalAmountCurrency === currency;

  const iconColor = isRejected
    ? colors.negative[500]
    : isCredit
    ? colors.positive[500]
    : colors.gray[900];

  return (
    <Box direction="row" alignItems="center" style={styles.root}>
      <View style={styles.container}>
        <Box direction="row" alignItems="center" style={styles.contents}>
          <Icon
            name={paymentMethodIcon === "card" ? "payment-regular" : "arrow-swap-regular"}
            size={24}
            color={iconColor}
          />

          <Space width={16} />

          <Text numberOfLines={1} style={styles.label}>
            {label}
          </Text>

          {isCanceled && (
            <>
              <Space width={12} />
              <Tag color="gray">{statusName}</Tag>
            </>
          )}

          {isPending && (
            <>
              <Space width={12} />
              <Tag color="warning">{statusName}</Tag>
            </>
          )}

          {isRejected && (
            <>
              <Space width={12} />
              <Tag color="negative">{statusName}</Tag>
            </>
          )}
        </Box>

        <Box direction="row" style={styles.method}>
          <Space width={40} />

          <Text numberOfLines={1} style={styles.paymentMethod}>
            {paymentMethodName}
          </Text>
        </Box>
      </View>

      <Space width={16} />

      <Box alignItems="end">
        <AmountLine
          amount={amount}
          currency={currency}
          displayPositiveSign={true}
          style={[styles.amount, isCredit && styles.ok, isRejected && styles.rejected]}
        />

        {Boolean(originalAmount && originalAmountCurrency && !isLocalPayment) && (
          <AmountLine
            amount={originalAmount}
            currency={originalAmountCurrency}
            displayPositiveSign={true}
            style={styles.originalAmount}
          />
        )}
      </Box>
    </Box>
  );
};

export const TransactionRow = ({
  amount,
  currency,
  id,
  isCredit,
  label,
  onPress,
  originalAmount,
  originalAmountCurrency,
  paymentMethodIcon,
  paymentMethodName,
  selected = false,
  statusName,
  variant,
}: Props) => {
  const { desktop } = useResponsive();
  const accentColor = useLegacyAccentColor();

  const handleOnPress = useCallback(() => {
    onPress?.(id);
  }, [onPress, id]);

  return (
    <Touchable
      accessibilityRole="button"
      disabled={selected}
      onPress={handleOnPress}
      style={[styles.base, desktop && styles.desktop, selected && styles.selectedRow]}
    >
      {selected && <View style={[styles.selectedIndicator, { backgroundColor: accentColor }]} />}

      <Transaction
        amount={amount}
        currency={currency}
        isCredit={isCredit}
        label={label}
        originalAmount={originalAmount}
        originalAmountCurrency={originalAmountCurrency}
        paymentMethodIcon={paymentMethodIcon}
        paymentMethodName={paymentMethodName}
        statusName={statusName}
        variant={variant}
      />
    </Touchable>
  );
};
