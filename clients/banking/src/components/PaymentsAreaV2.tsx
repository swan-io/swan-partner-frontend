import { Option } from "@swan-io/boxed";
import { BreadcrumbsRoot } from "@swan-io/lake/src/components/Breadcrumbs";
import { FullViewportLayer } from "@swan-io/lake/src/components/FullViewportLayer";
import { useMemo } from "react";
import { match } from "ts-pattern";
import { useTransferToastWithRedirect } from "../hooks/useTransferToastWithRedirect";
import { NotFoundPage } from "../pages/NotFoundPage";
import { PaymentsPageV2 } from "../pages/PaymentsPageV2";
import { t } from "../utils/i18n";
import { paymentRoutesV2, Router } from "../utils/routes";
import { TransferRegularWizard } from "./TransferRegularWizard";
import { TransferTypePicker } from "./TransferTypePicker";

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

  const rootLevelCrumbs = useMemo(() => {
    return [
      {
        label: t("transfer.transfer"),
        link: Router.AccountPaymentsRoot({ accountMembershipId }),
      },
    ];
  }, [accountMembershipId]);

  return (
    <BreadcrumbsRoot rootLevelCrumbs={rootLevelCrumbs}>
      {match(route)
        .with({ name: "AccountPaymentsRoot" }, () => (
          <PaymentsPageV2
            accountId={accountId}
            accountMembershipId={accountMembershipId}
            newStandingOrderIsVisible={newStandingOrderIsVisible}
            canQueryCardOnTransaction={canQueryCardOnTransaction}
          />
        ))
        .with({ name: "AccountPaymentsNew" }, ({ params: { type } }) => (
          <>
            <TransferTypePicker accountMembershipId={accountMembershipId} />
            <FullViewportLayer visible={type === "transfer"}>
              <TransferRegularWizard
                onPressClose={() => Router.push("AccountPaymentsNew", { accountMembershipId })}
              />
            </FullViewportLayer>
            <FullViewportLayer visible={type === "recurring"}>recurring</FullViewportLayer>
          </>
        ))
        .otherwise(() => (
          <NotFoundPage />
        ))}
    </BreadcrumbsRoot>
  );
};
