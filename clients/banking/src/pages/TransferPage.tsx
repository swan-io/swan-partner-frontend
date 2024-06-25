import { Box } from "@swan-io/lake/src/components/Box";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { TabView } from "@swan-io/lake/src/components/TabView";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { breakpoints } from "@swan-io/lake/src/constants/design";
import { StyleSheet } from "react-native";
import { match } from "ts-pattern";
import { BeneficiaryList } from "../components/BeneficiaryList";
import { ErrorView } from "../components/ErrorView";
import { RecurringTransferList } from "../components/RecurringTransferList";
import { TransferList } from "../components/TransferList";
import { t } from "../utils/i18n";
import { Router, paymentRoutes } from "../utils/routes";

const styles = StyleSheet.create({
  container: {
    paddingTop: 24,
    paddingHorizontal: 24,
  },
  containerDesktop: {
    paddingTop: 40,
    paddingHorizontal: 40,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
});

type Props = {
  accountId: string;
  accountMembershipId: string;
  transferCreationVisible: boolean;
  canQueryCardOnTransaction: boolean;
  canViewAccount: boolean;
};

export const TransferPage = ({
  accountId,
  accountMembershipId,
  transferCreationVisible,
  canQueryCardOnTransaction,
  canViewAccount,
}: Props) => {
  const route = Router.useRoute(paymentRoutes);

  return (
    <ResponsiveContainer breakpoint={breakpoints.large} style={commonStyles.fill}>
      {({ small }) => (
        <>
          {transferCreationVisible ? (
            <Box direction="row">
              <ResponsiveContainer
                breakpoint={breakpoints.small}
                style={[
                  styles.buttonContainer,
                  commonStyles.fill,
                  small ? styles.container : styles.containerDesktop,
                ]}
              >
                {({ small }) => (
                  <LakeButton
                    grow={small}
                    onPress={() => Router.push("AccountPaymentsNew", { accountMembershipId })}
                    icon="add-circle-filled"
                    size="small"
                    color="current"
                  >
                    {t("transfer.newTransfer")}
                  </LakeButton>
                )}
              </ResponsiveContainer>
            </Box>
          ) : null}

          <Space height={24} />

          <TabView
            padding={small ? 24 : 40}
            sticky={true}
            tabs={[
              {
                label: t("transfer.tabs.transfers"),
                url: Router.AccountPaymentsRoot({ accountMembershipId }),
              },
              {
                label: t("transfer.tabs.recurringTransfer"),
                url: Router.AccountPaymentsRecurringTransferList({ accountMembershipId }),
              },
              {
                label: t("transfer.tabs.beneficiaries"),
                url: Router.AccountPaymentsBeneficiariesList({ accountMembershipId }),
              },
            ]}
            otherLabel={t("common.tabs.other")}
          />

          <Space height={24} />

          {match(route)
            .with({ name: "AccountPaymentsRoot" }, ({ params }) => (
              <TransferList
                accountId={accountId}
                accountMembershipId={accountMembershipId}
                canQueryCardOnTransaction={canQueryCardOnTransaction}
                canViewAccount={canViewAccount}
                params={params}
              />
            ))
            .with(
              { name: "AccountPaymentsRecurringTransferList" },
              { name: "AccountPaymentsRecurringTransferDetailsArea" },
              () => (
                <RecurringTransferList
                  accountId={accountId}
                  accountMembershipId={accountMembershipId}
                  canQueryCardOnTransaction={canQueryCardOnTransaction}
                  canViewAccount={canViewAccount}
                />
              ),
            )
            .with({ name: "AccountPaymentsBeneficiariesList" }, () => (
              <BeneficiaryList accountId={accountId} accountMembershipId={accountMembershipId} />
            ))
            .otherwise(() => (
              <ErrorView />
            ))}
        </>
      )}
    </ResponsiveContainer>
  );
};
