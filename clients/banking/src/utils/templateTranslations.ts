import { P, match } from "ts-pattern";
import { FeesTypeEnum, RejectedReasonCode } from "../graphql/partner";
import { isTranslationKey, t } from "./i18n";

export const getWiseIctLabel = (key: string) =>
  match(`transactionDetail.internationalCreditTransfer.${key}`)
    .with(P.when(isTranslationKey), key => t(key))
    .otherwise(() => key);

export const getTransactionRejectedReasonLabel = (reason: RejectedReasonCode) => {
  try {
    return match(`transactionRejectedReason.${reason}`)
      .with(P.when(isTranslationKey), key => t(key))
      .exhaustive();
  } catch {
    return;
  }
};

export const getInstantTransferFallbackReasonLabel = (reason: RejectedReasonCode) => {
  return match(`instantTransferFallbackReason.${reason}`)
    .with(P.when(isTranslationKey), key => t(key))
    .otherwise(() => t("transaction.instantTransferUnavailable.description"));
};

export const getFeesDescription = (fees: Exclude<FeesTypeEnum, "BankingFee">) => {
  try {
    return match(`transaction.fees.description.${fees}`)
      .with(P.when(isTranslationKey), key => t(key))
      .exhaustive();
  } catch {
    return;
  }
};

export const getInternationalTransferFormRouteLabel = (route: string) => {
  const key = `transfer.new.internationalTransfer.route.${route}`;

  return match(key)
    .with(P.when(isTranslationKey), key => t(key))
    .otherwise(() => route);
};
