import { Option } from "@swan-io/boxed";
import { useEffect } from "react";
import { sendClosePopupMessage } from "../utils/popup";

export const PopupCallbackPage = () => {
  useEffect(() => {
    sendClosePopupMessage(Option.None());
  }, []);

  return null;
};
