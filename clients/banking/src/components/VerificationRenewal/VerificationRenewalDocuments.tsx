import { Array, Option } from "@swan-io/boxed";
import { useMutation } from "@swan-io/graphql-client";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { breakpoints } from "@swan-io/lake/src/constants/design";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { SupportingDocumentCollection } from "@swan-io/shared-business/src/components/SupportingDocumentCollection";
import { SwanFile } from "@swan-io/shared-business/src/utils/SwanFile";
import { match, P } from "ts-pattern";
import { OnboardingStepContent } from "../../../../onboarding/src/components/OnboardingStepContent";
import { StepTitle } from "../../../../onboarding/src/components/StepTitle";
import {
  GenerateSupportingDocumentUploadUrlDocument,
  GetVerificationRenewalQuery,
  SupportingDocumentPurposeEnum,
  SupportingDocumentRenewalFragment,
} from "../../graphql/partner";
import { t } from "../../utils/i18n";
import { Router } from "../../utils/routes";

export type Document<Purpose extends string> = {
  purpose: Purpose;
  file: SwanFile;
};

type Props = {
  verificationRenewal: NonNullable<GetVerificationRenewalQuery["verificationRenewal"]>;
  supportingDocumentCollection: SupportingDocumentRenewalFragment;
};

export const VerificationRenewalDocuments = ({
  verificationRenewal,
  supportingDocumentCollection,
}: Props) => {
  console.log(supportingDocumentCollection);

  const requiredDocumentsPurposes =
    supportingDocumentCollection.requiredSupportingDocumentPurposes.map(purpose => purpose.name) ??
    [];

  const [generateSupportingDocumentUploadUrl] = useMutation(
    GenerateSupportingDocumentUploadUrlDocument,
  );

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

  const requiredPurposes = new Set(
    supportingDocumentCollection.requiredSupportingDocumentPurposes.map(item => item.name),
  );

  const docs = Array.filterMap(supportingDocumentCollection.supportingDocuments, document =>
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
  );

  return (
    <OnboardingStepContent>
      <ResponsiveContainer breakpoint={breakpoints.medium}>
        {({ small }) => (
          <>
            <StepTitle isMobile={small}>{t("verificationRenewal.documents.title")}</StepTitle>
            <Space height={4} />
            <LakeText>{t("verificationRenewal.documents.subtitle")}</LakeText>
            <Space height={40} />
            <SupportingDocumentCollection
              generateUpload={generateUpload}
              requiredDocumentPurposes={requiredDocumentsPurposes}
              status={supportingDocumentCollection.statusInfo.status}
              documents={docs}
            />

            <Space height={40} />

            <LakeButtonGroup>
              <LakeButton
                mode="secondary"
                onPress={() =>
                  Router.push("VerificationRenewalRoot", {
                    verificationRenewalId: verificationRenewal.id,
                  })
                }
              >
                {t("verificationRenewal.cancel")}
              </LakeButton>

              <LakeButton
                onPress={() =>
                  Router.push("VerificationRenewalFinalize", {
                    verificationRenewalId: verificationRenewal.id,
                  })
                }
                color="current"
              >
                {t("verificationRenewal.confirm")}
              </LakeButton>
            </LakeButtonGroup>
          </>
        )}
      </ResponsiveContainer>
    </OnboardingStepContent>
  );
};
