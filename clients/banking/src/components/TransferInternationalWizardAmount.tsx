import { AsyncData, Result } from "@swan-io/boxed";
import { Box } from "@swan-io/lake/src/components/Box";
import { Fill } from "@swan-io/lake/src/components/Fill";
import { LakeAlert } from "@swan-io/lake/src/components/LakeAlert";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Separator } from "@swan-io/lake/src/components/Separator";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { colors, radii } from "@swan-io/lake/src/constants/design";
import { useUrqlQuery } from "@swan-io/lake/src/hooks/useUrqlQuery";
import { isNotNullish } from "@swan-io/lake/src/utils/nullish";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { hasDefinedKeys, useForm } from "react-ux-form";
import { P, match } from "ts-pattern";
import {
  GetAvailableAccountBalanceDocument,
  GetInternationalCreditTransferQuoteDocument,
  GetInternationalCreditTransferQuoteQuery,
} from "../graphql/partner";
import { Currency, currencies, formatCurrency, formatNestedMessage, t } from "../utils/i18n";
import { isCombinedError } from "../utils/urql";
import { ErrorView } from "./ErrorView";

const styles = StyleSheet.create({
  placeholder: {
    height: 14,
    width: "50px",
    backgroundColor: colors.gray[200],
    borderRadius: radii[6],
    display: "inline-block",
    verticalAlign: "middle",
    animationDuration: "2000ms",
    animationTimingFunction: "linear",
    animationIterationCount: "infinite",
    animationKeyframes: {
      "50%": {
        opacity: 0.6,
      },
    },
  },
});

export type Amount = {
  value: string;
  currency: Currency;
};

const FIXED_AMOUNT_DEFAULT_VALUE = "";
const CURRENCY_DEFAULT_VALUE = "USD";

type Props = {
  initialAmount?: Amount;
  onPressPrevious: () => void;
  onSave: (amount: Amount) => void;
  accountMembershipId: string;
  accountId: string;
};

export const TransferInternationalWizardAmount = ({
  initialAmount,
  onPressPrevious,
  accountMembershipId,
  accountId,
  onSave,
}: Props) => {
  const [input, setInput] = useState<Amount | undefined>();
  const { data: balance } = useUrqlQuery(
    {
      query: GetAvailableAccountBalanceDocument,
      variables: { accountMembershipId },
    },
    [accountMembershipId],
  );

  const { data: quote } = useUrqlQuery(
    {
      query: GetInternationalCreditTransferQuoteDocument,
      variables: { accountId, ...(input ?? { value: "", currency: "" }) },
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

  const errors = match(quote)
    .with(AsyncData.P.Done(Result.P.Error(P.select())), error => {
      if (isCombinedError(error)) {
        return match(error)
          .with(
            {
              graphQLErrors: P.array({
                extensions: {
                  code: "QuoteValidationError",
                  meta: {
                    fields: P.array({ message: P.select(P.string) }),
                  },
                },
              }),
            },
            ([messages]) => messages ?? [],
          )
          .otherwise(() => []);
      }
      return [];
    })
    .otherwise(() => []);

  const metadata = match(quote)
    .with(
      AsyncData.P.Done(Result.P.Ok({ internationalCreditTransferQuote: P.select(P.nonNullable) })),
      quote => ({
        rate: quote.exchangeRate,
        total: quote.sourceAmount as Amount,
        out: {
          value: `${parseFloat(quote.feesAmount.value) + parseFloat(quote.sourceAmount.value)}`,
          currency: quote.sourceAmount.currency,
        } as Amount,
      }),
    )
    .otherwise(() => undefined);

  return (
    <View>
      <Tile
        footer={match(errors)
          .with([], () => null)
          .with([P.select()], error => <LakeAlert anchored={true} variant="error" title={error} />)
          .otherwise(errors => (
            <LakeAlert
              anchored={true}
              variant="error"
              title={t("transfer.new.internationalTransfer.errors.title")}
            >
              {errors.map((message, index) => (
                <LakeText key={`validation-alert-${index}`}>{message}</LakeText>
              ))}
            </LakeAlert>
          ))}
      >
        {match(balance)
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
          .with(AsyncData.P.Done(Result.P.Error(P.select())), error => <ErrorView error={error} />)
          .otherwise(() => (
            <ErrorView />
          ))}

        <Space height={24} />

        <LakeLabel
          label={t("transfer.new.internationalTransfer.amount.label")}
          render={id => (
            <Field name="amount">
              {({ value: { value, currency }, onChange, onBlur, error, valid, ref }) => (
                <LakeTextInput
                  id={id}
                  ref={ref}
                  value={value}
                  error={error}
                  valid={valid}
                  onChangeText={nextValue => {
                    onChange({ currency, value: nextValue.replace(/,/g, ".") });
                  }}
                  onBlur={onBlur}
                  units={currencies.toSorted() as unknown as string[]}
                  unit={currency}
                  inputMode="numeric"
                  onUnitChange={nextCurrency => {
                    onChange({ currency: nextCurrency as Currency, value });
                  }}
                />
              )}
            </Field>
          )}
        />

        <Space height={24} />

        {errors.length > 0
          ? null
          : match(quote)
              .with(AsyncData.P.NotAsked, () => null)
              .with(AsyncData.P.Loading, () => <QuoteDetailsPlaceholder />)
              .with(
                AsyncData.P.Done(
                  Result.P.Ok({ internationalCreditTransferQuote: P.select(P.nonNullable) }),
                ),
                quote => <QuoteDetails quote={quote} />,
              )
              .with(AsyncData.P.Done(Result.P.Error(P.select())), error => (
                <ErrorView error={error} />
              ))
              .otherwise(() => <ErrorView />)}
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
                errors?.length === 0 &&
                submitForm(values => {
                  if (hasDefinedKeys(values, ["amount"]) && isNotNullish(metadata)) {
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
  isMobile: boolean;
  onPressEdit: () => void;
};

export const TransferInternationamWizardAmountSummary = ({
  isMobile,
  amount,
  onPressEdit,
}: SummaryProps) => {
  return (
    <Tile selected={false}>
      <Box direction="row">
        <View>
          <LakeText color={colors.gray[500]} variant="regular">
            {t("transfer.new.details.summaryTitle")}
          </LakeText>

          <Space height={8} />

          <LakeHeading level={4} variant="h4">
            {formatCurrency(Number(amount.value), amount.currency)}
          </LakeHeading>
        </View>

        <Fill />

        <LakeButton
          mode="tertiary"
          icon="edit-regular"
          ariaLabel={t("common.edit")}
          onPress={onPressEdit}
        >
          {isMobile ? null : t("common.edit")}
        </LakeButton>
      </Box>
    </Tile>
  );
};

const QuoteDetails = ({
  quote,
}: {
  quote: NonNullable<GetInternationalCreditTransferQuoteQuery["internationalCreditTransferQuote"]>;
}) => {
  return (
    <>
      <LakeText color={colors.gray[700]} variant="smallRegular">
        {formatNestedMessage("transfer.new.internationalTransfer.amount.description", {
          amount: formatCurrency(Number(quote.sourceAmount.value), quote.sourceAmount.currency),
          rate: quote.exchangeRate,
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
          fee: formatCurrency(Number(quote.feesAmount.value), quote.feesAmount.currency),
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
            parseFloat(quote.feesAmount.value) + parseFloat(quote.sourceAmount.value),
            quote.sourceAmount.currency,
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
};

const Placeholder = () => <View style={styles.placeholder} />;

const QuoteDetailsPlaceholder = () => (
  <>
    <LakeText color={colors.gray[700]} variant="smallRegular">
      {formatNestedMessage("transfer.new.internationalTransfer.amount.description", {
        amount: "",
        rate: <Placeholder />,
        bold: () => <Placeholder />,
      })}
    </LakeText>

    <Space height={12} />

    <LakeText color={colors.gray[700]} variant="smallRegular">
      {formatNestedMessage("transfer.new.internationalTransfer.fee", {
        fee: "",
        bold: () => <Placeholder />,
      })}
    </LakeText>

    <Space height={12} />
    <Separator />
    <Space height={12} />

    <LakeText color={colors.gray[700]} variant="smallRegular">
      {formatNestedMessage("transfer.new.internationalTransfer.amount.converted", {
        amount: "",
        colored: () => <Placeholder />,
      })}
    </LakeText>
  </>
);
