import { Option } from "@swan-io/boxed";
import { BottomPanel } from "@swan-io/lake/src/components/BottomPanel";
import { Box } from "@swan-io/lake/src/components/Box";
import { Icon } from "@swan-io/lake/src/components/Icon";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { Link } from "@swan-io/lake/src/components/Link";
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
import { typography } from "@swan-io/lake/src/constants/typography";
import { useResponsive } from "@swan-io/lake/src/hooks/useResponsive";
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
    paddingLeft: spacings[24],
    paddingVertical: spacings[12],
    paddingBottom: 0,
  },
  balanceLarge: {
    paddingLeft: spacings[40],
    paddingRight: spacings[8],
    paddingTop: spacings[40],
    paddingBottom: spacings[12],
  },
  statementsLarge: {
    marginHorizontal: negativeSpacings[48],
  },
  statements: {
    marginHorizontal: negativeSpacings[24],
  },
  link: {
    display: "flex",
    transitionProperty: "opacity",
    transitionDuration: "150ms",
    alignItems: "center",
  },
  grow: { flexGrow: 1 },
  linkPressed: {
    opacity: 0.7,
  },
  balanceDetailsButton: {
    backgroundColor: colors.gray[100],
  },
  balanceDetailDesktopContainer: {
    paddingLeft: spacings[16],
    width: "400px",
  },
  balanceDetailDesktopLarge: { paddingBottom: spacings[16] },
  balanceDetailDesktopItem: { paddingLeft: spacings[24] },
  bottomPanelContainer: { padding: spacings[24] },
  bottomPanelItem: {
    paddingBottom: spacings[4],
  },
  linkContainerLarge: {
    paddingLeft: spacings[40],
  },
  linkContainer: {
    paddingLeft: spacings[24],
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

  const { desktop } = useResponsive();
  const [balanceDetailsVisible, setBalanceDetailsVisible] = useState<boolean>(false);

  const route = Router.useRoute(accountTransactionsRoutes);
  const account = data?.account;
  const availableBalance = account?.balances?.available;
  const bookedBalance = account?.balances?.booked;
  const pendingBalance = account?.balances?.pending;
  const reservedBalance = account?.balances?.reserved;

  return (
    <ResponsiveContainer style={commonStyles.fill} breakpoint={breakpoints.large}>
      {({ small, large }) => (
        <>
          {availableBalance && bookedBalance && pendingBalance && reservedBalance ? (
            <>
              <Box direction="row">
                <Box style={[styles.balance, large && styles.balanceLarge]} direction="row">
                  <Box direction="columnReverse">
                    <LakeText variant="smallRegular">{t("transactions.availableBalance")}</LakeText>

                    <LakeHeading level={1} variant={large ? "h1" : "h3"}>
                      {formatCurrency(Number(availableBalance.value), availableBalance.currency)}
                    </LakeHeading>
                  </Box>

                  <Space width={12} />

                  <LakeButton
                    ariaLabel={t("common.see")}
                    mode="tertiary"
                    size="small"
                    icon={balanceDetailsVisible ? "eye-regular" : "eye-off-regular"}
                    onPress={() => {
                      setBalanceDetailsVisible(!balanceDetailsVisible);
                    }}
                    color="swan"
                    style={({ hovered }) => [hovered && styles.balanceDetailsButton]}
                  />
                </Box>

                {balanceDetailsVisible && desktop && (
                  <Box
                    direction="row"
                    alignItems="end"
                    style={styles.balanceDetailDesktopContainer}
                  >
                    <Box
                      style={[large && styles.balanceDetailDesktopLarge, styles.grow]}
                      direction="row"
                    >
                      <LakeText> = </LakeText>

                      <Box direction="column" style={styles.balanceDetailDesktopItem}>
                        <LakeText variant="medium" color={colors.gray[700]}>
                          {formatCurrency(Number(bookedBalance.value), bookedBalance.currency)}
                        </LakeText>

                        <LakeText color={colors.gray[500]} variant="smallRegular">
                          {t("transactions.bookedBalance")}
                        </LakeText>
                      </Box>
                    </Box>

                    <Box
                      style={[large && styles.balanceDetailDesktopLarge, styles.grow]}
                      direction="row"
                    >
                      <LakeText>{Number(pendingBalance.value) < 0 ? "-" : "+"}</LakeText>

                      <Box direction="column" style={styles.balanceDetailDesktopItem}>
                        <LakeText variant="medium" color={colors.gray[700]}>
                          {formatCurrency(
                            Math.abs(Number(pendingBalance.value)),
                            pendingBalance.currency,
                          )}
                        </LakeText>

                        <LakeText color={colors.gray[500]} variant="smallRegular">
                          {t("transactions.pendingBalance")}
                        </LakeText>
                      </Box>
                    </Box>

                    <Box
                      style={[large && styles.balanceDetailDesktopLarge, styles.grow]}
                      direction="row"
                    >
                      <LakeText> - </LakeText>

                      <Box direction="column" style={styles.balanceDetailDesktopItem}>
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

                {balanceDetailsVisible && !desktop && (
                  <BottomPanel
                    visible={screen != null}
                    onPressClose={() => {
                      setBalanceDetailsVisible(!balanceDetailsVisible);
                    }}
                  >
                    <View style={styles.bottomPanelContainer}>
                      <Icon name="money-filled" size={40} color={colors.current.primary} />
                      <Space height={12} />

                      <LakeHeading
                        level={3}
                        variant="h3"
                        style={{ lineHeight: typography.lineHeights.body }}
                      >
                        Available balance
                      </LakeHeading>

                      <Box direction="row">
                        <Link
                          target="blank"
                          to={`https://docs.swan.io/concept/account/balances`}
                          style={({ pressed }) => [pressed && styles.linkPressed, styles.link]}
                        >
                          <LakeText color={colors.current.primary}>
                            {t("common.learnMore")}
                          </LakeText>

                          <Space width={4} />
                          <Icon color={colors.current.primary} name="open-filled" size={16} />
                        </Link>
                      </Box>

                      <Space height={24} />

                      <LakeText variant="medium" color={colors.gray[700]}>
                        {formatCurrency(Number(availableBalance.value), availableBalance.currency)}
                      </LakeText>

                      <LakeText color={colors.gray[500]} variant="smallRegular">
                        {t("transactions.availableBalance")}
                      </LakeText>

                      <Space height={4} />
                      <LakeText style={styles.bottomPanelItem}>=</LakeText>

                      <LakeText variant="medium" color={colors.gray[700]}>
                        {formatCurrency(Number(bookedBalance.value), bookedBalance.currency)}
                      </LakeText>

                      <LakeText
                        color={colors.gray[500]}
                        variant="smallRegular"
                        style={styles.bottomPanelItem}
                      >
                        {t("transactions.bookedBalance")}
                      </LakeText>

                      <LakeText>{Number(pendingBalance.value) < 0 ? "-" : "+"}</LakeText>

                      <LakeText variant="medium" color={colors.gray[700]}>
                        {formatCurrency(
                          Math.abs(Number(pendingBalance.value)),
                          pendingBalance.currency,
                        )}
                      </LakeText>

                      <LakeText
                        color={colors.gray[500]}
                        variant="smallRegular"
                        style={styles.bottomPanelItem}
                      >
                        {t("transactions.pendingBalance")}
                      </LakeText>

                      <LakeText style={styles.bottomPanelItem}> - </LakeText>

                      <LakeText variant="medium" color={colors.gray[700]}>
                        {formatCurrency(Number(reservedBalance.value), reservedBalance.currency)}
                      </LakeText>

                      <LakeText color={colors.gray[500]} variant="smallRegular">
                        {t("transactions.reservedBalance")}
                      </LakeText>
                    </View>
                  </BottomPanel>
                )}
              </Box>

              <Box direction="row" style={large ? styles.linkContainerLarge : styles.linkContainer}>
                <Link
                  target="blank"
                  to={`https://docs.swan.io/concept/account/balances`}
                  style={({ pressed }) => [pressed && styles.linkPressed, styles.link]}
                >
                  <LakeText variant="smallRegular" color={colors.current.primary}>
                    {t("common.learnMore")}
                  </LakeText>

                  <Space width={4} />
                  <Icon color={colors.current.primary} name="open-filled" size={16} />
                </Link>
              </Box>

              <Space height={24} />
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
