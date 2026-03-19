import { Array, Option } from "@swan-io/boxed";
import { useMutation } from "@swan-io/graphql-client";
import { Box } from "@swan-io/lake/src/components/Box";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeLabelledCheckbox } from "@swan-io/lake/src/components/LakeCheckbox";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { breakpoints } from "@swan-io/lake/src/constants/design";
import { useBoolean } from "@swan-io/lake/src/hooks/useBoolean";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { LakeModal } from "@swan-io/shared-business/src/components/LakeModal";
import {
  Document,
  SupportingDocumentCollection,
  SupportingDocumentCollectionRef,
} from "@swan-io/shared-business/src/components/SupportingDocumentCollection";
import { SwanFile } from "@swan-io/shared-business/src/utils/SwanFile";
import { ReactNode, useCallback, useRef } from "react";
import { StyleSheet } from "react-native";
import { match } from "ts-pattern";
import { OnboardingFooter } from "../../../components/OnboardingFooter";
import { StepTitle } from "../../../components/StepTitle";
import { CompanyOnboardingFragment } from "../../../graphql/partner";
import {
  DeleteSupportingDocumentDocument,
  GenerateSupportingDocumentUploadUrlDocument,
  SupportingDocumentPurposeEnum,
} from "../../../graphql/unauthenticated";
import { t } from "../../../utils/i18n";
import { CompanyOnboardingRouteV2, Router } from "../../../utils/routes";

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});

type Props = {
  onboarding: NonNullable<CompanyOnboardingFragment>;
  previousStep: CompanyOnboardingRouteV2;
  supportingDocumentCollection: NonNullable<
    CompanyOnboardingFragment["supportingDocumentCollection"]
  >;
  templateLanguage: string;
};

const DocumentsStepTile = ({ small, children }: { small: boolean; children: ReactNode }) => {
  if (small) {
    return <>{children}</>;
  }
  return <Tile>{children}</Tile>;
};

export const OnboardingCompanyDocuments = ({
  onboarding,
  previousStep,
  supportingDocumentCollection,
  templateLanguage,
}: Props) => {
  const onboardingId = onboarding.id;
  const { accountInfo, company } = onboarding;

  const accountCountry = accountInfo?.country;
  const companyType = company?.companyType;

  const supportingDocumentCollectionId = supportingDocumentCollection.id;
  const documents = supportingDocumentCollection.supportingDocuments;
  const requiredDocumentsPurposes =
    supportingDocumentCollection.requiredSupportingDocumentPurposes.map(d => d.name) ?? [];

  const [generateSupportingDocumentUploadUrl] = useMutation(
    GenerateSupportingDocumentUploadUrlDocument,
  );
  const [deleteSupportingDocument] = useMutation(DeleteSupportingDocumentDocument);
  const [showConfirmModal, setShowConfirmModal] = useBoolean(false);
  const [missingDocumentConfirmed, setMissingDocumentConfirmed] = useBoolean(false);
  const supportingDocumentCollectionRef =
    useRef<SupportingDocumentCollectionRef<SupportingDocumentPurposeEnum>>(null);

  const onPressPrevious = () => {
    Router.push(previousStep, { onboardingId });
  };

  const goToNextStep = () => {
    Router.push("Finalize", { onboardingId });
  };

  const onPressNext = () => {
    const collection = supportingDocumentCollectionRef.current;
    if (collection == null) {
      return;
    }
    if (collection.areAllRequiredDocumentsFilled()) {
      goToNextStep();
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

  const onRemoveFile = useCallback(
    (file: SwanFile) => {
      return deleteSupportingDocument({ input: { id: file.id } })
        .mapOk(data => data.deleteSupportingDocument)
        .mapOkToResult(filterRejectionsToResult);
    },
    [deleteSupportingDocument],
  );

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

  return (
    <>
      <ResponsiveContainer breakpoint={breakpoints.medium}>
        {({ small }) => (
          <>


            <DocumentsStepTile small={small}>
              <StepTitle isMobile={small}>{t("company.step.documents.title")}</StepTitle>
              <Space height={4} />
              <LakeText>{t("company.step.documents.subtitle")}</LakeText>
              <Space height={small ? 24 : 32} />

              <SupportingDocumentCollection
                ref={supportingDocumentCollectionRef}
                documents={docs}
                requiredDocumentPurposes={requiredDocumentsPurposes}
                generateUpload={generateUpload}
                status={supportingDocumentCollection.statusInfo.status}
                templateLanguage={templateLanguage}
                onRemoveFile={onRemoveFile}
                purposeLabelOverrides={{
                  ...(accountCountry === "DEU" && companyType === "SelfEmployed"
                    ? {
                        CompanyRegistration: t(
                          "company.document.supportingDocuments.purpose.CompanyRegistrationSelfEmployedGermany",
                        ),
                      }
                    : null),
                }}
                purposeDescriptionLabelOverrides={{
                  ...(accountCountry === "DEU" && companyType === "SelfEmployed"
                    ? {
                        CompanyRegistration: t(
                          "company.document.supportingDocuments.purpose.CompanyRegistrationSelfEmployedGermany.description",
                        ),
                      }
                    : null),
                }}
              />
            </DocumentsStepTile>
          </>
        )}
      </ResponsiveContainer>

      <OnboardingFooter onPrevious={onPressPrevious} onNext={onPressNext} />

      <LakeModal
        visible={showConfirmModal}
        title={t("company.step.documents.confirmModal.title")}
        icon="warning-regular"
        color="partner"
      >
        <LakeText>{t("company.step.documents.confirmModal.message")}</LakeText>
        <Space height={16} />

        <LakeLabelledCheckbox
          value={missingDocumentConfirmed}
          onValueChange={setMissingDocumentConfirmed.toggle}
          label={t("company.step.documents.confirmModal.checkbox")}
        />

        <Space height={40} />

        <Box direction="row">
          <LakeButton
            mode="secondary"
            style={styles.fill}
            onPress={() => {
              setShowConfirmModal.off();
              setMissingDocumentConfirmed.off();
            }}
          >
            {t("company.step.documents.confirmModal.uploadDocuments")}
          </LakeButton>

          <Space width={24} />

          <LakeButton
            color="partner"
            style={styles.fill}
            onPress={goToNextStep}
            disabled={!missingDocumentConfirmed}
          >
            {t("common.next")}
          </LakeButton>
        </Box>
      </LakeModal>
    </>
  );
};
