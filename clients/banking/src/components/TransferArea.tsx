import { Option } from "@swan-io/boxed";
import { BreadcrumbsRoot } from "@swan-io/lake/src/components/Breadcrumbs";
import { FullViewportLayer } from "@swan-io/lake/src/components/FullViewportLayer";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { useMemo } from "react";
import { View } from "react-native";
import { match } from "ts-pattern";
import { useTransferToastWithRedirect } from "../hooks/useTransferToastWithRedirect";
import { NotFoundPage } from "../pages/NotFoundPage";
import { TransferPage } from "../pages/TransferPage";
import { t } from "../utils/i18n";
import { paymentRoutes, Router } from "../utils/routes";
import { TransferInternationalWizard } from "./TransferInternationalWizard";
import { TransferRecurringWizard } from "./TransferRecurringWizard";
import { TransferRegularWizard } from "./TransferRegularWizard";
import { TransferTypePicker } from "./TransferTypePicker";

type Props = {
  accountId: string;
  accountMembershipId: string;
  transferCreationVisible: boolean;
  canQueryCardOnTransaction: boolean;
  canViewAccount: boolean;
  transferConsent: Option<{ status: string; isStandingOrder: boolean }>;
};

export const TransferArea = ({
  accountId,
  accountMembershipId,
  transferCreationVisible,
  canQueryCardOnTransaction,
  transferConsent,
  canViewAccount,
}: Props) => {
  const route = Router.useRoute(paymentRoutes);

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
      <View role="main" style={commonStyles.fill}>
        {match(route)
          .with(
            { name: "AccountPaymentsRoot" },
            { name: "AccountPaymentsRecurringTransferDetailsArea" },
            () => (
              <TransferPage
                accountId={accountId}
                accountMembershipId={accountMembershipId}
                transferCreationVisible={transferCreationVisible}
                canQueryCardOnTransaction={canQueryCardOnTransaction}
                canViewAccount={canViewAccount}
              />
            ),
          )
          .with({ name: "AccountPaymentsNew" }, ({ params: { type } }) =>
            transferCreationVisible ? (
              <>
                <TransferTypePicker accountMembershipId={accountMembershipId} />

                <FullViewportLayer visible={type === "transfer"}>
                  <TransferRegularWizard
                    accountId={accountId}
                    accountMembershipId={accountMembershipId}
                    onPressClose={() => Router.push("AccountPaymentsNew", { accountMembershipId })}
                  />
                </FullViewportLayer>

                <FullViewportLayer visible={type === "recurring"}>
                  <TransferRecurringWizard
                    accountId={accountId}
                    accountMembershipId={accountMembershipId}
                    onPressClose={() => Router.push("AccountPaymentsNew", { accountMembershipId })}
                  />
                </FullViewportLayer>

                <FullViewportLayer visible={type === "international"}>
                  <TransferInternationalWizard
                    accountId={accountId}
                    accountMembershipId={accountMembershipId}
                    onPressClose={() => Router.push("AccountPaymentsNew", { accountMembershipId })}
                  />
                </FullViewportLayer>
              </>
            ) : (
              <NotFoundPage />
            ),
          )
          .otherwise(() => (
            <NotFoundPage />
          ))}
      </View>
    </BreadcrumbsRoot>
  );
};
