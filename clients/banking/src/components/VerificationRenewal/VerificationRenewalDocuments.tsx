import { Array, Option } from "@swan-io/boxed";
import { useMutation } from "@swan-io/graphql-client";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { breakpoints } from "@swan-io/lake/src/constants/design";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { SupportingDocumentCollection } from "@swan-io/shared-business/src/components/SupportingDocumentCollection";
import { SwanFile } from "@swan-io/shared-business/src/utils/SwanFile";
import { useCallback, useState } from "react";
import { match, P } from "ts-pattern";
import { StepTitle } from "../../../../onboarding/src/components/StepTitle";
import {
  DeleteSupportingDocumentDocument,
  GenerateSupportingDocumentUploadUrlDocument,
  SupportingDocumentPurposeEnum,
  SupportingDocumentRenewalFragment,
} from "../../graphql/partner";
import { t } from "../../utils/i18n";
import { Router } from "../../utils/routes";
import { RenewalStep } from "../../utils/verificationRenewal";
import { VerificationRenewalFooter } from "./VerificationRenewalFooter";
import { VerificationRenewalStepContent } from "./VerificationRenewalStepContent";

export type Document<Purpose extends string> = {
  purpose: Purpose;
  file: SwanFile;
};

type Props = {
  verificationRenewalId: string;
  supportingDocumentCollection: SupportingDocumentRenewalFragment;
  previousStep: RenewalStep | undefined;
  nextStep: RenewalStep;
  templateLanguage: string;
};

export const VerificationRenewalDocuments = ({
  verificationRenewalId,
  supportingDocumentCollection,
  previousStep,
  nextStep,
  templateLanguage,
}: Props) => {
  const requiredDocumentsPurposes =
    supportingDocumentCollection.requiredSupportingDocumentPurposes.map(purpose => purpose.name) ??
    [];

  const [generateSupportingDocumentUploadUrl] = useMutation(
    GenerateSupportingDocumentUploadUrlDocument,
  );
  const [deleteSupportingDocument] = useMutation(DeleteSupportingDocumentDocument);

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

  const onPressNext = () => {
    Router.push(nextStep.id, {
      verificationRenewalId: verificationRenewalId,
    });
  };

  const requiredPurposes = new Set(
    supportingDocumentCollection.requiredSupportingDocumentPurposes.map(item => item.name),
  );

  const [docs, setDocs] = useState(() =>
    Array.filterMap(supportingDocumentCollection.supportingDocuments, document =>
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
        // Hide `Validated` docs as they're results from internal upload
        .with({ statusInfo: { __typename: "SupportingDocumentValidatedStatusInfo" } }, () =>
          Option.None(),
        )
        .with({ statusInfo: { __typename: "SupportingDocumentRefusedStatusInfo" } }, document =>
          requiredPurposes.has(document.supportingDocumentPurpose)
            ? Option.Some({
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
              })
            : Option.None(),
        )
        .with({ statusInfo: { __typename: "SupportingDocumentUploadedStatusInfo" } }, document =>
          requiredPurposes.has(document.supportingDocumentPurpose)
            ? Option.Some({
                purpose: document.supportingDocumentPurpose,
                file: {
                  id: document.id,
                  name: document.statusInfo.filename,
                  statusInfo: { status: "Uploaded" },
                },
              })
            : Option.None(),
        )
        .exhaustive(),
    ),
  );

  const areAllRequiredDocumentsFilled = requiredDocumentsPurposes.every(purpose =>
    docs.some(doc => doc.purpose === purpose),
  );

  return (
    <VerificationRenewalStepContent>
      <ResponsiveContainer breakpoint={breakpoints.medium}>
        {({ small }) => (
          <>
            <StepTitle isMobile={small}>{t("verificationRenewal.documents.title")}</StepTitle>
            <Space height={4} />
            <LakeText>{t("verificationRenewal.documents.subtitle")}</LakeText>
            <Space height={24} />
            {requiredDocumentsPurposes.length === 0 ? (
              <Tile>
                <LakeText>{t("verificationRenewal.documents.noDocuments")}</LakeText>
              </Tile>
            ) : (
              <SupportingDocumentCollection
                generateUpload={generateUpload}
                requiredDocumentPurposes={requiredDocumentsPurposes}
                status={supportingDocumentCollection.statusInfo.status}
                documents={docs}
                templateLanguage={templateLanguage}
                onRemoveFile={onRemoveFile}
                onChange={setDocs}
              />
            )}

            <VerificationRenewalFooter
              onPrevious={
                previousStep !== undefined
                  ? () =>
                      Router.push(previousStep?.id, {
                        verificationRenewalId: verificationRenewalId,
                      })
                  : undefined
              }
              onNext={onPressNext}
              nextDisabled={!areAllRequiredDocumentsFilled}
            />
          </>
        )}
      </ResponsiveContainer>
    </VerificationRenewalStepContent>
  );
};
