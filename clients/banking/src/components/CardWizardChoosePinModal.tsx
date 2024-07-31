import { Future } from "@swan-io/boxed";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeModal } from "@swan-io/shared-business/src/components/LakeModal";
import { useRef, useState } from "react";
import { t } from "../utils/i18n";
import { CardItemPhysicalChoosePinForm, EditorState } from "./CardItemPhysicalChoosePinForm";
import { CardItemPhysicalDeliveryAddressFormRef } from "./CardItemPhysicalDeliveryAddressForm";

type Props = {
  visible: boolean;
  onPressClose: () => void;
  onSubmit: (editorState: EditorState) => Future<unknown>;
};

export const CardWizardChoosePinModal = ({ visible, onPressClose, onSubmit }: Props) => {
  const [isLoading, setIsLoading] = useState(false);

  const choosePinRef = useRef<CardItemPhysicalDeliveryAddressFormRef>(null);

  return (
    <LakeModal visible={visible} icon="pin-regular" title={t("card.physicalCard.choosePin.title")}>
      <CardItemPhysicalChoosePinForm
        ref={choosePinRef}
        onSubmit={editorState => {
          setIsLoading(true);
          void onSubmit(editorState).tap(() => setIsLoading(false));
        }}
      />

      <LakeButtonGroup paddingBottom={0}>
        <LakeButton onPress={onPressClose} mode="secondary" grow={true}>
          {t("common.back")}
        </LakeButton>

        <LakeButton
          onPress={() => choosePinRef.current?.submit()}
          color="partner"
          grow={true}
          loading={isLoading}
        >
          {t("common.confirm")}
        </LakeButton>
      </LakeButtonGroup>
    </LakeModal>
  );
};
