import { AsyncData, Option, Result } from "@swan-io/boxed";
import { useQuery } from "@swan-io/graphql-client";
import { useCrumb } from "@swan-io/lake/src/components/Breadcrumbs";
import { LoadingView } from "@swan-io/lake/src/components/LoadingView";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { TabView } from "@swan-io/lake/src/components/TabView";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { breakpoints } from "@swan-io/lake/src/constants/design";
import { useMemo } from "react";
import { StyleSheet } from "react-native";
import { P, match } from "ts-pattern";
import { MerchantPaymentMethodType, MerchantProfileDocument } from "../graphql/partner";
import { NotFoundPage } from "../pages/NotFoundPage";
import { t } from "../utils/i18n";
import { Router } from "../utils/routes";
import { ErrorView } from "./ErrorView";
import { MerchantProfilePaymentArea } from "./MerchantProfilePaymentArea";
import { MerchantProfilePaymentLinkArea } from "./MerchantProfilePaymentLinkArea";
import { MerchantProfilePaymentPicker } from "./MerchantProfilePaymentPicker";
import { MerchantProfileSettings } from "./MerchantProfileSettings";

const styles = StyleSheet.create({
  root: {
    ...commonStyles.fill,
  },
});

const ALLOWED_PAYMENT_METHODS = new Set<MerchantPaymentMethodType>([
  "Card",
  "SepaDirectDebitB2b",
  "SepaDirectDebitCore",
]);

type Props = {
  accountMembershipId: string;
  merchantProfileId: string;
};

export const AccountMerchantsProfileArea = ({ accountMembershipId, merchantProfileId }: Props) => {
  const route = Router.useRoute([
    "AccountMerchantsProfilePaymentsArea",
    "AccountMerchantsProfileSettings",
    "AccountMerchantsProfilePaymentLinkArea",
    "AccountMerchantsProfilePaymentsPicker",
  ]);

  const [merchantProfile, { refresh }] = useQuery(MerchantProfileDocument, { merchantProfileId });

  useCrumb(
    useMemo(() => {
      return merchantProfile
        .toOption()
        .flatMap(result => result.toOption())
        .flatMap(merchantProfile => Option.fromNullable(merchantProfile.merchantProfile))
        .map(merchantProfile => ({
          label: merchantProfile.merchantName,
          link: Router.AccountMerchantsProfileSettings({ accountMembershipId, merchantProfileId }),
        }))
        .toUndefined();
    }, [merchantProfile, accountMembershipId, merchantProfileId]),
  );

  const { shouldEnableCheckTile, shouldEnablePaymentLinkTile } = useMemo(() => {
    const enabledPaymentMethods = merchantProfile
      .toOption()
      .flatMap(result => result.toOption())
      .flatMap(({ merchantProfile }) =>
        Option.fromNullable(merchantProfile?.merchantPaymentMethods),
      )
      .map(methods => methods.filter(method => method.statusInfo.status === "Enabled"))
      .getOr([]);

    return {
      shouldEnableCheckTile: enabledPaymentMethods.some(method => method.type === "Check"),
      shouldEnablePaymentLinkTile: enabledPaymentMethods.some(method =>
        ALLOWED_PAYMENT_METHODS.has(method.type),
      ),
    };
  }, [merchantProfile]);

  const tabs = useMemo(
    () => [
      {
        label: t("merchantProfile.tab.payments"),
        url: Router.AccountMerchantsProfilePaymentsList({
          accountMembershipId,
          merchantProfileId,
        }),
      },
      {
        label: t("merchantProfile.tab.paymentLinks"),
        url: Router.AccountMerchantsProfilePaymentLinkList({
          accountMembershipId,
          merchantProfileId,
        }),
      },
      {
        label: t("merchantProfile.tab.settings"),
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
          .with(
            AsyncData.P.Done(Result.P.Ok({ merchantProfile: P.select(P.nonNullable) })),
            merchantProfile => (
              <>
                {route?.name === "AccountMerchantsProfilePaymentsPicker" ? (
                  <MerchantProfilePaymentPicker
                    params={route.params}
                    shouldEnableCheckTile={shouldEnableCheckTile}
                    shouldEnablePaymentLinkTile={shouldEnablePaymentLinkTile}
                    merchantProfile={merchantProfile}
                  />
                ) : (
                  <>
                    <TabView
                      sticky={true}
                      padding={small ? 24 : 40}
                      tabs={tabs}
                      otherLabel={t("common.tabs.other")}
                    />

                    {match(route)
                      .with({ name: "AccountMerchantsProfileSettings" }, ({ params }) => (
                        <MerchantProfileSettings
                          params={params}
                          merchantProfile={merchantProfile}
                          large={large}
                          onUpdate={() => {
                            refresh();
                          }}
                        />
                      ))
                      .with({ name: "AccountMerchantsProfilePaymentLinkArea" }, ({ params }) => (
                        <MerchantProfilePaymentLinkArea large={large} params={params} />
                      ))
                      .with({ name: "AccountMerchantsProfilePaymentsArea" }, ({ params }) => (
                        <MerchantProfilePaymentArea
                          large={large}
                          params={params}
                          shouldEnableCheckTile={shouldEnableCheckTile}
                          shouldEnablePaymentLinkTile={shouldEnablePaymentLinkTile}
                        />
                      ))
                      .with(P.nullish, () => <NotFoundPage />)
                      .exhaustive()}
                  </>
                )}
              </>
            ),
          )
          .with(AsyncData.P.Done(Result.P.Ok(P._)), () => <NotFoundPage />)
          .exhaustive()
      }
    </ResponsiveContainer>
  );
};
