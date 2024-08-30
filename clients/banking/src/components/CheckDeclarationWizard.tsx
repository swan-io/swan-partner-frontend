import { Option } from "@swan-io/boxed";
import { useMutation } from "@swan-io/graphql-client";
import { Box } from "@swan-io/lake/src/components/Box";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { Stack } from "@swan-io/lake/src/components/Stack";
import { Path, Svg } from "@swan-io/lake/src/components/Svg";
import { Tile } from "@swan-io/lake/src/components/Tile";
import {
  colors,
  fonts,
  invariantColors,
  negativeSpacings,
  radii,
  spacings,
} from "@swan-io/lake/src/constants/design";
import { useDisclosure } from "@swan-io/lake/src/hooks/useDisclosure";
import { showToast } from "@swan-io/lake/src/state/toasts";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { emptyToUndefined } from "@swan-io/lake/src/utils/nullish";
import { getRifmProps } from "@swan-io/lake/src/utils/rifm";
import { capitalize, trim } from "@swan-io/lake/src/utils/string";
import { LakeModal } from "@swan-io/shared-business/src/components/LakeModal";
import { translateError } from "@swan-io/shared-business/src/utils/i18n";
import { combineValidators, useForm } from "@swan-io/use-form";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Rifm } from "rifm";
import { match } from "ts-pattern";
import { FnciInfoFragment, InitiateCheckMerchantPaymentDocument } from "../graphql/partner";
import { formatNestedMessage, t } from "../utils/i18n";
import { validateCMC7, validateRequired, validateRLMC } from "../utils/validations";
import { FoldableAlert } from "./FoldableAlert";
import { WizardLayout } from "./WizardLayout";

const CMC7_EXAMPLE = "0000000 000000000000 000000000000";

const rifmCMC7Props = getRifmProps({
  accept: "numeric",
  charMap: { 7: " ", 19: " " },
  maxLength: 31,
});

const styles = StyleSheet.create({
  numberDot: {
    backgroundColor: colors.partner[500],
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    width: 20,
    height: 20,
  },
  numberDotText: {
    fontFamily: fonts.primary,
    color: invariantColors.white,
    fontStyle: "italic",
    textAlign: "center",
    fontSize: 12,
    lineHeight: 20,
  },
  grow: {
    flexGrow: 1,
  },
  rlmcLarge: {
    flexGrow: 1,
    maxWidth: 220,
  },
  check: {
    borderColor: colors.gray[200],
    borderRadius: radii[8],
    borderWidth: 1,
    backgroundColor: invariantColors.white,
    overflow: "hidden",
    paddingTop: spacings[48],
  },
  checkSvg: {
    paddingHorizontal: spacings[12],
  },
  checkRight: {
    padding: spacings[12],
  },
  checkBottom: {
    backgroundColor: colors.gray[50],
    paddingVertical: spacings[12],
    paddingHorizontal: spacings[16],
  },
  checkText: {
    fontSize: 12,
    fontStyle: "italic",
  },
  italic: {
    fontStyle: "italic",
  },
  expandButton: {
    position: "absolute",
    top: negativeSpacings[8],
    right: negativeSpacings[8],
  },
});

const NumberDot = ({ value }: { value: number }) => (
  <View style={styles.numberDot}>
    <Text style={styles.numberDotText}>{value}</Text>
  </View>
);

type CollapsedCheck = {
  label: string;
  amount: string;
  cmc7: string;
  rlmcKey: string;
  fnciInfo: FnciInfoFragment;
};

const CollapsedCheck = ({
  label,
  amount,
  cmc7,
  rlmcKey,
  fnciInfo,
  large,
  title,
}: CollapsedCheck & {
  large: boolean;
  title: string;
}) => {
  const [opened, setOpened] = useDisclosure(false);
  const { colorCode: code, cpt1, cpt2, cpt3, holderEstablishment: bank } = fnciInfo;

  return (
    <Tile
      title={title}
      headerEnd={
        <LakeButton
          aria-expanded={opened}
          icon={opened ? "chevron-up-filled" : "chevron-down-filled"}
          ariaLabel={opened ? t("common.collapse") : t("common.expand")}
          size="small"
          mode="tertiary"
          onPress={setOpened.toggle}
          style={styles.expandButton}
        />
      }
      footer={
        <FoldableAlert
          variant="success"
          title={t("check.fnci.successTitle")}
          more={
            <LakeText variant="smallRegular">
              {`${t("check.fnci.successSubtitle")}\n\n• `}

              {formatNestedMessage("check.fnci.code", {
                code: capitalize(code.toLowerCase()),
                bold: text => <LakeText variant="smallSemibold">{text}</LakeText>,
              })}

              {`\n• ${t("check.fnci.cpt", { cpt1, cpt2, cpt3 })}`}
              {`\n• ${t("check.fnci.holderBank", { bank })}\n\n`}

              <Text style={styles.italic}>{t("check.fnci.notice")}</Text>
            </LakeText>
          }
        />
      }
    >
      {opened ? (
        <>
          <LakeLabel
            label={t("check.form.customLabel")}
            optionalLabel={t("form.optional")}
            render={id => <LakeTextInput id={id} readOnly={true} value={label} />}
          />

          <Space height={8} />

          <LakeLabel
            label={t("check.form.amount")}
            render={id => <LakeTextInput id={id} readOnly={true} value={amount} unit="EUR" />}
          />

          <Box direction={large ? "row" : "column"} alignItems={large ? "center" : "stretch"}>
            <LakeLabel
              label={t("check.form.cmc7")}
              render={id => <LakeTextInput id={id} readOnly={true} value={cmc7} />}
              style={styles.grow}
            />

            <Space width={32} />

            <LakeLabel
              label={t("check.form.rlmc")}
              render={id => <LakeTextInput id={id} readOnly={true} value={rlmcKey} />}
              style={large && styles.rlmcLarge}
            />
          </Box>
        </>
      ) : null}
    </Tile>
  );
};

type Props = {
  merchantProfileId: string;
  onPressClose?: () => void;
};

export const CheckDeclarationWizard = ({ merchantProfileId, onPressClose }: Props) => {
  const [collapsedChecks, setCollapsedChecks] = useState<CollapsedCheck[]>([]);
  const [helpModalVisible, setHelpModal] = useDisclosure(false);
  const [declareOnly, declareOnlyData] = useMutation(InitiateCheckMerchantPaymentDocument);
  const [declareAndAdd, declareAndAddData] = useMutation(InitiateCheckMerchantPaymentDocument);

  const { Field, resetForm, submitForm } = useForm({
    label: {
      initialValue: "",
      sanitize: trim,
    },
    amount: {
      initialValue: "",
      sanitize: value => value.replace(/,/g, ".").replace(/\s/g, ""),
      validate: value => {
        const number = Number(value);

        if (Number.isNaN(number) || number <= 0) {
          return t("common.form.invalidAmount");
        }
        if (number > 10000) {
          return t("check.form.error.amountTooHigh");
        }
      },
    },
    cmc7: {
      initialValue: "",
      sanitize: value => value.replace(/\s/g, ""),
      validate: combineValidators(validateRequired, validateCMC7),
    },
    rlmcKey: {
      initialValue: "",
      validate: combineValidators(validateRequired, validateRLMC),
    },
  });

  return (
    <WizardLayout title={t("check.form.title")} onPressClose={onPressClose}>
      {({ large }) => (
        <>
          <LakeHeading level={2} variant="h3">
            {t("check.form.subtitle")}
          </LakeHeading>

          <Space height={8} />
          <LakeText variant="smallRegular">{t("check.form.description")}</LakeText>
          <Space height={32} />

          {collapsedChecks.length > 0 && (
            <>
              <Stack space={32}>
                {collapsedChecks.map((check, index) => (
                  <CollapsedCheck
                    key={`${check.cmc7}-${index}`}
                    label={check.label}
                    amount={check.amount}
                    cmc7={check.cmc7}
                    rlmcKey={check.rlmcKey}
                    fnciInfo={check.fnciInfo}
                    large={large}
                    title={t("check.form.checkTitle", {
                      number: index + 1,
                    })}
                  />
                ))}
              </Stack>

              <Space height={32} />
            </>
          )}

          <Tile
            title={t("check.form.checkTitle", {
              number: collapsedChecks.length + 1,
            })}
            footer={
              // TODO: change this
              // <FoldableAlert
              //   variant="error"
              //   title="Check failed FNCI verification"
              //   description="toto"
              // />
              null
            }
          >
            <LakeLabel
              label={t("check.form.customLabel")}
              optionalLabel={t("form.optional")}
              render={id => (
                <Field name="label">
                  {({ ref, error, valid, value, onBlur, onChange }) => (
                    <LakeTextInput
                      ref={ref}
                      id={id}
                      error={error}
                      valid={valid}
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                    />
                  )}
                </Field>
              )}
            />

            <Space height={8} />

            <LakeLabel
              label={t("check.form.amount")}
              render={id => (
                <Field name="amount">
                  {({ ref, error, valid, value, onBlur, onChange }) => (
                    <LakeTextInput
                      ref={ref}
                      id={id}
                      error={error}
                      valid={valid}
                      value={value}
                      unit="EUR"
                      onBlur={onBlur}
                      onChangeText={onChange}
                    />
                  )}
                </Field>
              )}
            />

            <Box direction={large ? "row" : "column"} alignItems={large ? "center" : "stretch"}>
              <LakeLabel
                label={t("check.form.cmc7")}
                style={styles.grow}
                help={
                  <LakeButton
                    mode="tertiary"
                    size="small"
                    color="gray"
                    icon="question-circle-regular"
                    onPress={setHelpModal.open}
                    ariaLabel={t("common.help.whatIsThis")}
                  >
                    {t("common.help.whatIsThis")}
                  </LakeButton>
                }
                render={id => (
                  <Field name="cmc7">
                    {({ ref, error, valid, value, onBlur, onChange }) => (
                      <Rifm value={value} onChange={onChange} {...rifmCMC7Props}>
                        {({ value, onChange }) => (
                          <LakeTextInput
                            ref={ref}
                            id={id}
                            error={error}
                            valid={valid}
                            value={value}
                            placeholder={CMC7_EXAMPLE}
                            onBlur={onBlur}
                            onChange={onChange}
                          />
                        )}
                      </Rifm>
                    )}
                  </Field>
                )}
              />

              <Space width={32} />

              <LakeLabel
                label={t("check.form.rlmc")}
                style={large && styles.rlmcLarge}
                help={
                  <LakeButton
                    mode="tertiary"
                    size="small"
                    color="gray"
                    icon="question-circle-regular"
                    ariaLabel={t("common.help.whatIsThis")}
                    onPress={setHelpModal.open}
                  >
                    {t("common.help.whatIsThis")}
                  </LakeButton>
                }
                render={id => (
                  <Field name="rlmcKey">
                    {({ ref, error, valid, value, onBlur, onChange }) => (
                      <LakeTextInput
                        ref={ref}
                        id={id}
                        error={error}
                        valid={valid}
                        value={value}
                        placeholder="00"
                        onBlur={onBlur}
                        onChangeText={text => {
                          // replace all non-digits characters
                          onChange(text.replace(/[^\d]/g, ""));
                        }}
                      />
                    )}
                  </Field>
                )}
              />
            </Box>
          </Tile>

          <Space height={20} />

          <ResponsiveContainer breakpoint={800}>
            {({ small }) => (
              <LakeButtonGroup>
                <LakeButton
                  color="current"
                  grow={small}
                  disabled={declareAndAddData.isLoading()}
                  loading={declareOnlyData.isLoading()}
                  onPress={() => {}}
                >
                  {t("check.form.declare")}
                </LakeButton>

                <LakeButton
                  icon="add-circle-regular"
                  mode="secondary"
                  grow={small}
                  disabled={declareOnlyData.isLoading()}
                  loading={declareAndAddData.isLoading()}
                  onPress={() => {
                    submitForm({
                      onSuccess: values => {
                        const option = Option.allFromDict(values);

                        if (option.isSome()) {
                          const check = option.get();

                          return declareAndAdd({
                            input: {
                              merchantProfileId,
                              label: emptyToUndefined(check.label),
                              cmc7: check.cmc7,
                              rlmcKey: check.rlmcKey,
                              amount: {
                                currency: "EUR",
                                value: check.amount,
                              },
                            },
                          })
                            .mapOk(data => data.initiateCheckMerchantPayment)
                            .mapOkToResult(data => Option.fromNullable(data).toResult(undefined))
                            .mapOkToResult(filterRejectionsToResult)
                            .tapOk(({ fnciInfo }) => {
                              setCollapsedChecks(prevChecks => [
                                ...prevChecks,
                                { ...check, fnciInfo },
                              ]);

                              resetForm();

                              // match(trustedBeneficiary.statusInfo)
                              //   .with(
                              //     { __typename: "TrustedBeneficiaryConsentPendingStatusInfo" },
                              //     ({ consent }) => window.location.assign(consent.consentUrl),
                              //   )
                              //   .otherwise(() => {});
                            })
                            .tapError(error => {
                              match(error)
                                .with({ __typename: "CheckRejection" }, () => {
                                  // TODO: add an alert
                                })
                                .otherwise(error => {
                                  showToast({
                                    variant: "error",
                                    error,
                                    title: translateError(error),
                                  });
                                });
                            });
                        }
                      },
                    });
                  }}
                >
                  {t("check.form.declareAndAdd")}
                </LakeButton>
              </LakeButtonGroup>
            )}
          </ResponsiveContainer>

          <LakeModal
            title={t("check.form.modal.title")}
            visible={helpModalVisible}
            onPressClose={setHelpModal.close}
          >
            <Space height={8} />

            <View role="img" style={styles.check}>
              <Svg viewBox="0 0 448 69" style={styles.checkSvg}>
                <Path
                  d="M0 1.91a1 1 0 011-1h300a1 1 0 010 2H1a1 1 0 01-1-1zm0 28a1 1 0 011-1h300a1 1 0 010 2H1a1 1 0 01-1-1zm1-15a1 1 0 100 2h300a1 1 0 000-2H1zm333 39a1 1 0 011-1h112a1 1 0 010 2H335a1 1 0 01-1-1zm1 13a1 1 0 000 2h112a1 1 0 000-2H335z"
                  fill={colors.gray[100]}
                />

                <Path d="M334 12.787h113.972v25.934H334z" fill={colors.gray[50]} />
              </Svg>

              <Box
                alignItems="center"
                direction="row"
                justifyContent="end"
                style={styles.checkRight}
              >
                <NumberDot value={2} />
                <Space width={8} />

                <LakeText color={colors.gray[600]} numberOfLines={1} style={styles.checkText}>
                  (00)
                </LakeText>
              </Box>

              <Box alignItems="center" direction="row" style={styles.checkBottom}>
                <NumberDot value={1} />
                <Space width={8} />

                <LakeText color={colors.gray[600]} numberOfLines={1} style={styles.checkText}>
                  {CMC7_EXAMPLE}
                </LakeText>
              </Box>
            </View>

            <Space height={32} />

            <Box direction="row" alignItems="center">
              <NumberDot value={1} />
              <Space width={12} />

              <LakeText variant="smallRegular">
                {formatNestedMessage("check.form.modal.cmc7", {
                  bold: text => <LakeText variant="smallMedium">{text}</LakeText>,
                })}
              </LakeText>
            </Box>

            <Space height={12} />

            <Box direction="row" alignItems="center">
              <NumberDot value={2} />
              <Space width={12} />

              <LakeText variant="smallRegular">
                {formatNestedMessage("check.form.modal.rlmc", {
                  bold: text => <LakeText variant="smallMedium">{text}</LakeText>,
                })}
              </LakeText>
            </Box>
          </LakeModal>
        </>
      )}
    </WizardLayout>
  );
};
