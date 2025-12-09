import { CreditLimitSettingsRequestFragment } from "../graphql/partner";

export const getPendingCreditLimitAmount = (
  creditLimitRequests: CreditLimitSettingsRequestFragment[],
): { value: number; currency: string } => {
  const lastPendingRequest = creditLimitRequests
    .filter(
      request =>
        request.statusInfo.__typename === "CreditLimitSettingsRequestPendingReviewStatusInfo",
    )
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)) // Sort by updatedAt descending
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

export const getRefusedCreditLimitAmount = (
  creditLimitRequests: CreditLimitSettingsRequestFragment[],
): { value: number; currency: string } => {
  const lastRefusedRequest = creditLimitRequests
    .filter(
      request => request.statusInfo.__typename === "CreditLimitSettingsRequestRefusedStatusInfo",
    )
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)) // Sort by updatedAt descending
    .at(0);

  if (lastRefusedRequest == null) {
    return {
      value: 0,
      currency: "EUR",
    };
  }

  return {
    value: Number(lastRefusedRequest.amount.value),
    currency: lastRefusedRequest.amount.currency,
  };
};

export const hasPendingCreditLimitRequest = (
  creditLimitRequests: CreditLimitSettingsRequestFragment[],
): boolean => {
  const lastRequest = creditLimitRequests
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .at(0);

  return lastRequest?.statusInfo.__typename === "CreditLimitSettingsRequestPendingReviewStatusInfo";
};
