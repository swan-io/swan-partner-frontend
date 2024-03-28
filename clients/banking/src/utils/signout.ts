import { showToast } from "@swan-io/lake/src/state/toasts";
import { Request, badStatusToError } from "@swan-io/request";
import { translateError } from "@swan-io/shared-business/src/utils/i18n";
import { logFrontendError } from "./logger";
import { Router } from "./routes";

export const signout = () => {
  Request.make({ url: "/auth/logout", method: "POST", withCredentials: true })
    .mapOkToResult(badStatusToError)
    .tapOk(() => window.location.replace(Router.ProjectLogin()))
    .tapError(error => {
      showToast({ variant: "error", error, title: translateError(error) });
      logFrontendError(error);
    });
};
