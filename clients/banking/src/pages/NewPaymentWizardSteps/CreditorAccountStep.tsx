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
import { combineValidators, hasDefinedKeys, useForm } from "react-ux-form";
import { Main } from "../../components/Main";
import { TransferRow } from "../../components/TransferRow";
import { useLegacyAccentColor } from "../../contexts/legacyAccentColor";
import { t } from "../../utils/i18n";
import * as iban from "../../utils/iban";
import {
  validateAccountNameLength,
  validateSepaBeneficiaryNameAlphabet,
} from "../../utils/validations";
import { NewPaymentFormValues, SetNewPaymentFormValues, SetStepAction } from "../NewPaymentWizard";

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

export type CreditorAccountFormValues = {
  creditorIban: string;
  creditorName: string;
};

// type IbanData = {
//   bic: string;
//   bankName: string;
//   address: string;
//   city: string;
//   zipcode: string;
//   country: string;
// };

// const BLANK_IBAN_DATA: IbanData = {
//   bic: "",
//   bankName: "",
//   address: "",
//   city: "",
//   zipcode: "",
//   country: "",
// };

// const styles = StyleSheet.create({
// spinner: {
//   position: "absolute",
//   right: 16,
// },
// card: {
//   backgroundColor: colors.gray[3],
//   borderBottomLeftRadius: 4,
//   borderBottomRightRadius: 4,
//   borderColor: colors.gray[10],
//   borderTopWidth: 1,
//   borderWidth: 1,
//   paddingHorizontal: 16,
//   paddingVertical: 12,
// },
// lineTitle: {
//   ...typography.bodySmall,
//   fontWeight: typography.fontWeights.demi,
//   color: colors.gray[50],
// },
// lineText: {
//   ...typography.bodySmall,
//   color: colors.gray[50],
// },
// });

type Props = {
  nextButtonElement: Element | null;
  setNewPaymentFormValues: SetNewPaymentFormValues;
  newPaymentFormValues: NewPaymentFormValues;
  setStep: SetStepAction;
};

export const CreditorAccountStep = ({
  nextButtonElement,
  setNewPaymentFormValues,
  newPaymentFormValues,
  setStep,
}: Props) => {
  const { desktop, media } = useResponsive();
  const accentColor = useLegacyAccentColor();
  const { debtorAccountName, debtorAccountNumber, ...defaultValues } = newPaymentFormValues;

  const { Field, submitForm, FieldsListener } = useForm<CreditorAccountFormValues>({
    creditorIban: {
      initialValue: defaultValues.creditorIban,
      sanitize: iban.printFormat,
      validate: value => {
        if (!iban.isValid(value)) {
          return t("error.invalidIban");
        }
      },
    },
    creditorName: {
      initialValue: defaultValues.creditorName,
      validate: combineValidators(validateSepaBeneficiaryNameAlphabet, validateAccountNameLength),
      sanitize: value => value.trim(),
    },
  });

  const onSubmit = () => {
    submitForm(values => {
      if (hasDefinedKeys(values, ["creditorName", "creditorIban"])) {
        setNewPaymentFormValues((prevState: NewPaymentFormValues) => ({
          ...prevState,
          creditorName: values.creditorName,
          creditorIban: values.creditorIban,
        }));
        setStep("TransferDetails");
      }
    });
  };

  // useEffect(() => {
  //   // when receiving a new IBAN, check if it's valid
  //   // if it is, button can be enabled
  //   if (ibanState === "fetching") {
  //     setTimeout(() => {
  //       setIban(prevState => ({
  //         ...prevState,
  //         state: "valid",
  //         data: {
  //           bic: "BNPAFRPP",
  //           bankName: "BNP Paribas",
  //           address: "50 rue Jean Jaures",
  //           city: "Paris",
  //           zipcode: "75010",
  //           country: "France",
  //         },
  //       }));
  //     }, 750);
  //   }
  // }, [ibanState, ibanValue]);

  return (
    <Main.ScrollView noTopPadding={true}>
      <Box
        alignItems={media({ mobile: "center", desktop: "start" })}
        style={desktop && styles.headerDesktop}
      >
        <Text style={styles.suptitle}>{t("payments.new.creditor.suptitle")}</Text>
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
          {({ value, onChange, error, valid }) => (
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

      {/* {ibanState === "fetching" ? (
          <ActivityIndicator style={styles.spinner} size="small" color={colors.gray[50]} />
          ) : ibanState === "valid" ? (
          <Icon name="check" color={colors.green[100]} style={styles.checkIcon} />
          ) : null} */}

      {/* <Box direction="row" style={styles.card}>
          <View>
          <Text numberOfLines={1} style={styles.lineTitle}>{t("iban.bic")}</Text>
          <Text numberOfLines={1} style={styles.lineTitle}>{t("iban.bankName")}</Text>
          <Text numberOfLines={1} style={styles.lineTitle}>{t("iban.address")}</Text>
          <Text numberOfLines={1} style={styles.lineTitle}>{t("iban.city")}</Text>
          <Text numberOfLines={1} style={styles.lineTitle}>{t("iban.zipcode")}</Text>
          <Text numberOfLines={1} style={styles.lineTitle}>{t("iban.country")}</Text>
          </View>

          <Space width={40} />

          <Fill>
          <Text numberOfLines={1} style={styles.lineText}>{ibanData.bic}</Text>
          <Text numberOfLines={1} style={styles.lineText}>{ibanData.bankName}</Text>
          <Text numberOfLines={1} style={styles.lineText}>{ibanData.address}</Text>
          <Text numberOfLines={1} style={styles.lineText}>{ibanData.city}</Text>
          <Text numberOfLines={1} style={styles.lineText}>{ibanData.zipcode}</Text>
          <Text numberOfLines={1} style={styles.lineText}>{ibanData.country}</Text>
          </Fill>
          </Box> */}
    </Main.ScrollView>
  );
};
