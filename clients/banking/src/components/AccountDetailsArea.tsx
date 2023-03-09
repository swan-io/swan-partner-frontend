import * as Sentry from "@sentry/react";
import { LakeScrollView } from "@swan-io/lake/src/components/LakeScrollView";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { TabView } from "@swan-io/lake/src/components/TabView";
import { TilePlaceholder } from "@swan-io/lake/src/components/TilePlaceholder";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { backgroundColor, breakpoints, spacings } from "@swan-io/lake/src/constants/design";
import { Suspense, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { match, P } from "ts-pattern";
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
  },
  container: {
    backgroundColor: backgroundColor.default,
    flexShrink: 1,
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: spacings[24],
    paddingVertical: spacings[24],
    zIndex: 1, // TODO: Remove relying on zIndex for that
  },
  headerDesktop: {
    paddingHorizontal: spacings[40],
  },
  placeholders: {
    paddingTop: spacings[40],
  },
  content: {
    flexShrink: 1,
    flexGrow: 1,
    paddingHorizontal: spacings[24],
    paddingVertical: spacings[20],
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
      {({ large }) => (
        <View style={styles.container}>
          <View style={[styles.header, large && styles.headerDesktop]}>
            <TabView tabs={tabs} otherLabel={t("common.tabs.other")} />
          </View>

          <Sentry.ErrorBoundary
            key={route?.name}
            fallback={({ error }) => <ErrorView error={error} />}
          >
            {match(route)
              .with({ name: "AccountDetailsIban" }, () => (
                <LakeScrollView
                  contentContainerStyle={[styles.content, large && styles.contentDesktop]}
                  horizontalSafeArea={0}
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
                </LakeScrollView>
              ))
              .with({ name: "AccountDetailsVirtualIbans" }, () => (
                <AccountDetailsVirtualIbansPage accountId={accountId} />
              ))
              .with({ name: "AccountDetailsBilling" }, () => (
                <Suspense
                  fallback={
                    <View style={styles.placeholders}>
                      <TilePlaceholder />
                    </View>
                  }
                >
                  <AccountDetailsBillingPage accountId={accountId} />
                </Suspense>
              ))
              .with({ name: "AccountDetailsSettings" }, () => (
                <LakeScrollView
                  contentContainerStyle={[styles.content, large && styles.contentDesktop]}
                  horizontalSafeArea={0}
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
                </LakeScrollView>
              ))

              .with(P.nullish, () => null)
              .exhaustive()}
          </Sentry.ErrorBoundary>
        </View>
      )}
    </ResponsiveContainer>
  );
};
