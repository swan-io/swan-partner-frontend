import { ErrorBoundary } from "@swan-io/lake/src/components/ErrorBoundary";
import { LoadingView } from "@swan-io/lake/src/components/LoadingView";
import { colors } from "@swan-io/lake/src/constants/design";
import { Suspense } from "react";
import { P, match } from "ts-pattern";
import { Provider as ClientProvider } from "urql";
import { ErrorView } from "./components/ErrorView";
import { PaymentForm } from "./components/PaymentForm";
import { NotFoundPage } from "./pages/NotFoundPage";
import { logFrontendError } from "./utils/logger";
import { Router } from "./utils/routes";
import { unauthenticatedClient } from "./utils/urql";

export const App = () => {
  const route = Router.useRoute(["PaymentLink"]);

  return (
    <ErrorBoundary
      key={route?.name}
      onError={error => logFrontendError(error)}
      fallback={({ error }) => <ErrorView error={error} />}
    >
      <Suspense fallback={<LoadingView color={colors.gray[100]} />}>
        <ClientProvider value={unauthenticatedClient}>
          {match(route)
            .with({ name: "PaymentLink" }, () => <PaymentForm />)
            .with(P.nullish, () => <NotFoundPage />)
            .exhaustive()}
        </ClientProvider>
      </Suspense>
    </ErrorBoundary>
  );
};
