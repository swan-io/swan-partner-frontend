import { AsyncData, Result } from "@swan-io/boxed";
import { ClientContext, useDeferredQuery, useMutation } from "@swan-io/graphql-client";
import { ErrorBoundary } from "@swan-io/lake/src/components/ErrorBoundary";
import { LoadingView } from "@swan-io/lake/src/components/LoadingView";
import { WithPartnerAccentColor } from "@swan-io/lake/src/components/WithPartnerAccentColor";
import { colors, invariantColors } from "@swan-io/lake/src/constants/design";
import { ToastStack } from "@swan-io/shared-business/src/components/ToastStack";
import { useEffect } from "react";
import { P, match } from "ts-pattern";
import { ErrorView } from "./components/ErrorView";
import { Redirect } from "./components/Redirect";
import { SupportingDocumentCollectionFlow } from "./components/SupportingDocumentCollectionFlow";
import {
  GetPublicCompamyInfoRegistryDataDocument,
  GetPublicOnboardingDocument,
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
import { updateTgglContext, useTgglFlag } from "./utils/tggl";

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
  useEffect(() => {
    updateTgglContext({ accountCountry });
  }, [accountCountry]);

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
  const [companyRegistryData, { query: queryCompanyRegistryData }] = useDeferredQuery(
    GetPublicCompamyInfoRegistryDataDocument,
  );
  const [updateIndividualOnboarding, individualOnboardingUpdate] = useMutation(
    UpdatePublicIndividualAccountHolderOnboardingDocument,
  );
  const [updateCompanyOnboarding, companyOnboardingUpdate] = useMutation(
    UpdatePublicCompanyAccountHolderOnboardingDocument,
  );

  const addAccountAdminData = () => {
    updateCompanyOnboarding({
      input: {
        onboardingId,
        accountAdmin: {
          nationality: "FRA",
          firstName: "John",
          lastName: "Doe",
        },
      },
    });
  };

  const addCompanyData = () => {
    return match(companyRegistryData)
      .with(AsyncData.P.NotAsked, AsyncData.P.Loading, () => null)
      .with(AsyncData.P.Done(Result.P.Error(P.select())), () => null)
      .with(AsyncData.P.Done(Result.P.Ok(P.select())), ({ publicCompanyInfoRegistryData }) => {
        match(publicCompanyInfoRegistryData)
          .with(
            { __typename: "PublicCompanyInfoRegistryDataSuccessPayload" },
            ({ companyInfo }) => {
              const { __typename, legalForm, address, ...company } = companyInfo;
              updateCompanyOnboarding({
                input: {
                  onboardingId,
                  company,
                },
              });
            },
          )
          .otherwise(() => {});
      })
      .exhaustive();
  };

  const fetchCompanyRegistryData = () => {
    queryCompanyRegistryData({
      input: { registrationNumber: "853827103", residencyAddressCountry: "FRA" },
    });
  };

  const refreshData = () => {
    query({ id: onboardingId });
  };

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
                  .otherwise(() => (
                    <ErrorView />
                  ))}
                <div>
                  <h1>Debug tool:</h1>
                  <ul>
                    <li>Id: {onboarding.id}</li>
                    <li>Type: {onboarding.__typename}</li>
                    <li>Status: {onboarding.statusInfo.__typename}</li>
                    <li>projectInfo id: {onboarding.projectInfo.id}</li>
                    <li>projectInfo accent: {onboarding.projectInfo.accentColor}</li>
                  </ul>
                  {onboarding.__typename === "CompanyAccountHolderOnboarding" && (
                    <>
                      <button type="button" onClick={() => addCompanyData()}>
                        Add company data
                      </button>
                      <button type="button" onClick={() => fetchCompanyRegistryData()}>
                        Fetch company registry data
                      </button>
                    </>
                  )}
                  <button type="button" onClick={() => addAccountAdminData()}>
                    Add Account admin data
                  </button>

                  <button type="button" onClick={() => refreshData()}>
                    Refresh data
                  </button>
                </div>
              </WithPartnerAccentColor>
            </>
          );
        })
        .otherwise(() => <div>Error onboarding</div>);
    })
    .exhaustive();
};

const FlowPickerWizard = ({ onboardingId }: Props) => {
  const isOnboardingV2 = false; // TODO: Get onboarding version from partner with onboarding id
  return isOnboardingV2 ? (
    <ClientContext.Provider value={partnerClient}>
      <FlowPickerV2 onboardingId={onboardingId} />
    </ClientContext.Provider>
  ) : (
    <FlowPicker onboardingId={onboardingId} />
  );
};

export const App = () => {
  const route = Router.useRoute(["Area", "SupportingDocumentCollectionArea", "ChangeAdminArea"]);
  const displayChangeAccountAdmin = useTgglFlag("changeAccountAdmin").getOr(false);

  return (
    <ErrorBoundary
      key={route?.name}
      onError={error => logFrontendError(error)}
      fallback={() => <ErrorView />}
    >
      <ClientContext.Provider value={client}>
        {match(route)
          .with(
            { name: "SupportingDocumentCollectionArea" },
            ({ params: { supportingDocumentCollectionId } }) => (
              <SupportingDocumentCollectionFlow
                supportingDocumentCollectionId={supportingDocumentCollectionId}
              />
            ),
          )
          .with({ name: "ChangeAdminArea" }, ({ params: { requestId } }) =>
            displayChangeAccountAdmin ? (
              <ChangeAdminWizard changeAdminRequestId={requestId} />
            ) : (
              <NotFoundPage />
            ),
          )
          .with({ name: "Area" }, ({ params: { onboardingId } }) => (
            <FlowPickerWizard onboardingId={onboardingId} />
          ))
          .with(P.nullish, () => <NotFoundPage />)
          .exhaustive()}
      </ClientContext.Provider>

      <ToastStack />
    </ErrorBoundary>
  );
};
