import { AsyncData, Option, Result } from "@swan-io/boxed";
import { ErrorBoundary } from "@swan-io/lake/src/components/ErrorBoundary";
import { LoadingView } from "@swan-io/lake/src/components/LoadingView";
import { ToastStack } from "@swan-io/lake/src/components/ToastStack";
import { WithPartnerAccentColor } from "@swan-io/lake/src/components/WithPartnerAccentColor";
import { colors, invariantColors } from "@swan-io/lake/src/constants/design";
import { useBoolean } from "@swan-io/lake/src/hooks/useBoolean";
import { useUrqlMutation } from "@swan-io/lake/src/hooks/useUrqlMutation";
import { useUrqlQuery } from "@swan-io/lake/src/hooks/useUrqlQuery";
import { useEffect } from "react";
import { P, match } from "ts-pattern";
import { Provider as ClientProvider } from "urql";
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
import { locale } from "./utils/i18n";
import { logFrontendError } from "./utils/logger";
import { TrackingProvider, useSessionTracking } from "./utils/matomo";
import { Router } from "./utils/routes";
import { updateTgglContext } from "./utils/tggl";
import { unauthenticatedClient } from "./utils/urql";

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
  const { data } = useUrqlQuery({
    query: GetOnboardingDocument,
    variables: { id: onboardingId, language: locale.language },
  });

  const [isReadyToRender, setIsReadyToRender] = useBoolean(false);

  const onboardingInfo = data
    .toOption()
    .flatMap(data => data.toOption())
    .flatMap(({ onboardingInfo }) => Option.fromNullable(onboardingInfo));

  const accountHolderType = onboardingInfo
    .map(onboardingInfo => onboardingInfo.info.__typename)
    .toUndefined();
  const onboardingLanguage = onboardingInfo
    .flatMap(onboardingInfo => Option.fromNullable(onboardingInfo.language))
    .toUndefined();

  const [, updateIndividualOnboarding] = useUrqlMutation(UpdateIndividualOnboardingDocument);
  const [, updateCompanyOnboarding] = useUrqlMutation(UpdateCompanyOnboardingDocument);

  // Set the onboarding language based on the browser locale
  // We do this here to avoid having the loader jump
  useEffect(() => {
    // Already tried updating, if the language is still not matching, don't retry
    if (isReadyToRender) {
      return;
    }

    // Bail out if the onboarding language is already matching the browser one
    if (onboardingLanguage === locale.language) {
      setIsReadyToRender.on();
      return;
    }

    if (accountHolderType != null) {
      const languageUpdate = match(accountHolderType)
        .with("OnboardingCompanyAccountHolderInfo", () =>
          updateCompanyOnboarding({
            input: { onboardingId, language: locale.language },
            language: locale.language,
          }).tap(() => setIsReadyToRender.on()),
        )
        .with("OnboardingIndividualAccountHolderInfo", () =>
          updateIndividualOnboarding({
            input: { onboardingId, language: locale.language },
            language: locale.language,
          }).tap(() => setIsReadyToRender.on()),
        )
        .exhaustive();

      return () => languageUpdate.cancel();
    }
  }, [
    onboardingId,
    accountHolderType,
    onboardingLanguage,
    updateIndividualOnboarding,
    updateCompanyOnboarding,
    setIsReadyToRender,
    isReadyToRender,
  ]);

  return match(isReadyToRender ? data : AsyncData.Loading())
    .with(AsyncData.P.NotAsked, AsyncData.P.Loading, () => <LoadingView color={colors.gray[400]} />)
    .with(AsyncData.P.Done(Result.P.Error(P.select())), error => <ErrorView error={error} />)
    .with(AsyncData.P.Done(Result.P.Ok(P.select())), data => {
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
      fallback={({ error }) => <ErrorView error={error} />}
    >
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
          .with({ name: "Area" }, ({ params: { onboardingId } }) => (
            <FlowPicker onboardingId={onboardingId} />
          ))
          .with(P.nullish, () => <NotFoundPage />)
          .exhaustive()}
      </ClientProvider>

      <ToastStack />
    </ErrorBoundary>
  );
};
