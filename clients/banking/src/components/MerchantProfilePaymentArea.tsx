import { AsyncData, Result } from "@swan-io/boxed";
import { Link } from "@swan-io/chicane";
import { useQuery } from "@swan-io/graphql-client";
import { Box } from "@swan-io/lake/src/components/Box";
import { Fill } from "@swan-io/lake/src/components/Fill";
import { FocusTrapRef } from "@swan-io/lake/src/components/FocusTrap";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeSearchField } from "@swan-io/lake/src/components/LakeSearchField";
import { LakeTooltip } from "@swan-io/lake/src/components/LakeTooltip";
import { ListRightPanel } from "@swan-io/lake/src/components/ListRightPanel";
import { PlainListViewPlaceholder } from "@swan-io/lake/src/components/PlainListView";
import { Space } from "@swan-io/lake/src/components/Space";
import { LinkConfig } from "@swan-io/lake/src/components/VirtualizedList";
import { spacings } from "@swan-io/lake/src/constants/design";
import { nullishOrEmptyToUndefined } from "@swan-io/lake/src/utils/nullish";
import { useCallback, useMemo, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import { match, P } from "ts-pattern";
import {
  MerchantPaymentFiltersInput,
  MerchantPaymentFragment,
  MerchantPaymentsDocument,
} from "../graphql/partner";
import { t } from "../utils/i18n";
import { GetRouteParams, Router } from "../utils/routes";
import { Connection } from "./Connection";
import { ErrorView } from "./ErrorView";
import { MerchantProfilePaymentList } from "./MerchantProfilePaymentList";

const styles = StyleSheet.create({
  containerMobile: {
    paddingTop: spacings[24],
    paddingHorizontal: spacings[24],
  },
  filters: {
    paddingHorizontal: spacings[24],
    paddingTop: spacings[24],
    paddingBottom: spacings[12],
  },
  filtersLarge: {
    paddingHorizontal: spacings[40],
  },
});

const PER_PAGE = 20;

type Props = {
  params: GetRouteParams<"AccountMerchantsProfilePaymentsArea">;
  large: boolean;
};

export const MerchantProfilePaymentArea = ({ params, large }: Props) => {
  const { merchantProfileId, accountMembershipId } = params;

  const route = Router.useRoute([
    "AccountMerchantsProfilePaymentsList",
    "AccountMerchantsProfilePaymentsDetails",
  ]);

  const filters: MerchantPaymentFiltersInput = useMemo(() => {
    return {
      status: params.status,
      search: nullishOrEmptyToUndefined(params.search),
    } as const;
  }, [params]);

  const [data, { isLoading, reload, setVariables }] = useQuery(MerchantPaymentsDocument, {
    merchantProfileId,
    first: PER_PAGE,
    filters,
  });

  const panelRef = useRef<FocusTrapRef | null>(null);

  const onActiveRowChange = useCallback(
    (element: HTMLElement) => panelRef.current?.setInitiallyFocusedElement(element),
    [],
  );

  const getRowLink = useCallback(
    ({ item }: LinkConfig<MerchantPaymentFragment, undefined>) => (
      <Link
        to={Router.AccountMerchantsProfilePaymentsDetails({
          accountMembershipId,
          merchantProfileId,
          paymentId: item.id,
        })}
      />
    ),
    [accountMembershipId, merchantProfileId],
  );

  const activePaymentLinkId =
    route?.name === "AccountMerchantsProfilePaymentsDetails"
      ? (route.params.paymentId ?? null)
      : null;

  const [isRefreshing, setIsRefreshing] = useState(false);

  const search = nullishOrEmptyToUndefined(params.search);

  return (
    <>
      {!large && (
        <Box style={styles.containerMobile} alignItems="stretch">
          <LakeTooltip
            content={t("merchantProfile.paymentLink.button.new.disable")} //TODO
            // disabled={shouldEnableNewButton !== Option.Some(false)}
          >
            <LakeButton
              // disabled={!shouldEnableNewButton.getOr(false)}
              size="small"
              icon="add-circle-filled"
              color="current"
              onPress={() =>
                Router.push("AccountMerchantsProfilePaymentLinkList", {
                  new: "true",
                  accountMembershipId,
                  merchantProfileId,
                })
              }
            >
              {t("merchantProfile.payments.button.new")} //TODO
            </LakeButton>
          </LakeTooltip>
        </Box>
      )}

      <Box
        direction="row"
        alignItems="center"
        style={[styles.filters, large && styles.filtersLarge]}
      >
        {large && (
          <>
            <LakeTooltip
              content={t("merchantProfile.paymentLink.button.new.disable")} //TODO
              // disabled={shoul={shouldEnableNewButton !== Option.Some(false)}
            >
              <LakeButton
                // disabled={!shouldEnableNewButton.getOr(false)}
                size="small"
                icon="add-circle-filled"
                color="current"
                onPress={() =>
                  Router.push("AccountMerchantsProfilePaymentLinkList", {
                    new: "true",
                    accountMembershipId,
                    merchantProfileId,
                  })
                }
              >
                {t("merchantProfile.payments.button.new")}
              </LakeButton>
            </LakeTooltip>
            {/* // TODO USE FILL */}
            <Space width={12} />

            <LakeButton
              // disabled={!shouldEnableNewButton.getOr(false)}
              size="small"
              mode="secondary"
              onPress={
                () => {}
                // Router.push("AccountMerchantsProfilePaymentLinkList", {
                //   new: "true",
                //   accountMembershipId,
                //   merchantProfileId,
                // })
              }
            >
              {t("merchantProfile.payments.button.refund")}
            </LakeButton>

            <Space width={12} />
          </>
        )}

        <LakeButton
          ariaLabel={t("common.refresh")}
          mode="secondary"
          size="small"
          icon="arrow-counterclockwise-filled"
          loading={isRefreshing}
          onPress={() => {
            setIsRefreshing(true);
            reload().tap(() => setIsRefreshing(false));
          }}
        />

        <Fill minWidth={16} />

        <Box direction="row" alignItems="center" justifyContent="end" grow={0} shrink={1}>
          <Fill minWidth={16} />

          <LakeSearchField
            initialValue={search ?? ""}
            placeholder={t("common.search")}
            onChangeText={search => {
              Router.replace("AccountMerchantsProfilePaymentsList", {
                ...params,
                search,
              });
            }}
          />
        </Box>
      </Box>

      <Space height={24} />

      {match(data)
        .with(AsyncData.P.NotAsked, AsyncData.P.Loading, () => (
          <PlainListViewPlaceholder
            count={5}
            groupHeaderHeight={48}
            rowHeight={56}
            marginHorizontal={spacings[16]}
          />
        ))
        .with(AsyncData.P.Done(Result.P.Error(P.select())), error => <ErrorView error={error} />)
        .with(AsyncData.P.Done(Result.P.Ok(P.select())), ({ merchantProfile }) => {
          return (
            <Connection connection={merchantProfile?.merchantPayments}>
              {payments => (
                <>
                  <MerchantProfilePaymentList
                    isLoading={isLoading}
                    payments={payments?.edges.map(item => item.node) ?? []}
                    large={large}
                    getRowLink={getRowLink}
                    activeRowId={activePaymentLinkId ?? undefined}
                    onActiveRowChange={onActiveRowChange}
                    onEndReached={() => {
                      if (merchantProfile?.merchantPayments?.pageInfo.hasNextPage ?? false) {
                        setVariables({
                          after: merchantProfile?.merchantPayments?.pageInfo.endCursor ?? undefined,
                        });
                      }
                    }}
                  />

                  {/*   <FullViewportLayer visible={isNotNullish(route?.params.new)}>
               <MerchantProfilePaymentLinkNew
                      accentColor={merchantProfile.accentColor ?? undefined}
                      merchantLogoUrl={merchantProfile.merchantLogoUrl ?? undefined}
                      merchantName={merchantProfile.merchantName}
                      merchantProfileId={merchantProfileId}
                      paymentMethods={merchantProfile.merchantPaymentMethods}
                      paymentLinks={paymentLinks}
                      onPressClose={() =>
                        Router.push("AccountMerchantsProfilePaymentsList", {
                          accountMembershipId,
                          merchantProfileId,
                          new: undefined,
                        })
                      }
                      accountMembershipId={accountMembershipId}
                    />
                  </FullViewportLayer> */}

                  <ListRightPanel
                    ref={panelRef}
                    keyExtractor={item => item.id}
                    activeId={activePaymentLinkId}
                    onActiveIdChange={paymentId =>
                      Router.push("AccountMerchantsProfilePaymentsDetails", {
                        accountMembershipId,
                        merchantProfileId,
                        paymentId,
                      })
                    }
                    onClose={() =>
                      Router.push("AccountMerchantsProfilePaymentsList", {
                        accountMembershipId,
                        merchantProfileId,
                      })
                    }
                    items={payments?.edges.map(item => item.node) ?? []}
                    render={(item, large) => (
                      // <MerchantProfilePaymentsDetail large={large} paymentLinkId={item.id} />
                      <p>detail</p>
                    )}
                    closeLabel={t("common.closeButton")}
                    previousLabel={t("common.previous")}
                    nextLabel={t("common.next")}
                  />
                </>
              )}
            </Connection>
          );
        })
        .exhaustive()}
    </>
  );
};
