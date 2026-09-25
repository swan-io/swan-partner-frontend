import { isNotEmpty } from "@swan-io/lake/src/utils/nullish";
import { CountryCCA3 } from "@swan-io/shared-business/src/constants/countries";
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

// Germany is deliberately absent: a tax ID is optional for German memberships
export const isMembershipTaxIdRequired = ({
  accountCountry,
  residencyCountry,
  canInitiatePayments,
}: {
  accountCountry: CountryCCA3;
  residencyCountry: CountryCCA3;
  canInitiatePayments: boolean;
}) =>
  match({ accountCountry, residencyCountry, canInitiatePayments })
    .with({ accountCountry: "ITA", residencyCountry: "ITA", canInitiatePayments: true }, () => true)
    .otherwise(() => false);

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
