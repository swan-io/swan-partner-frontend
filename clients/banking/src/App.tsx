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
import { ErrorView } from "./components/ErrorView";
import { ProjectRootRedirect } from "./components/ProjectRootRedirect";
import { Redirect } from "./components/Redirect";
import { AuthStatusDocument } from "./graphql/partner";
import { NotFoundPage } from "./pages/NotFoundPage";
import { PopupCallbackPage } from "./pages/PopupCallbackPage";
import { ProjectLoginPage } from "./pages/ProjectLoginPage";
import { partnerClient, unauthenticatedClient } from "./utils/gql";
import { logFrontendError } from "./utils/logger";
import { projectConfiguration } from "./utils/projectId";
import { Router } from "./utils/routes";

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
  ]);
  const [authStatus] = useQuery(AuthStatusDocument, {});

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
          route =>
            isLoggedIn ? (
              match(route)
                .with({ name: "AccountClose" }, ({ params: { accountId, resourceId, status } }) => (
                  <AccountClose accountId={accountId} resourceId={resourceId} status={status} />
                ))
                .with({ name: "AccountArea" }, ({ params: { accountMembershipId } }) => (
                  <AccountMembershipArea accountMembershipId={accountMembershipId} />
                ))
                .with({ name: "ProjectRootRedirect" }, ({ params: { to, source } }) => (
                  <ProjectRootRedirect to={to} source={source} />
                ))
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
  const route = Router.useRoute(["PopupCallback"]);

  return (
    <ErrorBoundary
      key={route?.name}
      onError={error => logFrontendError(error)}
      fallback={() => <ErrorView style={styles.base} />}
    >
      {match(route)
        // The callback page is agnostic as to the current authentication,
        // meaning we don't check if the user is logged in when on this path
        .with({ name: "PopupCallback" }, ({ params: { redirectTo } }) => (
          <PopupCallbackPage redirectTo={redirectTo} />
        ))
        .otherwise(() => (
          // The auth check requires a GraphQL client
          <ClientContext.Provider value={partnerClient}>
            <AppContainer />
            <ToastStack />
          </ClientContext.Provider>
        ))}

      <ToastStack />
    </ErrorBoundary>
  );
};
