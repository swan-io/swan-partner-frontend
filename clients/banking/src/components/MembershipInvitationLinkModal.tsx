import { Box } from "@swan-io/lake/src/components/Box";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeModal } from "@swan-io/lake/src/components/LakeModal";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { Space } from "@swan-io/lake/src/components/Space";
import { useQuery } from "urql";
import { MembershipDetailDocument } from "../graphql/partner";
import { getMemberName } from "../utils/accountMembership";
import { t } from "../utils/i18n";
import { CopyTextButton } from "./CopyTextButton";

type Props = {
  accountMembershipId: string | undefined;
  onPressClose: () => void;
};
export const MembershipInvitationLinkModal = ({ accountMembershipId, onPressClose }: Props) => {
  const [{ data }] = useQuery({
    query: MembershipDetailDocument,
    variables: { accountMembershipId: accountMembershipId as string },
    pause: accountMembershipId == null,
  });

  const value = `${__env.CLIENT_BANKING_URL}/api/invitation/${accountMembershipId ?? ""}`;

  const accountMembership = data?.accountMembership;

  return (
    <LakeModal
      visible={accountMembershipId != null}
      onPressClose={onPressClose}
      icon="link-filled"
      title={
        accountMembership == null
          ? t("members.invitationTitle")
          : t("members.invitationTitle.name", {
              fullName: getMemberName({ accountMembership }),
            })
      }
    >
      <LakeLabel
        label={t("members.invitationLink")}
        render={id => {
          return (
            <Box direction="row">
              <LakeTextInput id={id} readOnly={true} value={value} hideErrors={true} />
              <Space width={12} />
              <CopyTextButton value={value} />
            </Box>
          );
        }}
      />
    </LakeModal>
  );
};
