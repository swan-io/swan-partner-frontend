import { Option } from "@swan-io/boxed";
import { Box } from "@swan-io/lake/src/components/Box";
import { Icon } from "@swan-io/lake/src/components/Icon";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { Pressable } from "@swan-io/lake/src/components/Pressable";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tag } from "@swan-io/lake/src/components/Tag";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { animations, colors } from "@swan-io/lake/src/constants/design";
import { emptyToUndefined } from "@swan-io/lake/src/utils/nullish";
import { toOptionalValidator, useForm } from "@swan-io/use-form";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { match } from "ts-pattern";
import { formatCurrency, t } from "../utils/i18n";
import { validateTransferReference } from "../utils/validations";

const styles = StyleSheet.create({
  field: {
    ...commonStyles.fill,
    flexBasis: "50%",
  },
  summaryContents: {
    ...commonStyles.fill,
  },
  grow: {
    ...commonStyles.fill,
  },
});

type FixedAmountDetails = {
  type: "FixedAmount";
  amount: PaymentCurrencyAmount;
  label?: string;
  reference?: string;
};

type TargetAccountBalanceDetails = {
  type: "TargetAccountBalance";
  targetAmount: PaymentCurrencyAmount;
  label?: string;
  reference?: string;
};

type SharedDetails = {
  label?: string;
  reference?: string;
};

export type Details = FixedAmountDetails | TargetAccountBalanceDetails;

type TransferRecurringWizardDetailsFixedAmountProps = {
  initialDetails?: FixedAmountDetails;
  onPressPrevious: () => void;
  onPressSwitchMode: (details: SharedDetails) => void;
  onSave: (details: FixedAmountDetails) => void;
};

const TransferRecurringWizardDetailsFixedAmount = ({
  initialDetails,
  onPressPrevious,
  onPressSwitchMode,
  onSave,
}: TransferRecurringWizardDetailsFixedAmountProps) => {
  const { Field, getFieldValue, submitForm } = useForm({
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
    },
  });

  const onPressSubmit = () => {
    submitForm({
      onSuccess: values => {
        const { amount } = values;

        if (amount.isSome()) {
          onSave({
            type: "FixedAmount",
            amount: {
              value: amount.get(),
              currency: "EUR",
            },
            label: values.label.toUndefined(),
            reference: values.reference.toUndefined(),
          });
        }
      },
    });
  };

  return (
    <>
      <LakeHeading level={2} variant="h3">
        {t("transfer.new.recurring.fixedAmount.title")}
      </LakeHeading>

      <Space height={32} />

      <Tile>
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

      <Space height={24} />

      <Pressable
        role="button"
        onPress={() =>
          onPressSwitchMode({
            label: getFieldValue("label"),
            reference: getFieldValue("reference"),
          })
        }
      >
        {({ hovered }) => (
          <Tile selected={false} hovered={hovered}>
            <Box direction="row" alignItems="center">
              <Box style={styles.grow}>
                <LakeText variant="medium" color={colors.swan[700]}>
                  {t("transfer.new.sendFullBalance")}
                </LakeText>

                <LakeText variant="regular" color={colors.gray[500]}>
                  {t("transfer.new.sendFullBalance.description")}
                </LakeText>
              </Box>

              <Space width={24} />
              <Icon name="chevron-right-filled" size={24} color={colors.gray[500]} />
            </Box>
          </Tile>
        )}
      </Pressable>

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

type TransferRecurringWizardDetailsTargetAccountBalanceProps = {
  initialDetails?: TargetAccountBalanceDetails;
  onPressPrevious: () => void;
  onPressSwitchMode: (details: SharedDetails) => void;
  onSave: (details: TargetAccountBalanceDetails) => void;
};

const TransferRecurringWizardDetailsTargetAccountBalance = ({
  initialDetails,
  onPressPrevious,
  onPressSwitchMode,
  onSave,
}: TransferRecurringWizardDetailsTargetAccountBalanceProps) => {
  const { Field, getFieldValue, submitForm } = useForm({
    targetAmount: {
      initialValue: initialDetails?.targetAmount.value ?? "",
      sanitize: value => value.replace(/,/g, "."),
      validate: value => {
        const amount = Number(value);

        if (Number.isNaN(amount) || value === "" || amount < 0) {
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

  const onPressSubmit = () => {
    submitForm({
      onSuccess: values => {
        const { targetAmount } = values;

        if (targetAmount.isSome()) {
          onSave({
            type: "TargetAccountBalance",
            targetAmount: {
              value: targetAmount.get(),
              currency: "EUR",
            },
            label: values.label
              .flatMap(value => Option.fromNullable(emptyToUndefined(value)))
              .toUndefined(),
            reference: values.reference
              .flatMap(value => Option.fromNullable(emptyToUndefined(value)))
              .toUndefined(),
          });
        }
      },
    });
  };

  return (
    <>
      <LakeHeading level={2} variant="h3">
        {t("transfer.new.recurring.targetAccountBalance.title")}
      </LakeHeading>

      <Space height={8} />
      <LakeText>{t("transfer.new.recurring.targetAccountBalance.subtitle")}</LakeText>
      <Space height={32} />

      <Tile>
        <LakeLabel
          label={t("transfer.new.details.targetAmount")}
          render={id => (
            <Field name="targetAmount">
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
                          help={t("transfer.new.details.reference.help")}
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
            </Box>
          )}
        </ResponsiveContainer>
      </Tile>

      <Space height={24} />

      <Pressable
        onPress={() =>
          onPressSwitchMode({
            label: getFieldValue("label"),
            reference: getFieldValue("reference"),
          })
        }
      >
        {({ hovered }) => (
          <Tile selected={false} hovered={hovered}>
            <Box direction="row" alignItems="center">
              <Icon name="chevron-left-filled" size={24} color={colors.gray[500]} />
              <Space width={24} />

              <Box style={styles.grow}>
                <LakeText variant="medium" color={colors.swan[700]}>
                  {t("transfer.new.sendRegularTransfer")}
                </LakeText>

                <LakeText variant="regular" color={colors.gray[500]}>
                  {t("transfer.new.sendRegularTransfer.description")}
                </LakeText>
              </Box>
            </Box>
          </Tile>
        )}
      </Pressable>

      <Space height={32} />

      <LakeButtonGroup>
        <LakeButton color="gray" mode="secondary" onPress={onPressPrevious}>
          {t("common.previous")}
        </LakeButton>

        <LakeButton color="current" onPress={onPressSubmit}>
          {t("common.continue")}
        </LakeButton>
      </LakeButtonGroup>
    </>
  );
};

type Props = {
  initialDetails?: Details;
  onPressPrevious: () => void;
  onSave: (details: Details) => void;
};

const FIXED_AMOUNT_DEFAULT_VALUE = {
  type: "FixedAmount",
  amount: { value: "", currency: "EUR" },
} as const;

const TARGET_ACCOUNT_BALANCE_DEFAULT_VALUE = {
  type: "TargetAccountBalance",
  targetAmount: { value: "", currency: "EUR" },
} as const;

export const TransferRecurringWizardDetails = ({
  initialDetails,
  onPressPrevious,
  onSave,
}: Props) => {
  const [details, setDetails] = useState<Details>(initialDetails ?? FIXED_AMOUNT_DEFAULT_VALUE);

  return (
    <View style={animations.fadeAndSlideInFromBottom.enter}>
      {match(details)
        .with({ type: "FixedAmount" }, initialDetails => (
          <>
            <TransferRecurringWizardDetailsFixedAmount
              initialDetails={initialDetails}
              onPressPrevious={onPressPrevious}
              onSave={onSave}
              onPressSwitchMode={sharedDetails =>
                setDetails({ ...TARGET_ACCOUNT_BALANCE_DEFAULT_VALUE, ...sharedDetails })
              }
            />
          </>
        ))
        .with({ type: "TargetAccountBalance" }, initialDetails => (
          <>
            <TransferRecurringWizardDetailsTargetAccountBalance
              initialDetails={initialDetails}
              onPressPrevious={onPressPrevious}
              onSave={onSave}
              onPressSwitchMode={sharedDetails =>
                setDetails({ ...FIXED_AMOUNT_DEFAULT_VALUE, ...sharedDetails })
              }
            />
          </>
        ))
        .exhaustive()}
    </View>
  );
};

type SummaryProps = {
  isMobile: boolean;
  details: Details;
  onPressEdit: () => void;
};

export const TransferRecurringWizardDetailsSummary = ({
  isMobile,
  details,
  onPressEdit,
}: SummaryProps) => {
  return (
    <Tile selected={false}>
      <Box direction="row">
        {match(details)
          .with({ type: "FixedAmount" }, ({ amount }) => (
            <View style={styles.summaryContents}>
              <LakeText variant="medium" color={colors.gray[900]}>
                {t("transfer.new.details.summaryTitle")}
              </LakeText>

              <Space height={8} />

              <LakeHeading level={3} variant="h4" color={colors.gray[700]}>
                {formatCurrency(Number(amount.value), amount.currency)}
              </LakeHeading>
            </View>
          ))
          .with({ type: "TargetAccountBalance" }, ({ targetAmount }) => (
            <View style={styles.summaryContents}>
              <LakeText variant="medium" color={colors.gray[900]}>
                {t("transfer.new.details.targetAmount")}
              </LakeText>

              <Space height={8} />

              <Box direction="row" alignItems="center">
                <LakeHeading level={3} variant="h4" color={colors.gray[700]}>
                  {formatCurrency(Number(targetAmount.value), targetAmount.currency)}
                </LakeHeading>

                <Space width={12} />
                <Tag color="live">{t("transfer.new.recurring.targetAccountBalance.title")}</Tag>
              </Box>
            </View>
          ))
          .exhaustive()}

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
