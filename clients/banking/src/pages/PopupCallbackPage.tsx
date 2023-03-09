import { isNotNullish } from "@swan-io/lake/src/utils/nullish";
import { useEffect } from "react";
import { dispatchToPopupOpener } from "../states/popup";

type Props = {
  redirectUrl?: string;
};

export const PopupCallbackPage = ({ redirectUrl }: Props) => {
  useEffect(() => {
    if (!dispatchToPopupOpener({ type: "close-popup" })) {
      if (isNotNullish(redirectUrl)) {
        window.location.replace(redirectUrl);
      }
    }
  }, [redirectUrl]);

  return null;
};
