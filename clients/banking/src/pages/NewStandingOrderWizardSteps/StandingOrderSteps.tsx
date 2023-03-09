import { Alert } from "@swan-io/lake/src/components/Alert";
import { Box } from "@swan-io/lake/src/components/Box";
import { Button } from "@swan-io/lake/src/components/Button";
import { Heading } from "@swan-io/lake/src/components/Heading";
import { Input } from "@swan-io/lake/src/components/Input";
import { Portal } from "@swan-io/lake/src/components/Portal";
import { SegmentedControl } from "@swan-io/lake/src/components/SegmentedControl";
import { Space } from "@swan-io/lake/src/components/Space";
import { colors } from "@swan-io/lake/src/constants/design";
import { typography } from "@swan-io/lake/src/constants/typography";
import { useResponsive } from "@swan-io/lake/src/hooks/useResponsive";
import { StyleSheet, Text, View } from "react-native";
import { useForm } from "react-ux-form";
import { Main } from "../../components/Main";
import { TransferRow } from "../../components/TransferRow";
import { useLegacyAccentColor } from "../../contexts/legacyAccentColor";
import { StandingOrderPeriod } from "../../graphql/partner";
import { t, TranslationKey } from "../../utils/i18n";
import { validateReference, validateRequired } from "../../utils/validations";
import { StandingOrderFormValues } from "../NewStandingOrderWizard";

const styles = StyleSheet.create({
  headerDesktop: {
    paddingTop: 56,
  },
  suptitle: {
    ...typography.bodyLarge,
    color: colors.gray[400],
    fontWeight: typography.fontWeights.demi,
  },
  input: {
    flexBasis: "0%",
    flexGrow: 1,
    flexShrink: 1,
  },
  targetBalanceNote: {
    height: 48,
    overflowWrap: "break-word",
  },
  itemText: {
    ...typography.bodyLarge,
    lineHeight: 20,
  },
  desktopButton: {
    width: 200,
  },
});

type Props = {
  nextButtonElement: Element | null;
  standingOrderFormValues: StandingOrderFormValues;
  onConfirm: (values: StandingOrderFormValues) => void;
};

export type StandingOrderDetailsFormValues = {
  standingOrderPeriod: StandingOrderPeriod;
  standingOrderHasFixedAmount: boolean;
  standingOrderAmount: string;
  standingOrderTargetBalance: string;
  standingOrderLabel: string;
  standingOrderReference: string;
};

export const StandingOrderStep = ({
  nextButtonElement,
  standingOrderFormValues,
  onConfirm,
}: Props) => {
  const { desktop, media } = useResponsive();
  const accentColor = useLegacyAccentColor();
  const { debtorAccountName, debtorAccountNumber, creditorName, creditorIban } =
    standingOrderFormValues;

  const periodTypes: { value: StandingOrderPeriod; text: TranslationKey }[] = [
    { value: "Daily", text: "payments.new.standingOrder.details.daily" },
    { value: "Weekly", text: "payments.new.standingOrder.details.weekly" },
    { value: "Monthly", text: "payments.new.standingOrder.details.monthly" },
  ];

  const hasFixedAmount: { value: boolean; text: TranslationKey }[] = [
    { value: true, text: "payments.new.standingOrder.details.yes" },
    { value: false, text: "payments.new.standingOrder.details.no" },
  ];

  const { Field, FieldsListener, submitForm, formStatus } = useForm<StandingOrderDetailsFormValues>(
    {
      standingOrderPeriod: {
        initialValue: standingOrderFormValues.standingOrderPeriod,
        validate: validateRequired,
      },
      standingOrderHasFixedAmount: {
        initialValue: standingOrderFormValues.standingOrderHasFixedAmount,
      },
      standingOrderAmount: {
        initialValue: standingOrderFormValues.standingOrderAmount,
        sanitize: value => value.replace(/,/g, ".").replace(/[^0-9.]/g, ""),
        validate: (value, { getFieldState }) => {
          const amount = Number(value);
          const hasFixedAmount = getFieldState("standingOrderHasFixedAmount").value;
          const debtorAccountAmount = Number(standingOrderFormValues.debtorAccountAmount);

          if (!hasFixedAmount) {
            return;
          }
          if (amount > debtorAccountAmount) {
            return t("error.transferAmountTooHigh");
          }

          if (Number.isNaN(amount) || value === "" || amount === 0) {
            return t("error.invalidTransferAmount");
          }
        },
      },
      standingOrderTargetBalance: {
        initialValue: standingOrderFormValues.standingOrderTargetBalance,
        sanitize: value => value.replace(/,/g, ".").replace(/[^0-9.]/g, ""),
        validate: (value, { getFieldState }) => {
          const amount = Number(value);
          const hasFixedAmount = getFieldState("standingOrderHasFixedAmount").value;

          if (!hasFixedAmount && (Number.isNaN(amount) || value === "")) {
            return t("error.invalidTargetBalanceAmount");
          }
        },
      },
      standingOrderLabel: {
        initialValue: standingOrderFormValues.standingOrderLabel,
        validate: value => {
          if (value !== "" && value.length > 140) {
            return t("error.transferLabelTooLong");
          }
        },
        sanitize: value => value.trim(),
      },
      standingOrderReference: {
        initialValue: standingOrderFormValues.standingOrderReference,
        validate: (value, { getFieldState }) => {
          const period = getFieldState("standingOrderPeriod").value;
          if (period !== "Daily") {
            return validateReference(value);
          }
        },
        sanitize: value => value.trim(),
      },
    },
  );

  const onSubmit = () => {
    submitForm(values => {
      return onConfirm({ ...standingOrderFormValues, ...values });
    });
  };

  return (
    <>
      <Main.ScrollView noTopPadding={true}>
        <Box
          alignItems={media({ mobile: "center", desktop: "start" })}
          style={desktop && styles.headerDesktop}
        >
          <Text style={styles.suptitle}>{t("payments.new.standingOrder.details.suptitle")}</Text>
          <Space height={8} />

          <Heading
            align={media({ mobile: "center", desktop: "left" })}
            level={1}
            size={media({ mobile: 24, desktop: 32 })}
          >
            {t("payments.new.standingOrder.title")}
          </Heading>
        </Box>

        <Space height={media({ mobile: 24, desktop: 40 })} />

        <TransferRow
          vertical={media({ mobile: true, desktop: false })}
          from={{ title: debtorAccountName, subtitle: debtorAccountNumber }}
          to={{ title: creditorName, subtitle: creditorIban }}
        />

        <Space height={media({ mobile: 24, desktop: 40 })} />

        <Field name="standingOrderPeriod">
          {({ onChange, value }) => (
            <SegmentedControl
              label={t("payments.new.standingOrder.details.recurrence")}
              onValueChange={onChange}
              value={value}
              items={periodTypes}
              renderItem={item => <Text style={styles.itemText}>{t(item.text)}</Text>}
              horizontal={desktop}
            />
          )}
        </Field>

        <Space height={media({ mobile: 24, desktop: 16 })} />

        <Box
          alignItems={media({ mobile: "stretch", desktop: "end" })}
          direction={media({ mobile: "column", desktop: "row" })}
        >
          <Field name="standingOrderHasFixedAmount">
            {({ value, onChange }) => (
              <>
                <SegmentedControl
                  label={t("payments.new.standingOrder.details.fixedAmount")}
                  horizontal={true}
                  value={value}
                  onValueChange={onChange}
                  items={hasFixedAmount}
                  renderItem={item => <Text style={styles.itemText}>{t(item.text)}</Text>}
                />

                {!value && (
                  <>
                    <Space
                      width={media({ mobile: 4, desktop: 24 })}
                      height={media({ mobile: 12, desktop: 4 })}
                    />

                    <Alert style={[styles.targetBalanceNote, styles.input]} variant="info">
                      {t("payments.new.standingOrder.details.targetBalanceNote")}
                    </Alert>
                  </>
                )}
              </>
            )}
          </Field>
        </Box>

        <Space height={media({ mobile: 24, desktop: 16 })} />

        <Box direction={media({ mobile: "column", desktop: "row" })}>
          <FieldsListener names={["standingOrderHasFixedAmount"]}>
            {({ standingOrderHasFixedAmount }) =>
              standingOrderHasFixedAmount.value ? (
                <Field name="standingOrderAmount">
                  {({ onChange, value, error }) => (
                    <Input
                      label={t("payments.new.details.amountLabel")}
                      placeholder={t("payments.new.details.amountPlaceholder")}
                      keyboardType="decimal-pad"
                      suffix="€"
                      error={error}
                      value={value}
                      style={styles.input}
                      onValueChange={onChange}
                    />
                  )}
                </Field>
              ) : (
                <Field name="standingOrderTargetBalance">
                  {({ onChange, value, error }) => (
                    <Input
                      label={t("payments.new.standingOrder.details.targetBalance")}
                      placeholder={t("payments.new.details.amountPlaceholder")}
                      keyboardType="decimal-pad"
                      suffix="€"
                      error={error}
                      value={value}
                      style={styles.input}
                      onValueChange={onChange}
                    />
                  )}
                </Field>
              )
            }
          </FieldsListener>

          <Space width={24} />

          <Field name="standingOrderLabel">
            {({ onChange, value, error }) => (
              <Input
                label={t("payments.new.details.labelLabel")}
                placeholder={t("payments.new.details.labelPlaceholder")}
                value={value}
                error={error}
                style={styles.input}
                onValueChange={onChange}
              />
            )}
          </Field>
        </Box>

        <FieldsListener names={["standingOrderPeriod"]}>
          {({ standingOrderPeriod }) =>
            standingOrderPeriod.value !== "Daily" ? (
              <Box direction={media({ mobile: "column", desktop: "row" })}>
                <Field name="standingOrderReference">
                  {({ onChange, value, error }) => (
                    <Input
                      label={t("payments.new.details.referenceLabel")}
                      placeholder={t("payments.new.details.referencePlaceholder")}
                      value={value}
                      error={error}
                      style={styles.input}
                      onValueChange={onChange}
                    />
                  )}
                </Field>

                <Space width={24} />
                <View accessibilityRole="none" style={styles.input} />
              </Box>
            ) : null
          }
        </FieldsListener>

        <Space width={24} />
        <View accessibilityRole="none" style={styles.input} />
      </Main.ScrollView>

      {nextButtonElement && (
        <Portal container={nextButtonElement}>
          <FieldsListener
            names={[
              "standingOrderHasFixedAmount",
              "standingOrderAmount",
              "standingOrderTargetBalance",
            ]}
          >
            {({ standingOrderHasFixedAmount, standingOrderTargetBalance, standingOrderAmount }) => (
              <Button
                color={accentColor}
                loading={formStatus === "submitting"}
                disabled={
                  standingOrderHasFixedAmount.value
                    ? !standingOrderAmount.valid
                    : !standingOrderTargetBalance.valid
                }
                onPress={onSubmit}
                style={desktop ? styles.desktopButton : null}
              >
                {t("payments.new.confirm")}
              </Button>
            )}
          </FieldsListener>
        </Portal>
      )}
    </>
  );
};
