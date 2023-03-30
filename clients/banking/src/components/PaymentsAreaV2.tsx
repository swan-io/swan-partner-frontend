import { Option } from "@swan-io/boxed";
import { FullViewportLayer } from "@swan-io/lake/src/components/FullViewportLayer";
import { useTransferToastWithRedirect } from "../hooks/useTransferToastWithRedirect";
import { NewPaymentPageV2 } from "../pages/NewPaymentPageV2";
import { NewRecurringTransferPageV2 } from "../pages/NewRecurringTransferPageV2";
import { PaymentsPageV2 } from "../pages/PaymentsPageV2";
import { paymentRoutesV2, Router } from "../utils/routes";

type Props = {
  accountId: string;
  accountMembershipId: string;
  newStandingOrderIsVisible: boolean;
  canQueryCardOnTransaction: boolean;
  transferConsent: Option<{ status: string; isStandingOrder: boolean }>;
};

export const PaymentsAreaV2 = ({
  accountId,
  accountMembershipId,
  newStandingOrderIsVisible,
  canQueryCardOnTransaction,
  transferConsent,
}: Props) => {
  const route = Router.useRoute(paymentRoutesV2);

  useTransferToastWithRedirect(transferConsent, () =>
    Router.replace("AccountPaymentsRoot", { accountMembershipId }),
  );

  return (
    <>
      <PaymentsPageV2
        accountId={accountId}
        accountMembershipId={accountMembershipId}
        newStandingOrderIsVisible={newStandingOrderIsVisible}
        canQueryCardOnTransaction={canQueryCardOnTransaction}
      />

      <FullViewportLayer visible={route?.name === "AccountPaymentsNew"}>
        <NewPaymentPageV2
          accountId={accountId}
          accountMembershipId={accountMembershipId}
          onClose={() => Router.replace("AccountPaymentsRoot", { accountMembershipId })}
        />
      </FullViewportLayer>

      <FullViewportLayer visible={route?.name === "AccountPaymentsRecurringTransferNew"}>
        <NewRecurringTransferPageV2
          accountId={accountId}
          accountMembershipId={accountMembershipId}
          onClose={() => Router.replace("AccountPaymentsRoot", { accountMembershipId })}
        />
      </FullViewportLayer>
    </>
  );
};
