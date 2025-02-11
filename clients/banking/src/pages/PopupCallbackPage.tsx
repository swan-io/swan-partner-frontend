import { Option } from "@swan-io/boxed";
import { useEffect } from "react";
import { sendClosePopupMessage } from "../utils/popup";

export const PopupCallbackPage = ({ redirectTo }: { redirectTo: string | undefined }) => {
  useEffect(() => {
    const cleanUrl =
      redirectTo != null
        ? !redirectTo.startsWith("/") || redirectTo.startsWith("//")
          ? null
          : redirectTo
        : null;
    sendClosePopupMessage(Option.fromNullable(cleanUrl));
  }, [redirectTo]);

  return null;
};
