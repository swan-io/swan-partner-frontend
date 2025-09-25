import { AsyncData, Option, Result } from "@swan-io/boxed";
import { useDeferredQuery, useMutation } from "@swan-io/graphql-client";
import { Box } from "@swan-io/lake/src/components/Box";
import { Icon } from "@swan-io/lake/src/components/Icon";
import { LakeAlert } from "@swan-io/lake/src/components/LakeAlert";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeLabelledCheckbox } from "@swan-io/lake/src/components/LakeCheckbox";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { animations, colors, spacings } from "@swan-io/lake/src/constants/design";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { isNotNullish } from "@swan-io/lake/src/utils/nullish";
import { printIbanFormat, validateIban } from "@swan-io/shared-business/src/utils/validation";
import { combineValidators, useForm } from "@swan-io/use-form";
import { electronicFormat } from "iban";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { P, match } from "ts-pattern";
import {
  AccountCountry,
  GetIbanValidationDocument,
  VerifyBeneficiaryDocument,
  VerifyBeneficiarySuccessPayloadFragment,
} from "../graphql/partner";
import { formatNestedMessage, t } from "../utils/i18n";
import { validateBeneficiaryName, validateRequired } from "../utils/validations";

export type SepaBeneficiary = (
  | {
      kind: "new";
      save: boolean;
      beneficiaryVerification?: VerifyBeneficiarySuccessPayloadFragment;
    }
  | { kind: "saved"; id: string; beneficiaryVerification?: VerifyBeneficiarySuccessPayloadFragment }
) & {
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
  nameSuggestion: {
    fontStyle: "italic",
    textDecorationStyle: "solid",
    textDecorationColor: "inherit",
    textDecorationLine: "underline",
  },
  nameSuggestionSummary: {
    fontStyle: "italic",
  },
  icon: {
    display: "inline-flex",
    alignSelf: "center",
    marginRight: spacings[8],
  },
});

type Props = {
  mode: "add" | "continue";
  accountCountry: AccountCountry;
  submitting?: boolean;
  onPressSubmit: (beneficiary: SepaBeneficiary) => void;
  onPressPrevious?: () => void;
  // Enforce prefill with new beneficiary data only
  initialBeneficiary?: Extract<SepaBeneficiary, { kind: "new" }>;
  saveCheckboxVisible: boolean;
};

export const BeneficiarySepaWizardForm = ({
  mode,
  accountCountry,
  submitting = false,
  initialBeneficiary,
  saveCheckboxVisible,
  onPressSubmit,
  onPressPrevious,
}: Props) => {
  const [saveBeneficiary, setSaveBeneficiary] = useState(
    saveCheckboxVisible && initialBeneficiary?.kind === "new" && initialBeneficiary.save,
  );

  const [ibanVerification, { query: queryIbanVerification, reset: resetIbanVerification }] =
    useDeferredQuery(GetIbanValidationDocument, { debounce: 500 });

  const [verifyBeneficiary, beneficiaryVerification, { reset: resetBeneficiaryVerification }] =
    useMutation(VerifyBeneficiaryDocument);

  const { Field, listenFields, submitForm, setFieldValue } = useForm({
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
      if (iban.valid) {
        verifyBeneficiary({
          input: {
            beneficiary: {
              sepa: {
                name: name.value,
                iban: electronicFormat(iban.value),
                save: saveBeneficiary,
              },
            },
          },
        });
      } else {
        resetBeneficiaryVerification();
      }
    });
  }, [
    accountCountry,
    listenFields,
    verifyBeneficiary,
    resetBeneficiaryVerification,
    saveBeneficiary,
  ]);

  useEffect(() => {
    return listenFields(["iban"], ({ iban }) => {
      if (iban.valid) {
        queryIbanVerification({ iban: electronicFormat(iban.value) });
      } else {
        resetIbanVerification();
      }
    });
  }, [queryIbanVerification, resetIbanVerification]);

  const handleOnPressSubmit = () => {
    submitForm({
      onSuccess: values => {
        Option.allFromDict({
          ...values,
          beneficiaryVerification: beneficiaryVerification
            .mapOk(value => value.verifyBeneficiary)
            .mapOkToResult(filterRejectionsToResult)
            .toOption()
            .flatMap(value => value.toOption()),
        }).map(({ beneficiaryVerification, ...rest }) =>
          onPressSubmit({
            kind: "new",
            save: saveBeneficiary,
            beneficiaryVerification,
            ...rest,
          }),
        );
      },
    });
  };

  return (
    <>
      <Tile
        style={animations.fadeAndSlideInFromBottom.enter}
        footer={match(
          beneficiaryVerification
            .mapOk(data => data.verifyBeneficiary)
            .mapOkToResult(filterRejectionsToResult)
            .mapOk(data => data.verifyBeneficiaryResult),
        )
          .with(AsyncData.P.Loading, () => (
            <Box alignItems="center" justifyContent="center" style={styles.loaderBox}>
              <ActivityIndicator color={colors.gray[500]} />
            </Box>
          ))

          .with(AsyncData.P.Done(Result.P.Ok({ __typename: "VerifyBeneficiaryNoMatch" })), () => (
            <LakeAlert
              anchored={true}
              variant="error"
              title={formatNestedMessage("transfer.new.beneficiaryVerification.alert.noMatch", {
                bold: value => (
                  <LakeText variant="semibold" color="inherit">
                    {value}
                  </LakeText>
                ),
              })}
            />
          ))
          .with(
            AsyncData.P.Done(Result.P.Ok({ __typename: "VerifyBeneficiaryNotPossible" })),
            () => (
              <LakeAlert
                anchored={true}
                variant="warning"
                title={formatNestedMessage(
                  "transfer.new.beneficiaryVerification.alert.notPossible",
                  {
                    bold: value => (
                      <LakeText variant="semibold" color="inherit">
                        {value}
                      </LakeText>
                    ),
                  },
                )}
              />
            ),
          )
          .with(
            AsyncData.P.Done(
              Result.P.Ok({
                __typename: "VerifyBeneficiaryCloseMatch",
              }),
            ),
            () => (
              <LakeAlert
                anchored={true}
                variant="info"
                title={formatNestedMessage(
                  "transfer.new.beneficiaryVerification.alert.closeMatch",
                  {
                    bold: value => (
                      <LakeText variant="semibold" color="inherit">
                        {value}
                      </LakeText>
                    ),
                  },
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
                const mode = match(
                  beneficiaryVerification
                    .mapOk(data => data.verifyBeneficiary)
                    .mapOkToResult(filterRejectionsToResult)
                    .mapOk(data => data.verifyBeneficiaryResult),
                )
                  .with(
                    AsyncData.P.Done(
                      Result.P.Ok(P.select({ __typename: "VerifyBeneficiaryCloseMatch" })),
                    ),
                    ({ nameSuggestion }) => ({ type: "info", nameSuggestion }) as const,
                  )
                  .with(
                    AsyncData.P.Done(Result.P.Ok({ __typename: "VerifyBeneficiaryNotPossible" })),
                    () => ({ type: "warn" }) as const,
                  )
                  .with(
                    AsyncData.P.Done(Result.P.Ok({ __typename: "VerifyBeneficiaryNoMatch" })),
                    () => ({ type: "error" }) as const,
                  )
                  .otherwise(() => undefined);

                return (
                  <LakeTextInput
                    id={id}
                    ref={ref}
                    value={value}
                    error={error ?? (mode?.type === "error" ? " " : undefined)}
                    valid={mode === undefined && valid}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    warning={mode?.type === "warn"}
                    info={
                      mode?.type === "info"
                        ? formatNestedMessage(
                            "transfer.new.beneficiaryVerification.input.closeMatch",
                            {
                              name: value => (
                                <LakeText
                                  variant="smallRegular"
                                  color="inherit"
                                  style={styles.nameSuggestion}
                                  onPress={() => setFieldValue("name", mode.nameSuggestion)}
                                >
                                  {value}
                                </LakeText>
                              ),
                              nameSuggestion: mode.nameSuggestion,
                            },
                          )
                        : undefined
                    }
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
                return (
                  <LakeTextInput
                    id={id}
                    ref={ref}
                    placeholder={t("transfer.new.iban.placeholder")}
                    value={printIbanFormat(value)}
                    error={error}
                    valid={valid}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    help={match(ibanVerification.mapOk(value => value.ibanValidation))
                      .with(
                        AsyncData.P.Done(Result.P.Ok(P.select({ __typename: "ValidIban" }))),
                        ({ bank }) => bank.name,
                      )
                      .otherwise(() => undefined)}
                  />
                );
              }}
            </Field>
          )}
        />

        {saveCheckboxVisible && (
          <>
            <Space height={4} />

            <LakeLabelledCheckbox
              label={t("transfer.new.beneficiary.save")}
              value={saveBeneficiary}
              onValueChange={setSaveBeneficiary}
            />
          </>
        )}
      </Tile>

      <Space height={16} />

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
  beneficiary: SepaBeneficiary;
  isMobile: boolean;
  onPressEdit?: () => void;
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
            {match(beneficiary.beneficiaryVerification?.verifyBeneficiaryResult)
              .with({ __typename: "VerifyBeneficiaryMatch" }, () => (
                <Icon
                  size={14}
                  name="lake-check"
                  color={colors.positive[500]}
                  style={styles.icon}
                />
              ))
              .with({ __typename: "VerifyBeneficiaryNoMatch" }, () => (
                <Icon
                  size={14}
                  name="warning-regular"
                  color={colors.negative[500]}
                  style={styles.icon}
                />
              ))
              .with({ __typename: "VerifyBeneficiaryNotPossible" }, () => (
                <Icon
                  size={14}
                  name="warning-regular"
                  color={colors.warning[500]}
                  style={styles.icon}
                />
              ))
              .with(
                {
                  __typename: "VerifyBeneficiaryCloseMatch",
                },
                () => (
                  <Icon
                    size={14}
                    name="info-regular"
                    color={colors.shakespear[500]}
                    style={styles.icon}
                  />
                ),
              )
              .otherwise(() => null)}

            {beneficiary.name}
          </LakeText>

          <LakeText variant="smallRegular" color={colors.gray[500]}>
            {printIbanFormat(beneficiary.iban)}
          </LakeText>

          {match(beneficiary.beneficiaryVerification?.verifyBeneficiaryResult)
            .with({ __typename: "VerifyBeneficiaryMatch" }, () => (
              <>
                <Space height={8} />

                <LakeText variant="smallRegular" color={colors.gray[500]}>
                  {t("transfer.new.beneficiaryVerification.summary.match")}
                </LakeText>
              </>
            ))
            .with({ __typename: "VerifyBeneficiaryNoMatch" }, () => (
              <>
                <Space height={8} />

                <LakeText variant="smallRegular" color={colors.gray[500]}>
                  {t("transfer.new.beneficiaryVerification.summary.noMatch")}
                </LakeText>
              </>
            ))
            .with({ __typename: "VerifyBeneficiaryNotPossible" }, () => (
              <>
                <Space height={8} />

                <LakeText variant="smallRegular" color={colors.gray[500]}>
                  {t("transfer.new.beneficiaryVerification.summary.notPossible")}
                </LakeText>
              </>
            ))
            .with(
              {
                __typename: "VerifyBeneficiaryCloseMatch",
              },
              ({ nameSuggestion }) => (
                <>
                  <Space height={8} />

                  <LakeText variant="smallRegular" color={colors.gray[500]}>
                    {formatNestedMessage(
                      "transfer.new.beneficiaryVerification.summary.closeMatch",
                      {
                        name: value => (
                          <LakeText
                            variant="smallSemibold"
                            color="inherit"
                            style={styles.nameSuggestionSummary}
                          >
                            {value}
                          </LakeText>
                        ),
                        nameSuggestion,
                      },
                    )}
                  </LakeText>
                </>
              ),
            )
            .otherwise(() => null)}
        </View>

        {isNotNullish(onPressEdit) && (
          <LakeButton
            mode="tertiary"
            icon="edit-regular"
            ariaLabel={t("common.edit")}
            onPress={onPressEdit}
          >
            {isMobile ? null : t("common.edit")}
          </LakeButton>
        )}
      </Box>
    </Tile>
  );
};
