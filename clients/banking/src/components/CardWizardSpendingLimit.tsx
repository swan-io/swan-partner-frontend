import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { breakpoints } from "@swan-io/lake/src/constants/design";
import { Ref } from "react";
import {
  AccountHolderForCardSettingsFragment,
  Amount,
  CardProductFragment,
} from "../graphql/partner";
import { WizardStepRef, useWizardStep } from "../hooks/useWizardStep";
import { t } from "../utils/i18n";
import { deriveSpendingLimitContext, getSpendingLimitAmountError } from "../utils/spendingLimit";
import {
  SpendingLimitForm,
  SpendingLimitFormValue,
  SpendingLimitValidationError,
  SpendingLimitValue,
  validateSpendingLimit,
} from "./CardItemSpendingLimit";

export type CardWizardSpendingLimitRef = WizardStepRef;

type Props = {
  ref?: Ref<CardWizardSpendingLimitRef>;
  cardProduct: CardProductFragment;
  initialSpendingLimit?: SpendingLimitValue;
  accountHolder?: AccountHolderForCardSettingsFragment;
  maxSpendingLimit?: { amount: Amount };
  disabled?: boolean;
  onSubmit: (spendingLimit: SpendingLimitValue) => void;
};

export const CardWizardSpendingLimit = ({
  ref,
  cardProduct,
  accountHolder,
  initialSpendingLimit,
  maxSpendingLimit,
  disabled,
  onSubmit,
}: Props) => {
  const { maxValue, currency } = deriveSpendingLimitContext(
    cardProduct,
    accountHolder,
    maxSpendingLimit,
  );

  const { value, errors, onChange } = useWizardStep<
    SpendingLimitFormValue,
    SpendingLimitValue,
    SpendingLimitValidationError
  >({
    ref,
    initialValue: () =>
      initialSpendingLimit ?? {
        amount: { value: String(maxValue), currency },
        mode: { type: "rolling", rollingValue: 1, period: "Monthly" },
      },
    validate: value => validateSpendingLimit(value, maxValue),
    onSubmit,
  });

  return (
    <ResponsiveContainer breakpoint={breakpoints.medium}>
      {({ large }) => (
        <Tile title={large ? t("card.settings.spendingLimit") : undefined}>
          <SpendingLimitForm
            large={large}
            value={value}
            onChange={onChange}
            disabled={disabled}
            error={getSpendingLimitAmountError(errors, maxValue, currency)}
          />
        </Tile>
      )}
    </ResponsiveContainer>
  );
};
