import { Array, Option } from "@swan-io/boxed";
import { useMutation } from "@swan-io/graphql-client";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { breakpoints } from "@swan-io/lake/src/constants/design";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
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
import {
  DeleteSupportingDocumentDocument,
  GenerateSupportingDocumentUploadUrlDocument,
  SupportingDocumentPurposeEnum,
} from "../../graphql/partner";
import { AccountAdminChangeInfoFragment } from "../../graphql/unauthenticated";
import { t } from "../../utils/i18n";
import { ChangeAdminRoute, Router } from "../../utils/routes";

type Props = {
  supportingDocumentCollection: AccountAdminChangeInfoFragment["supportingDocumentCollection"];
  templateLanguage: string;
  changeAdminRequestId: string;
  previousStep: ChangeAdminRoute;
  nextStep: ChangeAdminRoute;
};

const DocumentsStepTile = ({ small, children }: { small: boolean; children: ReactNode }) => {
  if (small) {
    return <>{children}</>;
  }
  return <Tile>{children}</Tile>;
};

export const ChangeAdminDocuments = ({
  supportingDocumentCollection,
  templateLanguage,
  changeAdminRequestId,
  previousStep,
  nextStep,
}: Props) => {
  const [generateSupportingDocumentUploadUrl] = useMutation(
    GenerateSupportingDocumentUploadUrlDocument,
  );
  const [deleteSupportingDocument] = useMutation(DeleteSupportingDocumentDocument);

  const supportingDocumentCollectionRef =
    useRef<SupportingDocumentCollectionRef<SupportingDocumentPurposeEnum>>(null);

  const onPressPrevious = () => {
    Router.push(previousStep, { requestId: changeAdminRequestId });
  };

  const onPressNext = () => {
    const supportingDocumentCollection = supportingDocumentCollectionRef.current;
    if (supportingDocumentCollection == null) {
      return;
    }
    // Show some validation errors
    // if (!supportingDocumentCollection.areAllRequiredDocumentsFilled()) {
    //   return;
    // }

    Router.push(nextStep, { requestId: changeAdminRequestId });
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
        supportingDocumentCollectionId: supportingDocumentCollection.id,
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

  const docs = Array.filterMap(supportingDocumentCollection.supportingDocuments, document =>
    match(document)
      .returnType<Option<Document<SupportingDocumentPurposeEnum>>>()
      .with(
        {
          statusInfo: {
            __typename: P.union(
              "SupportingDocumentNotUploadedStatusInfo",
              "SupportingDocumentWaitingForUploadStatusInfo",
            ),
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
            statusInfo: {
              status: "Refused",
              reason: document.statusInfo.reason,
              reasonCode: document.statusInfo.reasonCode,
            },
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
  const requiredDocumentsPurposes =
    supportingDocumentCollection.requiredSupportingDocumentPurposes.map(doc => doc.name);
  const supportingDocumentCollectionStatus = supportingDocumentCollection.statusInfo.status;

  return (
    <OnboardingStepContent>
      <ResponsiveContainer breakpoint={breakpoints.medium}>
        {({ small }) => (
          <>
            <StepTitle isMobile={small}>{t("changeAdmin.step.documents.title")}</StepTitle>
            <Space height={small ? 8 : 12} />
            <LakeText>{t("changeAdmin.step.documents.description")}</LakeText>
            <Space height={small ? 24 : 32} />

            <DocumentsStepTile small={small}>
              <SupportingDocumentCollection
                ref={supportingDocumentCollectionRef}
                documents={docs}
                requiredDocumentPurposes={requiredDocumentsPurposes}
                generateUpload={generateUpload}
                status={supportingDocumentCollectionStatus}
                templateLanguage={templateLanguage}
                onRemoveFile={onRemoveFile}
              />
            </DocumentsStepTile>
          </>
        )}
      </ResponsiveContainer>

      <OnboardingFooter onPrevious={onPressPrevious} onNext={onPressNext} loading={false} />
    </OnboardingStepContent>
  );
};
