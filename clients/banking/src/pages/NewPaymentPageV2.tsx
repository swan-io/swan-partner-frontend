import { Option, Result } from "@swan-io/boxed";
import { Box } from "@swan-io/lake/src/components/Box";
import { Icon } from "@swan-io/lake/src/components/Icon";
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
import { RadioGroup, RadioGroupItem } from "@swan-io/lake/src/components/RadioGroup";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { breakpoints, colors } from "@swan-io/lake/src/constants/design";
import { useUrqlMutation } from "@swan-io/lake/src/hooks/useUrqlMutation";
import { useUrqlQuery } from "@swan-io/lake/src/hooks/useUrqlQuery";
import { showToast } from "@swan-io/lake/src/state/toasts";
import { getCountryNameByCCA3 } from "@swan-io/shared-business/src/constants/countries";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { combineValidators, hasDefinedKeys, useForm } from "react-ux-form";
import { Rifm } from "rifm";
import { P, match } from "ts-pattern";
import { useClient } from "urql";
import { ErrorView } from "../components/ErrorView";
import { FieldsetTitle } from "../components/FormText";
import {
  GetAccountDocument,
  InitiateCreditTransfersInput,
  InitiateSepaCreditTransfersDocument,
  ValidIbanInformationFragment,
} from "../graphql/partner";
import { encodeDateTime, isToday } from "../utils/date";
import { formatCurrency, locale, rifmDateProps, rifmTimeProps, t } from "../utils/i18n";
import { getIbanValidation, printIbanFormat } from "../utils/iban";
import { Router } from "../utils/routes";
import {
  REFERENCE_MAX_LENGTH,
  validateAccountNameLength,
  validateReference,
  validateRequired,
  validateSepaBeneficiaryNameAlphabet,
  validateTime,
  validateTodayOrAfter,
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
  tileFooter: {
    padding: 24,
    backgroundColor: colors.shakespear[0],
    borderTopWidth: 1,
    borderTopColor: colors.shakespear[100],
  },
  confirmButtonDesktop: {
    alignSelf: "flex-start",
    minWidth: 300,
  },
});

const MIN_AMOUNT = 0;

const scheduleItems: RadioGroupItem<boolean>[] = [
  {
    name: t("transfer.new.schedule.today"),
    value: false,
  },
  {
    name: t("transfer.new.schedule.later"),
    value: true,
  },
];

type Props = {
  accountId: string;
  accountMembershipId: string;
  onClose: () => void;
};

export const NewPaymentPageV2 = ({ accountId, accountMembershipId, onClose }: Props) => {
  const client = useClient();
  const [transfer, initiateTransfers] = useUrqlMutation(InitiateSepaCreditTransfersDocument);
  const { data } = useUrqlQuery({ query: GetAccountDocument, variables: { accountId } }, []);
  const [insufisantBalanceOpened, setInsufisantBalanceOpened] = useState(false);

  const [ibanInformations, setIbanInformations] = useState<Option<ValidIbanInformationFragment>>(
    Option.None(),
  );

  const canSendInstantTransfer = ibanInformations
    .map(({ reachability }) => reachability.sepaCreditTransferInst)
    .getWithDefault(false);

  const availableBalance = data.mapOkToResult(({ account }) => {
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

  const { Field, FieldsListener, submitForm } = useForm({
    creditorIban: {
      initialValue: "",
      sanitize: printIbanFormat,
      validate: async value => {
        const result = await getIbanValidation(client, value);

        // If previous validation was an error, this will not trigger a new render
        // Because all `Option.None` refers to the same object, and set state run a new render only if the reference change
        setIbanInformations(result.toOption());

        if (result.isError()) {
          return result.getError();
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
      sanitize: value => value.replace(/,/g, "."),
      validate: value => {
        const amount = Number(value);

        if (Number.isNaN(amount) || value === "" || amount <= 0) {
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
    isScheduled: {
      initialValue: false,
    },
    scheduledDate: {
      initialValue: "",
      validate: combineValidators(validateRequired, validateTodayOrAfter),
    },
    scheduleTime: {
      initialValue: "",
      validate: (value, { getFieldState }) => {
        if (value === "") {
          return t("common.form.required");
        }

        const date = getFieldState("scheduledDate").value;
        const isScheduleToday = isToday(date);
        const minHours = isScheduleToday ? new Date().getHours() : 0;
        const minMinutes = isScheduleToday ? new Date().getMinutes() : 0;

        return validateTime(minHours, minMinutes)(value);
      },
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

        const requestedExecutionAt = hasDefinedKeys(values, ["scheduledDate", "scheduleTime"])
          ? encodeDateTime(values.scheduledDate, `${values.scheduleTime}:00`)
          : undefined;

        const input: InitiateCreditTransfersInput = {
          accountId,
          consentRedirectUrl:
            window.location.origin + Router.AccountTransactionsListRoot({ accountMembershipId }),
          creditTransfers: [
            {
              amount: { currency: "EUR", value: values.transferAmount },
              label: values.transferLabel ? values.transferLabel : null,
              reference: values.transferReference ? values.transferReference : null,
              requestedExecutionAt,
              sepaBeneficiary: {
                name: values.creditorName,
                save: false,
                iban: values.creditorIban,
                isMyOwnIban: false, // TODO
              },
              mode: values.isInstant === true ? "InstantWithFallback" : "Regular",
            },
          ],
        };

        initiateTransfers({ input })
          .mapOkToResult(response =>
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
              .with({ __typename: "PaymentInitiated" }, () => {
                showToast({
                  variant: "success",
                  title: t("transfer.consent.success.title"),
                  description: t("transfer.consent.success.description"),
                  autoClose: false,
                });
                Router.replace("AccountTransactionsListRoot", params);
              })
              .with({ __typename: "PaymentRejected" }, () =>
                showToast({
                  variant: "error",
                  title: t("transfer.consent.error.rejected.title"),
                  description: t("transfer.consent.error.rejected.description"),
                }),
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

                      <Tile
                        footer={ibanInformations.match({
                          None: () => undefined,
                          Some: ({ bank }) => (
                            <View style={styles.tileFooter}>
                              <LakeText variant="medium" color={colors.gray[900]}>
                                {t("transfer.new.recipient.bankDetails")}
                              </LakeText>

                              <Space height={16} />

                              <LakeText variant="smallRegular" color={colors.gray[700]}>
                                {bank.name}
                              </LakeText>

                              <Space height={4} />

                              <LakeText variant="smallRegular" color={colors.gray[700]}>
                                {[
                                  bank.address.addressLine1,
                                  bank.address.addressLine2,
                                  bank.address.postalCode,
                                  bank.address.city,
                                  bank.address.country != null
                                    ? getCountryNameByCCA3(bank.address.country)
                                    : undefined,
                                ]
                                  .filter(Boolean)
                                  .join(", ")}
                              </LakeText>
                            </View>
                          ),
                        })}
                      >
                        <LakeLabel
                          label={t("transfer.new.recipient.label")}
                          render={id => (
                            <Field name="creditorName">
                              {({ value, onChange, onBlur, error, valid }) => (
                                <LakeTextInput
                                  id={id}
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
                              {({ value, onChange, onBlur, error, validating, valid }) => (
                                <LakeTextInput
                                  id={id}
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
                                      id={id}
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
                                      id={id}
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
                                  id={id}
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

                      <Tile
                        footer={
                          !canSendInstantTransfer ? (
                            <View style={styles.tileFooter}>
                              <Box direction="row" alignItems="end">
                                <Icon
                                  name="info-regular"
                                  size={20}
                                  color={colors.shakespear[700]}
                                />

                                <Space width={12} />

                                <LakeText variant="smallRegular" color={colors.shakespear[700]}>
                                  {t("transfer.new.instantTransferNotAvailable")}
                                </LakeText>
                              </Box>

                              <Space height={16} />

                              <LakeText variant="smallRegular" color={colors.gray[700]}>
                                {t("transfer.new.bankNotAcceptInstantTransfer")}
                              </LakeText>
                            </View>
                          ) : undefined
                        }
                      >
                        <LakeLabel
                          label={t("transfer.new.schedule.label")}
                          type="radioGroup"
                          render={() => (
                            <Field name="isScheduled">
                              {({ value, onChange }) => (
                                <RadioGroup
                                  direction="row"
                                  items={scheduleItems}
                                  value={value}
                                  onValueChange={onChange}
                                />
                              )}
                            </Field>
                          )}
                        />

                        <Space height={24} />

                        <FieldsListener names={["isScheduled"]}>
                          {({ isScheduled }) =>
                            isScheduled.value ? (
                              <Box direction={small ? "column" : "row"}>
                                <LakeLabel
                                  label={t("transfer.new.scheduleDate.label")}
                                  style={styles.inlineInput}
                                  render={id => (
                                    <Field name="scheduledDate">
                                      {({ value, onChange, onBlur, error, valid }) => (
                                        <Rifm value={value} onChange={onChange} {...rifmDateProps}>
                                          {({ value, onChange }) => (
                                            <LakeTextInput
                                              id={id}
                                              placeholder={locale.datePlaceholder}
                                              value={value}
                                              error={error}
                                              valid={valid}
                                              onChange={onChange}
                                              onBlur={onBlur}
                                            />
                                          )}
                                        </Rifm>
                                      )}
                                    </Field>
                                  )}
                                />

                                <Space width={12} height={12} />

                                <LakeLabel
                                  label={t("transfer.new.scheduleTime.label")}
                                  style={styles.inlineInput}
                                  render={id => (
                                    <Field name="scheduleTime">
                                      {({ value, onChange, onBlur, error, valid }) => (
                                        <Rifm value={value} onChange={onChange} {...rifmTimeProps}>
                                          {({ value, onChange }) => (
                                            <LakeTextInput
                                              id={id}
                                              placeholder={locale.timePlaceholder.slice(0, -3)}
                                              value={value}
                                              error={error}
                                              valid={valid}
                                              onChange={onChange}
                                              onBlur={onBlur}
                                            />
                                          )}
                                        </Rifm>
                                      )}
                                    </Field>
                                  )}
                                />
                              </Box>
                            ) : (
                              <>
                                {canSendInstantTransfer && (
                                  <Field name="isInstant">
                                    {({ value, onChange }) => (
                                      <LakeLabelledCheckbox
                                        label={t("transfer.new.instantTransfer")}
                                        value={value}
                                        onValueChange={onChange}
                                      />
                                    )}
                                  </Field>
                                )}
                              </>
                            )
                          }
                        </FieldsListener>
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
                  <LakeText color={colors.gray[900]}>{printIbanFormat(accountIban)}</LakeText>
                )}
                actions={
                  <LakeCopyButton
                    valueToCopy={printIbanFormat(accountIban)}
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
