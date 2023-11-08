import { P, match } from "ts-pattern";
import { UploadedFile } from "../components/SupportingDocumentsForm";
import {
  FeesTypeEnum,
  RejectedReasonCode,
  SupportingDocumentPurposeEnum,
} from "../graphql/partner";
import { isTranslationKey, t } from "./i18n";

export const getSupportingDocumentPurposeLabel = (purpose: SupportingDocumentPurposeEnum) => {
  try {
    return match(`supportingDocuments.${purpose}.title`)
      .with(P.when(isTranslationKey), key => t(key))
      .exhaustive();
  } catch {
    return purpose;
  }
};

export const getSupportingDocumentPurposeDescriptionLabel = (
  purpose: SupportingDocumentPurposeEnum,
) => {
  // For sworn statement, we don't want to display a tooltip with a description because the target is a button
  if (purpose === "SwornStatement") {
    return undefined;
  }

  try {
    return match(`supportingDocuments.${purpose}.description`)
      .with(P.when(isTranslationKey), key => t(key))
      .exhaustive();
  } catch {
    return purpose;
  }
};

export const getSupportingDocumentStatusLabel = (status: UploadedFile["status"]) =>
  match(`supportingDocuments.alert.${status}`)
    .with(P.when(isTranslationKey), key => t(key))
    .exhaustive();

export const getTransactionRejectedReasonLabel = (reason: RejectedReasonCode) =>
  match(`transactionRejectedReason.${reason}`)
    .with(P.when(isTranslationKey), key => t(key))
    .otherwise(() => undefined);

export const getFeesDescription = (fees: Exclude<FeesTypeEnum, "BankingFee">) =>
  match(`transaction.fees.description.${fees}`)
    .with(P.when(isTranslationKey), key => t(key))
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
