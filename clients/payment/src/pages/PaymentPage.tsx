import { AsyncData, Result } from "@swan-io/boxed";
import { LoadingView } from "@swan-io/lake/src/components/LoadingView";
import { colors } from "@swan-io/lake/src/constants/design";
import { useUrqlQuery } from "@swan-io/lake/src/hooks/useUrqlQuery";
import { StyleSheet } from "react-native";
import { P, match } from "ts-pattern";
import { ErrorView } from "../components/ErrorView";
import { PaymentForm } from "../components/PaymentForm";
import { GetMerchantPaymentLinkDocument } from "../graphql/unauthenticated";
import { NotFoundPage } from "./NotFoundPage";

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.gray[50],
    flexGrow: 1,
  },
});

export const PaymentPage = () => {
  const { data } = useUrqlQuery(
    {
      query: GetMerchantPaymentLinkDocument,
      variables: { paymentLinkId: "test" },
    },
    [],
  );

  return (
    <>
      {match(data)
        .with(AsyncData.P.NotAsked, () => null)
        .with(AsyncData.P.Loading, () => (
          <LoadingView color={colors.gray[400]} style={styles.base} />
        ))

        .with(
          AsyncData.P.Done(Result.P.Ok({ merchantPaymentLink: P.select() })),
          merchantPaymentLink => {
            return merchantPaymentLink == null ? (
              <NotFoundPage />
            ) : (
              <PaymentForm paymentLink={merchantPaymentLink} />
            );
          },
        )
        .otherwise(() => (
          <ErrorView />
        ))}
    </>
  );
};
