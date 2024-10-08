import { AsyncData, Result } from "@swan-io/boxed";
import { useQuery } from "@swan-io/graphql-client";
import { Box } from "@swan-io/lake/src/components/Box";
import { LinkConfig, PlainListViewPlaceholder } from "@swan-io/lake/src/components/FixedListView";
import { FocusTrapRef } from "@swan-io/lake/src/components/FocusTrap";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { Link } from "@swan-io/lake/src/components/Link";
import { RightPanel } from "@swan-io/lake/src/components/RightPanel";
import { Space } from "@swan-io/lake/src/components/Space";
import { spacings } from "@swan-io/lake/src/constants/design";
import { nullishOrEmptyToUndefined } from "@swan-io/lake/src/utils/nullish";
import { useCallback, useMemo, useRef } from "react";
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
import { MerchantProfilePaymentLinksList } from "./MerchantProfilePaymentLinksList";

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: spacings[24],
    paddingVertical: spacings[12],
  },
  buttonLarge: {
    paddingHorizontal: spacings[40],
    paddingVertical: spacings[12],
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
      ? route.params.paymentLinkId
      : undefined;

  return (
    <>
      {match(data)
        .with(AsyncData.P.NotAsked, AsyncData.P.Loading, () => (
          <PlainListViewPlaceholder
            count={5}
            rowVerticalSpacing={0}
            groupHeaderHeight={48}
            rowHeight={56}
          />
        ))
        .with(AsyncData.P.Done(Result.P.Error(P.select())), error => <ErrorView error={error} />)
        .with(AsyncData.P.Done(Result.P.Ok(P.select())), ({ merchantProfile }) => (
          <Connection connection={merchantProfile?.merchantPaymentLinks}>
            {paymentLinks => (
              <>
                <MerchantProfilePaymentLinksList
                  isLoading={isLoading}
                  onPressReload={reload}
                  paymentLinks={paymentLinks?.edges.map(item => item.node) ?? []}
                  large={large}
                  merchantProfileId={merchantProfileId}
                  accountMembershipId={accountMembershipId}
                  params={{ status: params.status, search: params.search ?? "" }}
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

                {match(route)
                  .with(
                    { name: "AccountMerchantsProfilePaymentLinkDetails" },
                    ({ params: { paymentLinkId, accountMembershipId, merchantProfileId } }) => (
                      <RightPanel
                        visible={true}
                        onPressClose={() => {
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
                  .otherwise(() => null)}
              </>
            )}
          </Connection>
        ))
        .exhaustive()}
    </>
  );
};
