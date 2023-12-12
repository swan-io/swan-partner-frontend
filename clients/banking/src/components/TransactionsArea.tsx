import { Option } from "@swan-io/boxed";
import { Box } from "@swan-io/lake/src/components/Box";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { TabView } from "@swan-io/lake/src/components/TabView";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import {
  breakpoints,
  colors,
  negativeSpacings,
  spacings,
} from "@swan-io/lake/src/constants/design";
import { isNotEmpty } from "@swan-io/lake/src/utils/nullish";
import { LakeModal } from "@swan-io/shared-business/src/components/LakeModal";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { match } from "ts-pattern";
import { useQuery } from "urql";
import { Amount, GetAccountBalanceDocument } from "../graphql/partner";
import { TransactionListPage } from "../pages/TransactionListPage";
import { UpcomingTransactionListPage } from "../pages/UpcomingTransactionListPage";
import { formatCurrency, t } from "../utils/i18n";
import { Router, accountTransactionsRoutes } from "../utils/routes";
import { AccountStatementsList } from "./AccountStatementList";
import { ErrorView } from "./ErrorView";

type Props = {
  accountId: string;
  accountMembershipId: string;
  canQueryCardOnTransaction: boolean;
  accountStatementsVisible: boolean;
  canViewAccount: boolean;
  onBalanceReceive: (amount: Amount) => void;
};

const styles = StyleSheet.create({
  balance: {
    paddingHorizontal: spacings[24],
    paddingVertical: spacings[12],
    paddingBottom: 0,
    flexDirection: "column-reverse",
  },
  balanceLarge: {
    paddingLeft: spacings[40],
    paddingRight: spacings[8],
    paddingTop: spacings[40],
    paddingBottom: spacings[16],
  },
  statementsLarge: {
    marginHorizontal: negativeSpacings[48],
  },
  statements: {
    marginHorizontal: negativeSpacings[24],
  },
});

export const TransactionsArea = ({
  accountId,
  accountMembershipId,
  canQueryCardOnTransaction,
  accountStatementsVisible,
  onBalanceReceive,
  canViewAccount,
}: Props) => {
  const [{ data }] = useQuery({
    query: GetAccountBalanceDocument,
    variables: { accountId },
  });
  const [updatedUpcommingTransactionCount, setUpdatedUpcommingTransactionCount] = useState<
    number | undefined
  >(undefined);

  const [visible, setVisible] = useState<boolean>(true);

  const route = Router.useRoute(accountTransactionsRoutes);
  const account = data?.account;
  const availableBalance = account?.balances?.available;
  const bookedBalance = account?.balances?.booked;
  const pendingBalance = account?.balances?.pending;
  const reservedBalance = account?.balances?.reserved;

  const formatPendingAmount = (pendingBalance: string) => {
    if (pendingBalance.startsWith("-")) {
      return pendingBalance.slice(1);
    }
  };

  return (
    <ResponsiveContainer style={commonStyles.fill} breakpoint={breakpoints.large}>
      {({ small, large }) => (
        <>
          {availableBalance && bookedBalance && pendingBalance && reservedBalance ? (
            <Box
              style={{
                flexDirection: "row",
              }}
            >
              <Box style={[styles.balance, large && styles.balanceLarge]}>
                <LakeText variant="smallRegular">{t("transactions.availableBalance")}</LakeText>

                <LakeHeading level={1} variant={large ? "h1" : "h3"}>
                  {formatCurrency(Number(availableBalance.value), availableBalance.currency)}
                </LakeHeading>
              </Box>

              <Box justifyContent="center">
                <LakeButton
                  ariaLabel={t("common.see")}
                  mode="tertiary"
                  size="large"
                  icon={visible ? "eye-regular" : "eye-off-regular"}
                  onPress={() => {
                    setVisible(!visible);
                  }}
                  color="swan"
                />
              </Box>

              {visible && (
                <Box
                  direction="row"
                  alignItems="end"
                  style={{ paddingLeft: spacings[16], width: "400px" }}
                >
                  <Box
                    style={[large && { paddingBottom: spacings[16] }, { flexGrow: 1 }]}
                    direction="row"
                  >
                    <LakeText> = </LakeText>

                    <Box direction="column" style={{ paddingLeft: spacings[24] }}>
                      <LakeText variant="medium" color={colors.gray[700]}>
                        {formatCurrency(Number(bookedBalance.value), bookedBalance.currency)}
                      </LakeText>

                      <LakeText color={colors.gray[500]} variant="smallRegular">
                        {t("transactions.bookedBalance")}
                      </LakeText>
                    </Box>
                  </Box>

                  <Box
                    style={[large && { paddingBottom: spacings[16] }, { flexGrow: 1 }]}
                    direction="row"
                  >
                    {/* Get operator from the pending amount */}
                    <LakeText>
                      {formatCurrency(Number(pendingBalance.value), pendingBalance.currency).charAt(
                        0,
                      )}
                    </LakeText>

                    <Box direction="column" style={{ paddingLeft: spacings[24] }}>
                      <LakeText variant="medium" color={colors.gray[700]}>
                        {formatPendingAmount(
                          formatCurrency(Number(pendingBalance.value), pendingBalance.currency),
                        )}
                      </LakeText>

                      <LakeText color={colors.gray[500]} variant="smallRegular">
                        {t("transactions.pendingBalance")}
                      </LakeText>
                    </Box>
                  </Box>

                  <Box
                    style={[large && { paddingBottom: spacings[16] }, { flexGrow: 1 }]}
                    direction="row"
                  >
                    <LakeText> - </LakeText>

                    <Box direction="column" style={{ paddingLeft: spacings[24] }}>
                      <LakeText variant="medium" color={colors.gray[700]}>
                        {formatCurrency(Number(reservedBalance.value), reservedBalance.currency)}
                      </LakeText>

                      <LakeText color={colors.gray[500]} variant="smallRegular">
                        {t("transactions.reservedBalance")}
                      </LakeText>
                    </Box>
                  </Box>
                </Box>
              )}
            </Box>
          ) : (
            <Space height={24} />
          )}

          <TabView
            padding={small ? 24 : 40}
            sticky={true}
            tabs={[
              {
                label: t("transactions.history"),
                url: Router.AccountTransactionsListRoot({ accountMembershipId }),
              },
              {
                label: t("transactions.upcoming"),
                url: Router.AccountTransactionsUpcoming({ accountMembershipId }),
                count:
                  updatedUpcommingTransactionCount ??
                  data?.account?.upcomingTransactions?.totalCount ??
                  undefined,
              },
            ]}
            otherLabel={t("common.tabs.other")}
          />

          <Space height={16} />

          {match(route)
            .with(
              { name: "AccountTransactionsListRoot" },
              { name: "AccountTransactionsListStatementsArea" },
              ({
                name,
                params: {
                  accountMembershipId,
                  consentId,
                  standingOrder,
                  status: consentStatus,
                  ...params
                },
              }) => {
                return (
                  <>
                    <TransactionListPage
                      accountMembershipId={accountMembershipId}
                      params={params}
                      accountId={accountId}
                      transferConsent={
                        consentId != null && consentStatus != null
                          ? Option.Some({
                              status: consentStatus,
                              isStandingOrder: isNotEmpty(standingOrder ?? ""),
                            })
                          : Option.None()
                      }
                      onBalanceReceive={onBalanceReceive}
                      canQueryCardOnTransaction={canQueryCardOnTransaction}
                      accountStatementsVisible={accountStatementsVisible}
                      canViewAccount={canViewAccount}
                    />

                    <LakeModal
                      maxWidth={breakpoints.medium}
                      icon="arrow-download-filled"
                      title={t("accountStatements.title")}
                      visible={
                        name === "AccountTransactionsListStatementsArea" && accountStatementsVisible
                      }
                      onPressClose={() =>
                        Router.push("AccountTransactionsListRoot", {
                          accountMembershipId,
                          ...params,
                        })
                      }
                    >
                      {({ large }) => (
                        <View style={large ? styles.statementsLarge : styles.statements}>
                          <AccountStatementsList
                            accountId={accountId}
                            large={large}
                            accountMembershipId={accountMembershipId}
                          />
                        </View>
                      )}
                    </LakeModal>
                  </>
                );
              },
            )
            .with({ name: "AccountTransactionsUpcoming" }, () => {
              return (
                <UpcomingTransactionListPage
                  accountId={accountId}
                  canQueryCardOnTransaction={canQueryCardOnTransaction}
                  onUpcomingTransactionCountUpdated={setUpdatedUpcommingTransactionCount}
                  canViewAccount={canViewAccount}
                />
              );
            })
            .otherwise(() => (
              <ErrorView />
            ))}
        </>
      )}
    </ResponsiveContainer>
  );
};
