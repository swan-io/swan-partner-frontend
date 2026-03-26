import { Array, Future, Option } from "@swan-io/boxed";
import { useMutation } from "@swan-io/graphql-client";
import { LakeAlert } from "@swan-io/lake/src/components/LakeAlert";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { breakpoints } from "@swan-io/lake/src/constants/design";
import { useFirstMountState } from "@swan-io/lake/src/hooks/useFirstMountState";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { isNotNullish } from "@swan-io/lake/src/utils/nullish";
import {
  Document,
  SupportingDocumentCollection,
  SupportingDocumentCollectionRef,
} from "@swan-io/shared-business/src/components/SupportingDocumentCollection";
import { showToast } from "@swan-io/shared-business/src/state/toasts";
import { locale } from "@swan-io/shared-business/src/utils/i18n";
import { SwanFile } from "@swan-io/shared-business/src/utils/SwanFile";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { match, P } from "ts-pattern";
import { OnboardingFooter } from "../../../components/OnboardingFooter";
import { StepTitle } from "../../../components/StepTitle";
import {
  CompanyOnboardingFragment,
  UpdatePublicCompanyAccountHolderOnboardingDocument,
} from "../../../graphql/partner";
import {
  DeleteSupportingDocumentDocument,
  GenerateSupportingDocumentUploadUrlDocument,
  SupportingDocumentPurposeEnum,
} from "../../../graphql/unauthenticated";
import { t } from "../../../utils/i18n";
import { CompanyOnboardingRouteV2, Router } from "../../../utils/routes";
import { getUpdateOnboardingError } from "../../../utils/templateTranslations";
import { extractServerInvalidFields } from "../../../utils/validation";

type Props = {
  onboarding: NonNullable<CompanyOnboardingFragment>;
  previousStep: CompanyOnboardingRouteV2;
  supportingDocumentCollection: NonNullable<
    CompanyOnboardingFragment["supportingDocumentCollection"]
  >;
  templateLanguage: string;
  finalized: boolean;
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
  finalized,
}: Props) => {
  const onboardingId = onboarding.id;
  const { accountInfo, company } = onboarding;
  const accountCountry = accountInfo?.country;
  const companyType = company?.companyType;

  const supportingDocumentCollectionId = supportingDocumentCollection.id;
  const documents = supportingDocumentCollection.supportingDocuments;
  const requiredDocumentsPurposes =
    supportingDocumentCollection.requiredSupportingDocumentPurposes.map(d => d.name) ?? [];

  const [error, showError] = useState(false);
  const [loader, showLoader] = useState(false);
  const isFirstMount = useFirstMountState();

  const [forceUpdateCompanyOnboarding] = useMutation(
    UpdatePublicCompanyAccountHolderOnboardingDocument,
  );
  const [generateSupportingDocumentUploadUrl, uploadResult] = useMutation(
    GenerateSupportingDocumentUploadUrlDocument,
  );
  const [deleteSupportingDocument] = useMutation(DeleteSupportingDocumentDocument);
  const supportingDocumentCollectionRef =
    useRef<SupportingDocumentCollectionRef<SupportingDocumentPurposeEnum>>(null);

  useEffect(() => {
    if (isFirstMount && finalized) {
      const collection = supportingDocumentCollectionRef.current;
      if (isNotNullish(collection) && !collection.areAllRequiredDocumentsFilled()) {
        showError(true);
      }
    }
  }, [isFirstMount, finalized]);

  const onPressPrevious = () => {
    Router.push(previousStep, { onboardingId });
  };

  const goToNextStep = () => {
    Router.push("Finalize", { onboardingId });
  };

  const MAX_VALIDATION_ATTEMPTS = 3;

  const validateDocuments = (attempt = 1): void => {
    forceUpdateCompanyOnboarding({ input: { onboardingId }, language: locale.language })
      .mapOk(data => data.updatePublicCompanyAccountHolderOnboarding)
      .mapOkToResult(filterRejectionsToResult)
      .tapOk(data => {
        const errors = extractServerInvalidFields(data.onboarding.statusInfo, field =>
          match(field)
            .with(
              P.when(f => f.includes("supportingDocumentCollection")),
              () => "document",
            )
            .otherwise(() => null),
        );
        if (errors.length === 0) {
          goToNextStep();
        } else if (attempt < MAX_VALIDATION_ATTEMPTS) {
          Future.wait(attempt * 3000).onResolve(() => validateDocuments(attempt + 1)); // Retry after 3s, then 6s, 9s, then show an error
        } else {
          showToast({
            variant: "error",
            title: t("error.generic"),
            description: t("error.tryAgain"),
          });
          showLoader(false);
        }
      })
      .tapError(error => {
        showToast({ variant: "error", error, ...getUpdateOnboardingError(error) });
        showLoader(false);
      });
  };

  const onPressNext = () => {
    const collection = supportingDocumentCollectionRef.current;
    if (collection == null) {
      return;
    }
    if (collection.areAllRequiredDocumentsFilled()) {
      showLoader(true);
      validateDocuments();
    } else {
      showError(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
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

              {error && (
                <>
                  <LakeAlert
                    variant="error"
                    title={
                      requiredDocumentsPurposes.length > 1
                        ? t("company.step.ownership.error.missingDocuments")
                        : t("company.step.ownership.error.missingDocument")
                    }
                  />
                  <Space height={small ? 24 : 32} />
                </>
              )}

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

      <OnboardingFooter
        onPrevious={onPressPrevious}
        onNext={onPressNext}
        loading={loader || uploadResult.isLoading()}
      />
    </>
  );
};
