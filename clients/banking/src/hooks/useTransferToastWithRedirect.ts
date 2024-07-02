import { Option } from "@swan-io/boxed";
import { useFirstMountState } from "@swan-io/lake/src/hooks/useFirstMountState";
import { showToast } from "@swan-io/lake/src/state/toasts";
import { noop } from "@swan-io/lake/src/utils/function";
import { useEffect } from "react";
import { match, P } from "ts-pattern";
import { t } from "../utils/i18n";

export const useTransferToastWithRedirect = (
  transferConsent: Option<{ kind: "transfer" | "standingOrder" | "beneficiary"; status: string }>,
  replace: () => void,
) => {
  const isFirstMount = useFirstMountState();

  useEffect(() => {
    if (isFirstMount) {
      const newTransferConsent = transferConsent.toUndefined();

      match(newTransferConsent)
        .with({ kind: "transfer", status: "Accepted" }, () => {
          showToast({
            variant: "success",
            autoClose: false,
            title: t("transfer.consent.success.title"),
            description: t("transfer.consent.success.description"),
          });
        })
        .with({ kind: "transfer", status: "Canceled" }, () => {
          showToast({
            variant: "error",
            title: t("transfer.consent.error.canceled.title"),
          });
        })
        .with({ kind: "transfer" }, () => {
          showToast({
            variant: "error",
            title: t("transfer.consent.error.rejected.title"),
            description: t("transfer.consent.error.rejected.description"),
          });
        })
        .with({ kind: "standingOrder", status: "Accepted" }, () => {
          showToast({
            variant: "success",
            autoClose: false,
            title: t("recurringTransfer.consent.success.title"),
            description: t("recurringTransfer.consent.success.description"),
          });
        })
        .with({ kind: "standingOrder", status: "Canceled" }, () => {
          showToast({
            variant: "error",
            title: t("recurringTransfer.consent.error.canceled.title"),
          });
        })
        .with({ kind: "standingOrder" }, () => {
          showToast({
            variant: "error",
            title: t("recurringTransfer.consent.error.rejected.title"),
            description: t("recurringTransfer.consent.error.rejected.description"),
          });
        })
        .with({ kind: "beneficiary", status: "Accepted" }, () => {
          showToast({
            variant: "success",
            autoClose: false,
            title: t("beneficiary.consent.success.title"),
            description: t("beneficiary.consent.success.description"),
          });
        })
        .with({ kind: "beneficiary", status: "Canceled" }, () => {
          showToast({
            variant: "error",
            title: t("beneficiary.consent.error.canceled.title"),
          });
        })
        .with({ kind: "beneficiary" }, () => {
          showToast({
            variant: "error",
            title: t("beneficiary.consent.error.rejected.title"),
            description: t("beneficiary.consent.error.rejected.description"),
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
