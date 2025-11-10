import { CreditLimitSettingsRequestFragment } from "../graphql/partner";

export const getPendingCreditLimitAmount = (
  creditLimitRequests: CreditLimitSettingsRequestFragment[],
): { value: number; currency: string } => {
  const lastPendingRequest = creditLimitRequests
    .filter(
      request =>
        request.statusInfo.__typename === "CreditLimitSettingsRequestPendingReviewStatusInfo",
    )
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .at(0);

  if (lastPendingRequest == null) {
    return {
      value: 0,
      currency: "EUR",
    };
  }

  return {
    value: Number(lastPendingRequest.amount.value),
    currency: lastPendingRequest.amount.currency,
  };
};

export const getCreditLimitAmount = (
  creditLimitRequests: CreditLimitSettingsRequestFragment[],
): { value: number; currency: string } => {
  const lastApprovedRequest = creditLimitRequests
    .filter(
      request => request.statusInfo.__typename === "CreditLimitSettingsRequestApprovedStatusInfo",
    )
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .at(0);

  if (lastApprovedRequest == null) {
    return {
      value: 0,
      currency: "EUR",
    };
  }

  // Should not happen, but for making TS happy
  const authorizedAmount =
    lastApprovedRequest.statusInfo.__typename === "CreditLimitSettingsRequestApprovedStatusInfo" &&
    lastApprovedRequest.statusInfo.authorizedAmount != null
      ? Number(lastApprovedRequest.statusInfo.authorizedAmount.value)
      : null;

  if (authorizedAmount == null) {
    return {
      value: 0,
      currency: "EUR",
    };
  }

  const requestedAmount = Number(lastApprovedRequest.amount.value);
  const amountValue = Math.min(requestedAmount, authorizedAmount);

  return {
    value: amountValue,
    currency: lastApprovedRequest.amount.currency,
  };
};
