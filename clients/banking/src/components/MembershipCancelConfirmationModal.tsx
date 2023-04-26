import { Result } from "@swan-io/boxed";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeModal } from "@swan-io/lake/src/components/LakeModal";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { Space } from "@swan-io/lake/src/components/Space";
import { colors } from "@swan-io/lake/src/constants/design";
import { useUrqlMutation } from "@swan-io/lake/src/hooks/useUrqlMutation";
import { showToast } from "@swan-io/lake/src/state/toasts";
import { match } from "ts-pattern";
import { DisableAccountMembershipDocument } from "../graphql/partner";
import { t } from "../utils/i18n";

type Props = {
  visible: boolean;
  accountMembershipId?: string;
  onSuccess: () => void;
  onPressClose: () => void;
};

export const MembershipCancelConfirmationModal = ({
  visible,
  accountMembershipId,
  onSuccess,
  onPressClose,
}: Props) => {
  const [membershipDisabling, disableMembership] = useUrqlMutation(
    DisableAccountMembershipDocument,
  );

  const onPressConfirm = () => {
    if (accountMembershipId != null) {
      disableMembership({ accountMembershipId })
        .mapOkToResult(({ disableAccountMembership }) => {
          return match(disableAccountMembership)
            .with({ __typename: "DisableAccountMembershipSuccessPayload" }, () =>
              Result.Ok(undefined),
            )
            .otherwise(error => Result.Error(error));
        })
        .tapOk(() => {
          onSuccess();
        })
        .tapError(() => {
          showToast({ variant: "error", title: t("error.generic") });
        });
    }
  };

  return (
    <LakeModal
      icon="subtract-circle-regular"
      onPressClose={onPressClose}
      color="negative"
      visible={visible}
      title={t("membership.cancel.title")}
    >
      <LakeText color={colors.gray[600]}>{t("membership.cancel.description")}</LakeText>
      <Space height={32} />

      <LakeButton
        disabled={accountMembershipId == null}
        color="negative"
        icon="subtract-circle-filled"
        onPress={onPressConfirm}
        loading={membershipDisabling.isLoading()}
      >
        {t("membership.cancel.blockPermanently")}
      </LakeButton>
    </LakeModal>
  );
};
