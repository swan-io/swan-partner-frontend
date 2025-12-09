import { AsyncData } from "@swan-io/boxed";
import { getLocation } from "@swan-io/chicane";
import { ClientContext, useQuery } from "@swan-io/graphql-client";
import { ErrorBoundary } from "@swan-io/lake/src/components/ErrorBoundary";
import { colors } from "@swan-io/lake/src/constants/design";
import { isNotNullishOrEmpty } from "@swan-io/lake/src/utils/nullish";
import { ToastStack } from "@swan-io/shared-business/src/components/ToastStack";
import { StyleSheet } from "react-native";
import { P, match } from "ts-pattern";
import { AccountClose } from "./components/AccountClose";
import { AccountMembershipArea } from "./components/AccountMembershipArea";
import { AddReceivedSepaDirectDebitB2bMandate } from "./components/AddReceivedSepaDirectDebitB2bMandate";
import { CreditLimitRequest } from "./components/CreditLimitRequest";
import { ErrorView } from "./components/ErrorView";
import { ProjectRootRedirect } from "./components/ProjectRootRedirect";
import { Redirect } from "./components/Redirect";
import { VerificationRenewalArea } from "./components/VerificationRenewal/VerificationRenewalArea";
import { AuthStatusDocument } from "./graphql/partner";
import { NotFoundPage } from "./pages/NotFoundPage";
import { ProjectLoginPage } from "./pages/ProjectLoginPage";
import { partnerClient, unauthenticatedClient } from "./utils/gql";
import { logFrontendError } from "./utils/logger";
import { projectConfiguration } from "./utils/projectId";
import { Router } from "./utils/routes";
import { useTgglFlag } from "./utils/tggl";

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.gray[50],
    flexGrow: 1,
  },
});

const AppContainer = () => {
  const route = Router.useRoute([
    "ProjectLogin",
    "ProjectRootRedirect",
    "AccountArea",
    "AccountClose",
    "CreditLimitRequest",
    "AddReceivedSepaDirectDebitB2bMandate",
    "VerificationRenewalArea",
  ]);
  const [authStatus] = useQuery(AuthStatusDocument, {});

  // Feature flag used only during deferred debit card development
  // Should be removed once the feature is fully developed
  const showDeferredDebitCard = useTgglFlag("deferredDebitCard").getOr(false);
  const showReKYC = useTgglFlag("reKYCFrontend").getOr(false);

  const loginInfo = authStatus
    .mapOk(data => data.user?.id != null)
    .map(result => ({ isLoggedIn: result.getOr(false) }));

  return match(loginInfo)
    .with(AsyncData.P.NotAsked, AsyncData.P.Loading, () => null)
    .with(AsyncData.P.Done(P.select()), ({ isLoggedIn }) => {
      return match(route)
        .with({ name: "ProjectLogin" }, ({ params: { sessionExpired, redirectTo } }) =>
          projectConfiguration.match({
            None: () => <ErrorView />,
            Some: ({ projectId }) =>
              isLoggedIn ? (
                // Skip login and redirect to the root URL
                <Redirect to={Router.ProjectRootRedirect()} />
              ) : (
                <ClientContext.Provider value={unauthenticatedClient}>
                  <ProjectLoginPage
                    projectId={projectId}
                    sessionExpired={isNotNullishOrEmpty(sessionExpired)}
                    redirectTo={redirectTo}
                  />
                </ClientContext.Provider>
              ),
          }),
        )
        .with(
          { name: "AccountArea" },
          { name: "ProjectRootRedirect" },
          { name: "AccountClose" },
          { name: "CreditLimitRequest" },
          { name: "AddReceivedSepaDirectDebitB2bMandate" },
          { name: "VerificationRenewalArea" },
          route =>
            isLoggedIn ? (
              match(route)
                .with({ name: "AccountClose" }, ({ params: { accountId, resourceId, status } }) => (
                  <AccountClose accountId={accountId} resourceId={resourceId} status={status} />
                ))
                .with(
                  { name: "CreditLimitRequest" },
                  ({ params: { accountId, from, requestAgain } }) =>
                    showDeferredDebitCard ? (
                      <CreditLimitRequest
                        accountId={accountId}
                        from={from}
                        requestAgain={requestAgain === "true"}
                      />
                    ) : (
                      <Redirect to={Router.ProjectRootRedirect()} />
                    ),
                )
                .with(
                  { name: "AddReceivedSepaDirectDebitB2bMandate" },
                  ({ params: { accountId, resourceId, status } }) => (
                    <AddReceivedSepaDirectDebitB2bMandate
                      accountId={accountId}
                      resourceId={resourceId}
                      status={status}
                    />
                  ),
                )
                .with({ name: "AccountArea" }, ({ params: { accountMembershipId } }) => (
                  <AccountMembershipArea accountMembershipId={accountMembershipId} />
                ))
                .with({ name: "ProjectRootRedirect" }, ({ params: { to, source } }) => (
                  <ProjectRootRedirect to={to} source={source} />
                ))
                .with(
                  { name: "VerificationRenewalArea" },
                  ({ params: { verificationRenewalId } }) =>
                    showReKYC ? (
                      <VerificationRenewalArea verificationRenewalId={verificationRenewalId} />
                    ) : (
                      <Redirect to={Router.ProjectRootRedirect()} />
                    ),
                )
                .with(P.nullish, () => <NotFoundPage />)
                .exhaustive()
            ) : (
              <Redirect to={Router.ProjectLogin({ redirectTo: getLocation().toString() })} />
            ),
        )
        .with(P.nullish, () => <NotFoundPage style={styles.base} />)
        .exhaustive();
    })
    .exhaustive();
};

export const App = () => {
  return (
    <ErrorBoundary
      onError={error => logFrontendError(error)}
      fallback={() => <ErrorView style={styles.base} />}
    >
      <ClientContext.Provider value={partnerClient}>
        <AppContainer />
        <ToastStack />
      </ClientContext.Provider>
      <ToastStack />
    </ErrorBoundary>
  );
};
