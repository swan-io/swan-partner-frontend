import { Result } from "@swan-io/boxed";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { breakpoints } from "@swan-io/lake/src/constants/design";
import { Ref, useImperativeHandle, useState } from "react";
import {
  AccountHolderForCardSettingsFragment,
  Amount,
  CardProductFragment,
} from "../graphql/partner";
import { t } from "../utils/i18n";
import { deriveSpendingLimitContext, getSpendingLimitAmountError } from "../utils/spendingLimit";
import {
  SpendingLimitForm,
  SpendingLimitFormValue,
  SpendingLimitValue,
  narrowSpendingLimitValue,
} from "./CardItemSpendingLimit";

type CardProduct = CardProductFragment;

type ValidationError = "InvalidAmount" | "ExceedsMaxAmount" | "InvalidMode";

export type CardWizardSpendingLimitRef = {
  submit: () => void;
};

type Props = {
  ref?: Ref<CardWizardSpendingLimitRef>;
  cardProduct: CardProduct;
  initialSpendingLimit?: SpendingLimitValue;
  accountHolder?: AccountHolderForCardSettingsFragment;
  maxSpendingLimit?: { amount: Amount };
  disabled?: boolean;
  onSubmit: (spendingLimit: SpendingLimitValue) => void;
};

const validate = (
  value: SpendingLimitFormValue,
  maxValue: number,
): Result<SpendingLimitValue, ValidationError[]> => {
  const numericValue = Number(value.amount.value);
  const errors: ValidationError[] = [];
  if (!(numericValue > 0)) {
    errors.push("InvalidAmount");
  }
  if (numericValue > maxValue) {
    errors.push("ExceedsMaxAmount");
  }
  const narrowed = narrowSpendingLimitValue(value);
  if (narrowed == null) {
    errors.push("InvalidMode");
  }
  if (errors.length > 0) {
    return Result.Error(errors);
  }
  if (narrowed == null) {
    return Result.Error(["InvalidMode"]);
  }
  return Result.Ok(narrowed);
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
  const { maxValue: spendingLimitMaxValue, currency } = deriveSpendingLimitContext(
    cardProduct,
    accountHolder,
    maxSpendingLimit,
  );

  const [spendingLimit, setSpendingLimit] = useState<SpendingLimitFormValue>(
    () =>
      initialSpendingLimit ?? {
        amount: { value: String(spendingLimitMaxValue), currency },
        mode: { type: "rolling", rollingValue: 1, period: "Monthly" },
      },
  );

  const [validation, setValidation] = useState<ValidationError[] | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  useImperativeHandle(
    ref,
    () => ({
      submit: () => {
        setSubmitAttempted(true);
        validate(spendingLimit, spendingLimitMaxValue).match({
          Ok: value => {
            setValidation(null);
            onSubmit(value);
          },
          Error: errors => setValidation(errors),
        });
      },
    }),
    [spendingLimit, spendingLimitMaxValue, onSubmit],
  );

  const onChangeSpendingLimit = (value: SpendingLimitFormValue) => {
    setSpendingLimit(value);
    validate(value, spendingLimitMaxValue).match({
      Ok: () => setValidation(null),
      Error: errors => setValidation(errors),
    });
  };

  const errorMessage = getSpendingLimitAmountError(validation, spendingLimitMaxValue, currency);

  const modeError =
    submitAttempted && validation?.includes("InvalidMode") === true
      ? t("common.form.required")
      : undefined;

  return (
    <ResponsiveContainer breakpoint={breakpoints.medium}>
      {({ large }) => (
        <Tile title={large ? t("card.settings.spendingLimit") : undefined}>
          <SpendingLimitForm
            large={large}
            value={spendingLimit}
            onChange={onChangeSpendingLimit}
            disabled={disabled}
            error={errorMessage}
            modeError={modeError}
          />
        </Tile>
      )}
    </ResponsiveContainer>
  );
};
