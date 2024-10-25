import { useMutation } from "@swan-io/graphql-client";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { Space } from "@swan-io/lake/src/components/Space";
import { colors } from "@swan-io/lake/src/constants/design";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { LakeModal } from "@swan-io/shared-business/src/components/LakeModal";
import { showToast } from "@swan-io/shared-business/src/state/toasts";
import { translateError } from "@swan-io/shared-business/src/utils/i18n";
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
  const [disableMembership, membershipDisabling] = useMutation(DisableAccountMembershipDocument);

  const onPressConfirm = () => {
    if (accountMembershipId != null) {
      disableMembership({ accountMembershipId })
        .mapOk(data => data.disableAccountMembership)
        .mapOkToResult(filterRejectionsToResult)
        .tapOk(() => {
          onSuccess();
        })
        .tapError(error => {
          showToast({ variant: "error", error, title: translateError(error) });
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
