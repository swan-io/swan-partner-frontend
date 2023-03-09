import { isNotNullishOrEmpty } from "@swan-io/lake/src/utils/nullish";
import { countries, Country } from "@swan-io/shared-business/src/constants/countries";
import { match } from "ts-pattern";
import { Scalars, TransactionListPageQuery } from "../graphql/partner";
import { PaymentMethodIcon, TransactionVariant } from "../types";
import { formatDateTime, t } from "./i18n";
import * as iban from "./iban";
import { getTransactionRejectedReasonLabel } from "./templateTranslations";

type Amount = {
  amount: number;
  currency: Scalars["Currency"];
};

type RequiredTransactionProps = {
  amount: Amount;
  id: string;
  isCredit: boolean;
  label: string;
  paymentMethodIcon: PaymentMethodIcon;
  paymentMethodName: string;
  statusName: string;
  transactionDate: string;
  variant: TransactionVariant;
};

type OptionalTransactionProps = {
  bookingDateTime?: string;
  cardHolder?: string;
  creditorIban?: string;
  creditorName?: string;
  debtor?: string;
  executedDateTime?: string;
  executionDateTime?: string;
  maskedPan?: string;
  merchantCity?: string;
  merchantCountry?: Country["name"];
  originalAmount?: Amount;
  paymentDateTime?: string;
  reference?: string;
  rejectedDate?: string;
  rejectedReason?: string;
};

export type TransactionProps = RequiredTransactionProps & OptionalTransactionProps;

const convertAmount = ({
  currency,
  isCredit,
  value,
}: {
  currency: string;
  isCredit: boolean;
  value: string;
}): Amount => ({
  amount: Number(value) * (isCredit ? 1 : -1),
  currency,
});

const formatMaskedPan = (value: string) => value.replace(/X/g, "•").replace(/(.{4})(?!$)/g, "$1 ");

const hasMaskedIBAN = (
  value: { maskedIBAN: string; name: string } | { name: string },
): value is { maskedIBAN: string; name: string } =>
  "maskedIBAN" in value && typeof value.maskedIBAN === "string";

export const getTransactions = (
  transactionQuery: NonNullable<TransactionListPageQuery["account"]>["transactions"],
): TransactionProps[] => {
  const edges = transactionQuery?.edges;

  if (!edges) {
    return [];
  }

  return edges.map(({ node }) => {
    const {
      amount,
      createdAt: transactionCreatedAt,
      executionDate: transactionExecutionDate,
      payment,
      side,
      statusInfo,
    } = node;
    const isCredit = side === "Credit";
    const isDebit = side === "Debit";
    const paymentCreatedAt = payment?.createdAt ?? "";

    const derivedFromNode = match<
      typeof node,
      { paymentMethodName: string; paymentMethodIcon: PaymentMethodIcon } & OptionalTransactionProps
    >(node)
      .with(
        { __typename: "CardTransaction" },
        ({ card, maskedPan, merchantCountry, merchantCity, originalAmount }) => ({
          ...(paymentCreatedAt !== "" &&
            node.statusInfo.status === "Pending" && {
              paymentDateTime: formatDateTime(new Date(paymentCreatedAt), "LLL"),
            }),
          paymentMethodName: t("paymentMethod.card"),
          paymentMethodIcon: "card",
          cardHolder: [
            card?.accountMembership.user?.firstName,
            card?.accountMembership.user?.lastName,
          ]
            .filter(isNotNullishOrEmpty)
            .join(" "),
          maskedPan: formatMaskedPan(maskedPan),
          merchantCountry: isNotNullishOrEmpty(merchantCountry)
            ? countries.find(country => country.cca3 === merchantCountry)?.name
            : undefined,
          merchantCity,
          originalAmount: convertAmount({ ...originalAmount, isCredit }),
        }),
      )
      .with({ __typename: "SEPACreditTransferTransaction" }, ({ creditor, debtor, reference }) => ({
        paymentMethodName: t("paymentMethod.transfer"),
        paymentMethodIcon: "transfer",
        ...(isNotNullishOrEmpty(reference) && { reference }),
        ...(paymentCreatedAt !== "" && {
          paymentDateTime: formatDateTime(new Date(paymentCreatedAt), "LLL"),
        }),
        ...(isCredit && {
          debtor: debtor.name,
          ...(statusInfo.__typename === "BookedTransactionStatusInfo" && hasMaskedIBAN(creditor)
            ? { creditorIban: iban.printMaskedFormat(creditor.maskedIBAN) }
            : { creditorName: creditor.name }),
        }),
        ...(node.type === "SepaCreditTransferOut" &&
          match(creditor)
            .with({ __typename: "SEPACreditTransferOutCreditor" }, ({ name, maskedIBAN }) => ({
              creditorName: name,
              creditorIban: maskedIBAN,
            }))
            .otherwise(() => ({}))),
        ...(isDebit && {
          ...(statusInfo.__typename === "PendingTransactionStatusInfo" && {
            executedDateTime: formatDateTime(new Date(transactionCreatedAt), "LLL"),
          }),
        }),
      }))
      .with({ __typename: "SEPADirectDebitTransaction" }, ({ creditor, reference, mandate }) => ({
        paymentMethodName: t("paymentMethod.directDebit"),
        paymentMethodIcon: "transfer",
        ...match(mandate)
          .with({ __typename: "SEPAReceivedDirectDebitMandate" }, mandate =>
            isNotNullishOrEmpty(creditor.name)
              ? {
                  creditorName: isNotNullishOrEmpty(mandate.ultimateCreditorName)
                    ? mandate.ultimateCreditorName
                    : creditor.name,
                }
              : {},
          )
          .with({ __typename: "SEPAPaymentDirectDebitMandate" }, mandate =>
            isNotNullishOrEmpty(mandate.debtor.name) ? { debtor: mandate.debtor.name } : {},
          )
          .otherwise(() => ({})),
        ...(isNotNullishOrEmpty(reference) && { reference }),
      }))
      .with({ __typename: "InternalDirectDebitTransaction" }, ({ creditor, reference }) => ({
        paymentMethodName: t("paymentMethod.directDebit"),
        paymentMethodIcon: "transfer",
        ...(isNotNullishOrEmpty(creditor?.accountId)
          ? {
              creditorName: creditor.accountId,
            }
          : {}),
        ...(isNotNullishOrEmpty(reference) && { reference }),
      }))
      .with({ __typename: "InternalCreditTransfer" }, ({ creditor, reference }) => ({
        paymentMethodName: t("paymentMethod.transfer"),
        paymentMethodIcon: "transfer",
        ...(isNotNullishOrEmpty(creditor.name) && { creditorName: creditor.name }),
        ...(isNotNullishOrEmpty(reference) && { reference }),
      }))
      .with({ __typename: "FeeTransaction" }, ({ counterparty }) => ({
        paymentMethodName: t("paymentMethod.fees"),
        paymentMethodIcon: "transfer",
        ...(isNotNullishOrEmpty(counterparty) && { creditorName: counterparty }),
      }))
      .exhaustive();

    const derivedFromStatus = match<
      (typeof node)["statusInfo"],
      { statusName: string; variant: TransactionVariant } & OptionalTransactionProps
    >(statusInfo)
      .with({ __typename: "BookedTransactionStatusInfo" }, ({ bookingDate }) => ({
        statusName: t("transactionStatus.booked"),
        variant: isDebit ? "bookedDebit" : "bookedCredit",
        bookingDateTime: formatDateTime(new Date(bookingDate), "LLL"),
      }))
      .with({ __typename: "CanceledTransactionStatusInfo" }, () => ({
        statusName: t("transactionStatus.canceled"),
        variant: "canceled",
      }))
      .with({ __typename: "PendingTransactionStatusInfo" }, () => ({
        statusName: t("transactionStatus.pending"),
        variant: "pending",
      }))
      .with({ __typename: "RejectedTransactionStatusInfo" }, ({ reason }) => ({
        statusName: t("transactionStatus.rejected"),
        variant: "rejected",
        rejectedDate: formatDateTime(new Date(node.updatedAt), "LLL"),
        rejectedReason: getTransactionRejectedReasonLabel(reason),
      }))
      .with({ __typename: "UpcomingTransactionStatusInfo" }, ({ executionDate }) => ({
        statusName: t("transactionStatus.upcoming"),
        variant: "upcoming",
        executionDateTime: formatDateTime(new Date(executionDate), "LLL"),
      }))
      .with({ __typename: "ReleasedTransactionStatusInfo" }, () => ({
        statusName: "", // we don't display released transactions
        variant: "released",
      }))
      .exhaustive();

    const displayLabel = match(node)
      .with({ __typename: "FeeTransaction" }, ({ feesType }) => {
        return match(feesType)
          .with("CardPaymentsOutsideSEPA", () => t("paymentMethod.fees.cardPaymentsOutsideSEPA"))
          .with("CashWithdrawalsOutsideSEPA", () =>
            t("paymentMethod.fees.cashWithdrawalsOutsideSEPA"),
          )
          .with("CashWithdrawalsWithinSEPA", () =>
            t("paymentMethod.fees.cashWithdrawalsWithinSEPA"),
          )
          .with("CirculationLetterDraftingFee", () =>
            t("paymentMethod.fees.circulationLetterDraftingFee"),
          )
          .with("DirectDebitRejection", () => t("paymentMethod.fees.directDebitRejection"))
          .with("ImproperUseOfAccount", () => t("paymentMethod.fees.improperUseOfAccount"))
          .with("ProcessingJudicialOrAdministrativeSeizure", () =>
            t("paymentMethod.fees.processingJudicialOrAdministrativeSeizure"),
          )
          .with("UnauthorizedOverdraft", () => t("paymentMethod.fees.unauthorizedOverdraft"))
          .with("BankingFee", () => node.label)
          .exhaustive();
      })
      .otherwise(() => node.label);

    return {
      ...derivedFromNode,
      ...derivedFromStatus,
      amount: convertAmount({ ...amount, isCredit }),
      id: node.id,
      type: node.type,
      isCredit,
      label: displayLabel,

      transactionDate: formatDateTime(new Date(transactionExecutionDate), "LL"),
    };
  });
};
