import { AsyncData, Result } from "@swan-io/boxed";
import { LoadingView } from "@swan-io/lake/src/components/LoadingView";
import { colors } from "@swan-io/lake/src/constants/design";
import { useUrqlQuery } from "@swan-io/lake/src/hooks/useUrqlQuery";
import { StyleSheet } from "react-native";
import { P, match } from "ts-pattern";

import { isNotNullish } from "@swan-io/lake/src/utils/nullish";
import { useEffect, useState } from "react";
import { GetMerchantPaymentLinkDocument } from "../graphql/unauthenticated";
import { ExpiredPage } from "../pages/ExpiredPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { PaymentPage } from "../pages/PaymentPage";
import { SuccessPage } from "../pages/SuccessPage";
import { Router } from "../utils/routes";
import { ErrorView } from "./ErrorView";

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.gray[50],
    flexGrow: 1,
  },
});

type Props = {
  paymentLinkId: string;
};

export const PaymentArea = ({ paymentLinkId }: Props) => {
  const route = Router.useRoute(["PaymentForm", "PaymentSuccess"]);
  const [mandateUrl, setMandateUrl] = useState<string>();

  const { data } = useUrqlQuery(
    {
      query: GetMerchantPaymentLinkDocument,
      variables: { paymentLinkId },
    },
    [],
  );

  useEffect(() => {
    if (isNotNullish(mandateUrl)) {
      Router.replace("PaymentSuccess", { paymentLinkId });
    }
  }, [mandateUrl, paymentLinkId]);

  return match(data)
    .with(AsyncData.P.NotAsked, () => null)
    .with(AsyncData.P.Loading, () => <LoadingView color={colors.gray[400]} style={styles.base} />)
    .with(
      AsyncData.P.Done(
        Result.P.Ok({ merchantPaymentLink: P.select({ statusInfo: { status: "Active" } }) }),
      ),
      merchantPaymentLink =>
        match(route)
          .with({ name: "PaymentForm" }, () => (
            <PaymentPage paymentLink={merchantPaymentLink} setMandateUrl={setMandateUrl} />
          ))
          .with({ name: "PaymentSuccess" }, () => (
            <SuccessPage paymentLink={merchantPaymentLink} mandateUrl={mandateUrl} />
          ))
          .otherwise(() => <NotFoundPage />),
    )
    .with(
      AsyncData.P.Done(Result.P.Ok({ merchantPaymentLink: P.select(P.not(P.nullish)) })),
      merchantPaymentLink => <ExpiredPage paymentLink={merchantPaymentLink} />,
    )
    .otherwise(() => <ErrorView />);
};
