import { isNotNullish } from "@swan-io/lake/src/utils/nullish";
import { useEffect } from "react";
import { match, P } from "ts-pattern";
import { dispatchToPopupOpener } from "../states/popup";
import { env } from "../utils/env";

type Props = {
  redirectUrl?: string;
  accountMembershipId?: string;
  projectId?: string;
};

export const PopupCallbackPage = ({ redirectUrl, accountMembershipId, projectId }: Props) => {
  useEffect(() => {
    const url = isNotNullish(redirectUrl)
      ? redirectUrl
      : match({ accountMembershipId, projectId })
          .with(
            { accountMembershipId: P.string, projectId: P.string },
            ({ accountMembershipId, projectId }) =>
              `${env.BANKING_URL}/projects/${projectId}/${accountMembershipId}/activation`,
          )
          .with(
            { accountMembershipId: P.string },
            ({ accountMembershipId }) => `${env.BANKING_URL}/${accountMembershipId}/activation`,
          )
          .otherwise(() => `${env.BANKING_URL}?source=onboarding`);

    if (!dispatchToPopupOpener({ type: "close-popup", redirectUrl: url })) {
      // If we don't manage to close a popup, redirect from there
      window.location.replace(url);
    }
  }, [redirectUrl, projectId, accountMembershipId]);

  return null;
};
