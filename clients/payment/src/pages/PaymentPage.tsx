import { AsyncData, Result } from "@swan-io/boxed";
import { useUrqlQuery } from "@swan-io/lake/src/hooks/useUrqlQuery";
import { P, match } from "ts-pattern";
import { ErrorView } from "../components/ErrorView";
import { PaymentForm } from "../components/PaymentForm";
import { GetMerchantPaymentLinkDocument } from "../graphql/unauthenticated";
import { NotFoundPage } from "./NotFoundPage";

export const PaymentPage = () => {
  const { data } = useUrqlQuery(
    {
      query: GetMerchantPaymentLinkDocument,
    },
    [],
  );
  console.log(data);

  return (
    <>
      {match(data)
        .with(AsyncData.P.NotAsked, () => null)
        .with(AsyncData.P.Loading, () => <h1>Loading....</h1>)

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
