import { ErrorBoundary } from "@swan-io/lake/src/components/ErrorBoundary";
import { LoadingView } from "@swan-io/lake/src/components/LoadingView";
import { colors } from "@swan-io/lake/src/constants/design";
import { Suspense } from "react";
import { match } from "ts-pattern";
import { Provider as ClientProvider } from "urql";
import { ErrorView } from "./components/ErrorView";
import { PaymentArea } from "./components/PaymentArea";
import { NotFoundPage } from "./pages/NotFoundPage";
import { logFrontendError } from "./utils/logger";
import { Router } from "./utils/routes";
import { unauthenticatedClient } from "./utils/urql";

export const App = () => {
  const route = Router.useRoute(["PaymentArea"]);

  return (
    <ErrorBoundary
      onError={error => logFrontendError(error)}
      fallback={({ error }) => <ErrorView error={error} />}
    >
      <Suspense fallback={<LoadingView color={colors.gray[100]} />}>
        <ClientProvider value={unauthenticatedClient}>
          {match(route)
            .with({ name: "PaymentArea" }, ({ params: { paymentLinkId } }) => (
              <PaymentArea paymentLinkId={paymentLinkId} />
            ))
            .otherwise(() => (
              <NotFoundPage />
            ))}
        </ClientProvider>
      </Suspense>
    </ErrorBoundary>
  );
};
