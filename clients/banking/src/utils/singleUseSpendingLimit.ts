import { SpendingLimitValue } from "../components/CardItemSpendingLimit";
import { SpendingLimitFragment } from "../graphql/partner";

/**
 * Single-use cards are just an amount + a one-off (`Always`) / recurring (`Monthly`) choice, so a
 * dedicated type keeps the shared `SpendingLimitValue`'s rolling/calendar modes unrepresentable.
 * The adapters below convert to/from the shared type at the UI boundary.
 */
export type SingleUseSpendingLimitValue = {
  amount: { value: string; currency: string };
  period: "Always" | "Monthly";
};

export const deriveSingleUseSpendingLimitValue = (
  spendingLimits: SpendingLimitFragment[],
): SingleUseSpendingLimitValue | undefined => {
  const spendingLimit = spendingLimits[0];
  if (spendingLimit == null) {
    return undefined;
  }
  return {
    amount: { value: spendingLimit.amount.value, currency: spendingLimit.amount.currency },
    period: spendingLimit.period === "Monthly" ? "Monthly" : "Always",
  };
};

export const singleUseToSpendingLimitValue = (
  value: SingleUseSpendingLimitValue,
): SpendingLimitValue => ({
  amount: value.amount,
  mode: { type: "rolling", rollingValue: 1, period: value.period },
});

export const spendingLimitValueToSingleUse = (
  value: SpendingLimitValue,
): SingleUseSpendingLimitValue => ({
  amount: value.amount,
  period: value.mode.type === "rolling" && value.mode.period === "Monthly" ? "Monthly" : "Always",
});
