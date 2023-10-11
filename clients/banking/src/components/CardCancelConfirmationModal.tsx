import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { Space } from "@swan-io/lake/src/components/Space";
import { colors } from "@swan-io/lake/src/constants/design";
import { useUrqlMutation } from "@swan-io/lake/src/hooks/useUrqlMutation";
import { showToast } from "@swan-io/lake/src/state/toasts";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/urql";
import { LakeModal } from "@swan-io/shared-business/src/components/LakeModal";
import { translateError } from "@swan-io/shared-business/src/utils/i18n";
import { CancelCardDocument } from "../graphql/partner";
import { t } from "../utils/i18n";

type Props = {
  visible: boolean;
  cardId?: string;
  onSuccess: () => void;
  onPressClose: () => void;
};

export const CardCancelConfirmationModal = ({
  visible,
  cardId,
  onSuccess,
  onPressClose,
}: Props) => {
  const [cardCancelation, cancelCard] = useUrqlMutation(CancelCardDocument);

  const onPressConfirm = () => {
    if (cardId != null) {
      cancelCard({ cardId })
        .mapOk(data => data.cancelCard)
        .mapOkToResult(filterRejectionsToResult)
        .tapOk(() => {
          onSuccess();
        })
        .tapError(error => {
          showToast({ variant: "error", title: translateError(error) });
        });
    }
  };

  return (
    <LakeModal
      icon="subtract-circle-regular"
      onPressClose={onPressClose}
      color="negative"
      visible={visible}
      title={t("card.cancel.title")}
    >
      <LakeText color={colors.gray[600]}>{t("card.cancel.description")}</LakeText>
      <Space height={32} />

      <LakeButton
        disabled={cardId == null}
        color="negative"
        icon="subtract-circle-filled"
        onPress={onPressConfirm}
        loading={cardCancelation.isLoading()}
      >
        {t("card.cancel.cancelCard")}
      </LakeButton>
    </LakeModal>
  );
};
