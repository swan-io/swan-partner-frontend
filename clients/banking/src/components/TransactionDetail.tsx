import { Box } from "@swan-io/lake/src/components/Box";
import { Icon, IconName } from "@swan-io/lake/src/components/Icon";
import { LakeAlert } from "@swan-io/lake/src/components/LakeAlert";
import { LakeCopyButton } from "@swan-io/lake/src/components/LakeCopyButton";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { Link } from "@swan-io/lake/src/components/Link";
import { ListRightPanelContent } from "@swan-io/lake/src/components/ListRightPanel";
import { LoadingView } from "@swan-io/lake/src/components/LoadingView";
import { ReadOnlyFieldList } from "@swan-io/lake/src/components/ReadOnlyFieldList";
import { Separator } from "@swan-io/lake/src/components/Separator";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tag } from "@swan-io/lake/src/components/Tag";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { colors } from "@swan-io/lake/src/constants/design";
import { useUrqlQuery } from "@swan-io/lake/src/hooks/useUrqlQuery";
import { isNotEmpty, isNotNullish, isNullish } from "@swan-io/lake/src/utils/nullish";
import { countries } from "@swan-io/shared-business/src/constants/countries";
import { printIbanFormat } from "@swan-io/shared-business/src/utils/validation";
import { ScrollView, StyleSheet } from "react-native";
import { P, match } from "ts-pattern";
import { TransactionDocument } from "../graphql/partner";
import { formatCurrency, formatDateTime, t } from "../utils/i18n";
import { Router } from "../utils/routes";
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

const Line = ({ icon, label, text }: { icon?: IconName; label: string; text: string }) => (
  <LakeLabel
    type="viewSmall"
    label={label}
    render={() =>
      icon ? (
        <Box direction="row" alignItems="center">
          <Icon name={icon} size={16} />
          <Space width={8} />

          <LakeText variant="regular" color={colors.gray[900]}>
            {text}
          </LakeText>
        </Box>
      ) : (
        <LakeText variant="regular" color={colors.gray[900]}>
          {text}
        </LakeText>
      )
    }
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
  accountMembershipId: string;
  transactionId: string;
  large: boolean;
  canQueryCardOnTransaction: boolean;
  canViewAccount: boolean;
};

export const TransactionDetail = ({
  accountMembershipId,
  transactionId,
  large,
  canQueryCardOnTransaction,
  canViewAccount,
}: Props) => {
  const { data } = useUrqlQuery(
    {
      query: TransactionDocument,
      variables: { id: transactionId, canViewAccount, canQueryCardOnTransaction },
    },
    [transactionId],
  );

  if (data.isNotAsked() || data.isLoading()) {
    return <LoadingView />;
  }

  const result = data.get();

  if (result.isError()) {
    return <ErrorView error={result.getError()} />;
  }

  const transaction = result.get().transaction;

  if (transaction == null) {
    return <ErrorView />;
  }

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
                statusInfo: { status: "Pending" },
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
            .with(
              { statusInfo: { __typename: "RejectedTransactionStatusInfo" } },
              ({ statusInfo: { reason } }) => {
                const description = getTransactionRejectedReasonLabel(reason);
                if (isNullish(description)) {
                  return null;
                }
                return <LakeAlert anchored={true} variant="error" title={description} />;
              },
            )
            .with(
              { statusInfo: { __typename: "PendingTransactionStatusInfo" } },
              ({ statusInfo: { pendingEndDate } }) => (
                <LakeAlert
                  anchored={true}
                  variant="warning"
                  title={t("transaction.pendingTransaction.description", pendingEndDate)}
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
          <ReadOnlyFieldList>
            {match(transaction.statusInfo)
              .with({ __typename: "BookedTransactionStatusInfo" }, ({ bookingDate }) => (
                <Line
                  label={t("transaction.bookingDateTime")}
                  text={formatDateTime(new Date(bookingDate), "LLL")}
                  icon={"calendar-ltr-regular"}
                />
              ))
              .with({ __typename: "UpcomingTransactionStatusInfo" }, ({ executionDate }) => (
                <Line
                  label={t("transaction.executionDateTime")}
                  text={formatDateTime(new Date(executionDate), "LLL")}
                  icon={"calendar-ltr-regular"}
                />
              ))
              .with(
                {
                  __typename: "CanceledTransactionStatusInfo",
                  canceledDate: P.not(P.nullish),
                },
                ({ canceledDate }) => (
                  <Line
                    label={t("transaction.canceledDate")}
                    text={formatDateTime(new Date(canceledDate), "LLL")}
                    icon={"calendar-ltr-regular"}
                  />
                ),
              )
              .otherwise(() => null)}
          </ReadOnlyFieldList>

          <Separator space={8} />

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
                      <Line
                        label={t("transaction.paymentDateTime")}
                        text={formatDateTime(new Date(payment.createdAt), "LLL")}
                        icon={"calendar-ltr-regular"}
                      />
                    )}

                    {match(merchantCountryName)
                      .with(P.string, name => (
                        <Line
                          label={t("transaction.place")}
                          text={isNotEmpty(merchantCity) ? `${merchantCity} - ${name}` : name}
                        />
                      ))
                      .otherwise(() => null)}

                    <Line label={t("transaction.maskedPan")} text={formatMaskedPan(maskedPan)} />

                    {match(user)
                      .with(
                        { firstName: P.string, lastName: P.string },
                        ({ firstName, lastName }) => (
                          <Line
                            label={t("transaction.cardHolder")}
                            text={[firstName, lastName].join(" ")}
                          />
                        ),
                      )
                      .otherwise(() => null)}

                    <Line
                      label={t("transaction.paymentMethod")}
                      text={t("transactions.method.Card")}
                      icon="payment-regular"
                    />
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
                    <Line
                      label={t("transaction.paymentDateTime")}
                      text={formatDateTime(new Date(createdAt), "LLL")}
                      icon={"calendar-ltr-regular"}
                    />

                    <Line
                      label={t("transaction.debtorName")}
                      text={debtor.name}
                      icon={"person-regular"}
                    />

                    {isNotNullish(debtorIban) && (
                      <Line
                        label={t("transaction.debtorIban")}
                        text={printIbanFormat(debtorIban)}
                      />
                    )}

                    <Line
                      label={t("transaction.creditorName")}
                      text={creditor.name}
                      icon={"person-regular"}
                    />

                    {isNotNullish(creditorIban) && (
                      <Line
                        label={t("transaction.creditorIban")}
                        text={printIbanFormat(creditorIban)}
                      />
                    )}

                    <Line
                      label={t("transaction.paymentMethod")}
                      text={t("transactions.method.Transfer")}
                      icon="arrow-swap-regular"
                    />
                  </ReadOnlyFieldList>
                );
              },
            )
            .with(
              { __typename: "SEPADirectDebitTransaction" },
              ({
                mandate,
                creditor,
                debtor,
                reservedAmount,
                reservedAmountReleasedAt,
                createdAt,
              }) => {
                // const debtorIban = debtor.IBAN;

                // //TODO check if it works like this: should be ultimateCreditorName or creditor.IBAN
                // const creditorIban =
                //   (mandate?.__typename === "SEPAReceivedDirectDebitMandate"
                //     ? mandate.ultimateCreditorName
                //     : undefined) ?? creditor.IBAN;

                // // { __typename: "SEPACreditTransferTransaction" },
                // // ({ createdAt, debtor, creditor }) => {
                // //   const debtorIban = debtor.IBAN;
                // //   const creditorIban = creditor.IBAN;
                const ultimateCreditorName = match(mandate)
                  .with(
                    { __typename: "SEPAReceivedDirectDebitMandate" },
                    ({ ultimateCreditorName }) => ultimateCreditorName,
                  )
                  .otherwise(() => null);
                // (mandate?.__typename === "SEPAReceivedDirectDebitMandate"
                //   ? mandate.ultimateCreditorName
                //   : creditor.name) ?? creditor.name;

                return (
                  <ReadOnlyFieldList>
                    <Line
                      label={t("transaction.paymentDateTime")}
                      text={formatDateTime(new Date(createdAt), "LLL")}
                      icon={"calendar-ltr-regular"}
                    />

                    <Line
                      label={t("transaction.debtorName")}
                      text={debtor.name}
                      icon={"person-regular"}
                    />

                    {isNotNullish(debtor.IBAN) && (
                      <Line
                        label={t("transaction.debtorIban")}
                        text={printIbanFormat(debtor.IBAN)}
                      />
                    )}

                    <Line
                      label={t("transaction.creditorName")}
                      text={isNotEmpty(ultimateCreditorName) ? ultimateCreditorName : creditor.name}
                      icon={"person-regular"}
                    />

                    {isNotNullish(creditor.IBAN) && (
                      <Line
                        label={t("transaction.creditorIban")}
                        text={printIbanFormat(creditor.IBAN)}
                      />
                    )}

                    {isNotNullish(reservedAmount) && (
                      <Line
                        label={t("transaction.reservedAmount")}
                        text={formatCurrency(Number(reservedAmount.value), reservedAmount.currency)}
                      />
                    )}

                    {isNotNullish(reservedAmountReleasedAt) && (
                      <Line
                        label={t("transaction.reservedUntil")}
                        text={formatDateTime(new Date(reservedAmountReleasedAt), "LLL")}
                        icon={"calendar-ltr-regular"}
                      />
                    )}

                    <Line
                      label={t("transaction.paymentMethod")}
                      text={t("transactions.method.DirectDebit")}
                      icon="arrow-swap-regular"
                    />
                  </ReadOnlyFieldList>
                );
              },
            )
            .with(
              { __typename: "InternalDirectDebitTransaction" },
              ({ creditor, reservedAmount, reservedAmountReleasedAt, createdAt }) => (
                <ReadOnlyFieldList>
                  <Line
                    label={t("transaction.paymentDateTime")}
                    text={formatDateTime(new Date(createdAt), "LLL")}
                    icon={"calendar-ltr-regular"}
                  />

                  {isNotNullish(reservedAmount) && (
                    <Line
                      label={t("transaction.reservedAmount")}
                      text={formatCurrency(Number(reservedAmount.value), reservedAmount.currency)}
                    />
                  )}

                  {isNotNullish(reservedAmountReleasedAt) && (
                    <Line
                      label={t("transaction.reservedUntil")}
                      text={formatDateTime(new Date(reservedAmountReleasedAt), "LLL")}
                      icon={"calendar-ltr-regular"}
                    />
                  )}

                  <Line label={t("transaction.creditorName")} text={creditor.accountId} />

                  <Line
                    label={t("transaction.paymentMethod")}
                    text={t("transactions.method.DirectDebit")}
                    icon="arrow-swap-regular"
                  />
                </ReadOnlyFieldList>
              ),
            )
            .with({ __typename: "InternalCreditTransfer" }, ({ creditor, createdAt }) => (
              <ReadOnlyFieldList>
                <Line
                  label={t("transaction.paymentDateTime")}
                  text={formatDateTime(new Date(createdAt), "LLL")}
                  icon={"calendar-ltr-regular"}
                />

                <Line
                  label={t("transaction.creditorName")}
                  text={creditor.name}
                  icon={"person-regular"}
                />

                <Line
                  label={t("transaction.paymentMethod")}
                  text={t("transactions.method.Transfer")}
                  icon="arrow-swap-regular"
                />
              </ReadOnlyFieldList>
            ))
            .with(
              { __typename: "FeeTransaction" },
              ({ counterparty, feesType, originTransaction, createdAt }) => (
                <ReadOnlyFieldList>
                  <Line
                    label={t("transaction.paymentDateTime")}
                    text={formatDateTime(new Date(createdAt), "LLL")}
                    icon={"calendar-ltr-regular"}
                  />

                  <Line
                    label={t("transaction.creditorName")}
                    text={counterparty}
                    icon={"person-regular"}
                  />

                  {originTransaction != null && (
                    <ReadOnlyFieldList>
                      <LakeLabel
                        type="viewSmall"
                        label={t("transaction.originalTransactionId")}
                        actions={
                          <Link
                            to={Router.AccountTransactionsListDetail({
                              accountMembershipId,
                              transactionId: originTransaction.id,
                            })}
                          >
                            <Icon size={20} name="arrow-right-regular" color={colors.swan[900]} />
                          </Link>
                        }
                        render={() => (
                          <LakeText variant="regular" color={colors.gray[900]}>
                            {originTransaction.id}
                          </LakeText>
                        )}
                      />

                      <Line
                        label={t("transaction.originalTransactionDate")}
                        text={formatDateTime(new Date(originTransaction.executionDate), "LLL")}
                        icon={"calendar-ltr-regular"}
                      />

                      {match(feesType)
                        .with("CashWithdrawalsOutsideSEPA", "CardPaymentsOutsideSEPA", () => (
                          <Line
                            label={t("transaction.originalTransactionAmount")}
                            text={formatCurrency(
                              Number(originTransaction.amount.value),
                              originTransaction.amount.currency,
                            )}
                          />
                        ))
                        .with("DirectDebitRejection", () => (
                          <Line
                            label={t("transaction.rejectedAmount")}
                            text={formatCurrency(
                              Number(originTransaction.amount.value),
                              originTransaction.amount.currency,
                            )}
                          />
                        ))
                        .otherwise(() => null)}
                    </ReadOnlyFieldList>
                  )}

                  <Line
                    label={t("transaction.paymentMethod")}
                    text={t("transactions.method.Fees")}
                    icon="arrow-swap-regular"
                  />
                </ReadOnlyFieldList>
              ),
            )
            .with(
              { __typename: "CheckTransaction" },
              ({ cmc7, createdAt, reservedAmount, reservedAmountReleasedAt, rlmcKey }) => {
                // The check number is the first 7 numbers of the cmc7
                const checkNumber = cmc7.slice(0, 7);

                return (
                  <ReadOnlyFieldList>
                    <Line
                      label={t("transaction.paymentDateTime")}
                      text={formatDateTime(new Date(createdAt), "LLL")}
                      icon={"calendar-ltr-regular"}
                    />

                    {isNotNullish(reservedAmount) && (
                      <Line
                        label={t("transaction.reservedAmount")}
                        text={formatCurrency(Number(reservedAmount.value), reservedAmount.currency)}
                      />
                    )}

                    {isNotNullish(reservedAmountReleasedAt) && (
                      <Line
                        label={t("transaction.reservedUntil")}
                        text={formatDateTime(new Date(reservedAmountReleasedAt), "LLL")}
                        icon={"calendar-ltr-regular"}
                      />
                    )}

                    <CopiableLine label={t("transaction.cmc7")} text={cmc7} />
                    <CopiableLine label={t("transaction.rlmcKey")} text={rlmcKey} />
                    <CopiableLine label={t("transaction.checkNumber")} text={checkNumber} />

                    <Line
                      label={t("transaction.paymentMethod")}
                      text={t("transactions.method.Check")}
                      icon="arrow-swap-regular"
                    />
                  </ReadOnlyFieldList>
                );
              },
            )
            .with(
              { __typename: "InternationalCreditTransferTransaction" },
              ({ createdAt, creditor, internationalCurrencyExchange }) => (
                <ReadOnlyFieldList>
                  <Line
                    label={t("transaction.paymentDateTime")}
                    text={formatDateTime(new Date(createdAt), "LLL")}
                    icon={"calendar-ltr-regular"}
                  />

                  {match(creditor)
                    .with(
                      { __typename: "InternationalCreditTransferOutCreditor" },
                      ({ name, details }) => (
                        <ReadOnlyFieldList>
                          <Line
                            label={t("transaction.creditorName")}
                            text={name}
                            icon={"person-regular"}
                          />

                          {details.map(detail => (
                            <Line
                              key={getWiseIctLabel(detail.key)}
                              label={getWiseIctLabel(detail.key)}
                              text={getWiseIctLabel(detail.value)}
                            />
                          ))}
                        </ReadOnlyFieldList>
                      ),
                    )
                    .otherwise(() => null)}

                  <Line
                    label={t("transactionDetail.internationalCreditTransfer.exchangeRate")}
                    text={internationalCurrencyExchange.exchangeRate}
                  />

                  <Line
                    label={t("transaction.paymentMethod")}
                    text={t("transactions.method.Transfer")}
                    icon="arrow-swap-regular"
                  />
                </ReadOnlyFieldList>
              ),
            )

            .otherwise(() => null)}

          <Separator space={8} />

          {/* common fields */}
          <ReadOnlyFieldList>
            <CopiableLine
              label={t("transaction.id")}
              text={truncateTransactionId(transaction.id)}
            />

            <CopiableLine
              label={t("transaction.reference")}
              text={isNotEmpty(transaction.reference) ? transaction.reference : "—"}
            />
          </ReadOnlyFieldList>
        </ScrollView>
      </ListRightPanelContent>
    </ScrollView>
  );
};
