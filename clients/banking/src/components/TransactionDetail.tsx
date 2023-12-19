import { LakeAlert } from "@swan-io/lake/src/components/LakeAlert";
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
import { countries } from "@swan-io/shared-business/src/constants/countries";
import { ScrollView, StyleSheet } from "react-native";
import { P, match } from "ts-pattern";
import { TransactionDetailsFragment } from "../graphql/partner";
import { formatCurrency, formatDateTime, t } from "../utils/i18n";
import { printIbanFormat } from "../utils/iban";
import {
  getFeesDescription,
  getTransactionRejectedReasonLabel,
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

type Props = {
  transaction: TransactionDetailsFragment;
  large: boolean;
};

const truncateTransactionId = (id: string) => id.split("#", 2)[0];

const formatMaskedPan = (value: string) => value.replace(/X/g, "•").replace(/(.{4})(?!$)/g, "$1 ");

export const TransactionDetail = ({ transaction, large }: Props) => {
  if (transaction == null) {
    return <ErrorView />;
  }

  const bookingDateTime = match(transaction.statusInfo)
    .with({ __typename: "BookedTransactionStatusInfo" }, ({ bookingDate }) => (
      <LakeLabel
        type="viewSmall"
        label={t("transaction.bookingDateTime")}
        render={() => (
          <LakeText variant="regular" color={colors.gray[900]}>
            {formatDateTime(new Date(bookingDate), "LLL")}
          </LakeText>
        )}
      />
    ))
    .otherwise(() => null);

  const executionDateTime = match(transaction.statusInfo)
    .with({ __typename: "UpcomingTransactionStatusInfo" }, ({ executionDate }) => (
      <LakeLabel
        type="viewSmall"
        label={t("transaction.executionDateTime")}
        render={() => (
          <LakeText variant="regular" color={colors.gray[900]}>
            {formatDateTime(new Date(executionDate), "LLL")}
          </LakeText>
        )}
      />
    ))
    .otherwise(() => null);

  const rejectedDate = match(transaction.statusInfo)
    .with({ __typename: "RejectedTransactionStatusInfo" }, () => (
      <LakeLabel
        type="viewSmall"
        label={t("transaction.rejectedDate")}
        render={() => (
          <LakeText variant="regular" color={colors.gray[900]}>
            {formatDateTime(new Date(transaction.updatedAt), "LLL")}
          </LakeText>
        )}
      />
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
              P.union(
                {
                  __typename: "InternationalCreditTransferTransaction",
                  internationalCurrencyExchange: {
                    targetAmount: {
                      value: P.select("value", P.string),
                      currency: P.select("currency", P.string),
                    },
                  },
                },
                {
                  __typename: "CardTransaction",
                  originalAmount: {
                    value: P.select("value", P.string),
                    currency: P.select("currency", P.string),
                  },
                },
              ),
              ({ currency = "", value }) => {
                return (
                  <LakeText>
                    {(transaction.side === "Debit" ? "-" : "+") +
                      formatCurrency(Number(value), currency)}
                  </LakeText>
                );
              },
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
                createdAt,
                statusInfo,
                merchantCountry: merchantCountryCCA3,
                merchantCity,
                maskedPan,
              }) => {
                const merchantCountry = countries.find(
                  country => country.cca3 === merchantCountryCCA3,
                )?.name;

                return (
                  <ReadOnlyFieldList>
                    {statusInfo.status === "Pending" && isNotNullish(createdAt) ? (
                      <LakeLabel
                        type="viewSmall"
                        label={t("transaction.paymentDateTime")}
                        render={() => (
                          <LakeText variant="regular" color={colors.gray[900]}>
                            {formatDateTime(new Date(createdAt), "LLL")}
                          </LakeText>
                        )}
                      />
                    ) : null}

                    {bookingDateTime}
                    {executionDateTime}
                    {rejectedDate}
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

                    {transactionId}
                  </ReadOnlyFieldList>
                );
              },
            )
            .with(
              { __typename: "SEPACreditTransferTransaction" },
              ({ createdAt, side, debtor, creditor }) => (
                <ReadOnlyFieldList>
                  {isNotNullish(createdAt) ? (
                    <LakeLabel
                      type="viewSmall"
                      label={t("transaction.paymentDateTime")}
                      render={() => (
                        <LakeText variant="regular" color={colors.gray[900]}>
                          {formatDateTime(new Date(createdAt), "LLL")}
                        </LakeText>
                      )}
                    />
                  ) : null}

                  {bookingDateTime}

                  {side === "Credit" ? (
                    <LakeLabel
                      type="viewSmall"
                      label={t("transaction.debtor")}
                      render={() => (
                        <LakeText variant="regular" color={colors.gray[900]}>
                          {debtor.name}
                        </LakeText>
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
                            <LakeText variant="regular" color={colors.gray[900]}>
                              {creditor.name}
                            </LakeText>
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
                            <LakeText variant="regular" color={colors.gray[900]}>
                              {creditor.name}
                            </LakeText>
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
                  {rejectedDate}
                  {rejectedReason}
                  {transactionId}
                </ReadOnlyFieldList>
              ),
            )
            .with(
              { __typename: "SEPADirectDebitTransaction" },
              ({ mandate, creditor, reference, reservedAmount, reservedAmountReleasedAt }) => (
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
                    <LakeLabel
                      type="viewSmall"
                      label={t("transaction.reservedUntil")}
                      render={() => (
                        <LakeText variant="regular" color={colors.gray[900]}>
                          {formatDateTime(new Date(reservedAmountReleasedAt), "LLL")}
                        </LakeText>
                      )}
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

                  {match(mandate)
                    .with({ __typename: "SEPAPaymentDirectDebitMandate" }, ({ debtor }) => (
                      <LakeLabel
                        type="viewSmall"
                        label={t("transaction.debtor")}
                        render={() => (
                          <LakeText variant="regular" color={colors.gray[900]}>
                            {debtor.name}
                          </LakeText>
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
                              <LakeText variant="regular" color={colors.gray[900]}>
                                {ultimateCreditorName ?? creditor.name}
                              </LakeText>
                            )}
                          />
                        );
                      },
                    )
                    .otherwise(() => null)}

                  {rejectedDate}
                  {rejectedReason}

                  <LakeLabel
                    type="viewSmall"
                    label={t("transaction.reference")}
                    render={() => (
                      <LakeText variant="regular" color={colors.gray[900]}>
                        {isNotNullishOrEmpty(reference) ? reference : "—"}
                      </LakeText>
                    )}
                  />

                  {transactionId}
                </ReadOnlyFieldList>
              ),
            )
            .with(
              { __typename: "InternalDirectDebitTransaction" },
              ({ creditor, reservedAmount, reservedAmountReleasedAt }) => (
                <ReadOnlyFieldList>
                  {bookingDateTime}

                  {isNotNullish(reservedAmount) && (
                    <LakeLabel
                      type="viewSmall"
                      label={t("transaction.reservedAmount")}
                      render={() => (
                        <LakeText variant="regular" color={colors.gray[900]}>
                          {(transaction.side === "Debit" ? "-" : "+") +
                            formatCurrency(Number(reservedAmount.value), reservedAmount.currency)}
                        </LakeText>
                      )}
                    />
                  )}

                  {isNotNullish(reservedAmountReleasedAt) && (
                    <LakeLabel
                      type="viewSmall"
                      label={t("transaction.reservedUntil")}
                      render={() => (
                        <LakeText variant="regular" color={colors.gray[900]}>
                          {formatDateTime(new Date(reservedAmountReleasedAt), "LLL")}
                        </LakeText>
                      )}
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

                  {rejectedDate}
                  {rejectedReason}
                  {transactionId}
                </ReadOnlyFieldList>
              ),
            )
            .with({ __typename: "InternalCreditTransfer" }, ({ creditor }) => (
              <ReadOnlyFieldList>
                {bookingDateTime}
                {executionDateTime}

                {creditor.name != null ? (
                  <LakeLabel
                    type="viewSmall"
                    label={t("transaction.creditorName")}
                    render={() => (
                      <LakeText variant="regular" color={colors.gray[900]}>
                        {creditor.name}
                      </LakeText>
                    )}
                  />
                ) : null}

                {rejectedDate}
                {rejectedReason}
                {transactionId}
              </ReadOnlyFieldList>
            ))
            .with(
              { __typename: "FeeTransaction" },
              ({ counterparty, feesType, originTransaction }) => (
                <ReadOnlyFieldList>
                  {bookingDateTime}
                  {executionDateTime}

                  <LakeLabel
                    type="viewSmall"
                    label={t("transaction.creditorName")}
                    render={() => (
                      <LakeText variant="regular" color={colors.gray[900]}>
                        {counterparty}
                      </LakeText>
                    )}
                  />

                  {rejectedDate}
                  {rejectedReason}
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

                      <LakeLabel
                        type="viewSmall"
                        label={t("transaction.originalTransactionDate")}
                        render={() => (
                          <LakeText variant="regular" color={colors.gray[900]}>
                            {formatDateTime(new Date(originTransaction.executionDate), "LLL")}
                          </LakeText>
                        )}
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
              ({ cmc7, rlmcKey, reservedAmount, reservedAmountReleasedAt }) => {
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
                            {(transaction.side === "Debit" ? "-" : "+") +
                              formatCurrency(Number(reservedAmount.value), reservedAmount.currency)}
                          </LakeText>
                        )}
                      />
                    )}

                    {isNotNullish(reservedAmountReleasedAt) && (
                      <LakeLabel
                        type="viewSmall"
                        label={t("transaction.reservedUntil")}
                        render={() => (
                          <LakeText variant="regular" color={colors.gray[900]}>
                            {formatDateTime(new Date(reservedAmountReleasedAt), "LLL")}
                          </LakeText>
                        )}
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
                    {rejectedDate}
                    {rejectedReason}
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
            .otherwise(() => (
              <ReadOnlyFieldList>
                {bookingDateTime}
                {executionDateTime}
                {rejectedDate}
                {rejectedReason}
                {transactionId}
              </ReadOnlyFieldList>
            ))}
        </ScrollView>
      </ListRightPanelContent>
    </ScrollView>
  );
};
