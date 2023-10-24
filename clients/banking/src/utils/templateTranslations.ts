import { match } from "ts-pattern";
import { UploadedFile } from "../components/SupportingDocumentsForm";
import {
  FeesTypeEnum,
  RejectedReasonCode,
  SupportingDocumentPurposeEnum,
} from "../graphql/partner";
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
    .with("InvalidTransferDate", () => t("transactionRejectedReason.InvalidTransferDate"))
    .otherwise(() => undefined);

export const getFeesDescription = (fees: Exclude<FeesTypeEnum, "BankingFee">) =>
  match(fees)
    .with("CardPaymentsOutsideSEPA", () =>
      t("transaction.fees.description.cardPaymentsOutsideSEPA"),
    )
    .with("CashWithdrawalsOutsideSEPA", () =>
      t("transaction.fees.description.cashWithdrawalsOutsideSEPA"),
    )
    .with("CashWithdrawalsWithinSEPA", () =>
      t("transaction.fees.description.cashWithdrawalsWithinSEPA"),
    )
    .with("CirculationLetterDraftingFee", () =>
      t("transaction.fees.description.circulationLetterDraftingFee"),
    )
    .with("DirectDebitRejection", () => t("transaction.fees.description.directDebitRejection"))
    .with("ImproperUseOfAccount", () => t("transaction.fees.description.improperUseOfAccount"))
    .with("ProcessingJudicialOrAdministrativeSeizure", () =>
      t("transaction.fees.description.processingJudicialOrAdministrativeSeizure"),
    )
    .with("UnauthorizedOverdraft", () => t("transaction.fees.description.unauthorizedOverdraft"))
    .with("ConfirmationLetterDraftingFee", () =>
      t("transaction.fees.description.confirmationLetterDraftingFee"),
    )
    .with("CheckIncident", () => t("transaction.fees.description.checkIncident"))
    .with("CheckDeposit", () => t("transaction.fees.description.checkDeposit"))
    .with("PhysicalCardPrinting", () => t("transaction.fees.description.physicalCardPrinting"))
    .with("PhysicalCardDeliveryFrance", () =>
      t("transaction.fees.description.physicalCardDeliveryFrance"),
    )
    .with("PhysicalCardDeliveryIntl", () =>
      t("transaction.fees.description.physicalCardDeliveryIntl"),
    )
    .with("PhysicalCardDeliveryExpress", () =>
      t("transaction.fees.description.physicalCardDeliveryExpress"),
    )
    .with("InternationalCreditTransferInGroup1", () =>
      t("transaction.fees.description.internationalCreditTransferInGroup1"),
    )
    .with("InternationalCreditTransferInGroup2", () =>
      t("transaction.fees.description.internationalCreditTransferInGroup2"),
    )
    .with("InternationalCreditTransferInGroup3", () =>
      t("transaction.fees.description.internationalCreditTransferInGroup3"),
    )
    .with("InternationalCreditTransferInGroup4", () =>
      t("transaction.fees.description.internationalCreditTransferInGroup4"),
    )
    .with("InternationalCreditTransferOutGroup1", () =>
      t("transaction.fees.description.internationalCreditTransferOutGroup1"),
    )
    .with("InternationalCreditTransferOutGroup2", () =>
      t("transaction.fees.description.internationalCreditTransferOutGroup2"),
    )
    .with("InternationalCreditTransferOutGroup3", () =>
      t("transaction.fees.description.internationalCreditTransferOutGroup3"),
    )
    .with("InternationalCreditTransferOutGroup4", () =>
      t("transaction.fees.description.internationalCreditTransferOutGroup4"),
    )
    .with("SepaDirectDebitInB2bLevel1", () =>
      t("transaction.fees.description.sepaDirectDebitInB2bLevel1"),
    )
    .with("SepaDirectDebitInB2bLevel2", () =>
      t("transaction.fees.description.sepaDirectDebitInB2bLevel2"),
    )
    .with("SepaDirectDebitInCoreLevel1", () =>
      t("transaction.fees.description.sepaDirectDebitInCoreLevel1"),
    )
    .with("SepaDirectDebitInCoreLevel2", () =>
      t("transaction.fees.description.sepaDirectDebitInCoreLevel2"),
    )
    .with("SepaDirectDebitInCoreReturn", () =>
      t("transaction.fees.description.sepaDirectDebitInCoreReturn"),
    )
    .otherwise(() => undefined);

export const getInternationalTransferFormRouteLabel = (route: string) =>
  match(route)
    .with("Aba", () => t("transfer.new.internationalTransfer.route.aba"))
    .with("Argentina", () => t("transfer.new.internationalTransfer.route.argentina"))
    .with("Australian", () => t("transfer.new.internationalTransfer.route.australian"))
    .with("AustralianBpay", () => t("transfer.new.internationalTransfer.route.australianBpay"))
    .with("Brazil", () => t("transfer.new.internationalTransfer.route.brazil"))
    .with("Canadian", () => t("transfer.new.internationalTransfer.route.canadian"))
    .with("Chile", () => t("transfer.new.internationalTransfer.route.chile"))
    .with("CostaRica", () => t("transfer.new.internationalTransfer.route.costaRica"))
    .with("Czech", () => t("transfer.new.internationalTransfer.route.czech"))
    .with("Emirates", () => t("transfer.new.internationalTransfer.route.emirates"))
    .with("FedwireLocal", () => t("transfer.new.internationalTransfer.route.fedwireLocal"))
    .with("payments", () => t("transfer.new.internationalTransfer.route.payments"))
    .with("FijiMobile", () => t("transfer.new.internationalTransfer.route.fijiMobile"))
    .with("HongKongFps", () => t("transfer.new.internationalTransfer.route.hongKongFps"))
    .with("Hongkong", () => t("transfer.new.internationalTransfer.route.hongkong"))
    .with("Hungarian", () => t("transfer.new.internationalTransfer.route.hungarian"))
    .with("Iban", () => t("transfer.new.internationalTransfer.route.iban"))
    .with("Indian", () => t("transfer.new.internationalTransfer.route.indian"))
    .with("IndianUpi", () => t("transfer.new.internationalTransfer.route.indianUpi"))
    .with("Interac", () => t("transfer.new.internationalTransfer.route.interac"))
    .with("IsraeliLocal", () => t("transfer.new.internationalTransfer.route.israeliLocal"))
    .with("KenyaLocal", () => t("transfer.new.internationalTransfer.route.kenyaLocal"))
    .with("KenyaMobile", () => t("transfer.new.internationalTransfer.route.kenyaMobile"))
    .with("Malaysian", () => t("transfer.new.internationalTransfer.route.malaysian"))
    .with("MalaysianDuitnow", () => t("transfer.new.internationalTransfer.route.malaysianDuitnow"))
    .with("Mexican", () => t("transfer.new.internationalTransfer.route.mexican"))
    .with("Morocco", () => t("transfer.new.internationalTransfer.route.morocco"))
    .with("Nepal", () => t("transfer.new.internationalTransfer.route.nepal"))
    .with("NewZealand", () => t("transfer.new.internationalTransfer.route.newZealand"))
    .with("Philippines", () => t("transfer.new.internationalTransfer.route.philippines"))
    .with("PhilippinesMobile", () =>
      t("transfer.new.internationalTransfer.route.philippinesMobile"),
    )
    .with("Polish", () => t("transfer.new.internationalTransfer.route.polish"))
    .with("PrivatBank", () => t("transfer.new.internationalTransfer.route.privatBank"))
    .with("Singapore", () => t("transfer.new.internationalTransfer.route.singapore"))
    .with("SingaporePaynow", () => t("transfer.new.internationalTransfer.route.singaporePaynow"))
    .with("SortCode", () => t("transfer.new.internationalTransfer.route.sortCode"))
    .with("SouthAfrica", () => t("transfer.new.internationalTransfer.route.southAfrica"))
    .with("SouthKoreanPaygate", () =>
      t("transfer.new.internationalTransfer.route.southKoreanPaygate"),
    )
    .with("SouthKoreanPaygateBusiness", () =>
      t("transfer.new.internationalTransfer.route.southKoreanPaygateBusiness"),
    )
    .with("SwiftCode", () => t("transfer.new.internationalTransfer.route.swiftCode"))
    .with("Thailand", () => t("transfer.new.internationalTransfer.route.thailand"))
    .with("TurkishEarthport", () => t("transfer.new.internationalTransfer.route.turkishEarthport"))
    .otherwise(() => route);
