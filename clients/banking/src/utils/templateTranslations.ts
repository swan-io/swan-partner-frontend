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

export const getTransactionRejectedReasonLabel = (reason: RejectedReasonCode) => {
  try {
    return match(`transactionRejectedReason.${reason}`)
      .with(P.when(isTranslationKey), key => t(key))
      .exhaustive();
  } catch {
    return;
  }
};

export const getFeesDescription = (fees: Exclude<FeesTypeEnum, "BankingFee">) => {
  try {
    return match(`transaction.fees.description.${fees}`)
      .with(P.when(isTranslationKey), key => t(key))
      .exhaustive();
  } catch {
    return;
  }
};

export const getInternationalTransferFormRouteLabel = (route: string) => {
  const key = `transfer.new.internationalTransfer.route.${route}`;

  return match(key)
    .with(P.when(isTranslationKey), key => t(key))
    .otherwise(() => route);
};
