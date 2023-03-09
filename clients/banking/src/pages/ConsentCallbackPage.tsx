import { isNotEmpty } from "@swan-io/lake/src/utils/nullish";
import { match } from "ts-pattern";
import { ConsentCallbackPageDocument } from "../graphql/partner";
import { useQueryWithErrorBoundary } from "../utils/urql";
import { PaymentFailurePage } from "./PaymentFailurePage";
import { PaymentSuccessPage } from "./PaymentSuccessPage";
import { StandingOrderFailurePage } from "./StandingOrderFailurePage";
import { StandingOrderSuccessPage } from "./StandingOrderSuccessPage";

type Props = {
  standingOrder: string;
  consentId: string;
  accountMembershipId: string;
};

export const ConsentCallbackPage = ({ standingOrder, consentId, accountMembershipId }: Props) => {
  const [{ data }] = useQueryWithErrorBoundary({
    query: ConsentCallbackPageDocument,
    variables: { consentId },
  });

  const isAccepted = data.consent.status === "Accepted";

  return match<[boolean, boolean]>([isNotEmpty(standingOrder), isAccepted])
    .with([true, true], () => (
      <StandingOrderSuccessPage accountMembershipId={accountMembershipId} />
    ))
    .with([true, false], () => (
      <StandingOrderFailurePage accountMembershipId={accountMembershipId} />
    ))
    .with([false, true], () => <PaymentSuccessPage accountMembershipId={accountMembershipId} />)
    .with([false, false], () => <PaymentFailurePage accountMembershipId={accountMembershipId} />)
    .exhaustive();
};
