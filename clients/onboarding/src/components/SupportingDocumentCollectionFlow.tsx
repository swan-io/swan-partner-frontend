import { Array, AsyncData, Option, Result } from "@swan-io/boxed";
import { useMutation, useQuery } from "@swan-io/graphql-client";
import { Box } from "@swan-io/lake/src/components/Box";
import { FixedListViewEmpty } from "@swan-io/lake/src/components/FixedListView";
import { LoadingView } from "@swan-io/lake/src/components/LoadingView";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { WithPartnerAccentColor } from "@swan-io/lake/src/components/WithPartnerAccentColor";
import { breakpoints, invariantColors } from "@swan-io/lake/src/constants/design";
import { useBoolean } from "@swan-io/lake/src/hooks/useBoolean";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { ConfirmModal } from "@swan-io/shared-business/src/components/ConfirmModal";
import {
  Document,
  SupportingDocumentCollection,
  SupportingDocumentCollectionRef,
} from "@swan-io/shared-business/src/components/SupportingDocumentCollection";
import { ReactNode, useRef } from "react";
import { P, match } from "ts-pattern";
import {
  GenerateSupportingDocumentUploadUrlDocument,
  RequestSupportingDocumentCollectionReviewDocument,
  SupportingDocumentCollectionDocument,
  SupportingDocumentPurposeEnum,
} from "../graphql/unauthenticated";
import { NotFoundPage } from "../pages/NotFoundPage";
import { locale, t } from "../utils/i18n";
import { Router } from "../utils/routes";
import { ErrorView } from "./ErrorView";
import { OnboardingFooter } from "./OnboardingFooter";
import { OnboardingHeader } from "./OnboardingHeader";
import { OnboardingStepContent } from "./OnboardingStepContent";
import { StepTitle } from "./StepTitle";
import { SupportingDocumentCollectionSuccessPage } from "./SupportingDocumentCollectionSuccess";

type Props = {
  supportingDocumentCollectionId: string;
};

const DocumentsStepTile = ({ small, children }: { small: boolean; children: ReactNode }) => {
  if (small) {
    return <>{children}</>;
  }
  return <Tile>{children}</Tile>;
};

export const SupportingDocumentCollectionFlow = ({ supportingDocumentCollectionId }: Props) => {
  const route = Router.useRoute([
    "SupportingDocumentCollectionRoot",
    "SupportingDocumentCollectionSuccess",
  ]);
  const [data] = useQuery(SupportingDocumentCollectionDocument, { supportingDocumentCollectionId });

  const [generateSupportingDocumentUploadUrl] = useMutation(
    GenerateSupportingDocumentUploadUrlDocument,
  );
  const [
    requestSupportingDocumentCollectionReviewDocument,
    supportingDocumentCollectionReviewDocumentRequest,
  ] = useMutation(RequestSupportingDocumentCollectionReviewDocument);

  const [showConfirmModal, setShowConfirmModal] = useBoolean(false);

  const supportingDocumentCollectionRef =
    useRef<SupportingDocumentCollectionRef<SupportingDocumentPurposeEnum>>(null);

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

  const onPressNext = ({ force } = { force: false }) => {
    const supportingDocumentCollection = supportingDocumentCollectionRef.current;
    if (supportingDocumentCollection == null) {
      return;
    }
    if (force || supportingDocumentCollection.areAllRequiredDocumentsFilled()) {
      requestSupportingDocumentCollectionReviewDocument({
        input: {
          supportingDocumentCollectionId,
        },
      })
        .mapOk(data => data.requestSupportingDocumentCollectionReview)
        .mapOkToResult(filterRejectionsToResult)
        .tapOk(() => {
          Router.push("SupportingDocumentCollectionSuccess", { supportingDocumentCollectionId });
        });
    } else {
      setShowConfirmModal.on();
    }
  };

  return match(data)
    .with(AsyncData.P.NotAsked, AsyncData.P.Loading, () => <LoadingView />)
    .with(AsyncData.P.Done(Result.P.Error(P.select())), error => <ErrorView error={error} />)
    .with(
      AsyncData.P.Done(
        Result.P.Ok({
          supportingDocumentCollection: P.select(P.nonNullable),
        }),
      ),
      supportingDocumentCollection => {
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
            .with(
              { statusInfo: { __typename: "SupportingDocumentRefusedStatusInfo" } },
              document =>
                requiredPurposes.has(document.supportingDocumentPurpose)
                  ? Option.Some({
                      purpose: document.supportingDocumentPurpose,
                      file: {
                        id: document.id,
                        name: document.statusInfo.filename,
                        statusInfo: { status: "Refused", reason: document.statusInfo.reason },
                      },
                    })
                  : Option.None(),
            )
            .with(
              { statusInfo: { __typename: "SupportingDocumentUploadedStatusInfo" } },
              document =>
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

        const requiredDocumentsPurposes =
          supportingDocumentCollection.requiredSupportingDocumentPurposes.map(
            purpose => purpose.name,
          ) ?? [];

        return (
          <WithPartnerAccentColor
            color={
              supportingDocumentCollection.projectInfo.accentColor ??
              invariantColors.defaultAccentColor
            }
          >
            <>
              {match(supportingDocumentCollection.projectInfo)
                .with({ name: P.string, logoUri: P.string }, ({ name, logoUri }) => (
                  <OnboardingHeader projectName={name} projectLogo={logoUri} />
                ))
                .otherwise(() => null)}

              {match(route)
                .with(Router.P.SupportingDocumentCollectionRoot(P._), () => {
                  if (supportingDocumentCollection.statusInfo.status === "PendingReview") {
                    return (
                      <Box grow={1} alignItems="center" justifyContent="center">
                        <FixedListViewEmpty
                          icon="lake-clock"
                          borderedIcon={true}
                          title={t("supportingDocumentCollection.pendingReview")}
                          subtitle={t("supportingDocumentCollection.pendingReview.subtitle")}
                        />
                      </Box>
                    );
                  }
                  if (supportingDocumentCollection.statusInfo.status !== "WaitingForDocument") {
                    return <NotFoundPage />;
                  }
                  return (
                    <OnboardingStepContent>
                      <ResponsiveContainer breakpoint={breakpoints.medium}>
                        {({ small }) => (
                          <>
                            <StepTitle isMobile={small}>
                              {t("supportingDocumentCollection.title")}
                            </StepTitle>

                            <Space height={small ? 24 : 32} />

                            <DocumentsStepTile small={small}>
                              <SupportingDocumentCollection
                                ref={supportingDocumentCollectionRef}
                                documents={docs}
                                requiredDocumentPurposes={requiredDocumentsPurposes}
                                generateUpload={generateUpload}
                                status={supportingDocumentCollection.statusInfo.status}
                                templateLanguage={locale.language}
                              />
                            </DocumentsStepTile>
                          </>
                        )}
                      </ResponsiveContainer>

                      <ConfirmModal
                        visible={showConfirmModal}
                        title={t("company.step.documents.confirmModal.title")}
                        message={t("company.step.documents.confirmModal.message")}
                        icon="document-regular"
                        confirmText={t("company.step.documents.confirmModal.confirm")}
                        onConfirm={() => onPressNext({ force: true })}
                        loading={supportingDocumentCollectionReviewDocumentRequest.isLoading()}
                        onCancel={setShowConfirmModal.off}
                      />

                      <OnboardingFooter
                        onNext={onPressNext}
                        nextLabel="common.submit"
                        loading={supportingDocumentCollectionReviewDocumentRequest.isLoading()}
                      />
                    </OnboardingStepContent>
                  );
                })
                .with(Router.P.SupportingDocumentCollectionSuccess(P._), () => (
                  <SupportingDocumentCollectionSuccessPage />
                ))
                .with(P.nullish, () => <NotFoundPage />)
                .exhaustive()}
            </>
          </WithPartnerAccentColor>
        );
      },
    )
    .otherwise(() => <NotFoundPage />);
};
