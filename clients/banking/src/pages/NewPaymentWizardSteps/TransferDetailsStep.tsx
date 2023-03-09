import { Box } from "@swan-io/lake/src/components/Box";
import { Button } from "@swan-io/lake/src/components/Button";
import { Heading } from "@swan-io/lake/src/components/Heading";
import { Input } from "@swan-io/lake/src/components/Input";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { Portal } from "@swan-io/lake/src/components/Portal";
import { Space } from "@swan-io/lake/src/components/Space";
import { Switch } from "@swan-io/lake/src/components/Switch";
import { colors } from "@swan-io/lake/src/constants/design";
import { typography } from "@swan-io/lake/src/constants/typography";
import { useResponsive } from "@swan-io/lake/src/hooks/useResponsive";
import { StyleSheet, Text } from "react-native";
import { useForm } from "react-ux-form";
import { Main } from "../../components/Main";
import { TransferRow } from "../../components/TransferRow";
import { useLegacyAccentColor } from "../../contexts/legacyAccentColor";
import { t } from "../../utils/i18n";
import { validateReference } from "../../utils/validations";
import { NewPaymentFormValues } from "../NewPaymentWizard";

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
  desktopButton: {
    width: 200,
  },
});

type Props = {
  nextButtonElement: Element | null;
  newPaymentFormValues: NewPaymentFormValues;
  onConfirm: (values: NewPaymentFormValues) => void;
};

export type TransferDetailsFormValues = {
  transferAmount: string;
  transferLabel: string;
  transferReference: string;
  isInstant: boolean;
};

export const TransferDetailsStep = ({
  nextButtonElement,
  onConfirm,
  newPaymentFormValues,
}: Props) => {
  const { desktop, media } = useResponsive();
  const accentColor = useLegacyAccentColor();
  const { debtorAccountName, debtorAccountNumber, creditorName, creditorIban } =
    newPaymentFormValues;

  const { Field, FieldsListener, submitForm, formStatus } = useForm<TransferDetailsFormValues>({
    transferAmount: {
      initialValue: newPaymentFormValues.transferAmount,
      sanitize: value => value.replace(/,/g, ".").replace(/[^0-9.]/g, ""),
      validate: value => {
        const amount = Number(value);
        const debtorAccountAmount = Number(newPaymentFormValues.debtorAccountAmount);

        if (amount > debtorAccountAmount) {
          return t("error.transferAmountTooHigh");
        }

        if (Number.isNaN(amount) || value === "" || amount === 0) {
          return t("error.invalidTransferAmount");
        }
      },
    },
    transferLabel: {
      initialValue: newPaymentFormValues.transferLabel,
      sanitize: value => value.trim(),
      validate: value => {
        if (value !== "" && value.length > 140) {
          return t("error.transferLabelTooLong");
        }
      },
    },
    transferReference: {
      initialValue: newPaymentFormValues.transferReference,
      sanitize: value => value.trim(),
      validate: validateReference,
      strategy: "onSuccessOrBlur",
    },
    isInstant: {
      initialValue: false,
    },
  });

  const onSubmit = () => {
    submitForm(values => {
      return onConfirm({ ...newPaymentFormValues, ...values });
    });
  };

  return (
    <Main.ScrollView noTopPadding={true}>
      <Box
        alignItems={media({ mobile: "center", desktop: "start" })}
        style={desktop && styles.headerDesktop}
      >
        <Text style={styles.suptitle}>{t("payments.new.details.suptitle")}</Text>
        <Space height={8} />

        <Heading
          align={media({ mobile: "center", desktop: "left" })}
          level={1}
          size={media({ mobile: 24, desktop: 32 })}
        >
          {t("payments.new.details.title")}
        </Heading>
      </Box>

      <Space height={media({ mobile: 24, desktop: 40 })} />

      <TransferRow
        vertical={media({ mobile: true, desktop: false })}
        from={{ title: debtorAccountName, subtitle: debtorAccountNumber }}
        to={{ title: creditorName, subtitle: creditorIban }}
      />

      <Space height={media({ mobile: 24, desktop: 40 })} />

      <Box direction={media({ mobile: "column", desktop: "row" })}>
        <Field name="transferAmount">
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

        <Space width={24} />

        <Field name="transferLabel">
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

      <Box direction={media({ mobile: "column", desktop: "row" })}>
        <Field name="transferReference">
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

        <Box style={styles.input} direction="row" alignItems="center">
          <Field name="isInstant">
            {({ value, onChange }) => (
              <>
                <Switch value={value} onValueChange={onChange} />
                <Space width={12} />
                <LakeText color={colors.gray[800]}>{t("payments.new.details.sctInst")}</LakeText>
              </>
            )}
          </Field>
        </Box>
      </Box>

      {nextButtonElement && (
        <Portal container={nextButtonElement}>
          <FieldsListener names={["transferAmount"]}>
            {({ transferAmount }) => (
              <Button
                color={accentColor}
                loading={formStatus === "submitting"}
                disabled={!transferAmount.valid}
                onPress={onSubmit}
                style={desktop ? styles.desktopButton : null}
              >
                {t("payments.new.confirm")}
              </Button>
            )}
          </FieldsListener>
        </Portal>
      )}
    </Main.ScrollView>
  );
};
