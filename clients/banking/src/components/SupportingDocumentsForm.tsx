import { Dict } from "@swan-io/boxed";
import { FileTile } from "@swan-io/lake/src/components/FileTile";
import { Form } from "@swan-io/lake/src/components/Form";
import { Icon } from "@swan-io/lake/src/components/Icon";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeModal } from "@swan-io/lake/src/components/LakeModal";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LakeTooltip } from "@swan-io/lake/src/components/LakeTooltip";
import { Space } from "@swan-io/lake/src/components/Space";
import { Stack } from "@swan-io/lake/src/components/Stack";
import { colors } from "@swan-io/lake/src/constants/design";
import { useBoolean } from "@swan-io/lake/src/hooks/useBoolean";
import { useResponsive } from "@swan-io/lake/src/hooks/useResponsive";
import { showToast } from "@swan-io/lake/src/state/toasts";
import { isNotNullish, isNullish } from "@swan-io/lake/src/utils/nullish";
import { GetNode } from "@swan-io/lake/src/utils/types";
import { UploadArea, UploadFileStatus } from "@swan-io/shared-business/src/components/UploadArea";
import { MAX_SUPPORTING_DOCUMENT_UPLOAD_SIZE } from "@swan-io/shared-business/src/constants/uploads";
import { Fragment, forwardRef, useCallback, useImperativeHandle, useMemo, useState } from "react";
import { Pressable, StyleSheet } from "react-native";
import { match } from "ts-pattern";
import { useMutation } from "urql";
import {
  AccountActivationPageQuery,
  GenerateSupportingDocumentUploadUrlDocument,
  RequestSupportingDocumentCollectionReviewDocument,
  SupportingDocumentPurposeEnum,
} from "../graphql/partner";
import { t } from "../utils/i18n";
import {
  getSupportingDocumentPurposeDescriptionLabel,
  getSupportingDocumentPurposeLabel,
  getSupportingDocumentStatusLabel,
} from "../utils/templateTranslations";
import { parseOperationResult } from "../utils/urql";

const ACCEPTED_FORMATS = ["application/pdf", "image/png", "image/jpeg"];

const styles = StyleSheet.create({
  help: {
    alignItems: "center",
    flexDirection: "row",
  },
});

type HelpProps = {
  onPress?: () => void;
  text: string | undefined;
  width?: number;
};

const Help = ({ onPress, text, width }: HelpProps) => {
  const { desktop } = useResponsive();

  const content = (
    <Pressable role="button" disabled={isNullish(onPress)} onPress={onPress} style={styles.help}>
      <Icon color={colors.gray[600]} name="question-circle-regular" size={desktop ? 16 : 20} />

      {desktop && (
        <>
          <Space width={8} />

          <LakeText color={colors.gray[600]} variant="smallMedium">
            {t("supportingDocuments.button.whatIsThis")}
          </LakeText>
        </>
      )}
    </Pressable>
  );

  if (isNullish(text)) {
    return content;
  }

  return (
    <LakeTooltip content={text} placement="top" togglableOnFocus={true} width={width}>
      {content}
    </LakeTooltip>
  );
};

export type UploadedFile = { id: string; name: string; url: string } & (
  | { status: "pending" }
  | { status: "refused"; reason: string }
  | { status: "verified" }
);

type Collection = GetNode<
  NonNullable<
    NonNullable<AccountActivationPageQuery["accountMembership"]>["account"]
  >["holder"]["supportingDocumentCollections"]
>;

type LocalDocument = UploadFileStatus & {
  purpose: SupportingDocumentPurposeEnum;
};

type Documents = Partial<
  Record<
    SupportingDocumentPurposeEnum,
    {
      errorVisible: boolean;
      local: UploadFileStatus[];
      uploaded: UploadedFile[];
    }
  >
>;

type Props = {
  templateLanguage: "en" | "fr" | "es" | "de";
  collection: Collection;
  refetchCollection: () => void;
};

export type SupportingDocumentsFormRef = {
  submit: () => void;
};

export const SupportingDocumentsForm = forwardRef<SupportingDocumentsFormRef, Props>(
  ({ templateLanguage, collection, refetchCollection }, forwardedRef) => {
    const [powerOfAttorneyModalVisible, setPowerOfAttorneyModalVisible] = useBoolean(false);
    const [swornStatementModalVisible, setSwornStatementModalVisible] = useBoolean(false);
    const [feedbackEnabled, setFeedbackEnabled] = useBoolean(false);
    const [localDocuments, setLocalDocuments] = useState<LocalDocument[]>([]);

    const [, generateSupportingDocumentUploadUrl] = useMutation(
      GenerateSupportingDocumentUploadUrlDocument,
    );

    const [, requestSupportingDocumentCollectionReview] = useMutation(
      RequestSupportingDocumentCollectionReviewDocument,
    );

    const documentsByPurpose = useMemo(() => {
      const supportingDocuments = collection.supportingDocuments.filter(isNotNullish);

      return collection.requiredSupportingDocumentPurposes.reduce<Documents>((acc, { name }) => {
        const localDocumentsForPurpose = localDocuments.filter(item => item.purpose === name);
        const localDocumentsForPurposeIds = localDocuments.map(item => item.id);

        const supportingDocumentsForPurpose = supportingDocuments.filter(
          item =>
            item.supportingDocumentPurpose === name &&
            !localDocumentsForPurposeIds.includes(item.id),
        );

        const notRefused = supportingDocumentsForPurpose.filter(
          item => item.statusInfo.__typename !== "SupportingDocumentRefusedStatusInfo",
        );

        const errorVisible =
          feedbackEnabled && localDocumentsForPurpose.length === 0 && notRefused.length === 0;

        const uploaded = supportingDocumentsForPurpose.reduce<UploadedFile[]>((acc, item) => {
          if (
            item.statusInfo.__typename === "SupportingDocumentNotUploadedStatusInfo" ||
            item.statusInfo.__typename === "SupportingDocumentWaitingForUploadStatusInfo"
          ) {
            return acc;
          }

          const file: UploadedFile = {
            id: item.id,
            name: item.statusInfo.filename,
            url: item.statusInfo.downloadUrl,

            ...match(item.statusInfo)
              .with({ __typename: "SupportingDocumentUploadedStatusInfo" }, () => ({
                status: "pending" as const,
              }))
              .with({ __typename: "SupportingDocumentValidatedStatusInfo" }, () => ({
                status: "verified" as const,
              }))
              .with({ __typename: "SupportingDocumentRefusedStatusInfo" }, ({ reason }) => ({
                status: "refused" as const,
                reason,
              }))
              .exhaustive(),
          };

          return [...acc, file];
        }, [] as UploadedFile[]);

        return {
          ...acc,
          [name]: {
            errorVisible,
            local: localDocumentsForPurpose,
            uploaded,
          },
        };
      }, {} as Documents);
    }, [collection, feedbackEnabled, localDocuments]);

    useImperativeHandle(forwardedRef, () => ({
      submit: () => {
        const hasNoError = Dict.values(documentsByPurpose).every(
          item => isNotNullish(item) && !item.errorVisible,
        );

        if (hasNoError) {
          requestSupportingDocumentCollectionReview({
            input: { supportingDocumentCollectionId: collection.id },
          })
            .then(parseOperationResult)
            .then(data => data.requestSupportingDocumentCollectionReview)
            .then(data =>
              data.__typename !== "RequestSupportingDocumentCollectionReviewSuccessPayload"
                ? Promise.reject(new Error(data.message))
                : data,
            )
            .then(refetchCollection)
            .catch(() => {
              showToast({ variant: "error", title: t("error.generic") });
            });
        } else {
          setFeedbackEnabled.on();
        }
      },
    }));

    const getAwsUrl = useCallback(
      (file: File, purpose: SupportingDocumentPurposeEnum) =>
        generateSupportingDocumentUploadUrl({
          input: {
            filename: file.name,
            supportingDocumentCollectionId: collection.id,
            supportingDocumentPurpose: purpose,
          },
        })
          .then(parseOperationResult)
          .then(({ generateSupportingDocumentUploadUrl: data }) =>
            data.__typename !== "GenerateSupportingDocumentUploadUrlSuccessPayload"
              ? Promise.reject(new Error(`Expected success payload, received ${data.__typename}`))
              : data,
          ),
      [generateSupportingDocumentUploadUrl, collection.id],
    );

    const handleUpload = (files: File[], purpose: SupportingDocumentPurposeEnum) => {
      const file = files[0];

      if (isNullish(file)) {
        return;
      }

      getAwsUrl(file, purpose)
        .then(({ supportingDocumentId, upload: { url, fields } }) => {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", url, true);

          const initialState: LocalDocument = {
            purpose,
            id: supportingDocumentId,
            name: file.name,
            progress: 0,
            status: "uploading",
          };

          setLocalDocuments(prevState => [...prevState, initialState]);

          xhr.upload.onprogress = event => {
            const progress = (event.loaded / event.total) * 100;

            setLocalDocuments(prevState => {
              const clone = [...prevState];
              const index = clone.findIndex(item => item.id === supportingDocumentId);
              const item = clone[index];

              if (item?.status === "uploading") {
                clone[index] = { ...item, progress };
              } else {
                clone.push(initialState);
              }

              return clone;
            });
          };

          xhr.onload = () => {
            const uploadFailed = xhr.status !== 200 && xhr.status !== 204;

            const finishedState: LocalDocument = {
              purpose,
              id: supportingDocumentId,
              name: file.name,
              status: "finished",
            };

            setLocalDocuments(prevState => {
              const clone = [...prevState];
              const index = clone.findIndex(item => item.id === supportingDocumentId);
              const item = clone[index];

              if (isNullish(item)) {
                clone.push(finishedState);
                return clone;
              }

              if (!uploadFailed) {
                clone[index] = finishedState;
                return clone;
              }

              clone[index] = {
                purpose,
                id: supportingDocumentId,
                name: file.name,
                error: t("error.generic"),
                status: "failed",
              };

              return clone;
            });
          };

          const formData = new FormData();
          fields.forEach(({ key, value }) => formData.append(key, value));
          formData.append("file", file);

          xhr.send(formData);
        })
        .catch(() => {
          showToast({ variant: "error", title: t("error.generic") });
        });
    };

    return (
      <Form>
        <Stack direction="column" space={40}>
          {Dict.entries(documentsByPurpose).map(([purpose, documents]) => {
            if (isNullish(documents)) {
              return null;
            }

            return (
              <LakeLabel
                key={`label-${purpose}`}
                type="form"
                label={getSupportingDocumentPurposeLabel(purpose)}
                help={
                  <Help
                    text={getSupportingDocumentPurposeDescriptionLabel(purpose)}
                    onPress={match(purpose)
                      .with("PowerOfAttorney", () => setPowerOfAttorneyModalVisible.on)
                      .with("SwornStatement", () => setSwornStatementModalVisible.on)
                      .otherwise(() => undefined)}
                  />
                }
                render={() => (
                  <>
                    <UploadArea
                      layout="horizontal"
                      icon="document-regular"
                      description={t("supportingDocuments.documentTypes")}
                      documents={documents.local}
                      accept={ACCEPTED_FORMATS}
                      maxSize={MAX_SUPPORTING_DOCUMENT_UPLOAD_SIZE}
                      error={documents.errorVisible ? t("common.form.required") : undefined}
                      onDropAccepted={files => {
                        handleUpload(files, purpose);
                      }}
                    />

                    {documents.uploaded.map(document => (
                      <Fragment key={document.id}>
                        <Space height={12} />

                        <FileTile
                          key={document.id}
                          name={document.name}
                          url={document.url}
                          variant={document.status}
                          title={getSupportingDocumentStatusLabel(document.status)}
                          description={document.status === "refused" ? document.reason : undefined}
                        />
                      </Fragment>
                    ))}
                  </>
                )}
              />
            );
          })}
        </Stack>

        <LakeModal
          visible={powerOfAttorneyModalVisible}
          title={t("supportingDocuments.powerAttorneyModal.title")}
          icon="document-regular"
          onPressClose={setPowerOfAttorneyModalVisible.off}
        >
          <LakeText>{t("supportingDocuments.powerAttorneyModal.text")}</LakeText>
          <Space height={16} />

          <LakeButtonGroup paddingBottom={0}>
            <LakeButton
              grow={true}
              color="current"
              onPress={() => window.open(`/power-of-attorney-template/${templateLanguage}.pdf`)}
            >
              {t("supportingDocuments.powerAttorneyModal.downloadButton")}
            </LakeButton>
          </LakeButtonGroup>
        </LakeModal>

        <LakeModal
          visible={swornStatementModalVisible}
          title={t("supportingDocuments.swornStatementModal.title")}
          icon="document-regular"
          onPressClose={setSwornStatementModalVisible.off}
        >
          <LakeText>{t("supportingDocuments.swornStatementModal.text")}</LakeText>
          <Space height={16} />

          <LakeButtonGroup paddingBottom={0}>
            <LakeButton
              grow={true}
              color="current"
              onPress={() => window.open(`/sworn-statement-template/es.pdf`)}
            >
              {t("supportingDocuments.swornStatementModal.downloadButton")}
            </LakeButton>
          </LakeButtonGroup>
        </LakeModal>
      </Form>
    );
  },
);
