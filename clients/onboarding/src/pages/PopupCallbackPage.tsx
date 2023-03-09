import { isNotNullish } from "@swan-io/lake/src/utils/nullish";
import { useEffect } from "react";
import { dispatchToPopupOpener } from "../states/popup";
import { env } from "../utils/env";

type Props = {
  redirectUrl?: string;
  accountMembershipId?: string;
};

export const PopupCallbackPage = ({ redirectUrl, accountMembershipId }: Props) => {
  useEffect(() => {
    const url = isNotNullish(redirectUrl)
      ? redirectUrl
      : `${env.BANKING_URL}/${accountMembershipId ?? ""}?source=onboarding`;

    if (!dispatchToPopupOpener({ type: "close-popup", redirectUrl: url })) {
      // If we don't manage to close a popup, redirect from there
      window.location.replace(url);
    }
  }, [redirectUrl, accountMembershipId]);

  return null;
};
