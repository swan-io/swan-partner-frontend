import { AsyncData, Option, Result } from "@swan-io/boxed";
import { useQuery } from "@swan-io/graphql-client";
import { Box } from "@swan-io/lake/src/components/Box";
import { useCrumb } from "@swan-io/lake/src/components/Breadcrumbs";
import { FocusTrapRef } from "@swan-io/lake/src/components/FocusTrap";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LoadingView } from "@swan-io/lake/src/components/LoadingView";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { RightPanel } from "@swan-io/lake/src/components/RightPanel";
import { Space } from "@swan-io/lake/src/components/Space";
import { TabView } from "@swan-io/lake/src/components/TabView";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { breakpoints, spacings } from "@swan-io/lake/src/constants/design";
import { useCallback, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet } from "react-native";
import { P, match } from "ts-pattern";
import { MerchantProfileDocument } from "../graphql/partner";
import { NotFoundPage } from "../pages/NotFoundPage";
import { t } from "../utils/i18n";
import { Router } from "../utils/routes";
import { ErrorView } from "./ErrorView";
import { MerchantProfilePaymentLinkDetail } from "./MerchantProfilePaymentLinkDetail";
import { MerchantProfilePaymentLinksList } from "./MerchantProfilePaymentLinksList";
import { MerchantProfileSettings } from "./MerchantProfileSettings";

const styles = StyleSheet.create({
  root: {
    ...commonStyles.fill,
  },
  button: {
    paddingHorizontal: spacings[24],
    paddingVertical: spacings[12],
  },
  buttonLarge: {
    paddingHorizontal: spacings[40],
    paddingVertical: spacings[12],
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
    "AccountMerchantsProfileSettings",
    "AccountMerchantsProfilePaymentLinkList",
    "AccountMerchantsProfilePaymentLinkDetails",
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

  const tabs = useMemo(
    () => [
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

  const [activePaymentLinkId, setActivePaymentLinkId] = useState<string | null>(null);
  const panelRef = useRef<FocusTrapRef | null>(null);

  const onActiveRowChange = useCallback(
    (element: HTMLElement) => panelRef.current?.setInitiallyFocusedElement(element),
    [],
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
                  .with(
                    { name: "AccountMerchantsProfilePaymentLinkList" },
                    ({ params: { status = "Active", search } }) => (
                      <MerchantProfilePaymentLinksList
                        large={large}
                        merchantProfileId={merchantProfileId}
                        accountMembershipId={accountMembershipId}
                        params={{ status, search: search ?? "" }}
                        getRowLink={({ item }) => (
                          <Pressable onPress={() => setActivePaymentLinkId(item.id)} />
                        )}
                        activeRowId={activePaymentLinkId ?? undefined}
                        onActiveRowChange={onActiveRowChange}
                      />
                    ),
                  )
                  .with(
                    { name: "AccountMerchantsProfilePaymentLinkDetails" },
                    ({ params: { paymentLinkId, accountMembershipId, merchantProfileId } }) => (
                      <RightPanel
                        visible={true}
                        onPressClose={() => {
                          setActivePaymentLinkId(null);
                          Router.push("AccountMerchantsProfilePaymentLinkList", {
                            accountMembershipId,
                            merchantProfileId,
                          });
                        }}
                      >
                        {({ large }) => (
                          <>
                            <Box style={large ? styles.buttonLarge : styles.button}>
                              <LakeButton
                                mode="tertiary"
                                icon="lake-close"
                                ariaLabel={t("common.closeButton")}
                                onPress={() => {
                                  setActivePaymentLinkId(null);
                                  Router.push("AccountMerchantsProfilePaymentLinkList", {
                                    accountMembershipId,
                                    merchantProfileId,
                                  });
                                }}
                                children={null}
                              />
                            </Box>

                            <MerchantProfilePaymentLinkDetail
                              paymentLinkId={paymentLinkId}
                              large={large}
                            />

                            <Space height={24} />
                          </>
                        )}
                      </RightPanel>
                    ),
                  )
                  .with({ name: "AccountMerchantsProfileSettings" }, ({ params }) => (
                    <MerchantProfileSettings
                      params={params}
                      merchantProfile={merchantProfile}
                      large={large}
                      merchantProfileCardVisible={merchantProfileCardVisible}
                      merchantProfileSepaDirectDebitCoreVisible={
                        merchantProfileSepaDirectDebitCoreVisible
                      }
                      merchantProfileSepaDirectDebitB2BVisible={
                        merchantProfileSepaDirectDebitB2BVisible
                      }
                      merchantProfileInternalDirectDebitCoreVisible={
                        merchantProfileInternalDirectDebitCoreVisible
                      }
                      merchantProfileInternalDirectDebitB2BVisible={
                        merchantProfileInternalDirectDebitB2BVisible
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
