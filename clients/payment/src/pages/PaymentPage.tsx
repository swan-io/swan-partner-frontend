import { AsyncData, Result } from "@swan-io/boxed";
import { LoadingView } from "@swan-io/lake/src/components/LoadingView";
import { colors } from "@swan-io/lake/src/constants/design";
import { useUrqlQuery } from "@swan-io/lake/src/hooks/useUrqlQuery";
import { StyleSheet } from "react-native";
import { P, match } from "ts-pattern";
import { ErrorView } from "../components/ErrorView";
import { PaymentForm } from "../components/PaymentForm";
import { GetMerchantPaymentLinkDocument } from "../graphql/unauthenticated";
import { Router } from "../utils/routes";
import { NotFoundPage } from "./NotFoundPage";
import { SuccessPage } from "./SuccessPage";

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.gray[50],
    flexGrow: 1,
  },
});

type Props = {
  paymentLinkId: string;
};

export const PaymentPage = ({ paymentLinkId }: Props) => {
  const { data } = useUrqlQuery(
    {
      query: GetMerchantPaymentLinkDocument,
      variables: { paymentLinkId },
    },
    [],
  );

  const route = Router.useRoute(["Success", "PaymentLink"]);

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
              <>
                {match(route)
                  .with({ name: "PaymentLink" }, () => (
                    <PaymentForm paymentLink={merchantPaymentLink} />
                  ))
                  .with({ name: "Success" }, () => <SuccessPage />)
                  .otherwise(() => undefined)}
              </>
            );
          },
        )
        .otherwise(() => (
          <ErrorView />
        ))}
    </>
  );
};
