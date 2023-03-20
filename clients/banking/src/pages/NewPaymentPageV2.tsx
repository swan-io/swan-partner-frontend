import { Result, Option } from "@swan-io/boxed";
import { Box } from "@swan-io/lake/src/components/Box";
import { LakeAlert } from "@swan-io/lake/src/components/LakeAlert";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeLabelledCheckbox } from "@swan-io/lake/src/components/LakeCheckbox";
import { LakeCopyButton } from "@swan-io/lake/src/components/LakeCopyButton";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeModal } from "@swan-io/lake/src/components/LakeModal";
import { LakeScrollView } from "@swan-io/lake/src/components/LakeScrollView";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { LoadingView } from "@swan-io/lake/src/components/LoadingView";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { breakpoints, colors } from "@swan-io/lake/src/constants/design";
import { useUrqlMutation } from "@swan-io/lake/src/hooks/useUrqlMutation";
import { useUrqlQuery } from "@swan-io/lake/src/hooks/useUrqlQuery";
import { showToast } from "@swan-io/lake/src/state/toasts";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { combineValidators, hasDefinedKeys, useForm } from "react-ux-form";
import { match, P } from "ts-pattern";
import { ErrorView } from "../components/ErrorView";
import { FieldsetTitle } from "../components/FormText";
import {
  GetAccountDocument,
  InitiateCreditTransfersInput,
  InitiateSepaCreditTransfersDocument,
} from "../graphql/partner";
import { formatCurrency, t } from "../utils/i18n";
import * as iban from "../utils/iban";
import { Router } from "../utils/routes";
import {
  REFERENCE_MAX_LENGTH,
  validateAccountNameLength,
  validateReference,
  validateRequired,
  validateSepaBeneficiaryNameAlphabet,
} from "../utils/validations";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    width: "100%",
    maxWidth: 1300,
    marginHorizontal: "auto",
  },
  inlineInput: {
    flex: 1,
  },
  confirmButtonDesktop: {
    alignSelf: "flex-start",
    minWidth: 300,
  },
});

const MIN_AMOUNT = 0;

type Props = {
  accountId: string;
  accountMembershipId: string;
  onClose: () => void;
};

export const NewPaymentPageV2 = ({ accountId, accountMembershipId, onClose }: Props) => {
  const [transfer, initiateTransfers] = useUrqlMutation(InitiateSepaCreditTransfersDocument);
  const { data } = useUrqlQuery({ query: GetAccountDocument, variables: { accountId } }, []);
  const [insufisantBalanceOpened, setInsufisantBalanceOpened] = useState(false);

  const availableBalance = data.mapResult(({ account }) => {
    if (account?.balances?.available) {
      return Result.Ok({
        amount: Number(account.balances.available.value),
        currency: account.balances.available.currency,
      });
    }
    return Result.Error(new Error("No available balance"));
  });

  const accountIban = data
    .toOption()
    .flatMap(result => result.toOption())
    .flatMap(({ account }) => Option.fromUndefined(account?.IBAN ?? undefined));

  const { Field, submitForm } = useForm({
    creditorIban: {
      initialValue: "",
      sanitize: iban.printFormat,
      validate: value => {
        if (!iban.isValid(value)) {
          return t("error.invalidIban");
        }
      },
    },
    creditorName: {
      initialValue: "",
      validate: combineValidators(
        validateRequired,
        validateSepaBeneficiaryNameAlphabet,
        validateAccountNameLength,
      ),
      sanitize: value => value.trim(),
    },
    transferAmount: {
      initialValue: "",
      sanitize: value => value.replace(/,/g, ".").replace(/[^0-9.]/g, ""),
      validate: value => {
        const amount = Number(value);

        if (Number.isNaN(amount) || value === "" || amount === 0) {
          return t("error.invalidTransferAmount");
        }
      },
    },
    transferLabel: {
      initialValue: "",
      sanitize: value => value.trim(),
      validate: value => {
        if (value !== "" && value.length > 140) {
          return t("error.transferLabelTooLong");
        }
      },
    },
    transferReference: {
      initialValue: "",
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
      if (
        hasDefinedKeys(values, [
          "creditorIban",
          "creditorName",
          "transferAmount",
          "transferLabel",
          "transferReference",
          "isInstant",
        ])
      ) {
        const maximumAmount = availableBalance
          .toOption()
          .flatMap(balance => balance.toOption())
          .map(({ amount }) => amount)
          .getWithDefault(0);
        if (maximumAmount < Number(values.transferAmount)) {
          setInsufisantBalanceOpened(true);
          return;
        }

        const input: InitiateCreditTransfersInput = {
          accountId,
          consentRedirectUrl:
            window.location.origin +
            Router.AccountTransactionsListRoot({ accountMembershipId }),
          creditTransfers: [
            {
              amount: { currency: "EUR", value: values.transferAmount },
              label: values.transferLabel ? values.transferLabel : null,
              reference: values.transferReference ? values.transferReference : null,
              sepaBeneficiary: {
                name: values.creditorName,
                save: false,
                iban: values.creditorIban,
                isMyOwnIban: false, // TODO
              },
              isInstant: values.isInstant,
            },
          ],
        };

        initiateTransfers({ input })
          .mapResult(response =>
            match(response.initiateCreditTransfers)
              .with(
                P.nullish,
                { __typename: "AccountNotFoundRejection" },
                { __typename: "ForbiddenRejection" },
                error => Result.Error(error),
              )
              .with({ __typename: "InitiateCreditTransfersSuccessPayload" }, response =>
                Result.Ok(response),
              )
              .exhaustive(),
          )
          .tapOk(({ payment }) => {
            const status = payment.statusInfo;
            const params = { paymentId: payment.id, accountMembershipId };

            return match(status)
              .with({ __typename: "PaymentInitiated" }, () =>
                Router.replace("AccountPaymentsSuccess", params),
              )
              .with({ __typename: "PaymentRejected" }, () =>
                Router.replace("AccountPaymentsFailure", params),
              )
              .with({ __typename: "PaymentConsentPending" }, ({ consent }) => {
                window.location.assign(consent.consentUrl);
              })
              .exhaustive();
          })
          .tapError(() => showToast({ variant: "error", title: t("error.generic") }));
      }
    });
  };

  return (
    <>
      <ResponsiveContainer breakpoint={breakpoints.medium} style={styles.container}>
        {({ small, large }) => (
          <>
            <Box direction="row" alignItems="center">
              <LakeButton mode="tertiary" icon="lake-close" onPress={onClose} />
              <Space width={8} />

              <LakeHeading level={1} variant="h3">
                {t("transfer.new.title")}
              </LakeHeading>
            </Box>

            <Space height={20} />

            {availableBalance.match({
              NotAsked: () => null,
              Loading: () => <LoadingView />,
              Done: result =>
                result.match({
                  Ok: ({ amount, currency }) => (
                    <LakeScrollView
                      style={commonStyles.fill}
                      contentContainerStyle={commonStyles.fill}
                    >
                      {amount <= MIN_AMOUNT && (
                        <>
                          <LakeAlert variant="warning" title={t("transfer.new.lowBalance")} />
                          <Space height={24} />
                        </>
                      )}

                      <LakeText variant="smallRegular">
                        {t("transfer.new.availableBalance")}
                      </LakeText>

                      <Space height={8} />

                      <LakeHeading level={2} variant="h1">
                        {formatCurrency(amount, currency)}
                      </LakeHeading>

                      <Space height={32} />
                      <FieldsetTitle isMobile={small}>{t("transfer.new.recipient")}</FieldsetTitle>

                      <Tile>
                        <LakeLabel
                          label={t("transfer.new.recipient.label")}
                          render={id => (
                            <Field name="creditorName">
                              {({ value, onChange, onBlur, error, valid }) => (
                                <LakeTextInput
                                  nativeID={id}
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

                        <Space height={12} />

                        <LakeLabel
                          label={t("transfer.new.iban.label")}
                          render={id => (
                            <Field name="creditorIban">
                              {({ value, onChange, onBlur, error, valid }) => (
                                <LakeTextInput
                                  nativeID={id}
                                  placeholder={t("transfer.new.iban.placeholder")}
                                  value={iban.printFormat(value)}
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
                      <FieldsetTitle isMobile={small}>{t("transfer.new.reason")}</FieldsetTitle>

                      <Tile>
                        <Box
                          direction={small ? "column" : "row"}
                          alignItems={small ? "stretch" : "end"}
                        >
                          <View style={styles.inlineInput}>
                            <LakeLabel
                              label={t("transfer.new.reason.label")}
                              optionalLabel={t("transfer.new.reason.labelDetails")}
                              render={id => (
                                <Field name="transferLabel">
                                  {({ value, onChange, onBlur, error, valid }) => (
                                    <LakeTextInput
                                      nativeID={id}
                                      value={value}
                                      error={error}
                                      valid={value !== "" && valid}
                                      onChangeText={onChange}
                                      onBlur={onBlur}
                                    />
                                  )}
                                </Field>
                              )}
                            />
                          </View>

                          <Space width={24} />

                          <View style={styles.inlineInput}>
                            <LakeLabel
                              label={t("transfer.new.reference.label")}
                              optionalLabel={t("transfer.new.reference.labelDetails", {
                                count: REFERENCE_MAX_LENGTH,
                              })}
                              render={id => (
                                <Field name="transferReference">
                                  {({ value, onChange, onBlur, error, valid }) => (
                                    <LakeTextInput
                                      nativeID={id}
                                      value={value}
                                      error={error}
                                      valid={value !== "" && valid}
                                      onChangeText={onChange}
                                      onBlur={onBlur}
                                    />
                                  )}
                                </Field>
                              )}
                            />
                          </View>
                        </Box>
                      </Tile>

                      <Space height={32} />
                      <FieldsetTitle isMobile={small}>{t("transfer.new.amount")}</FieldsetTitle>

                      <Tile>
                        <LakeLabel
                          label={t("transfer.new.amount.label")}
                          render={id => (
                            <Field name="transferAmount">
                              {({ value, onChange, onBlur, error, valid }) => (
                                <LakeTextInput
                                  nativeID={id}
                                  value={value}
                                  error={error}
                                  valid={valid}
                                  onChangeText={onChange}
                                  onBlur={onBlur}
                                  unit="EUR"
                                />
                              )}
                            </Field>
                          )}
                        />
                      </Tile>

                      <Space height={32} />
                      <FieldsetTitle isMobile={small}>{t("transfer.new.schedule")}</FieldsetTitle>

                      <Tile>
                        <Field name="isInstant">
                          {({ value, onChange }) => (
                            <LakeLabelledCheckbox
                              label={t("transfer.new.instantTransfert")}
                              value={value}
                              onValueChange={onChange}
                            />
                          )}
                        </Field>
                      </Tile>

                      <Space height={32} />

                      <LakeButton
                        style={large && styles.confirmButtonDesktop}
                        color="current"
                        loading={transfer.isLoading()}
                        onPress={onSubmit}
                      >
                        {t("transfer.new.confirm")}
                      </LakeButton>

                      <Space height={40} />
                    </LakeScrollView>
                  ),
                  Error: () => <ErrorView />,
                }),
            })}
          </>
        )}
      </ResponsiveContainer>

      <LakeModal
        visible={insufisantBalanceOpened}
        icon="warning-regular"
        color="warning"
        title={t("transfer.new.insufisantBalance.title")}
        onPressClose={() => setInsufisantBalanceOpened(false)}
      >
        <LakeText variant="smallRegular">
          {t("transfer.new.insufisantBalance.description")}
        </LakeText>

        {accountIban.match({
          Some: accountIban => (
            <>
              <Space height={24} />

              <LakeLabel
                label={t("transfer.new.insufisantBalance.yourIban")}
                type="view"
                color="gray"
                render={() => (
                  <LakeText color={colors.gray[900]}>{iban.printFormat(accountIban)}</LakeText>
                )}
                actions={
                  <LakeCopyButton
                    valueToCopy={iban.printFormat(accountIban)}
                    copyText={t("copyButton.copyTooltip")}
                    copiedText={t("copyButton.copiedTooltip")}
                  />
                }
              />
            </>
          ),
          None: () => null,
        })}
      </LakeModal>
    </>
  );
};
