import { AsyncData, Option, Result } from "@swan-io/boxed";
import { useDeferredQuery } from "@swan-io/graphql-client";
import { Box } from "@swan-io/lake/src/components/Box";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { LoadingView } from "@swan-io/lake/src/components/LoadingView";
import { Space } from "@swan-io/lake/src/components/Space";
import { LakeModal } from "@swan-io/shared-business/src/components/LakeModal";
import { useEffect } from "react";
import { P, match } from "ts-pattern";
import { MembershipDetailDocument } from "../graphql/partner";
import { getMemberName } from "../utils/accountMembership";
import { t } from "../utils/i18n";
import { projectConfiguration } from "../utils/projectId";
import { CopyTextButton } from "./CopyTextButton";
import { ErrorView } from "./ErrorView";

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
        .getOr(t("members.invitationTitle"))}
    >
      {match(data)
        .with(AsyncData.P.NotAsked, AsyncData.P.Loading, () => <LoadingView />)
        .with(AsyncData.P.Done(Result.P.Error(P.select())), error => <ErrorView error={error} />)
        .with(AsyncData.P.Done(Result.P.Ok(P.select())), ({ accountMembership }) => {
          const value = match(projectConfiguration)
            .with(
              Option.P.Some({ projectId: P.select(), mode: "MultiProject" }),
              projectId =>
                `${__env.BANKING_URL}/api/projects/${projectId}/invitation/${accountMembershipId ?? ""}`,
            )
            .otherwise(() => `${__env.BANKING_URL}/api/invitation/${accountMembershipId ?? ""}`);

          const url = new URL(value);
          url.searchParams.append("identificationLevel", "Auto");
          match(accountMembership?.statusInfo)
            .with(
              {
                __typename: P.union(
                  "AccountMembershipBindingUserErrorStatusInfo",
                  "AccountMembershipInvitationSentStatusInfo",
                ),
              },
              ({ restrictedTo }) => {
                if (restrictedTo.phoneNumber == null && accountMembership?.email != null) {
                  url.searchParams.append("email", accountMembership.email);
                }
              },
            )
            .otherwise(() => {});

          const urlAsString = url.toString();

          return (
            <LakeLabel
              label={t("members.invitationLink")}
              render={id => {
                return (
                  <Box direction="row">
                    <LakeTextInput id={id} readOnly={true} value={urlAsString} hideErrors={true} />
                    <Space width={12} />
                    <CopyTextButton value={urlAsString} />
                  </Box>
                );
              }}
            />
          );
        })
        .exhaustive()}
    </LakeModal>
  );
};
