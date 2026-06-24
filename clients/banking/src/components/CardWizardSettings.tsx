import { Result } from "@swan-io/boxed";
import { Ref } from "react";
import { WizardStepRef, useWizardStep } from "../hooks/useWizardStep";
import { CardSettings, CardSettingsFields } from "./CardSettingsFields";

export type CardWizardSettingsRef = WizardStepRef;

type Props = {
  ref?: Ref<CardWizardSettingsRef>;
  initialSettings?: Partial<CardSettings>;
  onSubmit: (cardSettings: CardSettings) => void;
  disabled?: boolean;
};

export const CardWizardSettings = ({ ref, initialSettings, onSubmit, disabled }: Props) => {
  const { value, onChange } = useWizardStep<CardSettings, CardSettings, never>({
    ref,
    initialValue: () => ({
      cardName: initialSettings?.cardName,
      eCommerce: initialSettings?.eCommerce ?? true,
      withdrawal: initialSettings?.withdrawal ?? true,
      international: initialSettings?.international ?? true,
      nonMainCurrencyTransactions: initialSettings?.nonMainCurrencyTransactions ?? true,
    }),
    validate: Result.Ok,
    onSubmit,
  });

  return <CardSettingsFields value={value} onChange={onChange} disabled={disabled} />;
};
