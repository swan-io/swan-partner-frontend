import { Result } from "@swan-io/boxed";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { breakpoints } from "@swan-io/lake/src/constants/design";
import { useBoolean } from "@swan-io/lake/src/hooks/useBoolean";
import { useUrqlMutation } from "@swan-io/lake/src/hooks/useUrqlMutation";
import {
  Document,
  SupportingDocument,
  SupportingDocumentPurpose,
} from "@swan-io/shared-business/src/components/SupportingDocument";
import { ReactNode } from "react";
import { match } from "ts-pattern";
import { ConfirmModal } from "../../components/ConfirmModal";
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
  documents: Document[];
  requiredDocumentTypes: SupportingDocumentPurposeEnum[];
  supportingDocumentCollectionId: string;
  onboardingLanguage: string;
  onDocumentsChange: (documents: Document[]) => void;
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
  requiredDocumentTypes,
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
    const requiredTypeAreCompleted = requiredDocumentTypes.every(requiredType =>
      documents.some(({ purpose }) => purpose === requiredType),
    );

    if (requiredTypeAreCompleted) {
      submitDocuments();
    } else {
      setShowConfirmModal.on();
    }
  };

  const getAwsUrl = (
    file: File,
    purpose: SupportingDocumentPurpose,
  ): Promise<{ upload: { url: string; fields: { key: string; value: string }[] }; id: string }> => {
    return generateSupportingDocumentUploadUrl({
      input: {
        supportingDocumentCollectionId,
        supportingDocumentPurpose: purpose,
        filename: file.name,
      },
    })
      .mapOkToResult(({ generateSupportingDocumentUploadUrl }) =>
        match(generateSupportingDocumentUploadUrl)
          .with(
            { __typename: "GenerateSupportingDocumentUploadUrlSuccessPayload" },
            ({ upload, supportingDocumentId }) => Result.Ok({ upload, id: supportingDocumentId }),
          )
          .otherwise(error => Result.Error(error)),
      )
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
              <Space height={small ? 24 : 32} />

              <DocumentsStepTile small={small}>
                <SupportingDocument
                  documents={documents}
                  requiredDocumentTypes={requiredDocumentTypes}
                  onChange={onDocumentsChange}
                  getAwsUrl={getAwsUrl}
                  onboardingLanguage={onboardingLanguage}
                />
              </DocumentsStepTile>
            </>
          )}
        </ResponsiveContainer>
      </OnboardingStepContent>

      <OnboardingFooter onPrevious={onPressPrevious} onNext={onPressNext} />

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
