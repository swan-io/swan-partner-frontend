import { Future } from "@swan-io/boxed";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { Space } from "@swan-io/lake/src/components/Space";
import { StepDots } from "@swan-io/lake/src/components/StepDots";
import { LakeModal } from "@swan-io/shared-business/src/components/LakeModal";
import { useRef, useState } from "react";
import { match } from "ts-pattern";
import { CompleteAddressInput } from "../graphql/partner";
import { t } from "../utils/i18n";
import {
  CardItemPhysicalChoosePinForm,
  CardItemPhysicalChoosePinFormRef,
} from "./CardItemPhysicalChoosePinForm";
import {
  Address,
  CardItemPhysicalDeliveryAddressForm,
  CardItemPhysicalDeliveryAddressFormRef,
} from "./CardItemPhysicalDeliveryAddressForm";

type ChoosePinStep = { name: "ChoosePin" };
type AddressStep = { name: "Address"; choosePin: boolean };

type Step = ChoosePinStep | AddressStep;

type Props = {
  visible: boolean;
  initialAddress: Address | undefined;
  onPressClose: () => void;
  onSubmit: (args: { choosePin: boolean; address: CompleteAddressInput }) => Future<unknown>;
};

const formSteps = ["ChoosePin" as const, "Address" as const];

export const CardItemPhysicalDeliveryWizard = ({
  visible,
  initialAddress,
  onPressClose,
  onSubmit,
}: Props) => {
  const [isLoading, setIsLoading] = useState(false);

  const choosePinRef = useRef<CardItemPhysicalChoosePinFormRef>(null);
  const deliveryAddressRef = useRef<CardItemPhysicalDeliveryAddressFormRef>(null);

  const [step, setStep] = useState<Step>({ name: "ChoosePin" });

  return (
    <LakeModal
      visible={visible}
      icon={step.name === "ChoosePin" ? "key-regular" : "pin-regular"}
      title={
        step.name === "ChoosePin"
          ? t("card.physicalCard.choosePin.title")
          : t("card.physical.order.shippingAddress")
      }
    >
      {match(step)
        .with({ name: "ChoosePin" }, () => (
          <CardItemPhysicalChoosePinForm
            ref={choosePinRef}
            onSubmit={({ choosePin }) => setStep({ name: "Address", choosePin })}
          />
        ))
        .with({ name: "Address" }, ({ choosePin }) => (
          <CardItemPhysicalDeliveryAddressForm
            ref={deliveryAddressRef}
            initialEditorState={initialAddress}
            onSubmit={address => {
              setIsLoading(true);
              return onSubmit({ choosePin, address }).tap(() => setIsLoading(false));
            }}
          />
        ))
        .exhaustive()}

      <Space height={12} />
      <StepDots currentStep={step.name} steps={formSteps} />
      <Space height={12} />

      <LakeButtonGroup paddingBottom={0}>
        <LakeButton
          onPress={() => {
            match(step)
              .with({ name: "ChoosePin" }, () => onPressClose())
              .with({ name: "Address" }, () => {
                setStep({ name: "ChoosePin" });
              })
              .exhaustive();
          }}
          mode="secondary"
          grow={true}
        >
          {match(step)
            .with({ name: "Address" }, () => t("common.back"))
            .otherwise(() => t("common.cancel"))}
        </LakeButton>

        <LakeButton
          onPress={() =>
            match(step)
              .with({ name: "ChoosePin" }, () => choosePinRef.current?.submit())
              .with({ name: "Address" }, () => deliveryAddressRef.current?.submit())
              .exhaustive()
          }
          color="partner"
          grow={true}
          loading={isLoading}
        >
          {match(step)
            .with({ name: "ChoosePin" }, () => t("common.next"))
            .otherwise(() => t("common.confirm"))}
        </LakeButton>
      </LakeButtonGroup>
    </LakeModal>
  );
};
