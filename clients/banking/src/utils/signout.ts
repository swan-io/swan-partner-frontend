import { Request, badStatusToError } from "@swan-io/request";
import { showToast } from "@swan-io/shared-business/src/state/toasts";
import { translateError } from "@swan-io/shared-business/src/utils/i18n";
import { Router } from "./routes";

export const signout = () => {
  Request.make({ url: "/auth/logout", method: "POST", withCredentials: true })
    .mapOkToResult(badStatusToError)
    .tapOk(() => window.location.replace(Router.ProjectLogin()))
    .tapError(error => {
      showToast({ variant: "error", error, title: translateError(error) });
    });
};
