import { Option } from "@swan-io/boxed";
import { useDeferredQuery } from "@swan-io/graphql-client";
import { Box } from "@swan-io/lake/src/components/Box";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { Space } from "@swan-io/lake/src/components/Space";
import { LakeModal } from "@swan-io/shared-business/src/components/LakeModal";
import { useEffect } from "react";
import { P, match } from "ts-pattern";
import { MembershipDetailDocument } from "../graphql/partner";
import { getMemberName } from "../utils/accountMembership";
import { t } from "../utils/i18n";
import { projectConfiguration } from "../utils/projectId";
import { CopyTextButton } from "./CopyTextButton";

type Props = {
  accountMembershipId: string | undefined;
  onPressClose: () => void;
};
export const MembershipInvitationLinkModal = ({ accountMembershipId, onPressClose }: Props) => {
  const [data, { query }] = useDeferredQuery(MembershipDetailDocument);

  useEffect(() => {
    if (accountMembershipId != null) {
      const request = query({ accountMembershipId });
      return () => request.cancel();
    }
  }, [accountMembershipId, query]);

  const value = match(projectConfiguration)
    .with(
      Option.P.Some({ projectId: P.select(), mode: "MultiProject" }),
      projectId =>
        `${__env.BANKING_URL}/api/projects/${projectId}/invitation/${accountMembershipId ?? ""}`,
    )
    .otherwise(() => `${__env.BANKING_URL}/api/invitation/${accountMembershipId ?? ""}`);

  return (
    <LakeModal
      visible={accountMembershipId != null}
      onPressClose={onPressClose}
      icon="link-filled"
      title={data
        .toOption()
        .flatMap(result => result.toOption())
        .flatMap(data => Option.fromNullable(data.accountMembership))
        .map(accountMembership =>
          t("members.invitationTitle.name", {
            fullName: getMemberName({ accountMembership }),
          }),
        )
        .getWithDefault(t("members.invitationTitle"))}
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
