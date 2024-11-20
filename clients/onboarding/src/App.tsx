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
import { AccountCountry } from "./graphql/unauthenticated";
import { useTitle } from "./hooks/useTitle";
import { UpdateCompanyOnboardingMutation } from "./mutations/UpdateCompanyOnboardingMutation";
import { UpdateIndividualOnboardingMutation } from "./mutations/UpdateIndividualOnboardingMutation";
import { NotFoundPage } from "./pages/NotFoundPage";
import { PopupCallbackPage } from "./pages/PopupCallbackPage";
import {
  CompanyAccountHolderInfoFragment,
  CompanyOnboardingInfoFragment,
  OnboardingCompanyWizard,
} from "./pages/company/CompanyOnboardingWizard";
import {
  IndividualAccountHolderInfoFragment,
  IndividualOnboardingInfoFragment,
  OnboardingIndividualWizard,
} from "./pages/individual/OnboardingIndividualWizard";
import { env } from "./utils/env";
import { client, graphql } from "./utils/gql";
import { locale } from "./utils/i18n";
import { logFrontendError } from "./utils/logger";
import { TrackingProvider, useSessionTracking } from "./utils/matomo";
import { Router } from "./utils/routes";
import { updateTgglContext } from "./utils/tggl";

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

const OnboardingInfoQuery = graphql(
  `
    query OnboardingInfo($id: ID!, $language: String!) {
      onboardingInfo(id: $id) {
        id
        accountCountry
        language
        onboardingState
        oAuthRedirectParameters {
          redirectUrl
        }
        redirectUrl
        projectInfo {
          id
          accentColor
          name
        }
        ...CompanyOnboardingInfo
        ...IndividualOnboardingInfo
        info {
          __typename
          ... on OnboardingCompanyAccountHolderInfo {
            ...CompanyAccountHolderInfo
          }
          ... on OnboardingIndividualAccountHolderInfo {
            ...IndividualAccountHolderInfo
          }
        }
      }
    }
  `,
  [
    CompanyAccountHolderInfoFragment,
    CompanyOnboardingInfoFragment,
    IndividualAccountHolderInfoFragment,
    IndividualOnboardingInfoFragment,
  ],
);

const FlowPicker = ({ onboardingId }: Props) => {
  const [data, { query }] = useDeferredQuery(OnboardingInfoQuery);

  const [updateIndividualOnboarding, individualOnboardingUpdate] = useMutation(
    UpdateIndividualOnboardingMutation,
  );
  const [updateCompanyOnboarding, companyOnboardingUpdate] = useMutation(
    UpdateCompanyOnboardingMutation,
  );

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

  if (companyOnboardingUpdate.isLoading() || individualOnboardingUpdate.isLoading()) {
    return <LoadingView color={colors.gray[400]} />;
  }

  return match(data)
    .with(AsyncData.P.NotAsked, () => <LoadingView color={colors.gray[400]} />)
    .with(AsyncData.P.Loading, () => <LoadingView color={colors.gray[400]} />)
    .with(AsyncData.P.Done(Result.P.Error(P.select())), error => <ErrorView error={error} />)
    .with(AsyncData.P.Done(Result.P.Ok(P.select())), ({ onboardingInfo }) => {
      if (onboardingInfo == null) {
        return <ErrorView />;
      }
      const accountCountry = onboardingInfo.accountCountry ?? undefined;
      const projectInfo = onboardingInfo.projectInfo;
      const accountHolder = onboardingInfo.info;

      // In case of the user returns to an already completed onboarding (back navigator, or a bookmarked one)
      if (onboardingInfo.onboardingState === "Completed") {
        const oAuthRedirect = onboardingInfo.oAuthRedirectParameters?.redirectUrl?.trim() ?? "";

        // By order of priority
        if (oAuthRedirect !== "") {
          return <Redirect to={oAuthRedirect} />;
        }

        if (onboardingInfo.redirectUrl.trim()) {
          return <Redirect to={onboardingInfo.redirectUrl.trim()} />;
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

          <WithPartnerAccentColor
            color={projectInfo?.accentColor ?? invariantColors.defaultAccentColor}
          >
            {match(accountHolder)
              .with(
                { __typename: "OnboardingIndividualAccountHolderInfo" },
                individualAccountHolderInfo => (
                  <TrackingProvider category="Individual">
                    <OnboardingIndividualWizard
                      onboardingInfoData={onboardingInfo}
                      individualAccountHolderInfoData={individualAccountHolderInfo}
                    />
                  </TrackingProvider>
                ),
              )
              .with({ __typename: "OnboardingCompanyAccountHolderInfo" }, companyAccountHolder => (
                <TrackingProvider category="Company">
                  <OnboardingCompanyWizard
                    onboardingInfoData={onboardingInfo}
                    companyAccountHolderData={companyAccountHolder}
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

export const App = () => {
  const route = Router.useRoute(["Area", "SupportingDocumentCollectionArea", "PopupCallback"]);

  return (
    <ErrorBoundary
      key={route?.name}
      onError={error => logFrontendError(error)}
      fallback={() => <ErrorView />}
    >
      <ClientContext.Provider value={client}>
        {match(route)
          .with(
            { name: "PopupCallback" },
            ({ params: { redirectUrl, accountMembershipId, projectId } }) => (
              <PopupCallbackPage
                redirectUrl={redirectUrl}
                accountMembershipId={accountMembershipId}
                projectId={projectId}
              />
            ),
          )
          .with(
            { name: "SupportingDocumentCollectionArea" },
            ({ params: { supportingDocumentCollectionId } }) => (
              <SupportingDocumentCollectionFlow
                supportingDocumentCollectionId={supportingDocumentCollectionId}
              />
            ),
          )
          .with({ name: "Area" }, ({ params: { onboardingId } }) => (
            <FlowPicker onboardingId={onboardingId} />
          ))
          .with(P.nullish, () => <NotFoundPage />)
          .exhaustive()}
      </ClientContext.Provider>

      <ToastStack />
    </ErrorBoundary>
  );
};
