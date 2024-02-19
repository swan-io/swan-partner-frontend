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
import { TransitionView } from "@swan-io/lake/src/components/TransitionView";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import {
  animations,
  breakpoints,
  colors,
  negativeSpacings,
  spacings,
  texts,
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
  balanceDetailsButton: {
    backgroundColor: colors.gray[100],
  },
  balanceDetailsDesktopTransitionView: {
    alignItems: "flex-end",
    flexDirection: "row",
    paddingLeft: spacings[16],
    paddingTop: spacings[8],
  },
  balanceDetailDesktopOperator: {
    height: "100%",
    alignSelf: "center",
    paddingBottom: spacings[12],
  },
  balanceDetailDesktopItem: {
    height: "100%",
    paddingHorizontal: spacings[24],
  },
  balanceDetailDesktopText: {
    paddingBottom: 2,
  },
  bottomPanelContainer: {
    padding: spacings[24],
  },
  bottomPanelItem: {
    paddingBottom: spacings[4],
  },
  link: {
    display: "flex",
    transitionProperty: "opacity",
    transitionDuration: "150ms",
    alignItems: "center",
  },
  linkPressed: {
    opacity: 0.7,
  },
  statements: {
    marginHorizontal: negativeSpacings[24],
  },
  statementsLarge: {
    marginHorizontal: negativeSpacings[48],
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

  const shouldShowDetailedBalance = Option.fromNullable(data?.account)
    .flatMap(account =>
      Option.allFromDict({
        fundingSources: Option.fromNullable(account.fundingSources),
        merchantProfiles: Option.fromNullable(account.merchantProfiles),
      }),
    )
    .map(
      ({ fundingSources, merchantProfiles }) =>
        fundingSources.totalCount > 0 || merchantProfiles.totalCount > 0,
    )
    .getWithDefault(false);

  const [updatedUpcommingTransactionCount, setUpdatedUpcommingTransactionCount] = useState<
    number | undefined
  >(undefined);

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
                  <Box>
                    <LakeHeading level={1} variant={large ? "h1" : "h3"}>
                      {formatCurrency(Number(availableBalance.value), availableBalance.currency)}
                    </LakeHeading>

                    <LakeText variant="smallRegular">{t("transactions.availableBalance")}</LakeText>
                  </Box>

                  <Space width={12} />

                  {shouldShowDetailedBalance && (
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
                  )}

                  <TransitionView
                    enter={animations.fadeAndSlideInFromLeft.enter}
                    leave={animations.fadeAndSlideInFromLeft.leave}
                    style={styles.balanceDetailsDesktopTransitionView}
                  >
                    {balanceDetailsVisible && large ? (
                      <>
                        <LakeText
                          color={colors.gray[700]}
                          variant="medium"
                          style={styles.balanceDetailDesktopOperator}
                        >
                          =
                        </LakeText>

                        <Box style={styles.balanceDetailDesktopItem}>
                          <LakeText
                            color={colors.gray[700]}
                            style={styles.balanceDetailDesktopText}
                            variant="medium"
                          >
                            {formatCurrency(Number(bookedBalance.value), bookedBalance.currency)}
                          </LakeText>

                          <LakeText color={colors.gray[500]} variant="smallRegular">
                            {t("transactions.bookedBalance")}
                          </LakeText>
                        </Box>

                        <LakeText
                          color={colors.gray[700]}
                          variant="medium"
                          style={styles.balanceDetailDesktopOperator}
                        >
                          {Number(pendingBalance.value) < 0 ? "-" : "+"}
                        </LakeText>

                        <Box style={styles.balanceDetailDesktopItem}>
                          <LakeText
                            color={colors.gray[700]}
                            style={styles.balanceDetailDesktopText}
                            variant="medium"
                          >
                            {formatCurrency(
                              Math.abs(Number(pendingBalance.value)),
                              pendingBalance.currency,
                            )}
                          </LakeText>

                          <LakeText color={colors.gray[500]} variant="smallRegular">
                            {t("transactions.pendingBalance")}
                          </LakeText>
                        </Box>

                        <LakeText
                          color={colors.gray[700]}
                          variant="medium"
                          style={styles.balanceDetailDesktopOperator}
                        >
                          -
                        </LakeText>

                        <Box style={styles.balanceDetailDesktopItem}>
                          <LakeText
                            color={colors.gray[700]}
                            style={styles.balanceDetailDesktopText}
                            variant="medium"
                          >
                            {formatCurrency(
                              Number(reservedBalance.value),
                              reservedBalance.currency,
                            )}
                          </LakeText>

                          <LakeText color={colors.gray[500]} variant="smallRegular">
                            {t("transactions.reservedBalance")}
                          </LakeText>
                        </Box>

                        <Box
                          direction="row"
                          style={styles.balanceDetailDesktopItem}
                          alignItems="baseline"
                        >
                          <Link
                            target="blank"
                            to="https://support.swan.io/hc/en-150/articles/16464971717277-Account-balances"
                            style={({ pressed }) => [pressed && styles.linkPressed, styles.link]}
                          >
                            <LakeText variant="smallRegular" color={colors.current.primary}>
                              {t("common.learnMore")}
                            </LakeText>

                            <Space width={4} />
                            <Icon color={colors.current.primary} name="open-filled" size={16} />
                          </Link>
                        </Box>
                      </>
                    ) : null}
                  </TransitionView>
                </Box>

                {balanceDetailsVisible && !large && (
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
                        style={{ lineHeight: texts.regular.lineHeight }}
                      >
                        {t("transactions.availableBalance")}
                      </LakeHeading>

                      <Box direction="row">
                        <Link
                          target="blank"
                          to="https://support.swan.io/hc/en-150/articles/16464971717277-Account-balances"
                          style={({ pressed }) => [pressed && styles.linkPressed, styles.link]}
                        >
                          <LakeText color={colors.current.primary}>
                            {t("balances.learnMore")}
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
