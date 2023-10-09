import { showToast } from "@swan-io/lake/src/state/toasts";
import { translateError } from "@swan-io/shared-business/src/utils/i18n";
import { logFrontendError } from "./logger";
import { Router } from "./routes";

export const signout = () => {
  fetch(`/auth/logout`, {
    method: "post",
    credentials: "include",
  })
    .then(async response => {
      if (response.ok) {
        window.location.replace(Router.ProjectLogin());
      } else {
        const message = await response.text();
        throw new Error(message);
      }
    })
    .catch((error: Error) => {
      showToast({ variant: "error", title: translateError(error) });
      logFrontendError(error);
    });
};
