import { Array, Option } from "@swan-io/boxed";
import { useMutation } from "@swan-io/graphql-client";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { breakpoints } from "@swan-io/lake/src/constants/design";
import { useBoolean } from "@swan-io/lake/src/hooks/useBoolean";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { ConfirmModal } from "@swan-io/shared-business/src/components/ConfirmModal";
import {
  Document,
  SupportingDocumentCollection,
  SupportingDocumentCollectionRef,
} from "@swan-io/shared-business/src/components/SupportingDocumentCollection";
import { SwanFile } from "@swan-io/shared-business/src/utils/SwanFile";
import { ReactNode, useCallback, useRef } from "react";
import { match, P } from "ts-pattern";
import { OnboardingFooter } from "../../components/OnboardingFooter";
import { OnboardingStepContent } from "../../components/OnboardingStepContent";
import { StepTitle } from "../../components/StepTitle";
import { FragmentType, getFragmentData, graphql } from "../../gql";
import { SupportingDocumentPurposeEnum } from "../../gql/graphql";
import { DeleteSupportingDocumentMutation } from "../../mutations/DeleteSupportingDocumentMutation";
import { GenerateSupportingDocumentUploadUrlMutation } from "../../mutations/GenerateSupportingDocumentUploadUrlMutation";
import { UpdateCompanyOnboardingMutation } from "../../mutations/UpdateCompanyOnboardingMutation";
import { locale, t } from "../../utils/i18n";

export const OnboardingCompanyDocuments_OnboardingInfo = graphql(`
  fragment OnboardingCompanyDocuments_OnboardingInfo on OnboardingInfo {
    supportingDocumentCollection {
      id
      statusInfo {
        status
      }
      requiredSupportingDocumentPurposes {
        name
      }
      supportingDocuments {
        id
        supportingDocumentPurpose
        supportingDocumentType
        updatedAt
        statusInfo {
          __typename
          status
          ... on SupportingDocumentUploadedStatusInfo {
            filename
          }
          ... on SupportingDocumentValidatedStatusInfo {
            filename
          }
          ... on SupportingDocumentRefusedStatusInfo {
            reason
            filename
          }
        }
      }
    }
    language
  }
`);

type Props = {
  onboardingId: string;
  onboardingInfoData: FragmentType<typeof OnboardingCompanyDocuments_OnboardingInfo>;
  onPressPrevious: () => void;
  onSave: () => void;
};

const DocumentsStepTile = ({ small, children }: { small: boolean; children: ReactNode }) => {
  if (small) {
    return <>{children}</>;
  }
  return <Tile>{children}</Tile>;
};

export const OnboardingCompanyDocuments = ({
  onboardingId,
  onboardingInfoData,
  onPressPrevious,
  onSave,
}: Props) => {
  const onboardingInfo = getFragmentData(
    OnboardingCompanyDocuments_OnboardingInfo,
    onboardingInfoData,
  );

  const [updateOnboarding, updateResult] = useMutation(UpdateCompanyOnboardingMutation);
  const [generateSupportingDocumentUploadUrl] = useMutation(
    GenerateSupportingDocumentUploadUrlMutation,
  );
  const [deleteSupportingDocument] = useMutation(DeleteSupportingDocumentMutation);
  const [showConfirmModal, setShowConfirmModal] = useBoolean(false);
  const supportingDocumentCollectionRef =
    useRef<SupportingDocumentCollectionRef<SupportingDocumentPurposeEnum>>(null);

  const onPressNext = () => {
    const supportingDocumentCollection = supportingDocumentCollectionRef.current;
    if (supportingDocumentCollection == null) {
      return;
    }
    if (supportingDocumentCollection.areAllRequiredDocumentsFilled()) {
      updateOnboarding({
        input: {
          onboardingId,
        },
        language: locale.language,
      })
        .mapOk(data => data.unauthenticatedUpdateCompanyOnboarding)
        .mapOkToResult(filterRejectionsToResult)
        .tap(onSave);
    } else {
      setShowConfirmModal.on();
    }
  };

  const generateUpload = ({
    fileName,
    purpose,
  }: {
    fileName: string;
    purpose: SupportingDocumentPurposeEnum;
  }) => {
    return generateSupportingDocumentUploadUrl({
      input: {
        supportingDocumentCollectionId: onboardingInfo.supportingDocumentCollection.id,
        supportingDocumentPurpose: purpose,
        filename: fileName,
      },
    })
      .mapOk(data => data.generateSupportingDocumentUploadUrl)
      .mapOkToResult(filterRejectionsToResult)
      .mapOk(({ upload, supportingDocumentId }) => ({ upload, id: supportingDocumentId }));
  };

  const onRemoveFile = useCallback(
    (file: SwanFile) => {
      return deleteSupportingDocument({ input: { id: file.id } })
        .mapOk(data => data.deleteSupportingDocument)
        .mapOkToResult(filterRejectionsToResult);
    },
    [deleteSupportingDocument],
  );

  const docs = Array.filterMap(
    onboardingInfo.supportingDocumentCollection.supportingDocuments,
    document =>
      match(document)
        .returnType<Option<Document<SupportingDocumentPurposeEnum>>>()
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
        .with(P.nullish, () => Option.None())
        .exhaustive(),
  );

  return (
    <>
      <OnboardingStepContent>
        <ResponsiveContainer breakpoint={breakpoints.medium}>
          {({ small }) => (
            <>
              <StepTitle isMobile={small}>{t("company.step.documents.title")}</StepTitle>
              <Space height={4} />
              <LakeText>{t("company.step.documents.subtitle")}</LakeText>
              <Space height={small ? 24 : 32} />

              <DocumentsStepTile small={small}>
                <SupportingDocumentCollection
                  ref={supportingDocumentCollectionRef}
                  documents={docs}
                  requiredDocumentPurposes={onboardingInfo.supportingDocumentCollection.requiredSupportingDocumentPurposes.map(
                    purpose => purpose.name,
                  )}
                  generateUpload={generateUpload}
                  status={onboardingInfo.supportingDocumentCollection.statusInfo.status}
                  templateLanguage={onboardingInfo.language ?? "en"}
                  onRemoveFile={onRemoveFile}
                />
              </DocumentsStepTile>
            </>
          )}
        </ResponsiveContainer>

        <OnboardingFooter
          onPrevious={onPressPrevious}
          onNext={onPressNext}
          loading={updateResult.isLoading()}
        />
      </OnboardingStepContent>

      <ConfirmModal
        visible={showConfirmModal}
        title={t("company.step.documents.confirmModal.title")}
        message={t("company.step.documents.confirmModal.message")}
        icon="document-regular"
        confirmText={t("company.step.documents.confirmModal.confirm")}
        onConfirm={onSave}
        loading={updateResult.isLoading()}
        onCancel={setShowConfirmModal.off}
      />
    </>
  );
};
