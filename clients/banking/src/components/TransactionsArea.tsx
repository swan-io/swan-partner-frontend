import { Option } from "@swan-io/boxed";
import { Box } from "@swan-io/lake/src/components/Box";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeModal } from "@swan-io/lake/src/components/LakeModal";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { TabView } from "@swan-io/lake/src/components/TabView";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { breakpoints, negativeSpacings, spacings } from "@swan-io/lake/src/constants/design";
import { isNotEmpty } from "@swan-io/lake/src/utils/nullish";
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
  canViewAccountStatement: boolean;
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
    paddingHorizontal: spacings[40],
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
  canViewAccountStatement,
  onBalanceReceive,
}: Props) => {
  const [{ data }] = useQuery({
    query: GetAccountBalanceDocument,
    variables: { accountId },
  });

  const route = Router.useRoute(accountTransactionsRoutes);
  const account = data?.account;
  const availableBalance = account?.balances?.available;

  return (
    <ResponsiveContainer style={commonStyles.fill} breakpoint={breakpoints.large}>
      {({ small, large }) => (
        <>
          {availableBalance ? (
            <>
              <Box style={[styles.balance, large && styles.balanceLarge]}>
                <LakeText>{t("transactions.availableBalance")}</LakeText>

                <LakeHeading level={1} variant={large ? "h1" : "h3"}>
                  {formatCurrency(Number(availableBalance.value), availableBalance.currency)}
                </LakeHeading>
              </Box>
            </>
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
                count: data?.account?.upcomingTransactions?.totalCount ?? undefined,
              },
            ]}
            otherLabel={t("common.tabs.other")}
          />

          <Space height={16} />

          {match(route)
            .with(
              { name: "AccountTransactionsListRoot" },
              { name: "AccountTransactionsListStatements" },
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
                    />

                    <LakeModal
                      icon="arrow-download-filled"
                      title={t("accountStatements.title")}
                      visible={
                        name === "AccountTransactionsListStatements" && canViewAccountStatement
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
                          <AccountStatementsList accountId={accountId} large={large} />
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
