import { Future, Option, Result } from "@swan-io/boxed";
import { useDeferredQuery, useMutation, useQuery } from "@swan-io/graphql-client";
import { Box } from "@swan-io/lake/src/components/Box";
import { Icon } from "@swan-io/lake/src/components/Icon";
import { LakeAlert } from "@swan-io/lake/src/components/LakeAlert";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { Link } from "@swan-io/lake/src/components/Link";
import { ListRightPanelContent } from "@swan-io/lake/src/components/ListRightPanel";
import { LoadingView } from "@swan-io/lake/src/components/LoadingView";
import { Pressable } from "@swan-io/lake/src/components/Pressable";
import { ReadOnlyFieldList } from "@swan-io/lake/src/components/ReadOnlyFieldList";
import { ScrollView } from "@swan-io/lake/src/components/ScrollView";
import { Separator } from "@swan-io/lake/src/components/Separator";
import { Space } from "@swan-io/lake/src/components/Space";
import { useIsSuspendable } from "@swan-io/lake/src/components/Suspendable";
import { TabView } from "@swan-io/lake/src/components/TabView";
import { Tag } from "@swan-io/lake/src/components/Tag";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { backgroundColor, colors, radii, spacings } from "@swan-io/lake/src/constants/design";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import {
  isNotEmpty,
  isNotNullish,
  isNotNullishOrEmpty,
  isNullish,
} from "@swan-io/lake/src/utils/nullish";
import { getCountryByCCA3, isCountryCCA3 } from "@swan-io/shared-business/src/constants/countries";
import { showToast } from "@swan-io/shared-business/src/state/toasts";
import { translateError } from "@swan-io/shared-business/src/utils/i18n";
import { printIbanFormat } from "@swan-io/shared-business/src/utils/validation";
import { printFormat } from "iban";
import { useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import { P, match } from "ts-pattern";
import {
  GenerateTransactionStatementDocument,
  TransactionDocument,
  TransactionStatementDocument,
  TransactionStatementLanguage,
} from "../graphql/partner";
import { usePermissions } from "../hooks/usePermissions";
import { NotFoundPage } from "../pages/NotFoundPage";
import { formatCurrency, formatDateTime, locale, t } from "../utils/i18n";
import { Router } from "../utils/routes";
import {
  getFeesDescription,
  getInstantTransferFallbackReasonLabel,
  getTransactionRejectedReasonLabel,
  getWiseIctLabel,
} from "../utils/templateTranslations";
import { concatSepaBeneficiaryAddress } from "./BeneficiaryDetail";
import { DetailCopiableLine, DetailLine } from "./DetailLine";
import { ErrorView } from "./ErrorView";
import {
  getMerchantCategoryIcon,
  getMerchantCategoryLabel,
  getMerchantCategorySublabel,
  getTransactionLabel,
} from "./TransactionListCells";

const styles = StyleSheet.create({
  fill: {
    ...commonStyles.fill,
  },
  content: {
    ...commonStyles.fill,
    paddingVertical: spacings[24],
  },
  tile: {
    alignItems: "center",
  },
  debitAmount: {
    marginLeft: -16,
  },
  wrapText: {
    display: "flex",
    wordBreak: "break-all",
    flexDirection: "row",
    alignItems: "center",
  },
  merchantLogo: {
    width: spacings[72],
    height: spacings[72],
    borderRadius: radii[8],
  },
  merchantLogoShadow: {
    ...StyleSheet.absoluteFillObject,
    width: spacings[72],
    height: spacings[72],
    borderRadius: radii[8],
    boxShadow: "inset 0 0 0 1px rgba(0, 0, 0, 0.1)",
  },
  icon: {
    aspectRatio: "1 / 1",
    display: "flex",
  },
  buttonGroup: {
    backgroundColor: backgroundColor.default,
    position: "sticky",
    bottom: 0,
  },
});

const formatMaskedPan = (value: string) => value.replace(/X/g, "•").replace(/(.{4})(?!$)/g, "$1 ");
const truncateTransactionId = (id: string) => id.split("#")[0] ?? id;

type Props = {
  accountMembershipId: string;
  transactionId: string;
  large: boolean;
};

type Tab = "details" | "beneficiary" | "merchantInfo";

export const TransactionDetail = ({ accountMembershipId, transactionId, large }: Props) => {
  const suspense = useIsSuspendable();

  const [generateTransactionStatement] = useMutation(GenerateTransactionStatementDocument);
  const [, { query: queryTransactionStatement }] = useDeferredQuery(TransactionStatementDocument);

  const [isGeneratingStatement, setIsGeneratingStatement] = useState(false);

  const generateStatement = ({ language }: { language: TransactionStatementLanguage }) => {
    setIsGeneratingStatement(true);
    generateTransactionStatement({ input: { transactionId, language } })
      .mapOk(data => data.generateTransactionStatement)
      .mapOkToResult(filterRejectionsToResult)
      .mapOkToResult(data => Option.fromNullable(data.transactionStatement).toResult(new Error()))
      .flatMapOk(({ id }) =>
        Future.retry(
          () =>
            Future.wait(1000).flatMap(() =>
              queryTransactionStatement({ id }).mapOkToResult(data =>
                match(data.transactionStatement)
                  .with(
                    {
                      statusInfo: {
                        __typename: "GeneratedTransactionStatementStatusInfo",
                        url: P.select(),
                      },
                    },
                    url => Result.Ok(url),
                  )
                  .otherwise(value => Result.Error(value)),
              ),
            ),
          { max: 20 },
        ),
      )
      .tap(() => setIsGeneratingStatement(false))
      .tapOk(url => window.location.replace(url))
      .tapError(error => showToast({ variant: "error", title: translateError(error), error }));
  };

  const { canReadOtherMembersCards: canQueryCardOnTransaction } = usePermissions();
  const [data] = useQuery(
    TransactionDocument,
    {
      id: transactionId,
      canQueryCardOnTransaction,
    },
    { suspense },
  );

  const [activeTab, setActiveTab] = useState<Tab>("details");

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

  const tabs: { id: Tab; label: string }[] = [
    { id: "details", label: t("transaction.tabs.details") },

    ...match(transaction)
      .returnType<typeof tabs>()
      .with({ __typename: "CardTransaction", merchant: { __typename: "CardOutMerchant" } }, () => [
        { id: "merchantInfo", label: t("transaction.tabs.merchantInfo") },
      ])
      .with({ beneficiary: P.nonNullable }, () => [
        { id: "beneficiary", label: t("transaction.tabs.beneficiary") },
      ])
      .otherwise(() => []),
  ];

  return (
    <ScrollView contentContainerStyle={large ? styles.fill : undefined}>
      <ListRightPanelContent large={large} style={styles.fill}>
        <Tile
          style={styles.tile}
          footer={match(transaction)
            // BankingFee should never happen, so we don't handle it
            // We display the description only for non rejected transaction because it has already an alert displayed in this case
            .with(
              {
                feesType: P.not("BankingFee"),
                statusInfo: { __typename: P.not("RejectedTransactionStatusInfo") },
              },
              ({ feesType }) => {
                const description = getFeesDescription(feesType);

                if (isNullish(description)) {
                  return null;
                }

                return <LakeAlert anchored={true} variant="info" title={description} />;
              },
            )
            .with(
              {
                statusInfo: { status: "Pending" },
                originTransaction: {
                  type: P.union("SepaInstantCreditTransferIn", "SepaInstantCreditTransferOut"),
                  statusInfo: {
                    reason: P.select(),
                  },
                },
              },
              reason => {
                const description = getInstantTransferFallbackReasonLabel(reason);

                return (
                  <LakeAlert
                    anchored={true}
                    variant="warning"
                    title={t("transaction.instantTransferUnavailable")}
                    children={description}
                  />
                );
              },
            )
            .with(
              {
                statusInfo: { __typename: "RejectedTransactionStatusInfo", reason: P.select() },
              },
              reason => {
                const description = getTransactionRejectedReasonLabel(reason);
                if (isNullish(description)) {
                  return null;
                }
                return <LakeAlert anchored={true} variant="error" title={description} />;
              },
            )
            .with(
              {
                statusInfo: {
                  __typename: "PendingTransactionStatusInfo",
                  pendingEndDate: P.select(P.string),
                },
              },
              pendingEndDate => (
                <LakeAlert
                  anchored={true}
                  variant="info"
                  title={t("transaction.pendingTransaction.description", {
                    executionDate: formatDateTime(pendingEndDate, "LL"),
                  })}
                />
              ),
            )
            .otherwise(() => null)}
        >
          {match(transaction.statusInfo.__typename)
            .with("PendingTransactionStatusInfo", () => (
              <>
                <Tag color="shakespear">{t("transactionStatus.pending")}</Tag>
                <Space height={12} />
              </>
            ))
            .with("RejectedTransactionStatusInfo", () => (
              <>
                <Tag color="negative">{t("transactionStatus.rejected")}</Tag>
                <Space height={12} />
              </>
            ))
            .with("CanceledTransactionStatusInfo", () => (
              <>
                <Tag color="gray">{t("transactionStatus.canceled")}</Tag>
                <Space height={12} />
              </>
            ))
            .otherwise(() => null)}

          {match(transaction)
            .with(
              {
                __typename: "CardTransaction",
                enrichedTransactionInfo: { logoUrl: P.select(P.string) },
              },
              logoUrl => (
                <>
                  <View>
                    <Image source={logoUrl} style={styles.merchantLogo} />
                    <View style={styles.merchantLogoShadow} />
                  </View>

                  <Space height={12} />
                </>
              ),
            )
            .otherwise(() => null)}

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

        {tabs.length > 1 && (
          <>
            <Space height={24} />

            <TabView
              activeTabId={activeTab}
              tabs={tabs}
              onChange={tab => setActiveTab(tab as Tab)}
              otherLabel={t("common.tabs.other")}
            />
          </>
        )}

        {match(activeTab)
          .with("details", () => (
            <ScrollView style={styles.fill} contentContainerStyle={styles.content}>
              {match(transaction.statusInfo)
                .with({ __typename: "BookedTransactionStatusInfo" }, ({ bookingDate }) => (
                  <>
                    <DetailLine
                      label={t("transaction.bookingDateTime")}
                      text={formatDateTime(bookingDate, "LLL")}
                      icon="calendar-ltr-regular"
                    />

                    <Separator space={8} />
                  </>
                ))
                .with({ __typename: "UpcomingTransactionStatusInfo" }, ({ executionDate }) => (
                  <>
                    <DetailLine
                      label={t("transaction.executionDateTime")}
                      text={formatDateTime(executionDate, "LLL")}
                      icon="calendar-ltr-regular"
                    />

                    <Separator space={8} />
                  </>
                ))
                .with(
                  {
                    __typename: "CanceledTransactionStatusInfo",
                    canceledDate: P.nonNullable,
                  },
                  ({ canceledDate }) => (
                    <>
                      <DetailLine
                        label={t("transaction.canceledDate")}
                        text={formatDateTime(canceledDate, "LLL")}
                        icon="calendar-ltr-regular"
                      />

                      <Separator space={8} />
                    </>
                  ),
                )
                .otherwise(() => null)}

              {match(transaction)
                .with(
                  { __typename: "CardTransaction" },
                  {
                    cardDetails: {
                      __typename: "CardOutDetails",
                    },
                  },
                  ({ cardDetails, payment, enrichedTransactionInfo, statusInfo: { status } }) => {
                    return (
                      <ReadOnlyFieldList>
                        {isNotNullish(payment) && (status === "Booked" || status === "Pending") && (
                          <DetailLine
                            label={t("transaction.paymentDateTime")}
                            text={formatDateTime(payment.createdAt, "LLL")}
                            icon="calendar-ltr-regular"
                          />
                        )}

                        {cardDetails?.__typename === "CardOutDetails" && (
                          <ReadOnlyFieldList>
                            <DetailLine
                              label={t("transaction.maskedPan")}
                              text={formatMaskedPan(cardDetails.maskedPan)}
                            />

                            {match(cardDetails.card?.accountMembership.user)
                              .with({ fullName: P.string }, ({ fullName }) => (
                                <DetailLine
                                  label={t("transaction.cardHolder")}
                                  text={fullName}
                                  icon="person-regular"
                                />
                              ))
                              .otherwise(() => null)}
                          </ReadOnlyFieldList>
                        )}

                        <DetailLine
                          label={t("transaction.paymentMethod")}
                          text={t("transactions.method.Card")}
                          icon="payment-regular"
                        />

                        {match(enrichedTransactionInfo)
                          .with({ isSubscription: P.select(P.boolean) }, isSubscription => (
                            <DetailLine
                              label={t("transaction.isSubscription")}
                              text={
                                isSubscription === true ? (
                                  <Tag color="positive">{t("common.true")}</Tag>
                                ) : (
                                  <Tag color="gray">{t("common.false")}</Tag>
                                )
                              }
                            />
                          ))
                          .otherwise(() => null)}

                        {match(enrichedTransactionInfo)
                          .with({ carbonFootprint: P.select(P.string) }, carbonFootprint => (
                            <DetailLine
                              label={t("transaction.carbonFootprint")}
                              text={t("transaction.carbonFootprint.value", {
                                carbonFootprint: Number(carbonFootprint) / 1_000_000,
                              })}
                            />
                          ))
                          .otherwise(() => null)}

                        {match(enrichedTransactionInfo)
                          .with({ enrichedMerchantName: P.string }, () => (
                            <DetailLine label={t("transaction.label")} text={transaction.label} />
                          ))
                          .otherwise(() => null)}
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
                        <DetailLine
                          label={t("transaction.paymentDateTime")}
                          text={formatDateTime(createdAt, "LLL")}
                          icon="calendar-ltr-regular"
                        />

                        <DetailLine
                          label={t("transaction.debtorName")}
                          text={debtor.name}
                          icon="person-regular"
                        />

                        {isNotNullish(debtorIban) && (
                          <DetailCopiableLine
                            label={t("transaction.debtorIban")}
                            text={printIbanFormat(debtorIban)}
                          />
                        )}

                        <DetailLine
                          label={t("transaction.creditorName")}
                          text={creditor.name}
                          icon="person-regular"
                        />

                        {isNotNullish(creditorIban) && (
                          <DetailCopiableLine
                            label={t("transaction.creditorIban")}
                            text={printIbanFormat(creditorIban)}
                          />
                        )}

                        <DetailLine
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
                    const ultimateCreditorName = match(mandate)
                      .with(
                        {
                          __typename: "SEPAReceivedDirectDebitMandate",
                          ultimateCreditorName: P.select(P.string),
                        },
                        ultimateCreditorName => ultimateCreditorName,
                      )
                      .otherwise(() => null);

                    return (
                      <ReadOnlyFieldList>
                        <DetailLine
                          label={t("transaction.paymentDateTime")}
                          text={formatDateTime(createdAt, "LLL")}
                          icon="calendar-ltr-regular"
                        />

                        <DetailLine
                          label={t("transaction.debtorName")}
                          text={debtor.name}
                          icon="person-regular"
                        />

                        {isNotNullish(debtor.IBAN) && (
                          <DetailCopiableLine
                            label={t("transaction.debtorIban")}
                            text={printIbanFormat(debtor.IBAN)}
                          />
                        )}

                        <DetailLine
                          label={t("transaction.creditorName")}
                          text={
                            isNotNullishOrEmpty(ultimateCreditorName)
                              ? ultimateCreditorName
                              : creditor.name
                          }
                          icon="person-regular"
                        />

                        {isNotNullish(creditor.IBAN) && (
                          <DetailCopiableLine
                            label={t("transaction.creditorIban")}
                            text={printIbanFormat(creditor.IBAN)}
                          />
                        )}

                        {isNotNullish(reservedAmount) && (
                          <DetailLine
                            label={t("transaction.reservedAmount")}
                            text={formatCurrency(
                              Number(reservedAmount.value),
                              reservedAmount.currency,
                            )}
                          />
                        )}

                        {isNotNullish(reservedAmountReleasedAt) && (
                          <DetailLine
                            label={t("transaction.reservedUntil")}
                            text={formatDateTime(reservedAmountReleasedAt, "LLL")}
                            icon="calendar-ltr-regular"
                          />
                        )}

                        <DetailLine
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
                      <DetailLine
                        label={t("transaction.paymentDateTime")}
                        text={formatDateTime(createdAt, "LLL")}
                        icon="calendar-ltr-regular"
                      />

                      {isNotNullish(reservedAmount) && (
                        <DetailLine
                          label={t("transaction.reservedAmount")}
                          text={formatCurrency(
                            Number(reservedAmount.value),
                            reservedAmount.currency,
                          )}
                        />
                      )}

                      {isNotNullish(reservedAmountReleasedAt) && (
                        <DetailLine
                          label={t("transaction.reservedUntil")}
                          text={formatDateTime(reservedAmountReleasedAt, "LLL")}
                          icon="calendar-ltr-regular"
                        />
                      )}

                      <DetailLine label={t("transaction.creditorName")} text={creditor.accountId} />

                      <DetailLine
                        label={t("transaction.paymentMethod")}
                        text={t("transactions.method.DirectDebit")}
                        icon="arrow-swap-regular"
                      />
                    </ReadOnlyFieldList>
                  ),
                )
                .with({ __typename: "InternalCreditTransfer" }, ({ creditor, createdAt }) => (
                  <ReadOnlyFieldList>
                    <DetailLine
                      label={t("transaction.paymentDateTime")}
                      text={formatDateTime(createdAt, "LLL")}
                      icon="calendar-ltr-regular"
                    />

                    <DetailLine
                      label={t("transaction.creditorName")}
                      text={creditor.name}
                      icon="person-regular"
                    />

                    <DetailLine
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
                      <DetailLine
                        label={t("transaction.paymentDateTime")}
                        text={formatDateTime(createdAt, "LLL")}
                        icon="calendar-ltr-regular"
                      />

                      <DetailLine
                        label={t("transaction.creditorName")}
                        text={counterparty}
                        icon="person-regular"
                      />

                      {originTransaction != null && (
                        <ReadOnlyFieldList>
                          <LakeLabel
                            type="viewSmall"
                            label={t("transaction.relatedTransaction")}
                            actions={
                              <Link
                                to={Router.AccountTransactionsListDetail({
                                  accountMembershipId,
                                  transactionId: originTransaction.id,
                                })}
                              >
                                <Icon
                                  size={20}
                                  name="arrow-right-regular"
                                  color={colors.swan[900]}
                                />
                              </Link>
                            }
                            render={() => (
                              <Box direction="row" alignItems="center">
                                <Icon name="calendar-ltr-regular" size={16} />
                                <Space width={8} />

                                <LakeText variant="regular" color={colors.gray[900]}>
                                  {formatDateTime(originTransaction.executionDate, "LLL")}
                                </LakeText>
                              </Box>
                            )}
                          />

                          {match(feesType)
                            .with("CashWithdrawalsOutsideSEPA", "CardPaymentsOutsideSEPA", () => (
                              <DetailLine
                                label={t("transaction.originalTransactionAmount")}
                                text={formatCurrency(
                                  Number(originTransaction.amount.value),
                                  originTransaction.amount.currency,
                                )}
                              />
                            ))
                            .with("DirectDebitRejection", () => (
                              <DetailLine
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

                      <DetailLine
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
                        <DetailLine
                          label={t("transaction.paymentDateTime")}
                          text={formatDateTime(createdAt, "LLL")}
                          icon="calendar-ltr-regular"
                        />

                        {isNotNullish(reservedAmount) && (
                          <DetailLine
                            label={t("transaction.reservedAmount")}
                            text={formatCurrency(
                              Number(reservedAmount.value),
                              reservedAmount.currency,
                            )}
                          />
                        )}

                        {isNotNullish(reservedAmountReleasedAt) && (
                          <DetailLine
                            label={t("transaction.reservedUntil")}
                            text={formatDateTime(reservedAmountReleasedAt, "LLL")}
                            icon="calendar-ltr-regular"
                          />
                        )}

                        <DetailCopiableLine label={t("transaction.cmc7")} text={cmc7} />
                        <DetailCopiableLine label={t("transaction.rlmcKey")} text={rlmcKey} />

                        <DetailCopiableLine
                          label={t("transaction.checkNumber")}
                          text={checkNumber}
                        />

                        <DetailLine
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
                      <DetailLine
                        label={t("transaction.paymentDateTime")}
                        text={formatDateTime(createdAt, "LLL")}
                        icon="calendar-ltr-regular"
                      />

                      {match(creditor)
                        .with(
                          { __typename: "InternationalCreditTransferOutCreditor" },
                          ({ name, details }) => {
                            return (
                              <ReadOnlyFieldList>
                                <DetailLine
                                  label={t("transaction.creditorName")}
                                  text={name}
                                  icon="person-regular"
                                />

                                {details.map(detail => (
                                  <DetailLine
                                    key={detail.key}
                                    label={getWiseIctLabel(detail.key)}
                                    text={match(detail)
                                      .with({ key: "IBAN" }, ({ value }) => printFormat(value))
                                      .otherwise(({ value }) => value)}
                                  />
                                ))}
                              </ReadOnlyFieldList>
                            );
                          },
                        )
                        .otherwise(() => null)}

                      <DetailLine
                        label={t("transactionDetail.internationalCreditTransfer.exchangeRate")}
                        text={internationalCurrencyExchange.exchangeRate}
                      />

                      <DetailLine
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
                <DetailCopiableLine
                  label={t("transaction.reference")}
                  text={isNotEmpty(transaction.reference) ? transaction.reference : "—"}
                />

                <DetailCopiableLine
                  label={t("transaction.id")}
                  text={truncateTransactionId(transaction.id)}
                />
              </ReadOnlyFieldList>

              {transaction.statementCanBeGenerated === true ? (
                <View style={styles.buttonGroup}>
                  <LakeButtonGroup paddingBottom={0}>
                    <LakeButton
                      size="small"
                      color="current"
                      icon="arrow-download-filled"
                      loading={isGeneratingStatement}
                      onPress={() =>
                        generateStatement({
                          language: transaction.account?.language ?? locale.language,
                        })
                      }
                    >
                      {t("transaction.transactionConfirmation")}
                    </LakeButton>
                  </LakeButtonGroup>
                </View>
              ) : null}
            </ScrollView>
          ))
          .with("beneficiary", () => (
            <ScrollView style={styles.fill} contentContainerStyle={styles.content}>
              {match(transaction)
                .with({ beneficiary: P.select(P.nonNullable) }, beneficiary => (
                  <ReadOnlyFieldList>
                    <DetailLine label={t("beneficiaries.details.name")} text={beneficiary.name} />

                    {match(beneficiary)
                      .with(
                        { __typename: "TrustedSepaBeneficiary" },
                        { __typename: "UnsavedSepaBeneficiary" },
                        ({ address, iban }) => (
                          <>
                            <DetailLine
                              label={t("beneficiaries.details.iban")}
                              text={printFormat(iban)}
                            />

                            {match(concatSepaBeneficiaryAddress(address))
                              .with(P.nonNullable, address => (
                                <DetailLine
                                  label={t("beneficiaries.details.address")}
                                  text={address}
                                />
                              ))
                              .otherwise(() => null)}
                          </>
                        ),
                      )
                      .with({ __typename: "TrustedInternationalBeneficiary" }, ({ details }) =>
                        details.map(detail => (
                          <DetailLine
                            key={detail.key}
                            label={getWiseIctLabel(detail.key)}
                            text={match(detail)
                              .with({ key: "IBAN" }, ({ value }) => printFormat(value))
                              .otherwise(({ value }) => value)}
                          />
                        )),
                      )
                      .otherwise(() => null)}
                  </ReadOnlyFieldList>
                ))
                .otherwise(() => (
                  <NotFoundPage />
                ))}
            </ScrollView>
          ))
          .with("merchantInfo", () => (
            <ScrollView style={styles.fill} contentContainerStyle={styles.content}>
              {match(transaction)
                .with(
                  {
                    __typename: "CardTransaction",
                    merchant: {
                      merchantCity: P.select("merchantCity", P.string),
                      merchantCountry: P.select("merchantCountry", P.string),
                    },
                    enrichedTransactionInfo: P.select("enrichedTransactionInfo", P.nonNullable),
                  },
                  ({ merchantCity, merchantCountry, enrichedTransactionInfo }) => {
                    const contactWebsite = enrichedTransactionInfo.contactWebsite;
                    const contactEmail = enrichedTransactionInfo.contactEmail;
                    const contactPhone = enrichedTransactionInfo.contactPhone;
                    const city = enrichedTransactionInfo.city ?? merchantCity;

                    const countryName = match(enrichedTransactionInfo.country ?? merchantCountry)
                      .with(P.when(isCountryCCA3), value => getCountryByCCA3(value).name)
                      .otherwise(() => undefined);

                    return (
                      <ReadOnlyFieldList>
                        {enrichedTransactionInfo.category != null ? (
                          <DetailLine
                            label={t("transaction.category")}
                            text={getMerchantCategoryLabel(enrichedTransactionInfo.category)}
                            icon={getMerchantCategoryIcon(enrichedTransactionInfo.category)}
                          />
                        ) : null}

                        {enrichedTransactionInfo.subcategory != null ? (
                          <DetailLine
                            label={t("transaction.subcategory")}
                            text={getMerchantCategorySublabel(enrichedTransactionInfo.subcategory)}
                          />
                        ) : null}

                        {contactWebsite != null ? (
                          <LakeLabel
                            type="viewSmall"
                            label={t("transaction.website")}
                            actions={
                              <Pressable
                                style={styles.icon}
                                href={
                                  contactWebsite.startsWith("http://") ||
                                  contactWebsite.startsWith("https://")
                                    ? contactWebsite
                                    : `https://${contactWebsite}`
                                }
                                hrefAttrs={{ target: "blank" }}
                              >
                                <Icon size={21} color={colors.gray[900]} name="open-regular" />
                              </Pressable>
                            }
                            render={() => {
                              const url = Result.fromExecution(() => new URL(contactWebsite)).map(
                                url => `${url.hostname}${url.pathname}`,
                              );
                              return (
                                <LakeText variant="regular" color={colors.gray[900]}>
                                  {url.map(url => url.toString()).getOr(contactWebsite)}
                                </LakeText>
                              );
                            }}
                          />
                        ) : null}

                        {contactEmail != null ? (
                          <LakeLabel
                            type="viewSmall"
                            label={t("transaction.contactEmail")}
                            actions={
                              <Pressable style={styles.icon} href={`mailto:${contactEmail}`}>
                                <Icon size={21} color={colors.gray[900]} name="mail-regular" />
                              </Pressable>
                            }
                            render={() => {
                              return (
                                <LakeText variant="regular" color={colors.gray[900]}>
                                  {contactEmail}
                                </LakeText>
                              );
                            }}
                          />
                        ) : null}

                        {contactPhone != null ? (
                          <LakeLabel
                            type="viewSmall"
                            label={t("transaction.contactPhoneNumber")}
                            actions={
                              <Pressable style={styles.icon} href={`tel:${contactPhone}`}>
                                <Icon size={21} color={colors.gray[900]} name="call-regular" />
                              </Pressable>
                            }
                            render={() => {
                              return (
                                <LakeText variant="regular" color={colors.gray[900]}>
                                  {contactPhone}
                                </LakeText>
                              );
                            }}
                          />
                        ) : null}

                        {enrichedTransactionInfo.address != null ? (
                          <DetailLine
                            label={t("transaction.address")}
                            text={enrichedTransactionInfo.address}
                            icon="pin-regular"
                          />
                        ) : null}

                        {enrichedTransactionInfo.postalCode != null ? (
                          <DetailLine
                            label={t("transaction.postalCode")}
                            text={enrichedTransactionInfo.postalCode}
                          />
                        ) : null}

                        <DetailLine label={t("transaction.city")} text={city} />

                        {countryName != null ? (
                          <DetailLine label={t("transaction.country")} text={countryName} />
                        ) : null}
                      </ReadOnlyFieldList>
                    );
                  },
                )

                .otherwise(() => (
                  <NotFoundPage />
                ))}
            </ScrollView>
          ))
          .exhaustive()}
      </ListRightPanelContent>
    </ScrollView>
  );
};
