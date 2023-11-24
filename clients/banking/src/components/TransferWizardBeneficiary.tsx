import { AsyncData, Result } from "@swan-io/boxed";
import { Box } from "@swan-io/lake/src/components/Box";
import { LakeAlert } from "@swan-io/lake/src/components/LakeAlert";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { animations, colors } from "@swan-io/lake/src/constants/design";
import { useUrqlQuery } from "@swan-io/lake/src/hooks/useUrqlQuery";
import { electronicFormat } from "iban";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { combineValidators, hasDefinedKeys, useForm } from "react-ux-form";
import { P, match } from "ts-pattern";
import { GetIbanValidationDocument } from "../graphql/partner";
import { t } from "../utils/i18n";
import { printIbanFormat, validateIban } from "../utils/iban";
import { validateBeneficiaryName, validateRequired } from "../utils/validations";

export type Beneficiary = {
  name: string;
  iban: string;
};

const styles = StyleSheet.create({
  summaryContents: {
    ...commonStyles.fill,
  },
});

type Props = {
  initialBeneficiary?: Beneficiary;
  onSave: (beneficiary: Beneficiary) => void;
};

export const TransferWizardBeneficiary = ({ initialBeneficiary, onSave }: Props) => {
  const [iban, setIban] = useState<string | undefined>(undefined);
  const { data } = useUrqlQuery(
    {
      query: GetIbanValidationDocument,
      pause: iban == undefined,
      variables: {
        // `pause` gives us the guarantee we get a valid iban
        iban: iban as string,
      },
    },
    [iban],
  );

  const { Field, listenFields, submitForm } = useForm({
    name: {
      initialValue: initialBeneficiary?.name ?? "",
      validate: validateBeneficiaryName,
    },
    iban: {
      initialValue: initialBeneficiary?.iban ?? "",
      validate: combineValidators(validateRequired, validateIban),
    },
  });

  useEffect(() => {
    return listenFields(["iban"], ({ iban }) => {
      if (iban.valid) {
        setIban(electronicFormat(iban.value));
      } else {
        setIban(undefined);
      }
    });
  }, [listenFields]);

  const onPressSubmit = () => {
    submitForm(values => {
      if (hasDefinedKeys(values, ["name", "iban"])) {
        onSave({
          name: values.name,
          iban: values.iban,
        });
      }
    });
  };

  return (
    <>
      <Tile
        style={animations.fadeAndSlideInFromBottom.enter}
        footer={match(data)
          .with(AsyncData.P.Loading, () => {
            return (
              <LakeAlert anchored={true} variant="neutral" title="">
                <ActivityIndicator color={colors.gray[700]} />
              </LakeAlert>
            );
          })
          .with(
            AsyncData.P.Done(
              Result.P.Ok({ ibanValidation: { __typename: "ValidIban", bank: P.select() } }),
            ),
            ({ name, address }) => {
              return (
                <LakeAlert
                  anchored={true}
                  variant="neutral"
                  title={t("transfer.new.bankInformation")}
                >
                  <>
                    <LakeText>{name}</LakeText>

                    {match(address)
                      .with(
                        { addressLine1: P.string, postalCode: P.string, city: P.string },
                        ({ addressLine1, postalCode, city }) => (
                          <LakeText>
                            {addressLine1}, {postalCode} {city}
                          </LakeText>
                        ),
                      )
                      .otherwise(() => null)}
                  </>
                </LakeAlert>
              );
            },
          )
          .otherwise(() => null)}
      >
        <LakeLabel
          label={t("transfer.new.beneficiary.name")}
          render={id => (
            <Field name="name">
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

        <LakeLabel
          label={t("transfer.new.iban.label")}
          render={id => (
            <Field name="iban">
              {({ value, onChange, onBlur, error, validating, valid, ref }) => (
                <LakeTextInput
                  id={id}
                  ref={ref}
                  placeholder={t("transfer.new.iban.placeholder")}
                  value={printIbanFormat(value)}
                  validating={validating}
                  error={error}
                  valid={valid}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            </Field>
          )}
        />
      </Tile>

      <Space height={32} />

      <ResponsiveContainer breakpoint={800}>
        {({ small }) => (
          <LakeButtonGroup>
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
  beneficiary: Beneficiary;
  onPressEdit: () => void;
};

export const TransferWizardBeneficiarySummary = ({ beneficiary, onPressEdit }: SummaryProps) => {
  return (
    <Tile selected={false}>
      <Box direction="row">
        <View style={styles.summaryContents}>
          <LakeText variant="medium" color={colors.gray[900]}>
            {t("transfer.new.beneficiary")}
          </LakeText>

          <Space height={8} />

          <LakeText variant="medium" color={colors.gray[700]}>
            {beneficiary.name}
          </LakeText>

          <LakeText variant="smallRegular" color={colors.gray[500]}>
            {printIbanFormat(beneficiary.iban)}
          </LakeText>
        </View>

        <LakeButton mode="tertiary" icon="edit-regular" onPress={onPressEdit}>
          {t("common.edit")}
        </LakeButton>
      </Box>
    </Tile>
  );
};
