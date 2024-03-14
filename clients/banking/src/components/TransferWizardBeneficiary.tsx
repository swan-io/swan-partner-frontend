import { AsyncData, Future } from "@swan-io/boxed";
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
import { isNotNullish } from "@swan-io/lake/src/utils/nullish";
import { parseOperationResult } from "@swan-io/lake/src/utils/urql";
import { printIbanFormat, validateIban } from "@swan-io/shared-business/src/utils/validation";
import { electronicFormat } from "iban";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { combineValidators, hasDefinedKeys, useForm } from "react-ux-form";
import { P, match } from "ts-pattern";
import {
  AccountCountry,
  GetBeneficiaryVerificationDocument,
  GetBeneficiaryVerificationQuery,
  GetIbanValidationDocument,
  GetIbanValidationQuery,
} from "../graphql/partner";
import { t } from "../utils/i18n";
import { partnerClient } from "../utils/urql";
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
  const [ibanState, setIbanState] = useState<
    AsyncData<
      | {
          type: "ibanValidation";
          data: GetIbanValidationQuery["ibanValidation"];
        }
      | {
          type: "beneficiaryVerification";
          data: GetBeneficiaryVerificationQuery["beneficiaryVerification"];
        }
    >
  >(AsyncData.NotAsked());

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
        setIbanState(AsyncData.NotAsked());
      }

      setIbanState(AsyncData.Loading());

      const isTransferFromDutchAccountToDutchIBAN =
        accountCountry === "NLD" && iban.value.startsWith("NL");

      if (isTransferFromDutchAccountToDutchIBAN) {
        Future.fromPromise(
          partnerClient
            .query(GetBeneficiaryVerificationDocument, {
              // query needed only for NLD accounts
              input: {
                debtorAccountId: accountId,
                iban: iban.value,
                name: name.value,
              },
            })
            .toPromise()
            .then(parseOperationResult),
        )
          .mapOk(data => data.beneficiaryVerification)
          .tapOk(data => setIbanState(AsyncData.Done({ type: "beneficiaryVerification", data })))
          .tapError(() => setIbanState(AsyncData.NotAsked()));
      } else {
        Future.fromPromise(
          partnerClient
            .query(GetIbanValidationDocument, {
              iban: iban.value,
            })
            .toPromise()
            .then(parseOperationResult),
        )
          .mapOk(data => data.ibanValidation)
          .tapOk(data => setIbanState(AsyncData.Done({ type: "ibanValidation", data })))
          .tapError(() => setIbanState(AsyncData.NotAsked()));
      }
    });
  }, [accountCountry, accountId, listenFields]);

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
            footer={match(ibanState)
              .with(AsyncData.P.Loading, () => (
                <LakeAlert anchored={true} variant="neutral" title="">
                  <ActivityIndicator color={colors.gray[700]} />
                </LakeAlert>
              ))
              .with(
                AsyncData.P.Done({
                  type: "ibanValidation",
                  data: {
                    __typename: "ValidIban",
                    bank: P.select(),
                  },
                }),
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
                AsyncData.P.Done({
                  type: "beneficiaryVerification",
                  data: {
                    __typename: "BeneficiaryMatch",
                  },
                }),
                () => (
                  <LakeAlert
                    anchored={true}
                    variant="neutral"
                    title={t("transfer.new.bankInformation")}
                  >
                    <LakeText>{t("transfer.new.nldValidBankInformation")}</LakeText>
                  </LakeAlert>
                ),
              )
              .with(
                AsyncData.P.Done({
                  type: "beneficiaryVerification",
                  data: {
                    __typename: "BeneficiaryMismatch",
                    nameSuggestion: P.select(),
                  },
                }),
                nameSuggestion => (
                  <LakeAlert
                    anchored={true}
                    variant="neutral"
                    title={t("transfer.new.bankInformation")}
                  >
                    {isNotNullish(nameSuggestion) ? (
                      <LakeText>
                        {t("transfer.new.nldInvalidBeneficiaryVerification.withSuggestion", {
                          nameSuggestion,
                        })}
                      </LakeText>
                    ) : (
                      <LakeText>
                        {t("transfer.new.nldInvalidBeneficiaryVerification.withoutSuggestion", {
                          name: beneficiaryName.value,
                        })}
                      </LakeText>
                    )}
                  </LakeAlert>
                ),
              )
              .with(
                AsyncData.P.Done({
                  type: "beneficiaryVerification",
                  data: {
                    __typename: "InvalidBeneficiaryVerification",
                    message: P.select(),
                  },
                }),
                message => (
                  <LakeAlert
                    anchored={true}
                    variant="neutral"
                    title={t("transfer.new.bankInformation")}
                  >
                    <LakeText>{message}</LakeText>
                  </LakeAlert>
                ),
              )
              .with(
                AsyncData.P.Done({
                  type: "beneficiaryVerification",
                  data: {
                    __typename: "BeneficiaryTypo",
                    nameSuggestion: P.select(),
                  },
                }),
                nameSuggestion =>
                  isNotNullish(nameSuggestion) ? (
                    <LakeAlert
                      anchored={true}
                      variant="neutral"
                      title={t("transfer.new.bankInformation")}
                    >
                      <LakeText>
                        {t("transfer.new.nldInvalidBeneficiaryVerification.withSuggestion", {
                          nameSuggestion,
                        })}
                      </LakeText>
                    </LakeAlert>
                  ) : (
                    <LakeAlert
                      anchored={true}
                      variant="neutral"
                      title={t("transfer.new.bankInformation")}
                    >
                      <LakeText>{t("transfer.new.nldBeneficiaryTypo")}</LakeText>
                    </LakeAlert>
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
