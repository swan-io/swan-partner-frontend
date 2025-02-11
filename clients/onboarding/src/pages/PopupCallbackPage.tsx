import { Option } from "@swan-io/boxed";
import { useEffect } from "react";
import { match, P } from "ts-pattern";
import { env } from "../utils/env";
import { sendClosePopupMessage } from "../utils/popup";

type Props = {
  redirectUrl?: string;
  accountMembershipId?: string;
  projectId?: string;
};

export const PopupCallbackPage = ({ redirectUrl, accountMembershipId, projectId }: Props) => {
  useEffect(() => {
    const fallbackUrl = match({ accountMembershipId, projectId })
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

    const cleanUrl =
      redirectUrl == null
        ? fallbackUrl
        : !redirectUrl.startsWith("/") || redirectUrl.startsWith("//")
          ? fallbackUrl
          : redirectUrl;

    sendClosePopupMessage(Option.Some(cleanUrl)).tapError(() => {
      // If we don't manage to close a popup, redirect from there
      window.location.replace(cleanUrl);
    });
  }, [redirectUrl, projectId, accountMembershipId]);

  return null;
};
