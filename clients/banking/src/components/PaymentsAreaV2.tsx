import { FullViewportLayer } from "@swan-io/lake/src/components/FullViewportLayer";
import { NewPaymentPageV2 } from "../pages/NewPaymentPageV2";
import { NewStandingOrderPageV2 } from "../pages/NewStandingOrderPageV2";
import { PaymentsPageV2 } from "../pages/PaymentsPageV2";
import { paymentRoutesV2, Router } from "../utils/routes";

type Props = {
  accountId: string;
  accountMembershipId: string;
  newStandingOrderIsVisible: boolean;
  canQueryCardOnTransaction: boolean;
};

export const PaymentsAreaV2 = ({
  accountId,
  accountMembershipId,
  newStandingOrderIsVisible,
  canQueryCardOnTransaction,
}: Props) => {
  const route = Router.useRoute(paymentRoutesV2);

  return (
    <>
      <PaymentsPageV2
        accountId={accountId}
        accountMembershipId={accountMembershipId}
        newStandingOrderIsVisible={newStandingOrderIsVisible}
        canQueryCardOnTransaction={canQueryCardOnTransaction}
      />

      <FullViewportLayer visible={route?.name === "AccountPaymentsV2New"}>
        <NewPaymentPageV2
          accountId={accountId}
          accountMembershipId={accountMembershipId}
          onClose={() => Router.replace("AccountPaymentsV2Root", { accountMembershipId })}
        />
      </FullViewportLayer>

      <FullViewportLayer visible={route?.name === "AccountPaymentsV2StandingOrderNew"}>
        <NewStandingOrderPageV2
          accountId={accountId}
          accountMembershipId={accountMembershipId}
          onClose={() => Router.replace("AccountPaymentsV2Root", { accountMembershipId })}
        />
      </FullViewportLayer>
    </>
  );
};
