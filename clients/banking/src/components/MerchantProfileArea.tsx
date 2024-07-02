import { AsyncData, Result } from "@swan-io/boxed";
import { useQuery } from "@swan-io/graphql-client";
import { LoadingView } from "@swan-io/lake/src/components/LoadingView";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { TabView } from "@swan-io/lake/src/components/TabView";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { breakpoints, spacings } from "@swan-io/lake/src/constants/design";
import { useMemo } from "react";
import { StyleSheet } from "react-native";
import { P, match } from "ts-pattern";
import { MerchantProfileDocument } from "../graphql/partner";
import { NotFoundPage } from "../pages/NotFoundPage";
import { t } from "../utils/i18n";
import { Router } from "../utils/routes";
import { ErrorView } from "./ErrorView";
import { MerchantProfileSettings } from "./MerchantProfileSettings";

const styles = StyleSheet.create({
  root: {
    ...commonStyles.fill,
    paddingTop: spacings[24],
  },
});

type Props = {
  accountMembershipId: string;
  merchantProfileId: string;
  merchantProfileCardVisible: boolean;
  merchantProfileSepaDirectDebitCoreVisible: boolean;
  merchantProfileSepaDirectDebitB2BVisible: boolean;
  merchantProfileInternalDirectDebitCoreVisible: boolean;
  merchantProfileInternalDirectDebitB2BVisible: boolean;
  merchantProfileCheckVisible: boolean;
};

export const AccountMerchantsProfileArea = ({
  accountMembershipId,
  merchantProfileId,
  merchantProfileCardVisible,
  merchantProfileSepaDirectDebitCoreVisible,
  merchantProfileSepaDirectDebitB2BVisible,
  merchantProfileInternalDirectDebitCoreVisible,
  merchantProfileInternalDirectDebitB2BVisible,
  merchantProfileCheckVisible,
}: Props) => {
  const route = Router.useRoute([
    "AccountMerchantsProfilePaymentsArea",
    "AccountMerchantsProfilePaymentLinksArea",
    "AccountMerchantsProfileSettings",
  ]);

  const [merchantProfile, { refresh }] = useQuery(MerchantProfileDocument, { merchantProfileId });

  const tabs = useMemo(
    () => [
      {
        label: t("merchantProfile.area.payments"),
        url: Router.AccountMerchantsProfilePaymentsRoot({ accountMembershipId, merchantProfileId }),
      },
      {
        label: t("merchantProfile.area.paymentLinks"),
        url: Router.AccountMerchantsProfilePaymentLinksRoot({
          accountMembershipId,
          merchantProfileId,
        }),
      },
      {
        label: t("merchantProfile.area.settings"),
        url: Router.AccountMerchantsProfileSettings({ accountMembershipId, merchantProfileId }),
      },
    ],
    [accountMembershipId, merchantProfileId],
  );

  return (
    <ResponsiveContainer breakpoint={breakpoints.medium} style={styles.root}>
      {({ small, large }) =>
        match(merchantProfile)
          .with(AsyncData.P.NotAsked, AsyncData.P.Loading, () => <LoadingView />)
          .with(AsyncData.P.Done(Result.P.Error(P.select())), error => <ErrorView error={error} />)
          .with(AsyncData.P.Done(Result.P.Ok({ merchantProfile: P.nullish })), () => (
            <NotFoundPage />
          ))
          .with(
            AsyncData.P.Done(Result.P.Ok({ merchantProfile: P.select(P.nonNullable) })),
            merchantProfile => (
              <>
                <TabView
                  sticky={true}
                  padding={small ? 24 : 40}
                  tabs={tabs}
                  otherLabel={t("common.tabs.other")}
                />

                {match(route)
                  .with({ name: "AccountMerchantsProfilePaymentsArea" }, () => null)
                  .with({ name: "AccountMerchantsProfilePaymentLinksArea" }, () => null)
                  .with({ name: "AccountMerchantsProfileSettings" }, () => (
                    <MerchantProfileSettings
                      merchantProfile={merchantProfile}
                      large={large}
                      merchantProfileCardVisible={merchantProfileCardVisible}
                      merchantProfileSepaDirectDebitCoreVisible={
                        merchantProfileInternalDirectDebitB2BVisible
                      }
                      merchantProfileSepaDirectDebitB2BVisible={
                        merchantProfileInternalDirectDebitCoreVisible
                      }
                      merchantProfileInternalDirectDebitCoreVisible={
                        merchantProfileSepaDirectDebitB2BVisible
                      }
                      merchantProfileInternalDirectDebitB2BVisible={
                        merchantProfileSepaDirectDebitCoreVisible
                      }
                      merchantProfileCheckVisible={merchantProfileCheckVisible}
                      onUpdate={() => {
                        refresh();
                      }}
                    />
                  ))
                  .with(P.nullish, () => <NotFoundPage />)
                  .exhaustive()}
              </>
            ),
          )
          .exhaustive()
      }
    </ResponsiveContainer>
  );
};
