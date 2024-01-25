import { Box } from "@swan-io/lake/src/components/Box";
import { Icon } from "@swan-io/lake/src/components/Icon";
import { LakeCopyButton } from "@swan-io/lake/src/components/LakeCopyButton";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { ListRightPanelContent } from "@swan-io/lake/src/components/ListRightPanel";
import { ReadOnlyFieldList } from "@swan-io/lake/src/components/ReadOnlyFieldList";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tag } from "@swan-io/lake/src/components/Tag";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { colors } from "@swan-io/lake/src/constants/design";
import {
  isNotNullish,
  isNotNullishOrEmpty,
  isNullish,
  isNullishOrEmpty,
} from "@swan-io/lake/src/utils/nullish";
import { LakeAlert } from "@swan-io/shared-business/src/components/LakeAlert";
import { countries } from "@swan-io/shared-business/src/constants/countries";
import { ScrollView, StyleSheet } from "react-native";
import { P, match } from "ts-pattern";
import { TransactionDetailsFragment } from "../graphql/partner";
import { formatCurrency, formatDateTime, t } from "../utils/i18n";
import { printIbanFormat } from "../utils/iban";
import {
  getFeesDescription,
  getTransactionRejectedReasonLabel,
  getWiseIctLabel,
} from "../utils/templateTranslations";
import { ErrorView } from "./ErrorView";
import { getTransactionLabel } from "./TransactionListCells";

const styles = StyleSheet.create({
  container: {
    ...commonStyles.fill,
  },
  tile: {
    alignItems: "center",
  },
  debitAmount: {
    marginLeft: -16,
  },
  wrapText: {
    wordBreak: "break-all",
  },
});

const formatMaskedPan = (value: string) => value.replace(/X/g, "•").replace(/(.{4})(?!$)/g, "$1 ");
const truncateTransactionId = (id: string) => id.split("#", 2)[0];

const FormattedDateTime = ({ date, label }: { date: string; label: string }) => (
  <LakeLabel
    type="viewSmall"
    label={label}
    render={() => (
      <Box direction="row" alignItems="center">
        <Icon name="calendar-ltr-regular" size={16} />
        <Space width={8} />

        <LakeText variant="regular" color={colors.gray[900]}>
          {formatDateTime(new Date(date), "LLL")}
        </LakeText>
      </Box>
    )}
  />
);

type Props = {
  transaction: TransactionDetailsFragment;
  large: boolean;
};

export const TransactionDetail = ({ transaction, large }: Props) => {
  if (transaction == null) {
    return <ErrorView />;
  }

  const bookingDateTime = match(transaction.statusInfo)
    .with({ __typename: "BookedTransactionStatusInfo" }, ({ bookingDate }) => (
      <FormattedDateTime label={t("transaction.bookingDateTime")} date={bookingDate} />
    ))
    .otherwise(() => null);

  const executionDateTime = match(transaction.statusInfo)
    .with({ __typename: "UpcomingTransactionStatusInfo" }, ({ executionDate }) => (
      <FormattedDateTime label={t("transaction.executionDateTime")} date={executionDate} />
    ))
    .otherwise(() => null);

  const canceledDateTime = match(transaction.statusInfo)
    .with(
      { __typename: "CanceledTransactionStatusInfo", canceledDate: P.not(P.nullish) },
      ({ canceledDate }) => (
        <FormattedDateTime label={t("transaction.canceledDate")} date={canceledDate} />
      ),
    )
    .otherwise(() => null);

  const rejectedDateTime = match(transaction.statusInfo)
    .with({ __typename: "RejectedTransactionStatusInfo" }, () => (
      <FormattedDateTime label={t("transaction.rejectedDate")} date={transaction.updatedAt} />
    ))
    .otherwise(() => null);

  const rejectedReason = match(transaction.statusInfo)
    .with({ __typename: "RejectedTransactionStatusInfo" }, ({ reason }) => {
      const description = getTransactionRejectedReasonLabel(reason);

      if (isNullish(description)) {
        return null;
      }

      return (
        <LakeLabel
          type="viewSmall"
          label={t("transaction.rejectedReason")}
          render={() => (
            <LakeText variant="regular" color={colors.gray[900]}>
              {description}
            </LakeText>
          )}
        />
      );
    })
    .otherwise(() => null);

  const truncatesTransactionId = truncateTransactionId(transaction.id);

  const transactionId = (
    <LakeLabel
      type="viewSmall"
      label={t("transaction.id")}
      actions={
        truncatesTransactionId != null ? (
          <LakeCopyButton
            valueToCopy={truncatesTransactionId}
            copiedText={t("copyButton.copiedTooltip")}
            copyText={t("copyButton.copyTooltip")}
          />
        ) : undefined
      }
      render={() => (
        <LakeText variant="regular" color={colors.gray[900]}>
          {truncatesTransactionId}
        </LakeText>
      )}
    />
  );

  const renderReferenceToDisplay = (referenceToDisplay: string) => (
    <LakeLabel
      type="viewSmall"
      label={t("transaction.reference")}
      actions={
        isNotNullishOrEmpty(referenceToDisplay) ? (
          <LakeCopyButton
            valueToCopy={referenceToDisplay}
            copiedText={t("copyButton.copiedTooltip")}
            copyText={t("copyButton.copyTooltip")}
          />
        ) : null
      }
      render={() => (
        <LakeText variant="regular" color={colors.gray[900]}>
          {isNotNullishOrEmpty(referenceToDisplay) ? referenceToDisplay : "—"}
        </LakeText>
      )}
    />
  );

  return (
    <ScrollView contentContainerStyle={large ? commonStyles.fill : undefined}>
      <ListRightPanelContent large={large} style={styles.container}>
        <Tile
          style={styles.tile}
          footer={match(transaction)
            // BankingFee should never happen, so we don't handle it
            .with({ feesType: P.not("BankingFee") }, ({ feesType }) => {
              const description = getFeesDescription(feesType);

              if (isNullish(description)) {
                return null;
              }

              return <LakeAlert anchored={true} variant="info" title={description} />;
            })
            .with(
              {
                originTransaction: {
                  type: P.union("SepaInstantCreditTransferIn", "SepaInstantCreditTransferOut"),
                },
              },
              () => (
                <LakeAlert
                  anchored={true}
                  variant="warning"
                  title={t("transaction.instantTransferUnavailable")}
                  children={t("transaction.instantTransferUnavailable.description")}
                />
              ),
            )
            .otherwise(() => null)}
        >
          {match(transaction.statusInfo.__typename)
            .with("PendingTransactionStatusInfo", () => (
              <Tag color="warning">{t("transactionStatus.pending")}</Tag>
            ))
            .with("RejectedTransactionStatusInfo", () => (
              <Tag color="negative">{t("transactionStatus.rejected")}</Tag>
            ))
            .with("CanceledTransactionStatusInfo", () => (
              <Tag color="gray">{t("transactionStatus.canceled")}</Tag>
            ))
            .otherwise(() => null)}

          <Space height={12} />

          <LakeHeading
            variant="h1"
            level={2}
            align="center"
            style={transaction.side ? styles.debitAmount : null}
          >
            {(transaction.side === "Debit" ? "-" : "+") +
              formatCurrency(Number(transaction.amount.value), transaction.amount.currency)}
          </LakeHeading>

          {match(transaction)
            .with(
              {
                __typename: "CardTransaction",
                originalAmount: P.select("originalAmount", {
                  value: P.select("value", P.string),
                  currency: P.select("currency", P.string),
                }),
              },
              ({ currency, value, originalAmount }) =>
                originalAmount.currency !== transaction.amount.currency ? (
                  <LakeText>
                    {(transaction.side === "Debit" ? "-" : "+") +
                      formatCurrency(Number(value), currency)}
                  </LakeText>
                ) : null,
            )
            .with(
              {
                __typename: "InternationalCreditTransferTransaction",
                internationalCurrencyExchange: P.select("internationalCurrencyExchange", {
                  sourceAmount: { currency: P.string },
                  targetAmount: { value: P.string, currency: P.string },
                }),
              },
              ({ internationalCurrencyExchange }) =>
                internationalCurrencyExchange.sourceAmount.currency !==
                internationalCurrencyExchange.targetAmount.currency ? (
                  <LakeText>
                    {(transaction.side === "Debit" ? "-" : "+") +
                      formatCurrency(
                        Number(internationalCurrencyExchange.targetAmount.value),
                        internationalCurrencyExchange.targetAmount.currency,
                      )}
                  </LakeText>
                ) : null,
            )
            .otherwise(() => null)}

          <Space height={8} />

          <LakeHeading
            variant="h4"
            level={3}
            align="center"
            color={colors.gray[700]}
            style={styles.wrapText}
          >
            {getTransactionLabel(transaction)}
          </LakeHeading>
        </Tile>

        <Space height={24} />

        <ScrollView style={commonStyles.fill} contentContainerStyle={commonStyles.fill}>
          {match(transaction)
            .with(
              { __typename: "CardTransaction" },
              ({
                card,
                statusInfo,
                merchantCountry: merchantCountryCCA3,
                merchantCity,
                maskedPan,
                reference,
                payment,
              }) => {
                const merchantCountry = countries.find(
                  country => country.cca3 === merchantCountryCCA3,
                )?.name;

                return (
                  <ReadOnlyFieldList>
                    {match(statusInfo.status)
                      .with("Booked", "Pending", () => {
                        if (isNotNullish(payment)) {
                          return (
                            <FormattedDateTime
                              label={t("transaction.paymentDateTime")}
                              date={payment.createdAt}
                            />
                          );
                        }
                      })
                      .otherwise(() => null)}

                    {bookingDateTime}
                    {executionDateTime}
                    {canceledDateTime}
                    {rejectedDateTime}
                    {rejectedReason}

                    {match({ merchantCity, merchantCountry })
                      .with(
                        { merchantCity: P.string, merchantCountry: P.string },
                        ({ merchantCity, merchantCountry }) => (
                          <LakeLabel
                            type="viewSmall"
                            label={t("transaction.place")}
                            render={() => (
                              <LakeText variant="regular" color={colors.gray[900]}>
                                {`${merchantCity} - ${merchantCountry}`}
                              </LakeText>
                            )}
                          />
                        ),
                      )
                      .otherwise(() => null)}

                    <LakeLabel
                      type="viewSmall"
                      label={t("transaction.maskedPan")}
                      render={() => (
                        <LakeText variant="regular" color={colors.gray[900]}>
                          {formatMaskedPan(maskedPan)}
                        </LakeText>
                      )}
                    />

                    {match(card)
                      .with(
                        {
                          accountMembership: { user: { firstName: P.string, lastName: P.string } },
                        },
                        ({
                          accountMembership: {
                            user: { firstName, lastName },
                          },
                        }) => (
                          <LakeLabel
                            type="viewSmall"
                            label={t("transaction.cardHolder")}
                            render={() => (
                              <LakeText variant="regular" color={colors.gray[900]}>
                                {[firstName, lastName].join(" ")}
                              </LakeText>
                            )}
                          />
                        ),
                      )
                      .otherwise(() => null)}

                    {renderReferenceToDisplay(reference)}
                    {transactionId}
                  </ReadOnlyFieldList>
                );
              },
            )
            .with(
              { __typename: "SEPACreditTransferTransaction" },
              ({ createdAt, side, debtor, creditor, reference }) => (
                <ReadOnlyFieldList>
                  {isNotNullish(createdAt) ? (
                    <FormattedDateTime label={t("transaction.paymentDateTime")} date={createdAt} />
                  ) : null}

                  {bookingDateTime}

                  {side === "Credit" ? (
                    <LakeLabel
                      type="viewSmall"
                      label={t("transaction.debtor")}
                      render={() => (
                        <Box direction="row" alignItems="center">
                          <Icon name="person-regular" size={16} />
                          <Space width={8} />

                          <LakeText variant="regular" color={colors.gray[900]}>
                            {debtor.name}
                          </LakeText>
                        </Box>
                      )}
                    />
                  ) : null}

                  {match(transaction)
                    .with(
                      {
                        statusInfo: { __typename: P.not("BookedTransactionStatusInfo") },
                        creditor: { IBAN: P.nullish },
                        side: "Credit",
                      },
                      () => (
                        <LakeLabel
                          type="viewSmall"
                          label={t("transaction.creditorName")}
                          render={() => (
                            <Box direction="row" alignItems="center">
                              <Icon name="person-regular" size={16} />
                              <Space width={8} />

                              <LakeText variant="regular" color={colors.gray[900]}>
                                {creditor.name}
                              </LakeText>
                            </Box>
                          )}
                        />
                      ),
                    )
                    .with(
                      {
                        type: P.union("SepaCreditTransferOut", "SepaInstantCreditTransferOut"),
                        creditor: { __typename: "SEPACreditTransferOutCreditor", name: P.string },
                      },
                      ({ creditor }) => (
                        <LakeLabel
                          type="viewSmall"
                          label={t("transaction.creditorName")}
                          render={() => (
                            <Box direction="row" alignItems="center">
                              <Icon name="person-regular" size={16} />
                              <Space width={8} />

                              <LakeText variant="regular" color={colors.gray[900]}>
                                {creditor.name}
                              </LakeText>
                            </Box>
                          )}
                        />
                      ),
                    )
                    .otherwise(() => null)}

                  {match(transaction)
                    .with(
                      {
                        statusInfo: { __typename: "BookedTransactionStatusInfo" },
                        creditor: { IBAN: P.string },
                        side: "Credit",
                      },
                      ({ creditor: { IBAN } }) => (
                        <LakeLabel
                          type="viewSmall"
                          label={t("transaction.creditorIban")}
                          render={() => (
                            <LakeText variant="regular" color={colors.gray[900]}>
                              {printIbanFormat(IBAN)}
                            </LakeText>
                          )}
                        />
                      ),
                    )
                    .with(
                      {
                        type: P.union("SepaCreditTransferOut", "SepaInstantCreditTransferOut"),
                        creditor: {
                          __typename: "SEPACreditTransferOutCreditor",
                          IBAN: P.string,
                        },
                      },
                      ({ creditor: { IBAN } }) => (
                        <LakeLabel
                          type="viewSmall"
                          label={t("transaction.creditorIban")}
                          render={() => (
                            <LakeText variant="regular" color={colors.gray[900]}>
                              {printIbanFormat(IBAN)}
                            </LakeText>
                          )}
                        />
                      ),
                    )
                    .otherwise(() => null)}

                  {executionDateTime}
                  {canceledDateTime}
                  {rejectedDateTime}
                  {rejectedReason}
                  {renderReferenceToDisplay(reference)}
                  {transactionId}
                </ReadOnlyFieldList>
              ),
            )
            .with(
              { __typename: "SEPADirectDebitTransaction" },
              ({ mandate, creditor, reservedAmount, reservedAmountReleasedAt, reference }) => (
                <ReadOnlyFieldList>
                  {bookingDateTime}

                  {isNotNullish(reservedAmount) && (
                    <LakeLabel
                      type="viewSmall"
                      label={t("transaction.reservedAmount")}
                      render={() => (
                        <LakeText variant="regular" color={colors.gray[900]}>
                          {formatCurrency(Number(reservedAmount.value), reservedAmount.currency)}
                        </LakeText>
                      )}
                    />
                  )}

                  {isNotNullish(reservedAmountReleasedAt) && (
                    <FormattedDateTime
                      label={t("transaction.reservedUntil")}
                      date={reservedAmountReleasedAt}
                    />
                  )}

                  <LakeLabel
                    type="viewSmall"
                    label={t("transaction.paymentMethod")}
                    render={() => (
                      <Box direction="row" alignItems="center">
                        <Icon name="arrow-swap-regular" size={16} />
                        <Space width={8} />

                        <LakeText variant="regular" color={colors.gray[900]}>
                          {match(transaction)
                            .with({ __typename: "CheckTransaction" }, () =>
                              t("transactions.method.Check"),
                            )
                            .with(
                              { __typename: "InternalDirectDebitTransaction" },
                              { __typename: "SEPADirectDebitTransaction" },
                              () => t("transactions.method.DirectDebit"),
                            )
                            .otherwise(() => null)}
                        </LakeText>
                      </Box>
                    )}
                  />

                  {match(mandate)
                    .with({ __typename: "SEPAPaymentDirectDebitMandate" }, ({ debtor }) => (
                      <LakeLabel
                        type="viewSmall"
                        label={t("transaction.debtor")}
                        render={() => (
                          <Box direction="row" alignItems="center">
                            <Icon name="person-regular" size={16} />
                            <Space width={8} />

                            <LakeText variant="regular" color={colors.gray[900]}>
                              {debtor.name}
                            </LakeText>
                          </Box>
                        )}
                      />
                    ))
                    .otherwise(() => null)}

                  {executionDateTime}

                  {match(mandate)
                    .with(
                      { __typename: "SEPAReceivedDirectDebitMandate" },
                      ({ ultimateCreditorName }) => {
                        const creditorName = ultimateCreditorName ?? creditor.name;
                        if (isNullishOrEmpty(creditorName)) {
                          return null;
                        }
                        return (
                          <LakeLabel
                            type="viewSmall"
                            label={t("transaction.creditorName")}
                            render={() => (
                              <Box direction="row" alignItems="center">
                                <Icon name="person-regular" size={16} />
                                <Space width={8} />

                                <LakeText variant="regular" color={colors.gray[900]}>
                                  {ultimateCreditorName ?? creditor.name}
                                </LakeText>
                              </Box>
                            )}
                          />
                        );
                      },
                    )
                    .otherwise(() => null)}

                  {canceledDateTime}
                  {rejectedDateTime}
                  {rejectedReason}
                  {renderReferenceToDisplay(reference)}
                  {transactionId}
                </ReadOnlyFieldList>
              ),
            )
            .with(
              { __typename: "InternalDirectDebitTransaction" },
              ({ creditor, reservedAmount, reservedAmountReleasedAt, reference }) => (
                <ReadOnlyFieldList>
                  {bookingDateTime}

                  {isNotNullish(reservedAmount) && (
                    <LakeLabel
                      type="viewSmall"
                      label={t("transaction.reservedAmount")}
                      render={() => (
                        <LakeText variant="regular" color={colors.gray[900]}>
                          {formatCurrency(Number(reservedAmount.value), reservedAmount.currency)}
                        </LakeText>
                      )}
                    />
                  )}

                  {isNotNullish(reservedAmountReleasedAt) && (
                    <FormattedDateTime
                      label={t("transaction.reservedUntil")}
                      date={reservedAmountReleasedAt}
                    />
                  )}

                  <LakeLabel
                    type="viewSmall"
                    label={t("transaction.paymentMethod")}
                    render={() => (
                      <LakeText variant="regular" color={colors.gray[900]}>
                        {match(transaction)
                          .with({ __typename: "CheckTransaction" }, () =>
                            t("transactions.method.Check"),
                          )
                          .with(
                            { __typename: "InternalDirectDebitTransaction" },
                            { __typename: "SEPADirectDebitTransaction" },
                            () => t("transactions.method.DirectDebit"),
                          )
                          .otherwise(() => null)}
                      </LakeText>
                    )}
                  />

                  {executionDateTime}

                  {creditor.accountId != null ? (
                    <LakeLabel
                      type="viewSmall"
                      label={t("transaction.creditorName")}
                      render={() => (
                        <LakeText variant="regular" color={colors.gray[900]}>
                          {creditor.accountId}
                        </LakeText>
                      )}
                    />
                  ) : null}

                  {canceledDateTime}
                  {rejectedDateTime}
                  {rejectedReason}
                  {renderReferenceToDisplay(reference)}
                  {transactionId}
                </ReadOnlyFieldList>
              ),
            )
            .with({ __typename: "InternalCreditTransfer" }, ({ creditor, reference }) => (
              <ReadOnlyFieldList>
                {bookingDateTime}
                {executionDateTime}

                {creditor.name != null ? (
                  <LakeLabel
                    type="viewSmall"
                    label={t("transaction.creditorName")}
                    render={() => (
                      <Box direction="row" alignItems="center">
                        <Icon name="person-regular" size={16} />
                        <Space width={8} />

                        <LakeText variant="regular" color={colors.gray[900]}>
                          {creditor.name}
                        </LakeText>
                      </Box>
                    )}
                  />
                ) : null}

                {canceledDateTime}
                {rejectedDateTime}
                {rejectedReason}
                {renderReferenceToDisplay(reference)}
                {transactionId}
              </ReadOnlyFieldList>
            ))
            .with(
              { __typename: "FeeTransaction" },
              ({ counterparty, feesType, originTransaction, reference }) => (
                <ReadOnlyFieldList>
                  {bookingDateTime}
                  {executionDateTime}

                  <LakeLabel
                    type="viewSmall"
                    label={t("transaction.creditorName")}
                    render={() => (
                      <Box direction="row" alignItems="center">
                        <Icon name="person-regular" size={16} />
                        <Space width={8} />

                        <LakeText variant="regular" color={colors.gray[900]}>
                          {counterparty}
                        </LakeText>
                      </Box>
                    )}
                  />

                  {canceledDateTime}
                  {rejectedDateTime}
                  {rejectedReason}
                  {renderReferenceToDisplay(reference)}
                  {transactionId}

                  {originTransaction != null && (
                    <ReadOnlyFieldList>
                      <LakeLabel
                        type="viewSmall"
                        label={t("transaction.originalTransactionId")}
                        render={() => (
                          <LakeText variant="regular" color={colors.gray[900]}>
                            {originTransaction.id}
                          </LakeText>
                        )}
                      />

                      <FormattedDateTime
                        label={t("transaction.originalTransactionDate")}
                        date={originTransaction.executionDate}
                      />

                      {match(feesType)
                        .with("CashWithdrawalsOutsideSEPA", "CardPaymentsOutsideSEPA", () => (
                          <LakeLabel
                            type="viewSmall"
                            label={t("transaction.originalTransactionAmount")}
                            render={() => (
                              <LakeText variant="regular" color={colors.gray[900]}>
                                {formatCurrency(
                                  Number(originTransaction.amount.value),
                                  originTransaction.amount.currency,
                                )}
                              </LakeText>
                            )}
                          />
                        ))
                        .with("DirectDebitRejection", () => (
                          <LakeLabel
                            type="viewSmall"
                            label={t("transaction.rejectedAmount")}
                            render={() => (
                              <LakeText variant="regular" color={colors.gray[900]}>
                                {formatCurrency(
                                  Number(originTransaction.amount.value),
                                  originTransaction.amount.currency,
                                )}
                              </LakeText>
                            )}
                          />
                        ))
                        .otherwise(() => null)}

                      {match(transaction)
                        .with(
                          {
                            __typename: "FeeTransaction",
                            feesType: "DirectDebitRejection",
                            originTransaction: {
                              statusInfo: {
                                __typename: "RejectedTransactionStatusInfo",
                                reason: P.select(),
                              },
                            },
                          },
                          reason => {
                            const description = getTransactionRejectedReasonLabel(reason);

                            if (isNullish(description)) {
                              return null;
                            }

                            return (
                              <LakeLabel
                                type="viewSmall"
                                label={t("transaction.feesReason")}
                                render={() => (
                                  <LakeText variant="regular" color={colors.gray[900]}>
                                    {description}
                                  </LakeText>
                                )}
                              />
                            );
                          },
                        )
                        .otherwise(() => null)}
                    </ReadOnlyFieldList>
                  )}
                </ReadOnlyFieldList>
              ),
            )
            .with(
              { __typename: "CheckTransaction" },
              ({
                cmc7,
                rlmcKey,
                reservedAmount,
                reservedAmountReleasedAt,
                reference,
                createdAt,
              }) => {
                // The check number is the first 7 numbers of the cmc7
                const checkNumber = cmc7.slice(0, 7);

                return (
                  <ReadOnlyFieldList>
                    {bookingDateTime}

                    {isNotNullish(reservedAmount) && (
                      <LakeLabel
                        type="viewSmall"
                        label={t("transaction.reservedAmount")}
                        render={() => (
                          <LakeText variant="regular" color={colors.gray[900]}>
                            {formatCurrency(Number(reservedAmount.value), reservedAmount.currency)}
                          </LakeText>
                        )}
                      />
                    )}

                    {isNotNullish(reservedAmountReleasedAt) && (
                      <FormattedDateTime
                        label={t("transaction.reservedUntil")}
                        date={reservedAmountReleasedAt}
                      />
                    )}

                    <LakeLabel
                      type="viewSmall"
                      label={t("transaction.paymentMethod")}
                      render={() => (
                        <LakeText variant="regular" color={colors.gray[900]}>
                          {match(transaction)
                            .with({ __typename: "CheckTransaction" }, () =>
                              t("transactions.method.Check"),
                            )
                            .with(
                              { __typename: "InternalDirectDebitTransaction" },
                              { __typename: "SEPADirectDebitTransaction" },
                              () => t("transactions.method.DirectDebit"),
                            )
                            .otherwise(() => null)}
                        </LakeText>
                      )}
                    />

                    {match(transaction.statusInfo.status)
                      .with(P.not("Upcoming"), () => (
                        <FormattedDateTime
                          label={t("transaction.paymentDateTime")}
                          date={createdAt}
                        />
                      ))
                      .otherwise(() => null)}

                    {executionDateTime}
                    {canceledDateTime}
                    {rejectedDateTime}
                    {rejectedReason}
                    {renderReferenceToDisplay(reference)}
                    {transactionId}

                    <LakeLabel
                      type="viewSmall"
                      label={t("transaction.cmc7")}
                      actions={
                        <LakeCopyButton
                          valueToCopy={cmc7}
                          copiedText={t("copyButton.copiedTooltip")}
                          copyText={t("copyButton.copyTooltip")}
                        />
                      }
                      render={() => (
                        <LakeText variant="regular" color={colors.gray[900]}>
                          {cmc7}
                        </LakeText>
                      )}
                    />

                    <LakeLabel
                      type="viewSmall"
                      label={t("transaction.rlmcKey")}
                      actions={
                        <LakeCopyButton
                          valueToCopy={rlmcKey}
                          copiedText={t("copyButton.copiedTooltip")}
                          copyText={t("copyButton.copyTooltip")}
                        />
                      }
                      render={() => (
                        <LakeText variant="regular" color={colors.gray[900]}>
                          {rlmcKey}
                        </LakeText>
                      )}
                    />

                    <LakeLabel
                      type="viewSmall"
                      label={t("transaction.checkNumber")}
                      actions={
                        <LakeCopyButton
                          valueToCopy={checkNumber}
                          copiedText={t("copyButton.copiedTooltip")}
                          copyText={t("copyButton.copyTooltip")}
                        />
                      }
                      render={() => (
                        <LakeText variant="regular" color={colors.gray[900]}>
                          {checkNumber}
                        </LakeText>
                      )}
                    />
                  </ReadOnlyFieldList>
                );
              },
            )
            .with(
              { __typename: "InternationalCreditTransferTransaction" },
              ({
                reference,
                createdAt,
                creditor,
                internationalCurrencyExchange,
                paymentProduct,
              }) => (
                <ReadOnlyFieldList>
                  <FormattedDateTime label={t("transaction.paymentDateTime")} date={createdAt} />

                  {match(creditor)
                    .with(
                      { __typename: "InternationalCreditTransferOutCreditor" },
                      ({ name, details }) => (
                        <ReadOnlyFieldList>
                          <LakeLabel
                            type="viewSmall"
                            label={t("transaction.creditorName")}
                            render={() => (
                              <Box direction="row" alignItems="center">
                                <Icon name="person-regular" size={16} />
                                <Space width={8} />

                                <LakeText variant="regular" color={colors.gray[900]}>
                                  {name}
                                </LakeText>
                              </Box>
                            )}
                          />

                          {details.map(detail => (
                            <LakeLabel
                              key={getWiseIctLabel(detail.key)}
                              type="viewSmall"
                              label={getWiseIctLabel(detail.key)}
                              render={() => (
                                <LakeText variant="regular" color={colors.gray[900]}>
                                  {getWiseIctLabel(detail.value)}
                                </LakeText>
                              )}
                            />
                          ))}
                        </ReadOnlyFieldList>
                      ),
                    )
                    .otherwise(() => null)}

                  <LakeLabel
                    type="viewSmall"
                    label={t("transactionDetail.internationalCreditTransfer.exchangeRate")}
                    render={() => (
                      <LakeText variant="regular" color={colors.gray[900]}>
                        {internationalCurrencyExchange.exchangeRate}
                      </LakeText>
                    )}
                  />

                  {match(paymentProduct)
                    .with("InternationalCreditTransfer", () => (
                      <LakeLabel
                        type="viewSmall"
                        label={t("transactionDetail.internationalCreditTransfer.paymentProduct")}
                        render={() => (
                          <LakeText variant="regular" color={colors.gray[900]}>
                            {t("transactionDetail.paymentProduct.InternationalCreditTransfer")}
                          </LakeText>
                        )}
                      />
                    ))
                    .otherwise(() => null)}

                  {rejectedReason}
                  {renderReferenceToDisplay(reference)}
                  {transactionId}
                </ReadOnlyFieldList>
              ),
            )

            .otherwise(() => (
              <ReadOnlyFieldList>
                {bookingDateTime}
                {executionDateTime}
                {canceledDateTime}
                {rejectedDateTime}
                {rejectedReason}
                {transactionId}
              </ReadOnlyFieldList>
            ))}
        </ScrollView>
      </ListRightPanelContent>
    </ScrollView>
  );
};
