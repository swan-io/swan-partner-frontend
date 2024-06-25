import { Option } from "@swan-io/boxed";
import { BreadcrumbsRoot } from "@swan-io/lake/src/components/Breadcrumbs";
import { FullViewportLayer } from "@swan-io/lake/src/components/FullViewportLayer";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { useMemo } from "react";
import { View } from "react-native";
import { match } from "ts-pattern";
import { AccountCountry } from "../graphql/partner";
import { useTransferToastWithRedirect } from "../hooks/useTransferToastWithRedirect";
import { NotFoundPage } from "../pages/NotFoundPage";
import { TransferPage } from "../pages/TransferPage";
import { t } from "../utils/i18n";
import { paymentRoutes, Router } from "../utils/routes";
import { BeneficiaryTypePicker } from "./BeneficiaryTypePicker";
import { TransferBulkWizard } from "./TransferBulkWizard";
import { TransferInternationalWizard } from "./TransferInternationalWizard";
import { TransferRecurringWizard } from "./TransferRecurringWizard";
import { TransferRegularWizard } from "./TransferRegularWizard";
import { TransferTypePicker } from "./TransferTypePicker";

type Props = {
  accountCountry: AccountCountry;
  accountId: string;
  accountMembershipId: string;
  canQueryCardOnTransaction: boolean;
  canViewAccount: boolean;
  transferConsent: Option<{ status: string; isStandingOrder: boolean }>;
  transferCreationVisible: boolean;
};

export const TransferArea = ({
  accountCountry,
  accountId,
  accountMembershipId,
  canQueryCardOnTransaction,
  canViewAccount,
  transferConsent,
  transferCreationVisible,
}: Props) => {
  const route = Router.useRoute(paymentRoutes);

  useTransferToastWithRedirect(transferConsent, () =>
    Router.replace(
      route?.name === "AccountPaymentsRecurringTransferList"
        ? "AccountPaymentsRecurringTransferList"
        : "AccountPaymentsRoot",
      { accountMembershipId },
    ),
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
            { name: "AccountPaymentsRecurringTransferList" },
            { name: "AccountPaymentsRecurringTransferDetailsArea" },
            { name: "AccountPaymentsBeneficiariesList" },
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
                    accountCountry={accountCountry}
                    accountId={accountId}
                    accountMembershipId={accountMembershipId}
                    onPressClose={() => Router.push("AccountPaymentsNew", { accountMembershipId })}
                  />
                </FullViewportLayer>

                <FullViewportLayer visible={type === "recurring"}>
                  <TransferRecurringWizard
                    accountCountry={accountCountry}
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

                <FullViewportLayer visible={type === "bulk"}>
                  <TransferBulkWizard
                    accountCountry={accountCountry}
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
          .with({ name: "AccountPaymentsBeneficiariesNew" }, () => (
            <BeneficiaryTypePicker accountMembershipId={accountMembershipId} />
          ))
          .otherwise(() => (
            <NotFoundPage />
          ))}
      </View>
    </BreadcrumbsRoot>
  );
};
