import { Array, Future, Option } from "@swan-io/boxed";
import { useMutation } from "@swan-io/graphql-client";
import { useBoolean } from "@swan-io/lake/src/hooks/useBoolean";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { GetNode } from "@swan-io/lake/src/utils/types";
import { ConfirmModal } from "@swan-io/shared-business/src/components/ConfirmModal";
import {
  Document,
  SupportingDocumentCollection,
  SupportingDocumentCollectionRef,
} from "@swan-io/shared-business/src/components/SupportingDocumentCollection";
import { showToast } from "@swan-io/shared-business/src/state/toasts";
import { translateError } from "@swan-io/shared-business/src/utils/i18n";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";
import { P, match } from "ts-pattern";
import {
  AccountActivationPageQuery,
  GenerateSupportingDocumentUploadUrlDocument,
  RequestSupportingDocumentCollectionReviewDocument,
  SupportingDocumentPurposeEnum,
} from "../graphql/partner";
import { t } from "../utils/i18n";

type Collection = GetNode<
  NonNullable<
    NonNullable<AccountActivationPageQuery["accountMembership"]>["account"]
  >["holder"]["supportingDocumentCollections"]
>;

type Props = {
  templateLanguage: "en" | "fr" | "es" | "de";
  collection: Collection;
  refetchCollection: () => void;
};

export type SupportingDocumentsFormRef = {
  submit: () => Future<unknown>;
};

export const SupportingDocumentsForm = forwardRef<SupportingDocumentsFormRef, Props>(
  ({ templateLanguage, collection, refetchCollection }, forwardedRef) => {
    const [showConfirmModal, setShowConfirmModal] = useBoolean(false);
    const [generateSupportingDocumentUploadUrl] = useMutation(
      GenerateSupportingDocumentUploadUrlDocument,
    );

    const [requestSupportingDocumentCollectionReview, reviewRequest] = useMutation(
      RequestSupportingDocumentCollectionReviewDocument,
    );

    const supportingDocumentCollectionRef =
      useRef<SupportingDocumentCollectionRef<SupportingDocumentPurposeEnum>>(null);

    const requestReview = () => {
      return requestSupportingDocumentCollectionReview({
        input: { supportingDocumentCollectionId: collection.id },
      })
        .mapOk(data => data.requestSupportingDocumentCollectionReview)
        .mapOkToResult(filterRejectionsToResult)
        .tapOk(refetchCollection)
        .tapError(error => showToast({ variant: "error", error, title: translateError(error) }));
    };

    useImperativeHandle(forwardedRef, () => ({
      submit: (): Future<unknown> => {
        const supportingDocumentCollection = supportingDocumentCollectionRef.current;

        if (supportingDocumentCollection == null) {
          return Future.value(undefined);
        }
        if (supportingDocumentCollection.areAllRequiredDocumentsFilled()) {
          return requestReview();
        } else {
          setShowConfirmModal.on();
          return Future.value(undefined);
        }
      },
    }));

    const generateUpload = useCallback(
      ({ fileName, purpose }: { fileName: string; purpose: SupportingDocumentPurposeEnum }) =>
        generateSupportingDocumentUploadUrl({
          input: {
            filename: fileName,
            supportingDocumentCollectionId: collection.id,
            supportingDocumentPurpose: purpose,
          },
        })
          .mapOk(data => data.generateSupportingDocumentUploadUrl)
          .mapOkToResult(filterRejectionsToResult)
          .mapOk(({ upload, supportingDocumentId }) => ({ upload, id: supportingDocumentId })),
      [generateSupportingDocumentUploadUrl, collection.id],
    );

    const docs = Array.filterMap(collection.supportingDocuments, document =>
      match(document)
        .returnType<Option<Document<SupportingDocumentPurposeEnum>>>()
        .with(P.nullish, () => Option.None())
        .with({ statusInfo: { __typename: "SupportingDocumentNotUploadedStatusInfo" } }, () =>
          Option.None(),
        )
        .with(
          {
            statusInfo: {
              __typename: "SupportingDocumentWaitingForUploadStatusInfo",
            },
          },
          () => Option.None(),
        )
        .with({ statusInfo: { __typename: "SupportingDocumentValidatedStatusInfo" } }, document =>
          Option.Some({
            purpose: document.supportingDocumentPurpose,
            file: {
              id: document.id,
              name: document.statusInfo.filename,
              statusInfo: { status: "Validated" },
            },
          }),
        )
        .with({ statusInfo: { __typename: "SupportingDocumentRefusedStatusInfo" } }, document =>
          Option.Some({
            purpose: document.supportingDocumentPurpose,
            file: {
              id: document.id,
              name: document.statusInfo.filename,
              statusInfo: { status: "Refused", reason: document.statusInfo.reason },
            },
          }),
        )
        .with({ statusInfo: { __typename: "SupportingDocumentUploadedStatusInfo" } }, document =>
          Option.Some({
            purpose: document.supportingDocumentPurpose,
            file: {
              id: document.id,
              name: document.statusInfo.filename,
              statusInfo: { status: "Uploaded" },
            },
          }),
        )
        .exhaustive(),
    );

    return (
      <>
        <SupportingDocumentCollection
          ref={supportingDocumentCollectionRef}
          documents={docs}
          requiredDocumentPurposes={collection.requiredSupportingDocumentPurposes.map(
            item => item.name,
          )}
          generateUpload={generateUpload}
          status={collection.statusInfo.status}
          templateLanguage={templateLanguage}
        />

        <ConfirmModal
          visible={showConfirmModal}
          title={t("accountActivation.documents.confirmModal.title")}
          message={t("accountActivation.documents.confirmModal.message")}
          icon="document-regular"
          confirmText={t("accountActivation.documents.confirmModal.confirm")}
          onConfirm={() => void requestReview()}
          loading={reviewRequest.isLoading()}
          onCancel={setShowConfirmModal.off}
        />
      </>
    );
  },
);
