import { Option, Result } from "@swan-io/boxed";
import { Box } from "@swan-io/lake/src/components/Box";
import { LakeAlert } from "@swan-io/lake/src/components/LakeAlert";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeScrollView } from "@swan-io/lake/src/components/LakeScrollView";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { LoadingView } from "@swan-io/lake/src/components/LoadingView";
import { RadioGroup, RadioGroupItem } from "@swan-io/lake/src/components/RadioGroup";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { Switch } from "@swan-io/lake/src/components/Switch";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { breakpoints, colors } from "@swan-io/lake/src/constants/design";
import { useUrqlMutation } from "@swan-io/lake/src/hooks/useUrqlMutation";
import { useUrqlQuery } from "@swan-io/lake/src/hooks/useUrqlQuery";
import { showToast } from "@swan-io/lake/src/state/toasts";
import { isNotNullishOrEmpty } from "@swan-io/lake/src/utils/nullish";
import { getCountryNameByCCA3 } from "@swan-io/shared-business/src/constants/countries";
import dayjs from "dayjs";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { combineValidators, hasDefinedKeys, useForm } from "react-ux-form";
import { Rifm } from "rifm";
import { match } from "ts-pattern";
import { useClient } from "urql";
import { ErrorView } from "../components/ErrorView";
import { FieldsetTitle } from "../components/FormText";
import {
  GetAccountDocument,
  ScheduleStandingOrderDocument,
  ScheduleStandingOrderInput,
  StandingOrderPeriod,
  ValidIbanInformationFragment,
} from "../graphql/partner";
import { encodeDate } from "../utils/date";
import { formatCurrency, locale, rifmDateProps, t } from "../utils/i18n";
import { getIbanValidation, printIbanFormat } from "../utils/iban";
import { Router } from "../utils/routes";
import {
  REFERENCE_MAX_LENGTH,
  validateAccountNameLength,
  validateReference,
  validateRequired,
  validateSepaBeneficiaryNameAlphabet,
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

type Props = {
  accountId: string;
  accountMembershipId: string;
  onClose: () => void;
};

const periodItems: RadioGroupItem<StandingOrderPeriod>[] = [
  { value: "Daily", name: t("payments.new.standingOrder.details.daily") },
  { value: "Weekly", name: t("payments.new.standingOrder.details.weekly") },
  { value: "Monthly", name: t("payments.new.standingOrder.details.monthly") },
];

const hasFixedAmountItems: RadioGroupItem<boolean>[] = [
  { value: true, name: t("recurringTransfer.new.transferType.regular") },
  { value: false, name: t("recurringTransfer.new.transferType.fullBalance") },
];

export const NewRecurringTransferPageV2 = ({ accountId, accountMembershipId, onClose }: Props) => {
  const client = useClient();
  const [scheduleStandingOrder, initiateScheduleStandingOrder] = useUrqlMutation(
    ScheduleStandingOrderDocument,
  );
  const { data } = useUrqlQuery({ query: GetAccountDocument, variables: { accountId } }, []);

  const [ibanInformations, setIbanInformations] = useState<Option<ValidIbanInformationFragment>>(
    Option.None(),
  );

  const availableBalance = data.mapOkToResult(({ account }) => {
    if (account?.balances?.available) {
      return Result.Ok({
        amount: Number(account.balances.available.value),
        currency: account.balances.available.currency,
      });
    }
    return Result.Error(new Error("No available balance"));
  });

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
      validate: (value, { getFieldState }) => {
        const amount = Number(value);
        const hasFixedAmount = getFieldState("hasFixedAmount").value;

        if (Number.isNaN(amount) || value === "" || amount < 0) {
          return t("error.invalidTransferAmount");
        }
        if (hasFixedAmount && amount === 0) {
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
    period: {
      initialValue: "Daily" as StandingOrderPeriod,
    },
    firstExecutionDate: {
      initialValue: dayjs.utc().format(locale.dateFormat),
      validate: combineValidators(validateRequired, validateTodayOrAfter),
      sanitize: value => value?.trim(),
    },
    withLastExecutionDate: {
      initialValue: false,
    },
    lastExecutionDate: {
      initialValue: "",
      validate: (value, { getFieldState }) => {
        const withLastExecutionDate = getFieldState("withLastExecutionDate").value;
        if (!withLastExecutionDate) {
          return;
        }

        if (value === "") {
          return t("common.form.required");
        }

        const lastExecutionDate = dayjs.utc(value, locale.dateFormat);
        if (!lastExecutionDate.isValid()) {
          return t("common.form.invalidDate");
        }

        const firstExecution = getFieldState("firstExecutionDate").value;
        const firstExecutionDate = dayjs.utc(firstExecution, locale.dateFormat);
        if (lastExecutionDate.isBefore(firstExecutionDate)) {
          return t("error.lastExecutionDateBeforeFirstExecutionDate");
        }
      },
      sanitize: value => value?.trim(),
    },
    hasFixedAmount: {
      initialValue: true,
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
          "period",
          "firstExecutionDate",
          "lastExecutionDate",
          "hasFixedAmount",
        ])
      ) {
        const consentRedirectUrl =
          window.location.origin +
          Router.AccountPaymentsRoot({ accountMembershipId }) +
          `?${new URLSearchParams({ standingOrder: "true" }).toString()}`;

        const input: ScheduleStandingOrderInput = {
          period: values.period,
          accountId,
          consentRedirectUrl,
          label: values.transferLabel !== "" ? values.transferLabel : null,
          reference: values.transferReference !== "" ? values.transferReference : null,
          firstExecutionDate: encodeDate(values.firstExecutionDate),
          lastExecutionDate:
            values.withLastExecutionDate === true
              ? encodeDate(values.lastExecutionDate)
              : undefined,
          sepaBeneficiary: {
            name: values.creditorName,
            save: false,
            iban: values.creditorIban,
            isMyOwnIban: false,
          },
          ...(values.hasFixedAmount
            ? {
                amount: {
                  currency: "EUR",
                  value: values.transferAmount,
                },
              }
            : {
                targetAvailableBalance: {
                  currency: "EUR",
                  value: values.transferAmount,
                },
              }),
        };

        initiateScheduleStandingOrder({ input })
          .mapOkToResult(response =>
            match(response.scheduleStandingOrder)
              .with(
                { __typename: "InvalidArgumentRejection" },
                { __typename: "InternalErrorRejection" },
                { __typename: "ForbiddenRejection" },
                error => Result.Error(error),
              )
              .with({ __typename: "ScheduleStandingOrderSuccessPayload" }, response =>
                Result.Ok(response),
              )
              .exhaustive(),
          )
          .tapOk(({ standingOrder }) => {
            match(standingOrder.statusInfo)
              .with({ __typename: "StandingOrderConsentPendingStatusInfo" }, ({ consent }) => {
                window.location.assign(consent.consentUrl);
              })
              .with({ __typename: "StandingOrderCanceledStatusInfo" }, () => {
                showToast({
                  variant: "error",
                  title: t("recurringTransfer.consent.error.rejected.title"),
                  description: t("recurringTransfer.consent.error.rejected.description"),
                });
              })
              .with({ __typename: "StandingOrderEnabledStatusInfo" }, () => {
                showToast({
                  variant: "success",
                  title: t("recurringTransfer.consent.success.title"),
                  description: t("recurringTransfer.consent.success.description"),
                  autoClose: false,
                });
                Router.replace("AccountPaymentsRoot", { accountMembershipId });
              })
              .exhaustive();
          })
          .tapError(() => showToast({ variant: "error", title: t("error.generic") }));
      }
    });
  };

  return (
    <ResponsiveContainer breakpoint={breakpoints.medium} style={styles.container}>
      {({ small, large }) => (
        <>
          <Box direction="row" alignItems="center">
            <LakeButton mode="tertiary" icon="lake-close" onPress={onClose} />
            <Space width={8} />

            <LakeHeading level={1} variant="h3">
              {t("recurringTransfer.new.title")}
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
                      {t("recurringTransfer.new.availableBalance")}
                    </LakeText>

                    <Space height={4} />

                    <LakeHeading level={2} variant={small ? "h3" : "h1"}>
                      {formatCurrency(amount, currency)}
                    </LakeHeading>

                    <Space height={32} />

                    <FieldsetTitle isMobile={small}>
                      {t("recurringTransfer.new.recipient")}
                    </FieldsetTitle>

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
                                .filter(isNotNullishOrEmpty)
                                .join(", ")}
                            </LakeText>
                          </View>
                        ),
                      })}
                    >
                      <LakeLabel
                        label={t("recurringTransfer.new.recipient.label")}
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
                        label={t("recurringTransfer.new.iban.label")}
                        render={id => (
                          <Field name="creditorIban">
                            {({ value, onChange, onBlur, error, valid, validating }) => (
                              <LakeTextInput
                                id={id}
                                placeholder={t("recurringTransfer.new.iban.placeholder")}
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

                    <FieldsetTitle isMobile={small}>
                      {t("recurringTransfer.new.reason")}
                    </FieldsetTitle>

                    <Tile>
                      <Box
                        direction={small ? "column" : "row"}
                        alignItems={small ? "stretch" : "end"}
                      >
                        <View style={styles.inlineInput}>
                          <LakeLabel
                            label={t("recurringTransfer.new.reason.label")}
                            optionalLabel={t("recurringTransfer.new.reason.labelDetails")}
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
                            label={t("recurringTransfer.new.reference.label")}
                            optionalLabel={t("recurringTransfer.new.reference.labelDetails", {
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

                    <FieldsetTitle isMobile={small}>
                      {t("recurringTransfer.new.amount")}
                    </FieldsetTitle>

                    <Tile>
                      <Field name="hasFixedAmount">
                        {({ value: hasFixedAmount, onChange: onChangeFixedAmount }) => {
                          const amountLabel = hasFixedAmount
                            ? t("recurringTransfer.new.amount.label")
                            : t("recurringTransfer.new.targetBalance.label");

                          return (
                            <>
                              <LakeLabel
                                label={t("recurringTransfer.new.transferType.label")}
                                type="radioGroup"
                                render={() => (
                                  <RadioGroup
                                    items={hasFixedAmountItems}
                                    value={hasFixedAmount}
                                    onValueChange={onChangeFixedAmount}
                                  />
                                )}
                              />

                              {!hasFixedAmount && (
                                <>
                                  <Space height={8} />

                                  <LakeText color="grey">
                                    {t("recurringTransfer.new.transferType.fullBalanceDescription")}
                                  </LakeText>
                                </>
                              )}

                              <Space height={24} />

                              <LakeLabel
                                label={amountLabel}
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
                            </>
                          );
                        }}
                      </Field>
                    </Tile>

                    <Space height={32} />

                    <FieldsetTitle isMobile={small}>
                      {t("recurringTransfer.new.schedule")}
                    </FieldsetTitle>

                    <Tile>
                      <LakeLabel
                        label={t("recurringTransfer.new.frequency.label")}
                        type="radioGroup"
                        render={() => (
                          <Field name="period">
                            {({ value, onChange }) => (
                              <RadioGroup
                                items={periodItems}
                                value={value}
                                direction="row"
                                onValueChange={onChange}
                              />
                            )}
                          </Field>
                        )}
                      />

                      <Space height={24} />

                      <LakeLabel
                        label={t("recurringTransfer.new.firstExecutionDate.label")}
                        style={styles.inlineInput}
                        render={id => (
                          <Field name="firstExecutionDate">
                            {({ value, onChange, onBlur, error, valid }) => (
                              <Rifm value={value} onChange={onChange} {...rifmDateProps}>
                                {({ value, onChange }) => (
                                  <LakeTextInput
                                    id={id}
                                    placeholder={locale.datePlaceholder}
                                    value={value}
                                    error={error}
                                    valid={value !== "" && valid}
                                    onChange={onChange}
                                    onBlur={onBlur}
                                  />
                                )}
                              </Rifm>
                            )}
                          </Field>
                        )}
                      />

                      <Space width={24} height={4} />

                      <Box direction="row" alignItems="center">
                        <Field name="withLastExecutionDate">
                          {({ value, onChange }) => (
                            <Switch value={value} onValueChange={onChange} />
                          )}
                        </Field>

                        <Space width={12} />

                        <LakeText color={colors.gray[700]} variant="smallMedium">
                          {t("recurringTransfer.new.setEndDate")}
                        </LakeText>
                      </Box>

                      <Space width={24} height={24} />

                      <LakeLabel
                        label={t("recurringTransfer.new.lastExecutionDate.label")}
                        style={styles.inlineInput}
                        render={id => (
                          <FieldsListener names={["withLastExecutionDate"]}>
                            {({ withLastExecutionDate }) => (
                              <Field name="lastExecutionDate">
                                {({ value, onChange, onBlur, error, valid }) => (
                                  <Rifm value={value} onChange={onChange} {...rifmDateProps}>
                                    {({ value, onChange }) => (
                                      <LakeTextInput
                                        id={id}
                                        placeholder={locale.datePlaceholder}
                                        value={withLastExecutionDate.value ? value : undefined}
                                        error={withLastExecutionDate.value ? error : undefined}
                                        disabled={!withLastExecutionDate.value}
                                        valid={withLastExecutionDate.value && value !== "" && valid}
                                        onChange={onChange}
                                        onBlur={onBlur}
                                      />
                                    )}
                                  </Rifm>
                                )}
                              </Field>
                            )}
                          </FieldsListener>
                        )}
                      />
                    </Tile>

                    <Space height={32} />

                    <LakeButton
                      style={large && styles.confirmButtonDesktop}
                      color="current"
                      loading={scheduleStandingOrder.isLoading()}
                      onPress={onSubmit}
                    >
                      {t("recurringTransfer.new.confirm")}
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
  );
};
