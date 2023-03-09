import { Tag } from "@swan-io/lake/src/components/Tag";
import { ColorVariants } from "@swan-io/lake/src/constants/design";
import { AccountMembershipStatus } from "../graphql/partner";
import { t } from "../utils/i18n";

type Props = {
  status: AccountMembershipStatus;
};

const membershipStatusColors: Record<AccountMembershipStatus, ColorVariants> = {
  Enabled: "positive",
  Disabled: "gray",
  Suspended: "gray",
  ConsentPending: "warning",
  InvitationSent: "warning",
  BindingUserError: "negative",
};

const membershipStatusTranslations: Record<AccountMembershipStatus, string> = {
  Enabled: t("members.status.enabled"),
  Disabled: t("members.status.disabled"),
  Suspended: t("members.status.suspended"),
  ConsentPending: t("members.status.consentPending"),
  InvitationSent: t("members.status.invitationSent"),
  BindingUserError: t("members.status.bindingUserError"),
};

export const MembershipStatusBadge = ({ status }: Props) => {
  const label = membershipStatusTranslations[status];
  const color = membershipStatusColors[status];

  return <Tag color={color}>{label}</Tag>;
};
