import { isNotEmpty } from "@swan-io/lake/src/utils/nullish";
import { match } from "ts-pattern";

type AccountMembership = {
  statusInfo:
    | {
        __typename: "AccountMembershipBindingUserErrorStatusInfo";
        restrictedTo: { __typename: "RestrictedTo"; firstName: string; lastName: string };
      }
    | { __typename: "AccountMembershipConsentPendingStatusInfo" }
    | { __typename: "AccountMembershipDisabledStatusInfo" }
    | { __typename: "AccountMembershipEnabledStatusInfo" }
    | {
        __typename: "AccountMembershipInvitationSentStatusInfo";
        restrictedTo: { __typename: "RestrictedTo"; firstName: string; lastName: string };
      }
    | { __typename: "AccountMembershipSuspendedStatusInfo" };
  user?: {
    fullName?: string | null;
  } | null;
};

export const getMemberName = ({ accountMembership }: { accountMembership: AccountMembership }) => {
  return match(accountMembership.statusInfo)
    .with(
      { __typename: "AccountMembershipBindingUserErrorStatusInfo" },
      { __typename: "AccountMembershipInvitationSentStatusInfo" },
      ({ restrictedTo }) =>
        [restrictedTo.firstName, restrictedTo.lastName].filter(isNotEmpty).join(" "),
    )
    .otherwise(() => accountMembership.user?.fullName ?? "");
};
