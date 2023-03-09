import { Box } from "@swan-io/lake/src/components/Box";
import { Button } from "@swan-io/lake/src/components/Button";
import { Heading } from "@swan-io/lake/src/components/Heading";
import { Input } from "@swan-io/lake/src/components/Input";
import { Portal } from "@swan-io/lake/src/components/Portal";
import { Space } from "@swan-io/lake/src/components/Space";
import { colors } from "@swan-io/lake/src/constants/design";
import { typography } from "@swan-io/lake/src/constants/typography";
import { useResponsive } from "@swan-io/lake/src/hooks/useResponsive";
import { StyleSheet, Text } from "react-native";
import { hasDefinedKeys, useForm } from "react-ux-form";
import { Main } from "../../components/Main";
import { TransferRow } from "../../components/TransferRow";
import { useLegacyAccentColor } from "../../contexts/legacyAccentColor";
import { t } from "../../utils/i18n";
import * as iban from "../../utils/iban";
import {
  SetStandingOrderFormValues,
  SetStepAction,
  StandingOrderFormValues,
} from "../NewStandingOrderWizard";

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
  setStep: SetStepAction;
  setStandingOrderForm: SetStandingOrderFormValues;
  standingOrderFormValues: StandingOrderFormValues;
};

export type CreditorAccountFormValues = {
  creditorName: string;
  creditorIban: string;
};

export const CreditorAccountStep = ({
  nextButtonElement,
  setStep,
  setStandingOrderForm,
  standingOrderFormValues,
}: Props) => {
  const { desktop, media } = useResponsive();
  const accentColor = useLegacyAccentColor();
  const { debtorAccountName, debtorAccountNumber, ...defaultValues } = standingOrderFormValues;

  const { Field, submitForm, FieldsListener } = useForm<CreditorAccountFormValues>({
    creditorIban: {
      initialValue: defaultValues.creditorIban,
      sanitize: value => {
        return iban.printFormat(value);
      },
      validate: value => {
        if (!iban.isValid(value)) {
          return t("error.invalidIban");
        }
      },
    },
    creditorName: {
      initialValue: defaultValues.creditorName,
      validate: value => {
        if (value.length < 3) {
          return t("error.invalidCreditorName");
        }
      },
      sanitize: value => value.trim(),
    },
  });

  const onSubmit = () => {
    submitForm(values => {
      if (hasDefinedKeys(values, ["creditorName", "creditorIban"])) {
        setStandingOrderForm((prevState: StandingOrderFormValues) => ({
          ...prevState,
          creditorName: values.creditorName,
          creditorIban: values.creditorIban,
        }));
        setStep("StandingOrder");
      }
    });
  };

  return (
    <>
      <Main.ScrollView noTopPadding={true}>
        <Box
          alignItems={media({ mobile: "center", desktop: "start" })}
          style={desktop && styles.headerDesktop}
        >
          <Text style={styles.suptitle}>{t("payments.new.standingOrder.creditor.suptitle")}</Text>
          <Space height={8} />

          <Heading
            align={media({ mobile: "center", desktop: "left" })}
            level={1}
            size={media({ mobile: 24, desktop: 32 })}
          >
            {t("payments.new.creditor.title")}
          </Heading>
        </Box>

        <Space height={media({ mobile: 24, desktop: 40 })} />

        <TransferRow
          vertical={media({ mobile: true, desktop: false })}
          from={{ title: debtorAccountName, subtitle: debtorAccountNumber }}
          to="placeholder"
        />

        <Space height={media({ mobile: 24, desktop: 40 })} />

        <Box direction={media({ mobile: "column", desktop: "row" })}>
          <Field name="creditorName">
            {({ value, onChange, error }) => (
              <Input
                label={t("payments.new.creditor.beneficiariesLabel")}
                placeholder="John Doe"
                error={error}
                value={value}
                style={styles.input}
                onValueChange={onChange}
              />
            )}
          </Field>

          <Space width={24} />

          <Field name="creditorIban">
            {({ value, onChange, valid, error }) => (
              <Input
                label={t("payments.new.creditor.ibanLabel")}
                value={iban.printFormat(value)}
                error={error}
                placeholder={t("payments.new.creditor.ibanPlaceholder")}
                successful={valid}
                style={styles.input}
                onValueChange={onChange}
              />
            )}
          </Field>
        </Box>
      </Main.ScrollView>

      {nextButtonElement && (
        <Portal container={nextButtonElement}>
          <FieldsListener names={["creditorName"]}>
            {({ creditorName }) => (
              <Button
                color={accentColor}
                disabled={creditorName.value === ""}
                onPress={onSubmit}
                style={desktop ? styles.desktopButton : null}
              >
                {t("payments.new.next")}
              </Button>
            )}
          </FieldsListener>
        </Portal>
      )}
    </>
  );
};
