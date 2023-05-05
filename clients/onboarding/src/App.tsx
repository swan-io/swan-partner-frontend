import { ErrorBoundary } from "@sentry/react";
import { LoadingView } from "@swan-io/lake/src/components/LoadingView";
import { ToastStack } from "@swan-io/lake/src/components/ToastStack";
import { WithPartnerAccentColor } from "@swan-io/lake/src/components/WithPartnerAccentColor";
import { colors, defaultAccentColor } from "@swan-io/lake/src/constants/colors";
import { Suspense } from "react";
import { P, match } from "ts-pattern";
import { Provider as ClientProvider } from "urql";
import { ErrorView } from "./components/ErrorView";
import { Redirect } from "./components/Redirect";
import { GetOnboardingDocument } from "./graphql/unauthenticated";
import { useTitle } from "./hooks/useTitle";
import { NotFoundPage } from "./pages/NotFoundPage";
import { PopupCallbackPage } from "./pages/PopupCallbackPage";
import { OnboardingCompanyWizard } from "./pages/v2company/CompanyOnboardingWizard";
import { OnboardingIndividualWizard } from "./pages/v2individual/OnboardingIndividualWizard";
import { env } from "./utils/env";
import { locale } from "./utils/i18n";
import { Router } from "./utils/routes";
import { unauthenticatedClient, useQueryWithErrorBoundary } from "./utils/urql";

type Props = {
  onboardingId: string;
};

const FlowPicker = ({ onboardingId }: Props) => {
  const [{ data }] = useQueryWithErrorBoundary({
    query: GetOnboardingDocument,
    variables: { id: onboardingId, language: locale.language },
  });

  const onboarding = data.onboardingInfo;
  const project = onboarding?.projectInfo;
  const projectColor = project?.accentColor ?? defaultAccentColor;
  const holder = onboarding?.info;

  useTitle((project?.name ?? "Swan") + " onboarding");

  if (onboarding == null) {
    return <ErrorView />;
  }

  // In case of the user returns to an already completed onboarding (back navigator, or a bookmarked one)
  if (onboarding.onboardingState === "Completed") {
    const oAuthRedirect = onboarding.oAuthRedirectParameters?.redirectUrl?.trim() ?? "";

    // By order of priority
    if (oAuthRedirect !== "") {
      return <Redirect to={oAuthRedirect} />;
    }

    if (onboarding.redirectUrl.trim()) {
      return <Redirect to={onboarding.redirectUrl.trim()} />;
    }

    // Default cases, same behavior as PopupCallbackPage
    return <Redirect to={`${env.BANKING_URL}?source=onboarding`} />;
  }

  return (
    <WithPartnerAccentColor color={projectColor}>
      {match(holder)
        .with({ __typename: "OnboardingIndividualAccountHolderInfo" }, holder => (
          <OnboardingIndividualWizard
            onboarding={onboarding}
            onboardingId={onboardingId}
            holder={holder}
          />
        ))
        .with({ __typename: "OnboardingCompanyAccountHolderInfo" }, holder => (
          <OnboardingCompanyWizard
            onboarding={onboarding}
            onboardingId={onboardingId}
            holder={holder}
          />
        ))
        .otherwise(() => (
          <ErrorView />
        ))}
    </WithPartnerAccentColor>
  );
};

export const App = () => {
  const route = Router.useRoute(["OnboardingArea", "PopupCallback"]);

  return (
    <ErrorBoundary key={route?.name} fallback={({ error }) => <ErrorView error={error} />}>
      <Suspense fallback={<LoadingView color={colors.gray[50]} />}>
        <ClientProvider value={unauthenticatedClient}>
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
            .with({ name: "OnboardingArea" }, ({ params: { onboardingId } }) => (
              <FlowPicker onboardingId={onboardingId} />
            ))
            .with(P.nullish, () => <NotFoundPage />)
            .exhaustive()}
        </ClientProvider>
      </Suspense>

      <ToastStack />
    </ErrorBoundary>
  );
};
