import { Option } from "@swan-io/boxed";
import { useEffect } from "react";
import { sendClosePopupMessage } from "../utils/popup";

export const PopupCallbackPage = ({ redirectTo }: { redirectTo: string | undefined }) => {
  useEffect(() => {
    sendClosePopupMessage(Option.fromNullable(redirectTo));
  }, [redirectTo]);

  return null;
};
