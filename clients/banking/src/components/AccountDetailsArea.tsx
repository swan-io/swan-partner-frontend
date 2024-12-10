import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { TabView } from "@swan-io/lake/src/components/TabView";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { breakpoints, spacings } from "@swan-io/lake/src/constants/design";
import { useMemo } from "react";
import { StyleSheet } from "react-native";
import { P, match } from "ts-pattern";
import { AccountLanguage } from "../graphql/partner";
import { usePermissions } from "../hooks/usePermissions";
import { AccountDetailsBillingPage } from "../pages/AccountDetailsBillingPage";
// import { AccountDetailsIbanPage } from "../pages/AccountDetailsIbanPage";
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
  accountMembershipLanguage: AccountLanguage;
  accountId: string;
  accountMembershipId: string;
  isIndividual: boolean;
};

export const AccountDetailsArea = ({
  accountMembershipLanguage,
  accountId,
  accountMembershipId,
  isIndividual,
}: Props) => {
  const { canReadVirtualIBAN } = usePermissions();
  const route = Router.useRoute([
    "AccountDetailsIban",
    "AccountDetailsVirtualIbans",
    "AccountDetailsSettings",
    "AccountDetailsBilling",
  ]);

  const tabs = useMemo(
    () => [
      // keep this commented out as iban is handled in Assoconnect App
      // {
      //   label: t("accountDetails.iban.tab"),
      //   url: Router.AccountDetailsIban({ accountMembershipId }),
      // },
      ...(canReadVirtualIBAN
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
    [accountMembershipId, canReadVirtualIBAN, isIndividual],
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
            //  Keep return null as iban is handled in Assoconnect App
            .with({ name: "AccountDetailsIban" }, () => null)
            .with({ name: "AccountDetailsVirtualIbans" }, () => (
              <>
                <Space height={40} />
                <AccountDetailsVirtualIbansPage accountId={accountId} large={large} />
              </>
            ))
            .with({ name: "AccountDetailsBilling" }, () => (
              <>
                <Space height={24} />
                <AccountDetailsBillingPage accountId={accountId} large={large} />
              </>
            ))
            .with({ name: "AccountDetailsSettings" }, () => (
              <AccountDetailsSettingsPage
                accountMembershipLanguage={accountMembershipLanguage}
                accountId={accountId}
                largeBreakpoint={large}
              />
            ))

            .with(P.nullish, () => null)
            .exhaustive()}
        </>
      )}
    </ResponsiveContainer>
  );
};
