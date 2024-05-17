import { isNotNullish } from "@swan-io/lake/src/utils/nullish";
import { useEffect } from "react";
import { closePopup } from "../utils/popup";

type Props = {
  redirectUrl?: string;
};

export const PopupCallbackPage = ({ redirectUrl }: Props) => {
  useEffect(() => {
    if (closePopup().isError()) {
      if (isNotNullish(redirectUrl)) {
        window.location.replace(redirectUrl);
      }
    }
  }, [redirectUrl]);

  return null;
};
