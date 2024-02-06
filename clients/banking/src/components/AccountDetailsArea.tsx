import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { TabView } from "@swan-io/lake/src/components/TabView";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { breakpoints, spacings } from "@swan-io/lake/src/constants/design";
import { useMemo } from "react";
import { StyleSheet } from "react-native";
import { P, match } from "ts-pattern";
import { AccountDetailsBillingPage } from "../pages/AccountDetailsBillingPage";
import { AccountDetailsIbanPage } from "../pages/AccountDetailsIbanPage";
import { AccountDetailsSettingsPage } from "../pages/AccountDetailsSettingsPage";
import { AccountDetailsVirtualIbansPage } from "../pages/AccountDetailsVirtualIbansPage";
import { t } from "../utils/i18n";
import { Router } from "../utils/routes";

const styles = StyleSheet.create({
  root: {
    ...commonStyles.fill,
    paddingTop: spacings[24],
  },
});

type Props = {
  accountId: string;
  accountMembershipId: string;
  canManageAccountMembership: boolean;
  virtualIbansVisible: boolean;
  projectName: string;
  isIndividual: boolean;
};

export const AccountDetailsArea = ({
  accountId,
  accountMembershipId,
  canManageAccountMembership,
  virtualIbansVisible,
  projectName,
  isIndividual,
}: Props) => {
  const route = Router.useRoute([
    "AccountDetailsIban",
    "AccountDetailsVirtualIbans",
    "AccountDetailsSettings",
    "AccountDetailsBilling",
  ]);

  const tabs = useMemo(
    () => [
      {
        label: t("accountDetails.iban.tab"),
        url: Router.AccountDetailsIban({ accountMembershipId }),
      },
      ...(virtualIbansVisible
        ? [
            {
              label: t("accountDetails.virtualIbans.tab"),
              url: Router.AccountDetailsVirtualIbans({ accountMembershipId }),
            },
          ]
        : []),

      ...(!isIndividual
        ? [
            {
              label: t("accountDetails.billing.tab"),
              url: Router.AccountDetailsBilling({ accountMembershipId }),
            },
          ]
        : []),
      {
        label: t("accountDetails.settings.tab"),
        url: Router.AccountDetailsSettings({ accountMembershipId }),
      },
    ],
    [accountMembershipId, virtualIbansVisible, isIndividual],
  );

  return (
    <ResponsiveContainer breakpoint={breakpoints.large} style={styles.root}>
      {({ small, large }) => (
        <>
          <TabView
            sticky={true}
            padding={small ? 24 : 40}
            tabs={tabs}
            otherLabel={t("common.tabs.other")}
          />

          {match(route)
            .with({ name: "AccountDetailsIban" }, () => (
              <AccountDetailsIbanPage accountId={accountId} largeBreakpoint={large} />
            ))
            .with({ name: "AccountDetailsVirtualIbans" }, () => (
              <>
                <Space height={40} />
                <AccountDetailsVirtualIbansPage accountId={accountId} />
              </>
            ))
            .with({ name: "AccountDetailsBilling" }, () => (
              <>
                <Space height={24} />
                <AccountDetailsBillingPage accountId={accountId} />
              </>
            ))
            .with({ name: "AccountDetailsSettings" }, () => (
              <AccountDetailsSettingsPage
                projectName={projectName}
                accountId={accountId}
                largeBreakpoint={large}
                canManageAccountMembership={canManageAccountMembership}
              />
            ))

            .with(P.nullish, () => null)
            .exhaustive()}
        </>
      )}
    </ResponsiveContainer>
  );
};
