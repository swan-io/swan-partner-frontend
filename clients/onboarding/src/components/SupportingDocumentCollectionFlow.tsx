import { Array, AsyncData, Option, Result } from "@swan-io/boxed";
import { useMutation, useQuery } from "@swan-io/graphql-client";
import { Box } from "@swan-io/lake/src/components/Box";
import { EmptyView } from "@swan-io/lake/src/components/EmptyView";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LoadingView } from "@swan-io/lake/src/components/LoadingView";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { WithPartnerAccentColor } from "@swan-io/lake/src/components/WithPartnerAccentColor";
import { breakpoints, invariantColors } from "@swan-io/lake/src/constants/design";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import {
  Document,
  SupportingDocumentCollection,
  SupportingDocumentCollectionRef,
} from "@swan-io/shared-business/src/components/SupportingDocumentCollection";
import { showToast } from "@swan-io/shared-business/src/state/toasts";
import { SwanFile } from "@swan-io/shared-business/src/utils/SwanFile";
import { ReactNode, useCallback, useRef } from "react";
import { P, match } from "ts-pattern";
import {
  DeleteSupportingDocumentDocument,
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
  const [deleteSupportingDocument] = useMutation(DeleteSupportingDocumentDocument);
  const [
    requestSupportingDocumentCollectionReviewDocument,
    supportingDocumentCollectionReviewDocumentRequest,
  ] = useMutation(RequestSupportingDocumentCollectionReviewDocument);

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

  const onRemoveFile = useCallback(
    (file: SwanFile) => {
      return deleteSupportingDocument({ input: { id: file.id } })
        .mapOk(data => data.deleteSupportingDocument)
        .mapOkToResult(filterRejectionsToResult);
    },
    [deleteSupportingDocument],
  );

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
      showToast({
        variant: "error",
        title: t("supportingDocumentCollection.missingDocuments.title"),
        description: t("supportingDocumentCollection.missingDocuments.description"),
      });
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
                        <EmptyView
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

                            {supportingDocumentCollection.accountHolder.name != null ? (
                              <>
                                <Space height={small ? 12 : 16} />

                                <LakeText>
                                  {t("supportingDocumentCollection.intro", {
                                    accountHolderName:
                                      supportingDocumentCollection.accountHolder.name,
                                  })}
                                </LakeText>
                              </>
                            ) : null}

                            <Space height={small ? 24 : 32} />

                            <DocumentsStepTile small={small}>
                              <SupportingDocumentCollection
                                ref={supportingDocumentCollectionRef}
                                documents={docs}
                                requiredDocumentPurposes={requiredDocumentsPurposes}
                                generateUpload={generateUpload}
                                status={supportingDocumentCollection.statusInfo.status}
                                templateLanguage={locale.language}
                                onRemoveFile={onRemoveFile}
                              />
                            </DocumentsStepTile>
                          </>
                        )}
                      </ResponsiveContainer>

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
