import { AsyncData, Option, Result } from "@swan-io/boxed";
import { useQuery } from "@swan-io/graphql-client";
import { Box } from "@swan-io/lake/src/components/Box";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { animations, colors } from "@swan-io/lake/src/constants/design";
import { emptyToUndefined } from "@swan-io/lake/src/utils/nullish";
import { toOptionalValidator, useForm } from "@swan-io/use-form";
import { useLayoutEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { P, match } from "ts-pattern";
import { GetAvailableAccountBalanceDocument } from "../graphql/partner";
import { formatCurrency, t } from "../utils/i18n";
import { validateTransferReference } from "../utils/validations";
import { ErrorView } from "./ErrorView";

const styles = StyleSheet.create({
  field: {
    ...commonStyles.fill,
    flexBasis: "50%",
  },
  summaryContents: {
    ...commonStyles.fill,
  },
});

export type Details = {
  amount: PaymentCurrencyAmount;
  label?: string;
  reference?: string;
};

type Props = {
  isAccountClosing: boolean;
  accountMembershipId: string;
  initialDetails?: Details;
  onPressPrevious: () => void;
  onSave: (details: Details) => void;
};

export const TransferRegularWizardDetails = ({
  isAccountClosing,
  accountMembershipId,
  initialDetails,
  onPressPrevious,
  onSave,
}: Props) => {
  const [data] = useQuery(GetAvailableAccountBalanceDocument, { accountMembershipId });

  const { Field, setFieldValue, submitForm } = useForm({
    amount: {
      initialValue: initialDetails?.amount.value ?? "",
      sanitize: value => value.replace(/,/g, "."),
      validate: value => {
        const amount = Number(value);

        if (Number.isNaN(amount) || value === "" || amount <= 0) {
          return t("error.invalidTransferAmount");
        }
      },
    },
    label: {
      initialValue: initialDetails?.label ?? "",
    },
    reference: {
      initialValue: initialDetails?.reference ?? "",
      validate: toOptionalValidator(validateTransferReference),
    },
  });

  useLayoutEffect(() => {
    if (isAccountClosing) {
      match(data)
        .with(
          AsyncData.P.Done(
            Result.P.Ok({
              accountMembership: { account: { balances: { available: { value: P.select() } } } },
            }),
          ),
          value => {
            setFieldValue("amount", value);
          },
        )
        .otherwise(() => {});
    }
  }, [isAccountClosing, data, setFieldValue]);

  const onPressSubmit = () => {
    submitForm({
      onSuccess: values => {
        const { amount } = values;

        if (amount.isSome()) {
          onSave({
            amount: {
              value: amount.get(),
              currency: "EUR",
            },
            label: values.label
              .flatMap(value => Option.fromUndefined(emptyToUndefined(value)))
              .toUndefined(),
            reference: values.reference
              .flatMap(value => Option.fromUndefined(emptyToUndefined(value)))
              .toUndefined(),
          });
        }
      },
    });
  };

  return (
    <>
      {match(data)
        .with(AsyncData.P.NotAsked, AsyncData.P.Loading, () => (
          <ActivityIndicator color={colors.gray[500]} />
        ))
        .with(AsyncData.P.Done(Result.P.Ok(P.select())), data => {
          const availableBalance = data.accountMembership?.account?.balances?.available;
          return (
            <Tile style={animations.fadeAndSlideInFromBottom.enter}>
              {availableBalance != null ? (
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
              ) : null}

              <LakeLabel
                label={t("transfer.new.details.amount")}
                render={id => (
                  <Field name="amount">
                    {({ value, onChange, onBlur, error, valid, ref }) => (
                      <LakeTextInput
                        unit="EUR"
                        id={id}
                        ref={ref}
                        value={value}
                        error={error}
                        valid={valid}
                        onChangeText={onChange}
                        onBlur={onBlur}
                      />
                    )}
                  </Field>
                )}
              />

              <ResponsiveContainer breakpoint={800}>
                {({ large }) => (
                  <Box direction={large ? "row" : "column"}>
                    <View style={styles.field}>
                      <LakeLabel
                        optionalLabel={t("form.optional")}
                        label={t("transfer.new.details.label")}
                        render={id => (
                          <Field name="label">
                            {({ value, onChange, onBlur, error, valid, ref }) => (
                              <LakeTextInput
                                id={id}
                                ref={ref}
                                value={value}
                                error={error}
                                valid={valid}
                                onChangeText={onChange}
                                onBlur={onBlur}
                              />
                            )}
                          </Field>
                        )}
                      />
                    </View>

                    <Space width={24} />

                    <View style={styles.field}>
                      <LakeLabel
                        optionalLabel={t("form.optional")}
                        label={t("transfer.new.details.reference")}
                        render={id => (
                          <Field name="reference">
                            {({ value, onChange, onBlur, error, valid, ref }) => (
                              <LakeTextInput
                                id={id}
                                ref={ref}
                                value={value}
                                error={error}
                                valid={valid}
                                help={t("transfer.new.details.reference.help")}
                                onChangeText={onChange}
                                onBlur={onBlur}
                              />
                            )}
                          </Field>
                        )}
                      />
                    </View>
                  </Box>
                )}
              </ResponsiveContainer>
            </Tile>
          );
        })
        .with(AsyncData.P.Done(Result.P.Error(P.select())), error => <ErrorView error={error} />)
        .otherwise(() => (
          <ErrorView />
        ))}

      <Space height={32} />

      <ResponsiveContainer breakpoint={800}>
        {({ small }) => (
          <LakeButtonGroup>
            <LakeButton color="gray" mode="secondary" onPress={onPressPrevious} grow={small}>
              {t("common.previous")}
            </LakeButton>

            <LakeButton color="current" onPress={onPressSubmit} grow={small}>
              {t("common.continue")}
            </LakeButton>
          </LakeButtonGroup>
        )}
      </ResponsiveContainer>
    </>
  );
};

type SummaryProps = {
  details: Details;
  isMobile: boolean;
  onPressEdit: () => void;
};

export const TransferRegularWizardDetailsSummary = ({
  isMobile,
  details,
  onPressEdit,
}: SummaryProps) => {
  return (
    <Tile selected={false}>
      <Box direction="row">
        <View style={styles.summaryContents}>
          <LakeText variant="medium" color={colors.gray[900]}>
            {t("transfer.new.details.summaryTitle")}
          </LakeText>

          <Space height={8} />

          <LakeHeading level={3} variant="h4" color={colors.gray[700]}>
            {formatCurrency(Number(details.amount.value), details.amount.currency)}
          </LakeHeading>
        </View>

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
