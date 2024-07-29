import { Future } from "@swan-io/boxed";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeModal } from "@swan-io/shared-business/src/components/LakeModal";
import { useRef, useState } from "react";
import { CompleteAddressInput } from "../graphql/partner";
import { t } from "../utils/i18n";
import {
  Address,
  CardItemPhysicalDeliveryAddressForm,
  CardItemPhysicalDeliveryAddressFormRef,
} from "./CardItemPhysicalDeliveryAddressForm";

type Props = {
  visible: boolean;
  initialAddress: Address | undefined;
  onPressClose: () => void;
  onSubmit: (address: CompleteAddressInput) => Future<unknown>;
};

export const CardItemPhysicalRenewalWizard = ({
  visible,
  initialAddress,
  onPressClose,
  onSubmit,
}: Props) => {
  const [isLoading, setIsLoading] = useState(false);

  const deliveryAddressRef = useRef<CardItemPhysicalDeliveryAddressFormRef>(null);

  return (
    <LakeModal
      visible={visible}
      icon="pin-regular"
      title={t("card.physical.order.shippingAddress")}
    >
      <CardItemPhysicalDeliveryAddressForm
        ref={deliveryAddressRef}
        initialEditorState={initialAddress}
        onSubmit={address => {
          setIsLoading(true);
          return onSubmit(address).tap(() => setIsLoading(false));
        }}
      />

      <LakeButtonGroup paddingBottom={0}>
        <LakeButton onPress={onPressClose} mode="secondary" grow={true}>
          {t("common.back")}
        </LakeButton>

        <LakeButton
          onPress={() => deliveryAddressRef.current?.submit()}
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
