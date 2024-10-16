import { ClientContext } from "@swan-io/graphql-client";
import { ErrorBoundary } from "@swan-io/lake/src/components/ErrorBoundary";
import { LoadingView } from "@swan-io/lake/src/components/LoadingView";
import { ToastStack } from "@swan-io/lake/src/components/ToastStack";
import { colors } from "@swan-io/lake/src/constants/design";
import { Suspense } from "react";
import { match } from "ts-pattern";
import { ErrorView } from "./components/ErrorView";
import { PaymentArea } from "./components/PaymentArea";
import { Preview } from "./components/Preview";
import { NotFoundPage } from "./pages/NotFoundPage";
import { client } from "./utils/gql";
import { logFrontendError } from "./utils/logger";
import { Router } from "./utils/routes";

export const App = () => {
  const route = Router.useRoute(["PaymentArea", "Preview"]);

  return (
    <ErrorBoundary onError={error => logFrontendError(error)} fallback={() => <ErrorView />}>
      <Suspense fallback={<LoadingView color={colors.gray[100]} />}>
        <ClientContext.Provider value={client}>
          {match(route)
            .with({ name: "PaymentArea" }, ({ params: { paymentLinkId } }) => (
              <PaymentArea paymentLinkId={paymentLinkId} />
            ))
            .with(
              { name: "Preview" },
              ({
                params: {
                  accentColor,
                  amount,
                  card,
                  currency,
                  label,
                  logo,
                  sepaDirectDebit,
                  merchantName,
                },
              }) => (
                <Preview
                  accentColor={accentColor}
                  amount={amount}
                  card={card}
                  currency={currency}
                  label={label}
                  logo={logo}
                  sepaDirectDebit={sepaDirectDebit}
                  merchantName={merchantName}
                />
              ),
            )
            .otherwise(() => (
              <NotFoundPage />
            ))}

          <ToastStack />
        </ClientContext.Provider>
      </Suspense>
    </ErrorBoundary>
  );
};
