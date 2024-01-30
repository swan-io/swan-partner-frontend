import { Box } from "@swan-io/lake/src/components/Box";
import { Icon, IconName } from "@swan-io/lake/src/components/Icon";
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
import { isNotEmpty, isNotNullish, isNullish } from "@swan-io/lake/src/utils/nullish";
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
const truncateTransactionId = (id: string) => id.split("#")[0] ?? id;

const IconLine = ({ icon, text }: { icon: IconName; text: string }) => (
  <Box direction="row" alignItems="center">
    <Icon name={icon} size={16} />
    <Space width={8} />

    <LakeText variant="regular" color={colors.gray[900]}>
      {text}
    </LakeText>
  </Box>
);

const FormattedDateTime = ({ date, label }: { date: string; label: string }) => (
  <LakeLabel
    type="viewSmall"
    label={label}
    render={() => (
      <IconLine icon="calendar-ltr-regular" text={formatDateTime(new Date(date), "LLL")} />
    )}
  />
);

const CopiableLine = ({ label, text }: { label: string; text: string }) => (
  <LakeLabel
    type="viewSmall"
    label={label}
    actions={
      <LakeCopyButton
        valueToCopy={text}
        copiedText={t("copyButton.copiedTooltip")}
        copyText={t("copyButton.copyTooltip")}
      />
    }
    render={() => (
      <LakeText variant="regular" color={colors.gray[900]}>
        {text}
      </LakeText>
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

  const transactionId = (
    <CopiableLine label={t("transaction.id")} text={truncateTransactionId(transaction.id)} />
  );

  const reference = (
    <CopiableLine
      label={t("transaction.reference")}
      text={isNotEmpty(transaction.reference) ? transaction.reference : "—"}
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
                maskedPan,
                merchantCity,
                merchantCountry,
                payment,
                statusInfo: { status },
              }) => {
                const user = card?.accountMembership.user;

                const merchantCountryName = countries.find(
                  country => country.cca3 === merchantCountry,
                )?.name;

                return (
                  <ReadOnlyFieldList>
                    {isNotNullish(payment) && (status === "Booked" || status === "Pending") && (
                      <FormattedDateTime
                        label={t("transaction.paymentDateTime")}
                        date={payment.createdAt}
                      />
                    )}

                    {bookingDateTime}
                    {executionDateTime}
                    {canceledDateTime}
                    {rejectedDateTime}
                    {rejectedReason}

                    {match(merchantCountryName)
                      .with(P.string, name => (
                        <LakeLabel
                          type="viewSmall"
                          label={t("transaction.place")}
                          render={() => (
                            <LakeText variant="regular" color={colors.gray[900]}>
                              {`${merchantCity} - ${name}`}
                            </LakeText>
                          )}
                        />
                      ))
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

                    {match(user)
                      .with(
                        { firstName: P.string, lastName: P.string },
                        ({ firstName, lastName }) => (
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

                    {reference}
                    {transactionId}
                  </ReadOnlyFieldList>
                );
              },
            )
            .with(
              { __typename: "SEPACreditTransferTransaction" },
              ({ createdAt, debtor, creditor }) => {
                const debtorIban = debtor.IBAN;
                const creditorIban = creditor.IBAN;

                return (
                  <ReadOnlyFieldList>
                    <FormattedDateTime label={t("transaction.paymentDateTime")} date={createdAt} />

                    {bookingDateTime}

                    <LakeLabel
                      type="viewSmall"
                      label={t("transaction.debtorName")}
                      render={() => <IconLine icon="person-regular" text={debtor.name} />}
                    />

                    {isNotNullish(debtorIban) && (
                      <LakeLabel
                        type="viewSmall"
                        label={t("transaction.debtorIban")}
                        render={() => (
                          <LakeText variant="regular" color={colors.gray[900]}>
                            {printIbanFormat(debtorIban)}
                          </LakeText>
                        )}
                      />
                    )}

                    <LakeLabel
                      type="viewSmall"
                      label={t("transaction.creditorName")}
                      render={() => <IconLine icon="person-regular" text={creditor.name} />}
                    />

                    {isNotNullish(creditorIban) && (
                      <LakeLabel
                        type="viewSmall"
                        label={t("transaction.creditorIban")}
                        render={() => (
                          <LakeText variant="regular" color={colors.gray[900]}>
                            {printIbanFormat(creditorIban)}
                          </LakeText>
                        )}
                      />
                    )}

                    {executionDateTime}
                    {canceledDateTime}
                    {rejectedDateTime}
                    {rejectedReason}
                    {reference}
                    {transactionId}
                  </ReadOnlyFieldList>
                );
              },
            )
            .with(
              { __typename: "SEPADirectDebitTransaction" },
              ({ mandate, creditor, debtor, reservedAmount, reservedAmountReleasedAt }) => {
                const debtorIban = debtor.IBAN;

                const creditorIban =
                  (mandate?.__typename === "SEPAReceivedDirectDebitMandate"
                    ? mandate.ultimateCreditorName
                    : undefined) ?? creditor.IBAN;

                return (
                  <ReadOnlyFieldList>
                    {bookingDateTime}

                    <LakeLabel
                      type="viewSmall"
                      label={t("transaction.debtorName")}
                      render={() => <IconLine icon="person-regular" text={debtor.name} />}
                    />

                    {isNotNullish(debtorIban) && (
                      <LakeLabel
                        type="viewSmall"
                        label={t("transaction.debtorIban")}
                        render={() => (
                          <LakeText variant="regular" color={colors.gray[900]}>
                            {printIbanFormat(debtorIban)}
                          </LakeText>
                        )}
                      />
                    )}

                    <LakeLabel
                      type="viewSmall"
                      label={t("transaction.creditorName")}
                      render={() => <IconLine icon="person-regular" text={creditor.name} />}
                    />

                    {isNotNullish(creditorIban) && (
                      <LakeLabel
                        type="viewSmall"
                        label={t("transaction.creditorIban")}
                        render={() => (
                          <LakeText variant="regular" color={colors.gray[900]}>
                            {printIbanFormat(creditorIban)}
                          </LakeText>
                        )}
                      />
                    )}

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

                    {executionDateTime}
                    {canceledDateTime}
                    {rejectedDateTime}
                    {rejectedReason}
                    {reference}
                    {transactionId}
                  </ReadOnlyFieldList>
                );
              },
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

                  <LakeLabel
                    type="viewSmall"
                    label={t("transaction.creditorName")}
                    render={() => (
                      <LakeText variant="regular" color={colors.gray[900]}>
                        {creditor.accountId}
                      </LakeText>
                    )}
                  />

                  {canceledDateTime}
                  {rejectedDateTime}
                  {rejectedReason}
                  {reference}
                  {transactionId}
                </ReadOnlyFieldList>
              ),
            )
            .with({ __typename: "InternalCreditTransfer" }, ({ creditor }) => (
              <ReadOnlyFieldList>
                {bookingDateTime}
                {executionDateTime}

                <LakeLabel
                  type="viewSmall"
                  label={t("transaction.creditorName")}
                  render={() => <IconLine icon="person-regular" text={creditor.name} />}
                />

                {canceledDateTime}
                {rejectedDateTime}
                {rejectedReason}
                {reference}
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
                    render={() => <IconLine icon="person-regular" text={counterparty} />}
                  />

                  {canceledDateTime}
                  {rejectedDateTime}
                  {rejectedReason}
                  {reference}
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
                createdAt,
                reservedAmount,
                reservedAmountReleasedAt,
                rlmcKey,
                statusInfo: { status },
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

                    {status !== "Upcoming" && (
                      <FormattedDateTime
                        label={t("transaction.paymentDateTime")}
                        date={createdAt}
                      />
                    )}

                    {executionDateTime}
                    {canceledDateTime}
                    {rejectedDateTime}
                    {rejectedReason}
                    {reference}
                    {transactionId}

                    <CopiableLine label={t("transaction.cmc7")} text={cmc7} />
                    <CopiableLine label={t("transaction.rlmcKey")} text={rlmcKey} />
                    <CopiableLine label={t("transaction.checkNumber")} text={checkNumber} />
                  </ReadOnlyFieldList>
                );
              },
            )
            .with(
              { __typename: "InternationalCreditTransferTransaction" },
              ({ createdAt, creditor, internationalCurrencyExchange, paymentProduct }) => (
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
                            render={() => <IconLine icon="person-regular" text={name} />}
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
                  {reference}
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
                {reference}
                {transactionId}
              </ReadOnlyFieldList>
            ))}
        </ScrollView>
      </ListRightPanelContent>
    </ScrollView>
  );
};
