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
  SupportingDocument,
} from "@swan-io/shared-business/src/components/SupportingDocument";
import { ReactNode } from "react";
import { OnboardingFooter } from "../../components/OnboardingFooter";
import { OnboardingStepContent } from "../../components/OnboardingStepContent";
import { StepTitle } from "../../components/StepTitle";
import {
  GenerateSupportingDocumentUploadUrlDocument,
  SupportingDocumentPurposeEnum,
} from "../../graphql/unauthenticated";
import { t } from "../../utils/i18n";
import { CompanyOnboardingRoute, Router } from "../../utils/routes";

type Props = {
  previousStep: CompanyOnboardingRoute;
  nextStep: CompanyOnboardingRoute;
  onboardingId: string;
  documents: Document<SupportingDocumentPurposeEnum>[];
  requiredDocumentsPurposes: SupportingDocumentPurposeEnum[];
  supportingDocumentCollectionId: string;
  onboardingLanguage: string;
  onDocumentsChange: (documents: Document<SupportingDocumentPurposeEnum>[]) => void;
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
  onboardingLanguage,
  onDocumentsChange,
}: Props) => {
  const [, generateSupportingDocumentUploadUrl] = useUrqlMutation(
    GenerateSupportingDocumentUploadUrlDocument,
  );
  const [showConfirmModal, setShowConfirmModal] = useBoolean(false);

  const onPressPrevious = () => {
    Router.push(previousStep, { onboardingId });
  };

  const submitDocuments = () => {
    Router.push(nextStep, { onboardingId });
  };

  const onPressNext = () => {
    const requiredTypeAreCompleted = requiredDocumentsPurposes.every(requiredPurpose =>
      documents.some(({ purpose }) => purpose === requiredPurpose),
    );

    if (requiredTypeAreCompleted) {
      submitDocuments();
    } else {
      setShowConfirmModal.on();
    }
  };

  const getAwsUrl = (
    file: File,
    purpose: SupportingDocumentPurposeEnum,
  ): Promise<{ upload: { url: string; fields: { key: string; value: string }[] }; id: string }> => {
    return generateSupportingDocumentUploadUrl({
      input: {
        supportingDocumentCollectionId,
        supportingDocumentPurpose: purpose,
        filename: file.name,
      },
    })
      .mapOk(data => data.generateSupportingDocumentUploadUrl)
      .mapOkToResult(filterRejectionsToResult)
      .mapOk(({ upload, supportingDocumentId }) => ({ upload, id: supportingDocumentId }))
      .toPromise()
      .then(result =>
        result.match({
          Ok: value => value,
          Error: error => {
            throw error;
          },
        }),
      );
  };

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
                <SupportingDocument
                  documents={documents}
                  requiredDocumentPurposes={requiredDocumentsPurposes}
                  onChange={onDocumentsChange}
                  getAwsUrl={getAwsUrl}
                  onboardingLanguage={onboardingLanguage}
                />
              </DocumentsStepTile>
            </>
          )}
        </ResponsiveContainer>

        <OnboardingFooter onPrevious={onPressPrevious} onNext={onPressNext} />
      </OnboardingStepContent>

      <ConfirmModal
        visible={showConfirmModal}
        title={t("company.step.documents.confirmModal.title")}
        message={t("company.step.documents.confirmModal.message")}
        icon="document-regular"
        confirmText={t("company.step.documents.confirmModal.confirm")}
        onConfirm={submitDocuments}
        onCancel={setShowConfirmModal.off}
      />
    </>
  );
};
