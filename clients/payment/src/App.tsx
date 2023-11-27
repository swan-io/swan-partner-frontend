import { AsyncData, Result } from "@swan-io/boxed";
import { ErrorBoundary } from "@swan-io/lake/src/components/ErrorBoundary";
import { LoadingView } from "@swan-io/lake/src/components/LoadingView";
import { colors } from "@swan-io/lake/src/constants/design";
import { useUrqlQuery } from "@swan-io/lake/src/hooks/useUrqlQuery";
import { isNullishOrEmpty } from "@swan-io/lake/src/utils/nullish";
import { Suspense } from "react";
import { StyleSheet } from "react-native";
import { P, match } from "ts-pattern";
import { Provider as ClientProvider } from "urql";
import { ErrorView } from "./components/ErrorView";
import { GetMerchantPaymentLinkDocument } from "./graphql/unauthenticated";
import { NotFoundPage } from "./pages/NotFoundPage";
import { PaymentPage } from "./pages/PaymentPage";
import { SuccessPage } from "./pages/SuccessPage";
import { logFrontendError } from "./utils/logger";
import { Router } from "./utils/routes";
import { unauthenticatedClient } from "./utils/urql";

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.gray[50],
    flexGrow: 1,
  },
});

const UnauthenticatedClient = () => {
  const route = Router.useRoute(["Form", "Success"]);
  const paymentLinkId = route?.params.paymentLinkId;

  const { data } = useUrqlQuery(
    {
      query: GetMerchantPaymentLinkDocument,
      pause: isNullishOrEmpty(paymentLinkId),
      variables: {
        paymentLinkId: paymentLinkId ?? "",
      },
    },
    [],
  );

  return match(data)
    .with(AsyncData.P.NotAsked, () => null)
    .with(AsyncData.P.Loading, () => <LoadingView color={colors.gray[400]} style={styles.base} />)

    .with(
      AsyncData.P.Done(Result.P.Ok({ merchantPaymentLink: P.select() })),
      merchantPaymentLink => {
        return merchantPaymentLink == null ? (
          <NotFoundPage />
        ) : (
          <>
            {match(route)
              .with({ name: "Form" }, () => <PaymentPage paymentLink={merchantPaymentLink} />)
              .with({ name: "Success" }, () => (
                <SuccessPage redirectUrl={merchantPaymentLink.redirectUrl} />
              ))
              .otherwise(() => (
                <NotFoundPage />
              ))}
          </>
        );
      },
    )
    .otherwise(() => <ErrorView />);
};

export const App = () => (
  <ErrorBoundary
    onError={error => logFrontendError(error)}
    fallback={({ error }) => <ErrorView error={error} />}
  >
    <Suspense fallback={<LoadingView color={colors.gray[100]} />}>
      <ClientProvider value={unauthenticatedClient}>
        <UnauthenticatedClient />
      </ClientProvider>
    </Suspense>
  </ErrorBoundary>
);
