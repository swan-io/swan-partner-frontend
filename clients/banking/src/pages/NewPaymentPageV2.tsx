import { Result } from "@swan-io/boxed";
import { Box } from "@swan-io/lake/src/components/Box";
import { LakeAlert } from "@swan-io/lake/src/components/LakeAlert";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeLabelledCheckbox } from "@swan-io/lake/src/components/LakeCheckbox";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeScrollView } from "@swan-io/lake/src/components/LakeScrollView";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { LoadingView } from "@swan-io/lake/src/components/LoadingView";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { useUrqlMutation } from "@swan-io/lake/src/hooks/useUrqlMutation";
import { useUrqlQuery } from "@swan-io/lake/src/hooks/useUrqlQuery";
import { showToast } from "@swan-io/lake/src/state/toasts";
import { StyleSheet, View } from "react-native";
import { combineValidators, hasDefinedKeys, useForm } from "react-ux-form";
import { match, P } from "ts-pattern";
import { ErrorView } from "../components/ErrorView";
import {
  GetAccountDocument,
  InitiateCreditTransfersInput,
  InitiateSepaCreditTransfersDocument,
} from "../graphql/partner";
import { formatCurrency, t } from "../utils/i18n";
import * as iban from "../utils/iban";
import { Router } from "../utils/routes";
import {
  validateAccountNameLength,
  validateReference,
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
  confirmButton: {
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

  const availableBalance = data.mapResult(({ account }) => {
    if (account?.balances?.available) {
      return Result.Ok({
        amount: Number(account.balances.available.value),
        currency: account.balances.available.currency,
      });
    }
    return Result.Error(new Error("No available balance"));
  });

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
      validate: combineValidators(validateSepaBeneficiaryNameAlphabet, validateAccountNameLength),
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
        const input: InitiateCreditTransfersInput = {
          accountId,
          consentRedirectUrl:
            window.location.origin + Router.AccountTransactionsListRoot({ accountMembershipId }),
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
    <View style={styles.container}>
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
              <LakeScrollView style={commonStyles.fill} contentContainerStyle={commonStyles.fill}>
                {amount <= MIN_AMOUNT && (
                  <>
                    <LakeAlert variant="warning" title={t("transfer.new.lowBalance")} />
                    <Space height={24} />
                  </>
                )}

                <LakeText variant="smallRegular">{t("transfer.new.availableBalance")}</LakeText>
                <Space height={8} />

                <LakeHeading level={2} variant="h1">
                  {formatCurrency(amount, currency)}
                </LakeHeading>

                <Space height={32} />

                <LakeHeading level={2} variant="h3">
                  {t("transfer.new.recipient")}
                </LakeHeading>

                <Space height={24} />

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

                <LakeHeading level={2} variant="h3">
                  {t("transfer.new.reason")}
                </LakeHeading>

                <Space height={24} />

                <Tile>
                  <Box direction="row">
                    <View style={commonStyles.fill}>
                      <LakeLabel
                        label={t("transfer.new.reason.label")}
                        render={id => (
                          <Field name="transferLabel">
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
                    </View>

                    <Space width={24} />

                    <View style={commonStyles.fill}>
                      <LakeLabel
                        label={t("transfer.new.reference.label")}
                        optionalLabel={t("common.optional")}
                        render={id => (
                          <Field name="transferReference">
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
                    </View>
                  </Box>
                </Tile>

                <Space height={32} />

                <LakeHeading level={2} variant="h3">
                  {t("transfer.new.amount")}
                </LakeHeading>

                <Space height={24} />

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

                <LakeHeading level={2} variant="h3">
                  {t("transfer.new.schedule")}
                </LakeHeading>

                <Space height={24} />

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
                  style={styles.confirmButton}
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
    </View>
  );
};
