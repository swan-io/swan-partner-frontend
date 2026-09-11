import { badStatusToError, Request } from "@bloodyowl/request";
import { showToast } from "@swan-io/shared-business/src/state/toasts";
import { translateError } from "@swan-io/shared-business/src/utils/i18n";
import { clearLastActivity } from "./lastActivity";
import { Router } from "./routes";

export const signout = () => {
  Request.make({ url: "/auth/logout", method: "POST", credentials: "include", type: "text" })
    .mapOkToResult(badStatusToError)
    .tapOk(() => {
      clearLastActivity();
      window.location.replace(Router.ProjectLogin());
    })
    .tapError(error => {
      showToast({ variant: "error", error, title: translateError(error) });
    });
};
