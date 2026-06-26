import { Ref } from "react";
import {
  AccountHolderForCardSettingsFragment,
  Amount,
  CardProductFragment,
} from "../graphql/partner";
import { WizardStepRef, useWizardStep } from "../hooks/useWizardStep";
import {
  SingleUseSpendingLimitValue,
  validateSingleUseSpendingLimit,
} from "../utils/singleUseSpendingLimit";
import {
  SpendingLimitAmountError,
  deriveSpendingLimitContext,
  getSpendingLimitAmountError,
} from "../utils/spendingLimit";
import {
  SingleUseSpendingLimitFields,
  SingleUseSpendingLimitFieldsValue,
} from "./SingleUseSpendingLimitFields";

export type CardWizardSingleUseSpendingLimitRef = WizardStepRef;

type SingleUseSubmitValue = { spendingLimit: SingleUseSpendingLimitValue; cardName?: string };

type Props = {
  ref?: Ref<CardWizardSingleUseSpendingLimitRef>;
  cardProduct: CardProductFragment;
  accountHolder?: AccountHolderForCardSettingsFragment;
  maxSpendingLimit?: { amount: Amount };
  initialSpendingLimit?: SingleUseSpendingLimitValue;
  initialCardName?: string;
  disabled?: boolean;
  canEditPeriodicity?: boolean;
  onSubmit: (value: SingleUseSubmitValue) => void;
};

export const CardWizardSingleUseSpendingLimit = ({
  ref,
  cardProduct,
  accountHolder,
  maxSpendingLimit,
  initialSpendingLimit,
  initialCardName,
  disabled,
  canEditPeriodicity,
  onSubmit,
}: Props) => {
  const { maxValue, currency } = deriveSpendingLimitContext(
    cardProduct,
    accountHolder,
    maxSpendingLimit,
  );

  const { value, errors, onChange } = useWizardStep<
    SingleUseSpendingLimitFieldsValue,
    SingleUseSubmitValue,
    SpendingLimitAmountError
  >({
    ref,
    initialValue: () => ({
      spendingLimit: initialSpendingLimit ?? {
        amount: { value: String(maxValue), currency },
        period: "Always",
      },
      cardName: initialCardName,
    }),
    validate: ({ spendingLimit, cardName }) =>
      validateSingleUseSpendingLimit(spendingLimit, maxValue).map(validated => ({
        spendingLimit: validated,
        cardName,
      })),
    onSubmit,
    revalidateOnChange: "whenInvalid",
  });

  return (
    <SingleUseSpendingLimitFields
      value={value}
      onChange={onChange}
      error={getSpendingLimitAmountError(errors, maxValue, currency)}
      canEditPeriodicity={canEditPeriodicity}
      disabled={disabled}
    />
  );
};
