import { AsyncData, Option, Result } from "@swan-io/boxed";
import { useDeferredQuery } from "@swan-io/graphql-client";
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
import { animations, colors, spacings } from "@swan-io/lake/src/constants/design";
import { isNotNullish } from "@swan-io/lake/src/utils/nullish";
import { printIbanFormat, validateIban } from "@swan-io/shared-business/src/utils/validation";
import { combineValidators, useForm } from "@swan-io/use-form";
import { electronicFormat } from "iban";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
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
  loaderBox: {
    backgroundColor: colors.gray[50],
    borderTopColor: colors.gray[200],
    borderTopWidth: 1,
    padding: spacings[24],
  },
});

type Props = {
  accountCountry: AccountCountry;
  accountId: string;
  initialBeneficiary?: Beneficiary;
  mode: "add" | "continue";
  submitting?: boolean;
  onPressSubmit: (beneficiary: Beneficiary) => void;
  onPressPrevious?: () => void;
};

export const BeneficiaryWizard = ({
  accountCountry,
  accountId,
  initialBeneficiary,
  mode,
  submitting = false,
  onPressSubmit,
  onPressPrevious,
}: Props) => {
  const [ibanVerification, { query: queryIbanVerification, reset: resetIbanVerification }] =
    useDeferredQuery(GetIbanValidationDocument, { debounce: 500 });

  const [
    beneficiaryVerification,
    { query: queryBeneficiaryVerification, reset: resetBeneficiaryVerification },
  ] = useDeferredQuery(GetBeneficiaryVerificationDocument, { debounce: 500 });

  const { Field, listenFields, submitForm, FieldsListener, setFieldValue } = useForm({
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
    return listenFields(["iban"], ({ iban }) => {
      if (iban.valid) {
        const isTransferFromDutchAccountToDutchIBAN =
          accountCountry === "NLD" && iban.value.startsWith("NL");

        if (!isTransferFromDutchAccountToDutchIBAN) {
          queryIbanVerification({
            iban: electronicFormat(iban.value),
          });
        }
      } else {
        resetIbanVerification();
        resetBeneficiaryVerification();
      }
    });
  }, [
    accountCountry,
    listenFields,
    queryIbanVerification,
    resetIbanVerification,
    resetBeneficiaryVerification,
  ]);

  useEffect(() => {
    return listenFields(["iban", "name"], ({ iban, name }) => {
      if (iban.valid) {
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
        }
      } else {
        resetIbanVerification();
        resetBeneficiaryVerification();
      }
    });
  }, [
    accountCountry,
    accountId,
    listenFields,
    queryBeneficiaryVerification,
    resetIbanVerification,
    resetBeneficiaryVerification,
  ]);

  const handleOnPressSubmit = () => {
    submitForm({
      onSuccess: values => {
        Option.allFromDict(values).map(beneficiary => onPressSubmit(beneficiary));
      },
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
                  <Box alignItems="center" justifyContent="center" style={styles.loaderBox}>
                    <ActivityIndicator color={colors.gray[700]} />
                  </Box>
                ),
              )
              .with(
                {
                  ibanVerification: AsyncData.P.Done(
                    Result.P.Ok({ __typename: "ValidIban", bank: P.select() }),
                  ),
                },
                ({ name, address }) => (
                  <LakeAlert
                    anchored={true}
                    variant="neutral"
                    title={t("transfer.new.bankInformation")}
                  >
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
                  </LakeAlert>
                ),
              )
              .with(
                {
                  beneficiaryVerification: AsyncData.P.Done(
                    Result.P.Ok({ __typename: "BeneficiaryMatch" }),
                  ),
                },
                () => (
                  <LakeAlert
                    anchored={true}
                    variant="success"
                    title={t("transfer.new.beneficiaryVerification.beneficiaryMatch")}
                  />
                ),
              )
              .with(
                {
                  beneficiaryVerification: AsyncData.P.Done(
                    Result.P.Ok(
                      P.union(
                        { __typename: "InvalidBeneficiaryVerification" },
                        { __typename: "BeneficiaryMismatch", accountStatus: "Inactive" },
                      ),
                    ),
                  ),
                },
                () => (
                  <LakeAlert
                    anchored={true}
                    variant="warning"
                    title={t("transfer.new.beneficiaryVerification.invalidBeneficiary", {
                      name: beneficiaryName.value,
                    })}
                  >
                    {t("transfer.new.beneficiaryVerification.invalidBeneficiary.description")}
                  </LakeAlert>
                ),
              )
              .with(
                {
                  beneficiaryVerification: AsyncData.P.Done(
                    Result.P.Ok({
                      __typename: P.union("BeneficiaryMismatch", "BeneficiaryTypo"),
                      nameSuggestion: P.select(P.nonNullable),
                    }),
                  ),
                },
                nameSuggestion => (
                  <LakeAlert
                    anchored={true}
                    variant="warning"
                    title={t("transfer.new.beneficiaryVerification.mismatchOrTypo.withSuggestion", {
                      nameSuggestion,
                    })}
                  >
                    <LakeText>
                      {t(
                        "transfer.new.beneficiaryVerification.mismatchOrTypo.withSuggestion.description",
                      )}
                    </LakeText>

                    <Space height={12} />

                    <Box alignItems="start">
                      <LakeButton
                        mode="secondary"
                        icon="edit-filled"
                        onPress={() =>
                          setFieldValue("name", nameSuggestion.replaceAll(/[^a-zA-Z ]/g, ""))
                        }
                      >
                        {t(
                          "transfer.new.beneficiaryVerification.mismatchOrTypo.withSuggestion.updateButton",
                        )}
                      </LakeButton>
                    </Box>
                  </LakeAlert>
                ),
              )
              .with(
                {
                  beneficiaryVerification: AsyncData.P.Done(
                    Result.P.Ok({ __typename: P.union("BeneficiaryMismatch", "BeneficiaryTypo") }),
                  ),
                },
                () => (
                  <LakeAlert
                    anchored={true}
                    variant="error"
                    title={t(
                      "transfer.new.beneficiaryVerification.mismatchOrTypo.withoutSuggestion",
                      { name: beneficiaryName.value },
                    )}
                  />
                ),
              )
              .otherwise(() => null)}
          >
            <LakeLabel
              label={t("transfer.new.beneficiary.name")}
              render={id => (
                <Field name="name">
                  {({ value, onChange, onBlur, error, valid, ref }) => {
                    const shouldWarn = match(
                      beneficiaryVerification.mapOk(query => query.beneficiaryVerification),
                    )
                      .with(
                        AsyncData.P.Done(Result.P.Ok({ __typename: P.not("BeneficiaryMatch") })),
                        () => true,
                      )
                      .otherwise(() => false);

                    return (
                      <LakeTextInput
                        id={id}
                        ref={ref}
                        value={value}
                        error={error}
                        valid={!shouldWarn && valid}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        warning={shouldWarn}
                      />
                    );
                  }}
                </Field>
              )}
            />

            <LakeLabel
              label={t("transfer.new.iban.label")}
              render={id => (
                <Field name="iban">
                  {({ value, onChange, onBlur, error, valid, ref }) => {
                    const shouldWarn = match(
                      beneficiaryVerification.mapOk(query => query.beneficiaryVerification),
                    )
                      .with(
                        AsyncData.P.Done(
                          Result.P.Ok(
                            P.union(
                              { __typename: "InvalidBeneficiaryVerification" },
                              { __typename: "BeneficiaryMismatch", accountStatus: "Inactive" },
                            ),
                          ),
                        ),
                        () => true,
                      )
                      .otherwise(() => false);

                    return (
                      <LakeTextInput
                        id={id}
                        ref={ref}
                        placeholder={t("transfer.new.iban.placeholder")}
                        value={printIbanFormat(value)}
                        error={error}
                        valid={!shouldWarn && valid}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        warning={shouldWarn}
                      />
                    );
                  }}
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
            {isNotNullish(onPressPrevious) && (
              <LakeButton
                mode="secondary"
                color="gray"
                onPress={onPressPrevious}
                grow={small}
                disabled={submitting}
              >
                {t("common.previous")}
              </LakeButton>
            )}

            <LakeButton
              color="current"
              onPress={handleOnPressSubmit}
              grow={small}
              loading={submitting}
              icon={mode === "add" ? "add-circle-filled" : undefined}
            >
              {mode === "add" ? t("common.add") : t("common.continue")}
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
