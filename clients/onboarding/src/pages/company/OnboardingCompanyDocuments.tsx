import { Array, Option } from "@swan-io/boxed";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { breakpoints } from "@swan-io/lake/src/constants/design";
import { useBoolean } from "@swan-io/lake/src/hooks/useBoolean";
import { useUrqlMutation } from "@swan-io/lake/src/hooks/useUrqlMutation";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/urql";
import { ConfirmModal } from "@swan-io/shared-business/src/components/ConfirmModal";
import {
  Document,
  SupportingDocumentCollection,
  SupportingDocumentCollectionRef,
} from "@swan-io/shared-business/src/components/SupportingDocumentCollection";
import { ReactNode, useRef } from "react";
import { match } from "ts-pattern";
import { OnboardingFooter } from "../../components/OnboardingFooter";
import { OnboardingStepContent } from "../../components/OnboardingStepContent";
import { StepTitle } from "../../components/StepTitle";
import {
  GenerateSupportingDocumentUploadUrlDocument,
  SupportingDocumentCollectionStatus,
  SupportingDocumentFragment,
  SupportingDocumentPurposeEnum,
  UpdateCompanyOnboardingDocument,
} from "../../graphql/unauthenticated";
import { locale, t } from "../../utils/i18n";
import { CompanyOnboardingRoute, Router } from "../../utils/routes";

type Props = {
  previousStep: CompanyOnboardingRoute;
  nextStep: CompanyOnboardingRoute;
  onboardingId: string;
  documents: SupportingDocumentFragment[];
  requiredDocumentsPurposes: SupportingDocumentPurposeEnum[];
  supportingDocumentCollectionId: string;
  supportingDocumentCollectionStatus: SupportingDocumentCollectionStatus;
  templateLanguage: string;
};

const DocumentsStepTile = ({ small, children }: { small: boolean; children: ReactNode }) => {
  if (small) {
    return <>{children}</>;
  }
  return <Tile>{children}</Tile>;
};

export const OnboardingCompanyDocuments = ({
  previousStep,
  nextStep,
  onboardingId,
  documents,
  requiredDocumentsPurposes,
  supportingDocumentCollectionId,
  supportingDocumentCollectionStatus,
  templateLanguage,
}: Props) => {
  const [updateResult, updateOnboarding] = useUrqlMutation(UpdateCompanyOnboardingDocument);
  const [, generateSupportingDocumentUploadUrl] = useUrqlMutation(
    GenerateSupportingDocumentUploadUrlDocument,
  );
  const [showConfirmModal, setShowConfirmModal] = useBoolean(false);
  const supportingDocumentCollectionRef =
    useRef<SupportingDocumentCollectionRef<SupportingDocumentPurposeEnum>>(null);

  const onPressPrevious = () => {
    Router.push(previousStep, { onboardingId });
  };

  const goToNextStep = () => {
    Router.push(nextStep, { onboardingId });
  };

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
        .tap(() => goToNextStep());
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
        supportingDocumentCollectionId,
        supportingDocumentPurpose: purpose,
        filename: fileName,
      },
    })
      .mapOk(data => data.generateSupportingDocumentUploadUrl)
      .mapOkToResult(filterRejectionsToResult)
      .mapOk(({ upload, supportingDocumentId }) => ({ upload, id: supportingDocumentId }));
  };

  const docs = Array.filterMap(documents, document =>
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
            url: document.statusInfo.downloadUrl,
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
            url: document.statusInfo.downloadUrl,
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
            url: document.statusInfo.downloadUrl,
            statusInfo: { status: "Uploaded" },
          },
        }),
      )
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
                  requiredDocumentPurposes={requiredDocumentsPurposes}
                  generateUpload={generateUpload}
                  status={supportingDocumentCollectionStatus}
                  templateLanguage={templateLanguage}
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
        onConfirm={goToNextStep}
        loading={updateResult.isLoading()}
        onCancel={setShowConfirmModal.off}
      />
    </>
  );
};
