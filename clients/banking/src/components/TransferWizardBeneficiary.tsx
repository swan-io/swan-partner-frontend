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
import { useDeferredUrqlQuery } from "@swan-io/lake/src/hooks/useUrqlQuery";
import { isNotNullish } from "@swan-io/lake/src/utils/nullish";
import { printIbanFormat, validateIban } from "@swan-io/shared-business/src/utils/validation";
import { electronicFormat } from "iban";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { combineValidators, hasDefinedKeys, useForm } from "react-ux-form";
import { P, match } from "ts-pattern";
import {
  AccountCountry,
  GetBeneficiaryVerificationDocument,
  GetIbanValidationDocument,
} from "../graphql/partner";
import { t } from "../utils/i18n";
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
  accountCountry: AccountCountry;
  accountId: string;
  initialBeneficiary?: Beneficiary;
  onSave: (beneficiary: Beneficiary) => void;
};

export const TransferWizardBeneficiary = ({
  accountCountry,
  accountId,
  initialBeneficiary,
  onSave,
}: Props) => {
  const {
    data: ibanVerification,
    query: queryIbanVerification,
    reset: resetIbanVerification,
  } = useDeferredUrqlQuery(GetIbanValidationDocument);
  const {
    data: beneficiaryVerification,
    query: queryBeneficiaryVerification,
    reset: resetBeneficiaryVerification,
  } = useDeferredUrqlQuery(GetBeneficiaryVerificationDocument);

  const { Field, listenFields, submitForm, FieldsListener } = useForm({
    name: {
      initialValue: initialBeneficiary?.name ?? "",
      validate: validateBeneficiaryName,
    },
    iban: {
      initialValue: initialBeneficiary?.iban ?? "",
      sanitize: electronicFormat,
      validate: combineValidators(validateRequired, validateIban),
    },
  });

  useEffect(() => {
    return listenFields(["iban", "name"], ({ iban, name }) => {
      if (!iban.valid) {
        resetBeneficiaryVerification();
        resetIbanVerification();
        return;
      }

      const isTransferFromDutchAccountToDutchIBAN =
        accountCountry === "NLD" && iban.value.startsWith("NL");

      if (isTransferFromDutchAccountToDutchIBAN) {
        queryBeneficiaryVerification({
          input: {
            debtorAccountId: accountId,
            iban: electronicFormat(iban.value),
            name: name.value,
          },
        });
      } else {
        queryIbanVerification({
          iban: electronicFormat(iban.value),
        });
      }
    });
  }, [
    accountCountry,
    accountId,
    listenFields,
    queryBeneficiaryVerification,
    queryIbanVerification,
    resetBeneficiaryVerification,
    resetIbanVerification,
  ]);

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
      <FieldsListener names={["name"]}>
        {({ name: beneficiaryName }) => (
          <Tile
            style={animations.fadeAndSlideInFromBottom.enter}
            footer={match({
              beneficiaryVerification: beneficiaryVerification.mapOk(
                query => query.beneficiaryVerification,
              ),
              ibanVerification: ibanVerification.mapOk(query => query.ibanValidation),
            })
              .with(
                { beneficiaryVerification: AsyncData.P.Loading },
                { ibanVerification: AsyncData.P.Loading },
                () => (
                  <LakeAlert anchored={true} variant="neutral" title="">
                    <ActivityIndicator color={colors.gray[700]} />
                  </LakeAlert>
                ),
              )
              .with(
                {
                  ibanVerification: AsyncData.P.Done(
                    Result.P.Ok({
                      __typename: "ValidIban",
                      bank: P.select(),
                    }),
                  ),
                },
                ({ name, address }) => (
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
                ),
              )
              .with(
                {
                  beneficiaryVerification: AsyncData.P.Done(
                    Result.P.Ok({
                      __typename: "BeneficiaryMatch",
                    }),
                  ),
                },
                () => (
                  <LakeAlert
                    anchored={true}
                    variant="info"
                    title={t("transfer.new.nldValidBankInformation")}
                  />
                ),
              )
              .with(
                {
                  beneficiaryVerification: AsyncData.P.Done(
                    Result.P.Ok({
                      __typename:
                        "BeneficiaryMismatch" ||
                        "InvalidBeneficiaryVerification" ||
                        "BeneficiaryTypo",
                      nameSuggestion: P.select(),
                    }),
                  ),
                },
                nameSuggestion =>
                  isNotNullish(nameSuggestion) ? (
                    <LakeAlert
                      anchored={true}
                      variant="warning"
                      title={t("transfer.new.nldInvalidBeneficiaryVerification.withSuggestion", {
                        nameSuggestion,
                      })}
                    >
                      <LakeText>
                        {t(
                          "transfer.new.nldInvalidBeneficiaryVerification.withSuggestion.description",
                        )}
                      </LakeText>
                    </LakeAlert>
                  ) : (
                    <LakeAlert
                      anchored={true}
                      variant="error"
                      title={t("transfer.new.nldInvalidBeneficiaryVerification.withoutSuggestion", {
                        name: beneficiaryName.value,
                      })}
                    />
                  ),
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
        )}
      </FieldsListener>

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
  isMobile: boolean;
  onPressEdit: () => void;
};

export const TransferWizardBeneficiarySummary = ({
  isMobile,
  beneficiary,
  onPressEdit,
}: SummaryProps) => {
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
