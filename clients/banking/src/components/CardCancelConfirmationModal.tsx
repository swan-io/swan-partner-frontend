import { Result } from "@swan-io/boxed";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeModal } from "@swan-io/lake/src/components/LakeModal";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { Space } from "@swan-io/lake/src/components/Space";
import { colors } from "@swan-io/lake/src/constants/design";
import { useUrqlMutation } from "@swan-io/lake/src/hooks/useUrqlMutation";
import { showToast } from "@swan-io/lake/src/state/toasts";
import { match } from "ts-pattern";
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
        .mapOkToResult(({ cancelCard }) => {
          return match(cancelCard)
            .with({ __typename: "CancelCardSuccessPayload" }, () => Result.Ok(undefined))
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
