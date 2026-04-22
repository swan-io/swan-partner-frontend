import { Result } from "@swan-io/boxed";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { breakpoints } from "@swan-io/lake/src/constants/design";
import { isNullish } from "@swan-io/lake/src/utils/nullish";
import { Ref, useImperativeHandle, useState } from "react";
import { match, P } from "ts-pattern";
import {
  AccountHolderForCardSettingsFragment,
  Amount,
  CardProductFragment,
} from "../graphql/partner";
import { t } from "../utils/i18n";
import { SpendingLimitForm, SpendingLimitValue } from "./CardItemSpendingLimit";

type CardProduct = CardProductFragment;

type ValidationError = "InvalidAmount";

export type CardWizardSpendingLimitRef = {
  submit: () => void;
};

type Props = {
  ref?: Ref<CardWizardSpendingLimitRef>;
  cardProduct: CardProduct;
  initialSpendingLimit?: SpendingLimitValue;
  accountHolder?: AccountHolderForCardSettingsFragment;
  maxSpendingLimit?: { amount: Amount };
  onSubmit: (spendingLimit: SpendingLimitValue) => void;
};

const validate = (value: SpendingLimitValue): Result<SpendingLimitValue, ValidationError[]> => {
  const errors: ValidationError[] = [];
  if (isNullish(value.amount.value)) {
    errors.push("InvalidAmount");
  }
  return errors.length > 0 ? Result.Error(errors) : Result.Ok(value);
};

export const CardWizardSpendingLimit = ({
  ref,
  cardProduct,
  accountHolder,
  initialSpendingLimit,
  maxSpendingLimit,
  onSubmit,
}: Props) => {
  const spendingLimitMaxValue = match({
    accountHolderType: accountHolder?.info.__typename,
    maxSpendingLimit,
  })
    .with({ maxSpendingLimit: P.nonNullable }, ({ maxSpendingLimit }) =>
      Number(maxSpendingLimit.amount.value),
    )
    .with({ accountHolderType: "AccountHolderIndividualInfo" }, () =>
      Number(cardProduct.individualSpendingLimit.amount.value),
    )
    .otherwise(() => Number(cardProduct.companySpendingLimit.amount.value));

  const currency = match(accountHolder?.info.__typename)
    .with("AccountHolderIndividualInfo", () => cardProduct.individualSpendingLimit.amount.currency)
    .otherwise(() => cardProduct.companySpendingLimit.amount.currency);

  const [spendingLimit, setSpendingLimit] = useState<SpendingLimitValue>(
    () =>
      initialSpendingLimit ?? {
        amount: { value: String(spendingLimitMaxValue), currency },
        mode: { type: "rolling", rollingValue: 1, period: "Monthly" },
      },
  );

  useImperativeHandle(
    ref,
    () => ({
      submit: () => {
        validate(spendingLimit).match({
          Ok: value => onSubmit(value),
          Error: () => {},
        });
      },
    }),
    [spendingLimit, onSubmit],
  );

  return (
    <ResponsiveContainer breakpoint={breakpoints.medium}>
      {({ large }) => (
        <Tile title={large ? t("card.settings.spendingLimit") : undefined}>
          <SpendingLimitForm
            large={large}
            value={spendingLimit}
            maxValue={spendingLimitMaxValue}
            onChange={setSpendingLimit}
          />
        </Tile>
      )}
    </ResponsiveContainer>
  );
};
