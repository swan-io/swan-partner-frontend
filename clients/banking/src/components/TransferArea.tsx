import { Option } from "@swan-io/boxed";
import { BreadcrumbsRoot } from "@swan-io/lake/src/components/Breadcrumbs";
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
import { TransferTypePicker } from "./TransferTypePicker";

type Props = {
  accountCountry: AccountCountry;
  accountId: string;
  accountMembershipId: string;
  canQueryCardOnTransaction: boolean;
  canViewAccount: boolean;
  transferConsent: Option<{ kind: "transfer" | "standingOrder" | "beneficiary"; status: string }>;
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

  useTransferToastWithRedirect(transferConsent, () => {
    match(route?.name)
      .with("AccountPaymentsBeneficiariesList", "AccountPaymentsRecurringTransferList", name => {
        Router.replace(name, { accountMembershipId });
      })
      .otherwise(() => {
        Router.replace("AccountPaymentsRoot", { accountMembershipId });
      });
  });

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
              <TransferTypePicker
                accountCountry={accountCountry}
                accountId={accountId}
                accountMembershipId={accountMembershipId}
                type={type}
              />
            ) : (
              <NotFoundPage />
            ),
          )
          .with({ name: "AccountPaymentsBeneficiariesNew" }, ({ params: { type } }) => (
            <BeneficiaryTypePicker
              accountCountry={accountCountry}
              accountId={accountId}
              accountMembershipId={accountMembershipId}
              type={type}
            />
          ))
          .otherwise(() => (
            <NotFoundPage />
          ))}
      </View>
    </BreadcrumbsRoot>
  );
};
