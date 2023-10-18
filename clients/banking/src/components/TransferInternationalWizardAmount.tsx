import { AsyncData, Result } from "@swan-io/boxed";
import { Box } from "@swan-io/lake/src/components/Box";
import { Fill } from "@swan-io/lake/src/components/Fill";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Separator } from "@swan-io/lake/src/components/Separator";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { colors } from "@swan-io/lake/src/constants/design";
import { useUrqlQuery } from "@swan-io/lake/src/hooks/useUrqlQuery";
import { isNullish } from "@swan-io/lake/src/utils/nullish";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { hasDefinedKeys, useForm } from "react-ux-form";
import { P, match } from "ts-pattern";
import {
  GetAvailableAccountBalanceDocument,
  GetInternationalCreditTransferQuoteDocument,
} from "../graphql/partner";
import { Currency, currencies, formatCurrency, formatNestedMessage, t } from "../utils/i18n";
import { ErrorView } from "./ErrorView";

export type Amount = { value: string; currency: Currency };

const FIXED_AMOUNT_DEFAULT_VALUE = "";
const CURRENCY_DEFAULT_VALUE = "USD";

type Props = {
  initialAmount?: Amount;
  onPressPrevious: () => void;
  onSave: (amount: Amount) => void;
  accountMembershipId: string;
};

export const TransferInternationalWizardAmount = ({
  initialAmount,
  onPressPrevious,
  accountMembershipId,
  onSave,
}: Props) => {
  const [input, setInput] = useState<Amount | undefined>();
  const { data } = useUrqlQuery(
    {
      query: GetAvailableAccountBalanceDocument,
      variables: { accountMembershipId },
    },
    [accountMembershipId],
  );

  const { data: quote } = useUrqlQuery(
    {
      query: GetInternationalCreditTransferQuoteDocument,
      variables: input ?? { value: "", currency: "" },
      pause: !input || input?.value === "0" || Number.isNaN(Number(input?.value)),
    },
    [input],
  );

  const { Field, submitForm, listenFields } = useForm({
    amount: {
      initialValue: initialAmount ?? {
        value: FIXED_AMOUNT_DEFAULT_VALUE,
        currency: CURRENCY_DEFAULT_VALUE,
      },
      sanitize: ({ value, currency }) => ({ value: value.replace(/,/g, "."), currency }),
      validate: ({ value }) => {
        const amount = Number(value);

        if (Number.isNaN(amount) || amount <= 0) {
          return t("error.invalidTransferAmount");
        }
      },
    },
  });

  useEffect(() => {
    return listenFields(
      ["amount"],
      ({
        amount: {
          value: { currency, value },
        },
      }) => setInput(value && value !== "0" ? ({ currency, value } as Amount) : undefined),
    );
  }, [listenFields]);

  return (
    <View>
      <Tile>
        {match(data)
          .with(AsyncData.P.NotAsked, AsyncData.P.Loading, () => (
            <ActivityIndicator color={colors.gray[900]} />
          ))
          .with(AsyncData.P.Done(Result.P.Ok(P.select())), data => {
            const availableBalance = data.accountMembership?.account?.balances?.available;
            return availableBalance != null ? (
              <View>
                <LakeText color={colors.gray[500]} variant="smallRegular">
                  {t("transfer.new.availableBalance")}
                </LakeText>

                <Space height={4} />

                <LakeHeading level={3} variant="h1">
                  {formatCurrency(Number(availableBalance.value), availableBalance.currency)}
                </LakeHeading>

                <Space height={12} />
              </View>
            ) : null;
          })
          .otherwise(() => (
            <ErrorView />
          ))}

        <Space height={24} />

        <LakeLabel
          label={t("transfer.new.internationalTransfer.amount.label")}
          render={id => (
            <Field name="amount">
              {({ value, onChange, onBlur, error, valid, ref }) => (
                <LakeTextInput
                  id={id}
                  ref={ref}
                  value={value.value}
                  error={error}
                  valid={valid}
                  onChangeText={v => {
                    onChange({ currency: value.currency, value: v });
                  }}
                  onBlur={onBlur}
                  units={currencies}
                  unit={value.currency}
                  inputMode="numeric"
                  onUnitChange={c => {
                    onChange({ currency: c as Currency, value: value.value });
                  }}
                />
              )}
            </Field>
          )}
        />

        <Space height={24} />

        {match(quote)
          .with(AsyncData.P.NotAsked, () => null)
          .with(AsyncData.P.Loading, () => (
            <>
              <ActivityIndicator color={colors.gray[900]} />
              <Space height={12} />
            </>
          ))
          .with(
            AsyncData.P.Done(Result.P.Ok(P.select())),
            ({ internationalCreditTransferQuote: q }) => {
              if (isNullish(q)) {
                return null;
              }

              return (
                <>
                  <LakeText color={colors.gray[700]} variant="smallRegular">
                    {formatNestedMessage("transfer.new.internationalTransfer.amount.description", {
                      amount: formatCurrency(Number(q.sourceAmount.value), q.sourceAmount.currency),
                      rate: q.exchangeRate,
                      bold: str => (
                        <LakeText color={colors.gray[900]} variant="smallMedium">
                          {str}
                        </LakeText>
                      ),
                    })}
                  </LakeText>

                  <Space height={12} />

                  <LakeText color={colors.gray[700]} variant="smallRegular">
                    {formatNestedMessage("transfer.new.internationalTransfer.fee", {
                      fee: formatCurrency(Number(q.feesAmount.value), q.feesAmount.currency),
                      bold: str => (
                        <LakeText color={colors.gray[900]} variant="smallMedium">
                          {str}
                        </LakeText>
                      ),
                    })}
                  </LakeText>

                  <Space height={12} />
                  <Separator />
                  <Space height={12} />

                  <LakeText color={colors.gray[700]} variant="smallRegular">
                    {formatNestedMessage("transfer.new.internationalTransfer.amount.converted", {
                      amount: formatCurrency(
                        parseFloat(q.feesAmount.value) + parseFloat(q.sourceAmount.value),
                        q.sourceAmount.currency,
                      ),
                      colored: str => (
                        <LakeText color={colors.current[500]} variant="smallMedium">
                          {str}
                        </LakeText>
                      ),
                    })}
                  </LakeText>
                </>
              );
            },
          )
          .otherwise(() => (
            <ErrorView />
          ))}
      </Tile>

      <Space height={32} />

      <ResponsiveContainer breakpoint={800}>
        {({ small }) => (
          <LakeButtonGroup>
            <LakeButton color="gray" mode="secondary" onPress={onPressPrevious}>
              {t("common.cancel")}
            </LakeButton>

            <LakeButton
              color="current"
              onPress={() =>
                submitForm(values => {
                  if (hasDefinedKeys(values, ["amount"])) {
                    onSave({
                      value: values.amount.value,
                      currency: values.amount.currency as Currency,
                    });
                  }
                })
              }
              grow={small}
            >
              {t("common.continue")}
            </LakeButton>
          </LakeButtonGroup>
        )}
      </ResponsiveContainer>
    </View>
  );
};

type SummaryProps = {
  amount: Amount;
  onPressEdit: () => void;
};

export const TransferInternationamWizardAmountSummary = ({ amount, onPressEdit }: SummaryProps) => {
  return (
    <Tile selected={false}>
      <Box direction="row">
        <View>
          <LakeText color={colors.gray[500]} variant="regular">
            {t("transfer.new.internationalTransfer.amount.summary.title")}
          </LakeText>

          <Space height={8} />

          <LakeHeading level={4} variant="h4">
            {formatCurrency(Number(amount.value), amount.currency)}
          </LakeHeading>
        </View>

        <Fill />

        <LakeButton mode="tertiary" icon="edit-regular" onPress={onPressEdit}>
          {t("common.edit")}
        </LakeButton>
      </Box>
    </Tile>
  );
};
