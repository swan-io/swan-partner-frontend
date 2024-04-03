import { AsyncData, Result } from "@swan-io/boxed";
import { ClientContext, useDeferredQuery, useMutation } from "@swan-io/graphql-client";
import { ErrorBoundary } from "@swan-io/lake/src/components/ErrorBoundary";
import { LoadingView } from "@swan-io/lake/src/components/LoadingView";
import { ToastStack } from "@swan-io/lake/src/components/ToastStack";
import { WithPartnerAccentColor } from "@swan-io/lake/src/components/WithPartnerAccentColor";
import { colors, invariantColors } from "@swan-io/lake/src/constants/design";
import { useEffect } from "react";
import { P, match } from "ts-pattern";
import { ErrorView } from "./components/ErrorView";
import { Redirect } from "./components/Redirect";
import {
  AccountCountry,
  GetOnboardingDocument,
  UpdateCompanyOnboardingDocument,
  UpdateIndividualOnboardingDocument,
} from "./graphql/unauthenticated";
import { useTitle } from "./hooks/useTitle";
import { NotFoundPage } from "./pages/NotFoundPage";
import { PopupCallbackPage } from "./pages/PopupCallbackPage";
import { OnboardingCompanyWizard } from "./pages/company/CompanyOnboardingWizard";
import { OnboardingIndividualWizard } from "./pages/individual/OnboardingIndividualWizard";
import { env } from "./utils/env";
import { client } from "./utils/gql";
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

const FlowPicker = ({ onboardingId }: Props) => {
  const [data, query] = useDeferredQuery(GetOnboardingDocument);
  const [updateIndividualOnboarding, individualOnboardingUpdate] = useMutation(
    UpdateIndividualOnboardingDocument,
  );
  const [updateCompanyOnboarding, companyOnboardingUpdate] = useMutation(
    UpdateCompanyOnboardingDocument,
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
  }, [onboardingId]);

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

export const App = () => {
  const route = Router.useRoute(["Area", "PopupCallback"]);

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
