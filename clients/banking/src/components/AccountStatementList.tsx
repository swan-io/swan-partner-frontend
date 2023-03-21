import { Space } from "@swan-io/lake/src/components/Space";
import { TabView } from "@swan-io/lake/src/components/TabView";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { match } from "ts-pattern";
import { t } from "../utils/i18n";
import { Router } from "../utils/routes";
import { AccountStatementCustom } from "./AccountStatementCustom";
import { AccountStatementMonthly } from "./AccountStatementMonthly";

const styles = StyleSheet.create({
  root: {
    // we must have fixed height for PlainListView component
    // This height depends of new custom statement form
    height: 450,
    overflow: "hidden",
    borderTopColor: colors.gray[100],
    borderTopWidth: 1,
  },
  cellContainerLarge: {
    paddingLeft: spacings[24],
    paddingRight: spacings[40],
    flexGrow: 1,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "space-between",
    flexDirection: "row",
  },
  cellContainer: {
    paddingRight: spacings[16],
    flexGrow: 1,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "space-between",
    flexDirection: "row",
  },
});

type Props = {
  accountId: string;
  large: boolean;
  accountMembershipId: string;
};

export const AccountStatementsList = ({ accountId, large, accountMembershipId }: Props) => {
  const route = Router.useRoute([
    "AccountTransactionsListStatementsCustom",
    "AccountTransactionsListStatementsRoot",
  ]);

  const tabs = useMemo(
    () => [
      {
        label: t("accountStatements.tab.monthly"),
        url: Router.AccountTransactionsListStatementsRoot({ accountMembershipId }),
      },
      {
        label: t("accountStatements.tab.custom"),
        url: Router.AccountTransactionsListStatementsCustom({ accountMembershipId }),
      },
    ],
    [accountMembershipId],
  );

  return (
    <View style={styles.root}>
      <Space width={24} />
      <TabView tabs={tabs} otherLabel={t("common.tabs.other")} padding={large ? 48 : 24} />

      {match(route)
        .with({ name: "AccountTransactionsListStatementsCustom" }, () => (
          <AccountStatementCustom accountId={accountId} large={large} />
        ))

        .with({ name: "AccountTransactionsListStatementsRoot" }, () => (
          <AccountStatementMonthly
            accountId={accountId}
            large={large}
            accountMembershipId={accountMembershipId}
          />
        ))
        .otherwise(() => null)}
    </View>
  );
};
