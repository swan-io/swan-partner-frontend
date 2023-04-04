import { match } from "ts-pattern";
import { UploadedFile } from "../components/SupportingDocumentsForm";
import { RejectedReasonCode, SupportingDocumentPurposeEnum } from "../graphql/partner";
import { t } from "./i18n";

export const getSupportingDocumentPurposeLabel = (category: SupportingDocumentPurposeEnum) =>
  match(category)
    .with("AssociationRegistration", () => t("supportingDocuments.AssociationRegistration.title"))
    .with("Banking", () => t("supportingDocuments.Banking.title"))
    .with("CompanyRegistration", () => t("supportingDocuments.CompanyRegistration.title"))
    .with("Other", () => t("supportingDocuments.Other.title"))
    .with("PowerOfAttorney", () => t("supportingDocuments.PowerOfAttorney.title"))
    .with("ProofOfCompanyAddress", () => t("supportingDocuments.ProofOfCompanyAddress.title"))
    .with("ProofOfCompanyIncome", () => t("supportingDocuments.ProofOfCompanyIncome.title"))
    .with("ProofOfIdentity", () => t("supportingDocuments.ProofOfIdentity.title"))
    .with("ProofOfIndividualAddress", () => t("supportingDocuments.ProofOfIndividualAddress.title"))
    .with("ProofOfIndividualIncome", () => t("supportingDocuments.ProofOfIndividualIncome.title"))
    .with("ProofOfOriginOfFunds", () => t("supportingDocuments.ProofOfOriginOfFunds.title"))
    .with("SignedStatus", () => t("supportingDocuments.SignedStatus.title"))
    .with("SwornStatement", () => t("supportingDocuments.SwornStatement.title"))
    .with("UBODeclaration", () => t("supportingDocuments.UBODeclaration.title"))
    .exhaustive();

export const getSupportingDocumentPurposeDescriptionLabel = (
  category: SupportingDocumentPurposeEnum,
) =>
  match(category)
    .with("AssociationRegistration", () =>
      t("supportingDocuments.AssociationRegistration.description"),
    )
    .with("Banking", () => t("supportingDocuments.Banking.description"))
    .with("CompanyRegistration", () => t("supportingDocuments.CompanyRegistration.description"))
    .with("Other", () => t("supportingDocuments.Other.description"))
    .with("PowerOfAttorney", () => t("supportingDocuments.PowerOfAttorney.description"))
    .with("ProofOfCompanyAddress", () => t("supportingDocuments.ProofOfCompanyAddress.description"))
    .with("ProofOfCompanyIncome", () => t("supportingDocuments.ProofOfCompanyIncome.description"))
    .with("ProofOfIdentity", () => t("supportingDocuments.ProofOfIdentity.description"))
    .with("ProofOfIndividualAddress", () =>
      t("supportingDocuments.ProofOfIndividualAddress.description"),
    )
    .with("ProofOfIndividualIncome", () =>
      t("supportingDocuments.ProofOfIndividualIncome.description"),
    )
    .with("ProofOfOriginOfFunds", () => t("supportingDocuments.ProofOfOriginOfFunds.description"))
    .with("SignedStatus", () => t("supportingDocuments.SignedStatus.description"))
    .with("UBODeclaration", () => t("supportingDocuments.UBODeclaration.description"))
    // For sworn statement, we don't want to display a tooltip with a description because the target is a button
    .with("SwornStatement", () => undefined)
    .exhaustive();

export const getSupportingDocumentStatusLabel = (status: UploadedFile["status"]) =>
  match(status)
    .with("pending", () => t("supportingDocuments.alert.pending"))
    .with("refused", () => t("supportingDocuments.alert.refused"))
    .with("verified", () => t("supportingDocuments.alert.verified"))
    .exhaustive();

export const getTransactionRejectedReasonLabel = (reason: RejectedReasonCode) =>
  match(reason)
    .with("AccountClosed", () => t("transactionRejectedReason.AccountClosed"))
    .with("AccountHolderDeceased", () => t("transactionRejectedReason.AccountHolderDeceased"))
    .with("AccountMembershipRefused", () => t("transactionRejectedReason.AccountMembershipRefused"))
    .with("AccountSuspended", () => t("transactionRejectedReason.AccountSuspended"))
    .with("AccountUnknown", () => t("transactionRejectedReason.AccountUnknown"))
    .with("BankRefused", () => t("transactionRejectedReason.BankRefused"))
    .with("BeneficiaryBankNotReachable", () =>
      t("transactionRejectedReason.BeneficiaryBankNotReachable"),
    )
    .with("CardExpired", () => t("transactionRejectedReason.CardExpired"))
    .with("CardNotActivated", () => t("transactionRejectedReason.CardNotActivated"))
    .with("CardPermanentlyBlocked", () => t("transactionRejectedReason.CardPermanentlyBlocked"))
    .with("CardSuspended", () => t("transactionRejectedReason.CardSuspended"))
    .with("CreditorBankOffline", () => t("transactionRejectedReason.CreditorBankOffline"))
    .with("CreditorBankTechnicalErrorOccurred", () =>
      t("transactionRejectedReason.CreditorBankTechnicalErrorOccurred"),
    )
    .with("CreditorBankTimeout", () => t("transactionRejectedReason.CreditorBankTimeout"))
    .with("DebtorAccountClosed", () => t("transactionRejectedReason.DebtorAccountClosed"))
    .with("DebtorAccountConsumer", () => t("transactionRejectedReason.DebtorAccountConsumer"))
    .with("DebtorAccountUnknown", () => t("transactionRejectedReason.DebtorAccountUnknown"))
    .with("DebtorBankOffline", () => t("transactionRejectedReason.DebtorBankOffline"))
    .with("DebtorBankTechnicalErrorOccurred", () =>
      t("transactionRejectedReason.DebtorBankTechnicalErrorOccurred"),
    )
    .with("DebtorBankTimeout", () => t("transactionRejectedReason.DebtorBankTimeout"))
    .with("DebtorDeceased", () => t("transactionRejectedReason.DebtorDeceased"))
    .with("FraudSuspected", () => t("transactionRejectedReason.FraudSuspected"))
    .with("IbanInvalid", () => t("transactionRejectedReason.IbanInvalid"))
    .with("IbanSuspended", () => t("transactionRejectedReason.IbanSuspended"))
    .with("InsufficientFunds", () => t("transactionRejectedReason.InsufficientFunds"))
    .with("InvalidExpirationDate", () => t("transactionRejectedReason.InvalidExpirationDate"))
    .with("InvalidPin", () => t("transactionRejectedReason.InvalidPin"))
    .with("InvalidPinAttemptsExceeded", () =>
      t("transactionRejectedReason.InvalidPinAttemptsExceeded"),
    )
    .with("InvalidSecurityNumber", () => t("transactionRejectedReason.InvalidSecurityNumber"))
    .with("MandateInvalid", () => t("transactionRejectedReason.MandateInvalid"))
    .with("MerchantShouldResubmitAuthorization", () =>
      t("transactionRejectedReason.MerchantShouldResubmitAuthorization"),
    )
    .with("NoMandate", () => t("transactionRejectedReason.NoMandate"))
    .with("PartnerRefused", () => t("transactionRejectedReason.PartnerRefused"))
    .with("PartnerTechnicalErrorOccurred", () =>
      t("transactionRejectedReason.PartnerTechnicalErrorOccurred"),
    )
    .with("PeriodAmountLimitExceeded", () =>
      t("transactionRejectedReason.PeriodAmountLimitExceeded"),
    )
    .with("PeriodNbTransactionLimitExceeded", () =>
      t("transactionRejectedReason.PeriodNbTransactionLimitExceeded"),
    )
    .with("PinRequiredForFurtherTransaction", () =>
      t("transactionRejectedReason.PinRequiredForFurtherTransaction"),
    )
    .with("ReasonNotSpecifiedByBank", () => t("transactionRejectedReason.ReasonNotSpecifiedByBank"))
    .with("ReasonNotSpecifiedByDebtor", () =>
      t("transactionRejectedReason.ReasonNotSpecifiedByDebtor"),
    )
    .with("RegulatoryReason", () => t("transactionRejectedReason.RegulatoryReason"))
    .with("RetryWithChipAndPin", () => t("transactionRejectedReason.RetryWithChipAndPin"))
    .with("SwanOffline", () => t("transactionRejectedReason.SwanOffline"))
    .with("SwanRefused", () => t("transactionRejectedReason.SwanRefused"))
    .with("SwanTechnicalErrorOccurred", () =>
      t("transactionRejectedReason.SwanTechnicalErrorOccurred"),
    )
    .with("SwanTimeout", () => t("transactionRejectedReason.SwanTimeout"))
    .with("TermsAndConditionsLimitExceeded", () =>
      t("transactionRejectedReason.TermsAndConditionsLimitExceeded"),
    )
    .with("TransactionAmountLimitExceeded", () =>
      t("transactionRejectedReason.TransactionAmountLimitExceeded"),
    )
    .with("TransactionDuplicated", () => t("transactionRejectedReason.TransactionDuplicated"))
    .with("TransactionOnAccountTypeNotAllowed", () =>
      t("transactionRejectedReason.TransactionOnAccountTypeNotAllowed"),
    )
    .with("TransactionTypeNotAllowed", () =>
      t("transactionRejectedReason.TransactionTypeNotAllowed"),
    )
    .exhaustive();
