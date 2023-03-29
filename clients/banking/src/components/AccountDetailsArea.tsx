import { ErrorBoundary } from "@sentry/react";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { TabView } from "@swan-io/lake/src/components/TabView";
import { TilePlaceholder } from "@swan-io/lake/src/components/TilePlaceholder";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { breakpoints, spacings } from "@swan-io/lake/src/constants/design";
import { Suspense, useMemo } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { P, match } from "ts-pattern";
import { AccountDetailsBillingPage } from "../pages/AccountDetailsBillingPage";
import { AccountDetailsIbanPage } from "../pages/AccountDetailsIbanPage";
import { AccountDetailsSettingsPage } from "../pages/AccountDetailsSettingsPage";
import { AccountDetailsVirtualIbansPage } from "../pages/AccountDetailsVirtualIbansPage";
import { t } from "../utils/i18n";
import { Router } from "../utils/routes";
import { ErrorView } from "./ErrorView";

const styles = StyleSheet.create({
  root: {
    ...commonStyles.fill,
    paddingTop: spacings[24],
  },
  placeholders: {
    paddingTop: spacings[40],
  },
  content: {
    flexShrink: 1,
    flexGrow: 1,
    paddingHorizontal: spacings[24],
    paddingVertical: spacings[20],
    paddingTop: spacings[40],
  },
  contentDesktop: {
    paddingHorizontal: spacings[40],
  },
});

type Props = {
  accountId: string;
  accountMembershipId: string;
  canManageAccountMembership: boolean;
  canManageVirtualIbans: boolean;
  idVerified: boolean;
  projectName: string;
  userStatusIsProcessing: boolean;
  isIndividual: boolean;
};

export const AccountDetailsArea = ({
  accountId,
  accountMembershipId,
  canManageAccountMembership,
  canManageVirtualIbans,
  idVerified,
  projectName,
  userStatusIsProcessing,
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
      ...(canManageVirtualIbans
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
    [accountMembershipId, canManageVirtualIbans, isIndividual],
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

          <ErrorBoundary key={route?.name} fallback={({ error }) => <ErrorView error={error} />}>
            {match(route)
              .with({ name: "AccountDetailsIban" }, () => (
                <ScrollView
                  contentContainerStyle={[styles.content, large && styles.contentDesktop]}
                >
                  <Suspense
                    fallback={
                      <View style={styles.placeholders}>
                        <TilePlaceholder />
                        <Space height={32} />
                        <TilePlaceholder />
                      </View>
                    }
                  >
                    <AccountDetailsIbanPage
                      accountId={accountId}
                      accountMembershipId={accountMembershipId}
                      idVerified={idVerified}
                      userStatusIsProcessing={userStatusIsProcessing}
                    />
                  </Suspense>

                  <Space height={24} />
                </ScrollView>
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
                <ScrollView
                  contentContainerStyle={[styles.content, large && styles.contentDesktop]}
                >
                  <Suspense
                    fallback={
                      <View style={styles.placeholders}>
                        <TilePlaceholder />
                      </View>
                    }
                  >
                    <AccountDetailsSettingsPage
                      projectName={projectName}
                      accountId={accountId}
                      canManageAccountMembership={canManageAccountMembership}
                    />
                  </Suspense>
                </ScrollView>
              ))

              .with(P.nullish, () => null)
              .exhaustive()}
          </ErrorBoundary>
        </>
      )}
    </ResponsiveContainer>
  );
};
