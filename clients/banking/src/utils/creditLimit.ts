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
