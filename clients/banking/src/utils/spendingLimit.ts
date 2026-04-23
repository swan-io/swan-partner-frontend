import dayjs from "dayjs";
import {
  AccountHolderForCardSettingsFragment,
  Amount,
  CardProductFragment,
} from "../graphql/partner";
import { formatCurrency, t } from "./i18n";

export const sanitizeAmountString = (raw: string): string => {
  const sanitized = raw.replace(",", ".");
  const parsed = Number(sanitized);
  return String(Number.isNaN(parsed) || parsed < 0 ? 0 : parsed);
};

export const deriveSpendingLimitContext = (
  cardProduct: CardProductFragment,
  accountHolder: AccountHolderForCardSettingsFragment | undefined,
  maxSpendingLimit?: { amount: Amount },
): { maxValue: number; currency: string } => {
  const isIndividual = accountHolder?.info.__typename === "AccountHolderIndividualInfo";
  const limit = isIndividual
    ? cardProduct.individualSpendingLimit
    : cardProduct.companySpendingLimit;
  return {
    currency: limit.amount.currency,
    maxValue:
      maxSpendingLimit != null ? Number(maxSpendingLimit.amount.value) : Number(limit.amount.value),
  };
};

export const getSpendingLimitAmountError = (
  validation: string[] | null,
  maxValue: number,
  currency: string,
): string | undefined => {
  if (validation?.includes("ExceedsMaxAmount") === true) {
    return t("card.settings.spendingLimit.exceedsMax", {
      max: formatCurrency(maxValue, currency),
    });
  }
  if (validation?.includes("InvalidAmount") === true) {
    return t("common.form.invalidAmount");
  }
  return undefined;
};

export const getMonthlySpendingDate = (spendingDay: number, hour: number) => {
  const today = dayjs();

  const spendingDate = dayjs()
    .startOf("month")
    .add(spendingDay - 1, "day")
    .add(hour, "hour");

  // if the spendingDay will occurs on the current month
  if (today.isBefore(spendingDate)) {
    const daysInMonth = dayjs().daysInMonth();
    // which means the day doesn't exist
    if (spendingDay > daysInMonth) {
      // the spendingDay should occurs the last day of the month
      return dayjs().startOf("month").date(daysInMonth).format("LLL");
    } else {
      // which means the spendingDate exists
      return spendingDate.format("LLL");
    }
  } else {
    // if the spendingDate is before today, it will occurs next month
    return spendingDate.add(1, "M").format("LLL");
  }
};
