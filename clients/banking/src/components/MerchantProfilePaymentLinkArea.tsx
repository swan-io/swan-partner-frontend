import { AsyncData, Result } from "@swan-io/boxed";
import { Link } from "@swan-io/chicane";
import { useQuery } from "@swan-io/graphql-client";
import { Box } from "@swan-io/lake/src/components/Box";
import { Fill } from "@swan-io/lake/src/components/Fill";
import { FocusTrapRef } from "@swan-io/lake/src/components/FocusTrap";
import { FullViewportLayer } from "@swan-io/lake/src/components/FullViewportLayer";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeSearchField } from "@swan-io/lake/src/components/LakeSearchField";
import { ListRightPanel } from "@swan-io/lake/src/components/ListRightPanel";
import { PlainListViewPlaceholder } from "@swan-io/lake/src/components/PlainListView";
import { Space } from "@swan-io/lake/src/components/Space";
import { Toggle } from "@swan-io/lake/src/components/Toggle";
import { LinkConfig } from "@swan-io/lake/src/components/VirtualizedList";
import { spacings } from "@swan-io/lake/src/constants/design";
import { isNotNullish, nullishOrEmptyToUndefined } from "@swan-io/lake/src/utils/nullish";
import { useCallback, useMemo, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import { P, match } from "ts-pattern";
import {
  MerchantPaymentLinkFiltersInput,
  MerchantPaymentLinksDocument,
  PaymentLinkFragment,
} from "../graphql/partner";
import { t } from "../utils/i18n";
import { Router } from "../utils/routes";
import { Connection } from "./Connection";
import { ErrorView } from "./ErrorView";
import { MerchantProfilePaymentLinkDetail } from "./MerchantProfilePaymentLinkDetail";
import { MerchantProfilePaymentLinkNew } from "./MerchantProfilePaymentLinkNew";
import { MerchantProfilePaymentLinksList } from "./MerchantProfilePaymentLinksList";

const styles = StyleSheet.create({
  containerMobile: { paddingTop: spacings[24], paddingHorizontal: spacings[24] },
  filters: {
    paddingHorizontal: spacings[24],
    paddingTop: spacings[24],
    paddingBottom: spacings[12],
  },
  filtersLarge: {
    paddingHorizontal: spacings[40],
  },
  endFilters: {
    flexGrow: 0,
    flexShrink: 1,
  },
});

const PER_PAGE = 20;

type Props = {
  accountMembershipId: string;
  merchantProfileId: string;
  params: { status: "Active" | "Archived"; search: string };
  large: boolean;
};
export const MerchantProfilePaymentLinkArea = ({
  accountMembershipId,
  merchantProfileId,
  params,
  large,
}: Props) => {
  const route = Router.useRoute([
    "AccountMerchantsProfilePaymentLinkList",
    "AccountMerchantsProfilePaymentLinkDetails",
  ]);
  const filters: MerchantPaymentLinkFiltersInput = useMemo(() => {
    return {
      status: match(params.status)
        .with("Active", () => ["Active" as const])
        .with("Archived", () => ["Completed" as const, "Expired" as const])
        .exhaustive(),
      search: nullishOrEmptyToUndefined(params.search),
    } as const;
  }, [params.search, params.status]);

  const [data, { isLoading, reload, setVariables }] = useQuery(MerchantPaymentLinksDocument, {
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
    ({ item }: LinkConfig<PaymentLinkFragment, undefined>) => (
      <Link
        to={Router.AccountMerchantsProfilePaymentLinkDetails({
          accountMembershipId,
          merchantProfileId,
          paymentLinkId: item.id,
        })}
      />
    ),
    [accountMembershipId, merchantProfileId],
  );

  const activePaymentLinkId =
    route?.name === "AccountMerchantsProfilePaymentLinkDetails"
      ? (route.params.paymentLinkId ?? null)
      : null;

  const [isRefreshing, setIsRefreshing] = useState(false);

  const search = nullishOrEmptyToUndefined(params.search);

  return (
    <>
      {!large && (
        <Box style={styles.containerMobile} alignItems="stretch">
          <LakeButton
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
            {t("merchantProfile.paymentLink.button.new")}
          </LakeButton>
        </Box>
      )}

      <Box
        direction="row"
        alignItems="center"
        style={[styles.filters, large && styles.filtersLarge]}
      >
        {large && (
          <>
            <LakeButton
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
              {t("merchantProfile.paymentLink.button.new")}
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

        <Box direction="row" alignItems="center" justifyContent="end" style={styles.endFilters}>
          <Toggle
            mode={large ? "desktop" : "mobile"}
            value={params.status === "Active"}
            onToggle={status =>
              Router.push("AccountMerchantsProfilePaymentLinkList", {
                accountMembershipId,
                merchantProfileId,
                status: status ? "Active" : "Archived",
              })
            }
            onLabel={t("merchantProfile.list.Active")}
            offLabel={t("merchantProfile.list.Inactive")}
          />

          <Fill minWidth={16} />

          <LakeSearchField
            initialValue={search ?? ""}
            placeholder={t("common.search")}
            onChangeText={search => {
              Router.replace("AccountMerchantsProfilePaymentLinkList", {
                accountMembershipId,
                merchantProfileId,
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
          <PlainListViewPlaceholder count={5} groupHeaderHeight={48} rowHeight={56} />
        ))
        .with(AsyncData.P.Done(Result.P.Error(P.select())), error => <ErrorView error={error} />)
        .with(AsyncData.P.Done(Result.P.Ok(P.select())), ({ merchantProfile }) => (
          <Connection connection={merchantProfile?.merchantPaymentLinks}>
            {paymentLinks => (
              <>
                <MerchantProfilePaymentLinksList
                  isLoading={isLoading}
                  paymentLinks={paymentLinks?.edges.map(item => item.node) ?? []}
                  large={large}
                  getRowLink={getRowLink}
                  activeRowId={activePaymentLinkId ?? undefined}
                  onActiveRowChange={onActiveRowChange}
                  onEndReached={() => {
                    if (merchantProfile?.merchantPaymentLinks?.pageInfo.hasNextPage ?? false) {
                      setVariables({
                        after:
                          merchantProfile?.merchantPaymentLinks?.pageInfo.endCursor ?? undefined,
                      });
                    }
                  }}
                />

                {isNotNullish(merchantProfile) &&
                isNotNullish(merchantProfile.merchantPaymentMethods) ? (
                  <FullViewportLayer visible={isNotNullish(route?.params.new)}>
                    <MerchantProfilePaymentLinkNew
                      accentColor={merchantProfile.accentColor ?? undefined}
                      merchantLogoUrl={merchantProfile.merchantLogoUrl ?? undefined}
                      merchantName={merchantProfile.merchantName ?? undefined}
                      accountMembershipId={accountMembershipId}
                      merchantProfileId={merchantProfileId}
                      paymentMethods={merchantProfile.merchantPaymentMethods}
                      onPressClose={() =>
                        Router.push("AccountMerchantsProfilePaymentLinkList", {
                          accountMembershipId,
                          merchantProfileId,
                          new: undefined,
                        })
                      }
                    />
                  </FullViewportLayer>
                ) : null}

                <ListRightPanel
                  ref={panelRef}
                  keyExtractor={item => item.id}
                  activeId={activePaymentLinkId}
                  onActiveIdChange={paymentLinkId =>
                    Router.push("AccountMerchantsProfilePaymentLinkDetails", {
                      accountMembershipId,
                      merchantProfileId,
                      paymentLinkId,
                    })
                  }
                  onClose={() =>
                    Router.push("AccountMerchantsProfilePaymentLinkList", {
                      accountMembershipId,
                      merchantProfileId,
                    })
                  }
                  items={paymentLinks?.edges.map(item => item.node) ?? []}
                  render={(item, large) => (
                    <MerchantProfilePaymentLinkDetail large={large} paymentLinkId={item.id} />
                  )}
                  closeLabel={t("common.closeButton")}
                  previousLabel={t("common.previous")}
                  nextLabel={t("common.next")}
                />
              </>
            )}
          </Connection>
        ))
        .exhaustive()}
    </>
  );
};
