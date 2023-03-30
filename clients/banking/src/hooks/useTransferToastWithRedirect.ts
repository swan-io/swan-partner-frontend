import { Option } from "@swan-io/boxed";
import { useFirstMountState } from "@swan-io/lake/src/hooks/useFirstMountState";
import { showToast } from "@swan-io/lake/src/state/toasts";
import { noop } from "@swan-io/lake/src/utils/function";
import { useEffect } from "react";
import { match, P } from "ts-pattern";
import { t } from "../utils/i18n";

export const useTransferToastWithRedirect = (
  transferConsent: Option<{ status: string; isStandingOrder: boolean }>,
  replace: () => void,
) => {
  const isFirstMount = useFirstMountState();

  useEffect(() => {
    if (isFirstMount) {
      const newTransferConsent = transferConsent.toUndefined();

      match(newTransferConsent)
        .with({ status: "Accepted", isStandingOrder: true }, () => {
          showToast({
            variant: "success",
            title: t("recurringTransfer.consent.success.title"),
            description: t("recurringTransfer.consent.success.description"),
            autoClose: false,
          });
        })
        .with({ status: "Accepted", isStandingOrder: false }, () => {
          showToast({
            variant: "success",
            title: t("transfer.consent.success.title"),
            description: t("transfer.consent.success.description"),
            autoClose: false,
          });
        })
        .with({ status: "Canceled", isStandingOrder: true }, () => {
          showToast({
            variant: "error",
            title: t("recurringTransfer.consent.error.canceled.title"),
          });
        })
        .with({ status: "Canceled", isStandingOrder: false }, () => {
          showToast({
            variant: "error",
            title: t("transfer.consent.error.canceled.title"),
          });
        })
        .with({ isStandingOrder: true }, () => {
          showToast({
            variant: "error",
            title: t("recurringTransfer.consent.error.rejected.title"),
            description: t("recurringTransfer.consent.error.rejected.description"),
          });
        })
        .with({ isStandingOrder: false }, () => {
          showToast({
            variant: "error",
            title: t("transfer.consent.error.rejected.title"),
            description: t("transfer.consent.error.rejected.description"),
          });
        })
        .with(P.nullish, noop)
        .exhaustive();

      if (transferConsent.isSome()) {
        replace();
      }
    }
  }, [transferConsent, isFirstMount, replace]);
};
