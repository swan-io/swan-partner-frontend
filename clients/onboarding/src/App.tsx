import { AsyncData, Result } from "@swan-io/boxed";
import { ClientContext, useDeferredQuery, useMutation, useQuery } from "@swan-io/graphql-client";
import { ErrorBoundary } from "@swan-io/lake/src/components/ErrorBoundary";
import { LoadingView } from "@swan-io/lake/src/components/LoadingView";
import { WithPartnerAccentColor } from "@swan-io/lake/src/components/WithPartnerAccentColor";
import { colors, invariantColors } from "@swan-io/lake/src/constants/design";
import { ToastStack } from "@swan-io/shared-business/src/components/ToastStack";
import { useEffect } from "react";
import { TgglProvider, useFlag, useTggl } from "react-tggl-client";
import { P, match } from "ts-pattern";
import { ErrorView } from "./components/ErrorView";
import { Redirect } from "./components/Redirect";
import { SupportingDocumentCollectionFlow } from "./components/SupportingDocumentCollectionFlow";
import {
  GetPublicOnboardingDocument,
  GetPublicOnboardingVersionDocument,
  UpdatePublicCompanyAccountHolderOnboardingDocument,
  UpdatePublicIndividualAccountHolderOnboardingDocument,
} from "./graphql/partner";
import {
  AccountCountry,
  GetOnboardingDocument,
  UpdateCompanyOnboardingDocument,
  UpdateIndividualOnboardingDocument,
} from "./graphql/unauthenticated";
import { useTitle } from "./hooks/useTitle";
import { NotFoundPage } from "./pages/NotFoundPage";
import { ChangeAdminWizard } from "./pages/changeAdmin/ChangeAdminWizard";
import { OnboardingCompanyWizard } from "./pages/company/CompanyOnboardingWizard";
import { OnboardingIndividualWizard } from "./pages/individual/OnboardingIndividualWizard";
import { OnboardingIndividualWizard as OnboardingIndividualWizardV2 } from "./pages/v2/individual/OnboardingIndividualWizard";
import { env } from "./utils/env";
import { client, partnerClient } from "./utils/gql";
import { locale } from "./utils/i18n";
import { logFrontendError, registerOnboardingInfo } from "./utils/logger";
import { TrackingProvider, useSessionTracking } from "./utils/matomo";
import { Router } from "./utils/routes";
import { tgglClient } from "./utils/tggl";

type Props = {
  onboardingId: string;
};

const PageMetadata = ({
  accountCountry,
  projectName,
  projectId,
}: {
  accountCountry?: AccountCountry;
  projectName?: string;
  projectId?: string;
}) => {
  const { updateContext } = useTggl();

  useEffect(() => {
    updateContext({ accountCountry });
  }, [updateContext, accountCountry]);

  useTitle((projectName ?? "Swan") + " onboarding");
  useSessionTracking(projectId);

  return null;
};

const FlowPicker = ({ onboardingId }: Props) => {
  const [data, { query }] = useDeferredQuery(GetOnboardingDocument);
  const [updateIndividualOnboarding, individualOnboardingUpdate] = useMutation(
    UpdateIndividualOnboardingDocument,
  );
  const [updateCompanyOnboarding, companyOnboardingUpdate] = useMutation(
    UpdateCompanyOnboardingDocument,
  );

  useEffect(() => {
    match(data)
      .with(AsyncData.P.Done(Result.P.Ok(P.select())), ({ onboardingInfo }) => {
        if (onboardingInfo == null) {
          return;
        }

        const projectId = onboardingInfo.projectInfo?.id;
        const accountCountry = onboardingInfo.accountCountry;
        const onboardingType = match(onboardingInfo.info.__typename)
          .returnType<"Company" | "Individual" | undefined>()
          .with("OnboardingCompanyAccountHolderInfo", () => "Company")
          .with("OnboardingIndividualAccountHolderInfo", () => "Individual")
          .exhaustive(() => undefined);

        if (projectId != null && accountCountry != null && onboardingType != null) {
          registerOnboardingInfo({ accountCountry, projectId, onboardingType });
        }
      })
      .otherwise(() => {});
  }, [data]);

  useEffect(() => {
    const request = query({ id: onboardingId, language: locale.language }).tapOk(
      ({ onboardingInfo }) => {
        if (onboardingInfo?.language === locale.language) {
          return;
        }
        return match(onboardingInfo?.info.__typename)
          .with("OnboardingCompanyAccountHolderInfo", () =>
            updateCompanyOnboarding({
              input: { onboardingId, language: locale.language },
              language: locale.language,
            }),
          )
          .with("OnboardingIndividualAccountHolderInfo", () =>
            updateIndividualOnboarding({
              input: { onboardingId, language: locale.language },
              language: locale.language,
            }),
          )
          .otherwise(() => {});
      },
    );

    return () => request.cancel();
  }, [onboardingId, query, updateCompanyOnboarding, updateIndividualOnboarding]);

  return match({ data, companyOnboardingUpdate, individualOnboardingUpdate })
    .with(
      { data: P.union(AsyncData.P.NotAsked, AsyncData.P.Loading) },
      { companyOnboardingUpdate: AsyncData.P.Loading },
      { individualOnboardingUpdate: AsyncData.P.Loading },
      () => <LoadingView color={colors.gray[400]} />,
    )
    .with({ data: AsyncData.P.Done(Result.P.Error(P.select())) }, error => (
      <ErrorView error={error} />
    ))
    .with({ data: AsyncData.P.Done(Result.P.Ok(P.select())) }, data => {
      const onboardingInfo = data.onboardingInfo;

      if (onboardingInfo == null) {
        return <ErrorView />;
      }

      const accountCountry = onboardingInfo.accountCountry ?? undefined;
      const projectInfo = onboardingInfo.projectInfo;
      const projectColor = projectInfo?.accentColor ?? invariantColors.defaultAccentColor;
      const accountHolder = onboardingInfo.info;

      // In case of the user returns to an already completed onboarding (back navigator, or a bookmarked one)
      if (onboardingInfo.statusInfo.__typename === "OnboardingFinalizedStatusInfo") {
        const oAuthRedirect = onboardingInfo.oAuthRedirectParameters?.redirectUrl?.trim() ?? "";

        // By order of priority
        if (oAuthRedirect !== "") {
          return <Redirect to={oAuthRedirect} />;
        }

        // Default cases, same behavior as PopupCallbackPage
        return <Redirect to={`${env.BANKING_URL}?source=onboarding`} />;
      }

      return (
        <>
          <PageMetadata
            accountCountry={accountCountry}
            projectId={projectInfo?.id}
            projectName={projectInfo?.name}
          />

          <WithPartnerAccentColor color={projectColor}>
            {match(accountHolder)
              .with({ __typename: "OnboardingIndividualAccountHolderInfo" }, holder => (
                <TrackingProvider category="Individual">
                  <OnboardingIndividualWizard
                    onboarding={onboardingInfo}
                    onboardingId={onboardingId}
                    holder={holder}
                  />
                </TrackingProvider>
              ))
              .with({ __typename: "OnboardingCompanyAccountHolderInfo" }, holder => (
                <TrackingProvider category="Company">
                  <OnboardingCompanyWizard
                    onboarding={onboardingInfo}
                    onboardingId={onboardingId}
                    holder={holder}
                  />
                </TrackingProvider>
              ))
              .otherwise(() => (
                <ErrorView />
              ))}
          </WithPartnerAccentColor>
        </>
      );
    })
    .exhaustive();
};

const FlowPickerV2 = ({ onboardingId }: Props) => {
  const [data, { query }] = useDeferredQuery(GetPublicOnboardingDocument);
  const [updateIndividualOnboarding, individualOnboardingUpdate] = useMutation(
    UpdatePublicIndividualAccountHolderOnboardingDocument,
  );
  const [updateCompanyOnboarding, companyOnboardingUpdate] = useMutation(
    UpdatePublicCompanyAccountHolderOnboardingDocument,
  );

  useEffect(() => {
    const request = query({ id: onboardingId }).tapOk(({ publicAccountHolderOnboarding }) => {
      match(publicAccountHolderOnboarding)
        .with({ __typename: "PublicAccountHolderOnboardingSuccessPayload" }, ({ onboarding }) => {
          if (onboarding.accountAdmin?.preferredLanguage === locale.language) {
            return;
          }
          return match(onboarding.__typename)
            .with("CompanyAccountHolderOnboarding", () =>
              updateCompanyOnboarding({
                input: {
                  onboardingId,
                  accountAdmin: { preferredLanguage: locale.language },
                },
              }),
            )
            .with("IndividualAccountHolderOnboarding", () =>
              updateIndividualOnboarding({
                input: {
                  onboardingId,
                  accountAdmin: { preferredLanguage: locale.language },
                },
              }),
            )
            .otherwise(() => {});
        })
        .otherwise(() => {});

      return publicAccountHolderOnboarding;
    });

    return () => request.cancel();
  }, [onboardingId, query, updateCompanyOnboarding, updateIndividualOnboarding]);

  return match({ data, companyOnboardingUpdate, individualOnboardingUpdate })
    .with(
      { data: P.union(AsyncData.P.NotAsked, AsyncData.P.Loading) },
      { companyOnboardingUpdate: AsyncData.P.Loading },
      { individualOnboardingUpdate: AsyncData.P.Loading },
      () => <LoadingView color={colors.gray[400]} />,
    )
    .with({ data: AsyncData.P.Done(Result.P.Error(P.select())) }, error => (
      <ErrorView error={error} />
    ))
    .with({ data: AsyncData.P.Done(Result.P.Ok(P.select())) }, data => {
      const onboardingInfo = data.publicAccountHolderOnboarding;

      if (onboardingInfo == null) {
        return <ErrorView />;
      }

      return match(onboardingInfo)
        .with({ __typename: "PublicAccountHolderOnboardingSuccessPayload" }, ({ onboarding }) => {
          const accountCountry = onboarding.accountInfo?.country ?? undefined;
          const projectInfo = onboarding.projectInfo;
          const projectColor = projectInfo.accentColor ?? invariantColors.defaultAccentColor;

          return (
            <>
              <PageMetadata
                accountCountry={accountCountry}
                projectId={projectInfo.id}
                projectName={projectInfo.name}
              />
              <WithPartnerAccentColor color={projectColor}>
                {match(onboarding)
                  .with({ __typename: "CompanyAccountHolderOnboarding" }, companyOnboarding => (
                    <h2>todo OnboardingCompanyWizardV2 {companyOnboarding.id}</h2>
                  ))
                  .with(
                    { __typename: "IndividualAccountHolderOnboarding" },
                    individualOnboarding => (
                      <OnboardingIndividualWizardV2 onboarding={individualOnboarding} />
                    ),
                  )
                  .exhaustive()}
              </WithPartnerAccentColor>
            </>
          );
        })
        .otherwise(() => <ErrorView />);
    })
    .exhaustive();
};

const FlowPickerWizard = ({ onboardingId }: Props) => {
  const [data] = useQuery(GetPublicOnboardingVersionDocument, { id: onboardingId });

  const FlowPickerV1 = () => (
    <ClientContext.Provider value={client}>
      <FlowPicker onboardingId={onboardingId} />
    </ClientContext.Provider>
  );

  return match(data)
    .with(AsyncData.P.NotAsked, AsyncData.P.Loading, () => <LoadingView color={colors.gray[400]} />)
    .with(AsyncData.P.Done(Result.P.Error(P.select())), () => {
      // Temporary fallback while the Onboarding V2 is still in development
      return <FlowPickerV1 />;
    })
    .with(AsyncData.P.Done(Result.P.Ok(P.select())), ({ publicAccountHolderOnboarding }) => {
      return match(publicAccountHolderOnboarding)
        .with({ __typename: "PublicAccountHolderOnboardingSuccessPayload" }, ({ onboarding }) => {
          return onboarding.statusInfo.validationVersion === "V2" ? (
            <FlowPickerV2 onboardingId={onboardingId} />
          ) : (
            <FlowPickerV1 />
          );
        })
        .otherwise(() => <ErrorView />);
    })
    .exhaustive();
};

export const Routing = () => {
  const route = Router.useRoute(["Area", "SupportingDocumentCollectionArea", "ChangeAdminArea"]);
  const displayChangeAccountAdmin = useFlag("changeAccountAdmin", false);

  return (
    <ErrorBoundary
      key={route?.name}
      onError={error => logFrontendError(error)}
      fallback={() => <ErrorView />}
    >
      {match(route)
        .with(
          { name: "SupportingDocumentCollectionArea" },
          ({ params: { supportingDocumentCollectionId } }) => (
            <ClientContext.Provider value={client}>
              <SupportingDocumentCollectionFlow
                supportingDocumentCollectionId={supportingDocumentCollectionId}
              />
            </ClientContext.Provider>
          ),
        )
        .with({ name: "ChangeAdminArea" }, ({ params: { requestId } }) =>
          displayChangeAccountAdmin ? (
            <ClientContext.Provider value={partnerClient}>
              <ChangeAdminWizard changeAdminRequestId={requestId} />
            </ClientContext.Provider>
          ) : (
            <NotFoundPage />
          ),
        )
        .with({ name: "Area" }, ({ params: { onboardingId } }) => (
          <ClientContext.Provider value={partnerClient}>
            <FlowPickerWizard onboardingId={onboardingId} />
          </ClientContext.Provider>
        ))
        .with(P.nullish, () => <NotFoundPage />)
        .exhaustive()}
    </ErrorBoundary>
  );
};

export const App = () => {
  return (
    <TgglProvider client={tgglClient}>
      <Routing />
      <ToastStack />
    </TgglProvider>
  );
};
