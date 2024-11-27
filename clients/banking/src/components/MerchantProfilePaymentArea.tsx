import { Array, AsyncData, Option, Result } from "@swan-io/boxed";
import { Link } from "@swan-io/chicane";
import { useQuery } from "@swan-io/graphql-client";
import { AutoWidthImage } from "@swan-io/lake/src/components/AutoWidthImage";
import { BorderedIcon } from "@swan-io/lake/src/components/BorderedIcon";
import { Box } from "@swan-io/lake/src/components/Box";
import { FocusTrapRef } from "@swan-io/lake/src/components/FocusTrap";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LakeTooltip } from "@swan-io/lake/src/components/LakeTooltip";
import { ListRightPanel } from "@swan-io/lake/src/components/ListRightPanel";
import { PlainListViewPlaceholder } from "@swan-io/lake/src/components/PlainListView";
import { Space } from "@swan-io/lake/src/components/Space";
import { LinkConfig } from "@swan-io/lake/src/components/VirtualizedList";
import { spacings } from "@swan-io/lake/src/constants/design";
import { useDisclosure } from "@swan-io/lake/src/hooks/useDisclosure";
import { isNotNullish, nullishOrEmptyToUndefined } from "@swan-io/lake/src/utils/nullish";
import { useCallback, useMemo, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import { match, P } from "ts-pattern";
import {
  MerchantPaymentFragment,
  MerchantPaymentMethodType,
  MerchantPaymentsDocument,
  MerchantPaymentsQuery,
} from "../graphql/partner";
import { t } from "../utils/i18n";
import { GetRouteParams, Router } from "../utils/routes";
import { Connection } from "./Connection";
import { ErrorView } from "./ErrorView";
import { MerchantProfilePaymentDetail } from "./MerchantProfilePaymentDetail";
import { MerchantProfilePaymentList } from "./MerchantProfilePaymentList";
import {
  MerchantPaymentFilters,
  MerchantProfilePaymentListFilter,
} from "./MerchantProfilePaymentListFilter";
import { MerchantProfilePaymentPicker } from "./MerchantProfilePaymentPicker";

const styles = StyleSheet.create({
  filters: {
    paddingHorizontal: spacings[24],
    paddingTop: spacings[24],
    paddingBottom: spacings[12],
  },
  filtersLarge: {
    paddingHorizontal: spacings[40],
  },
  centered: {
    marginHorizontal: "auto",
  },
});

const PER_PAGE = 20;

const ALLOWED_PAYMENT_METHODS = new Set<MerchantPaymentMethodType>([
  "Card",
  "SepaDirectDebitB2b",
  "SepaDirectDebitCore",
]);

type EmptyListWithCreatePaymentCtaProps = {
  merchantProfile: MerchantPaymentsQuery["merchantProfile"];
  setPickerModal: {
    open: () => void;
    close: () => void;
    toggle: () => void;
  };
};

const EmptyListWithCreatePaymentCta = ({
  merchantProfile,
  setPickerModal,
}: EmptyListWithCreatePaymentCtaProps) => {
  return (
    <Box justifyContent="center">
      {isNotNullish(merchantProfile?.merchantLogoUrl) ? (
        <AutoWidthImage
          alt={merchantProfile.merchantName}
          height={40}
          maxWidth={180}
          resizeMode="contain"
          sourceUri={merchantProfile.merchantLogoUrl}
          style={styles.centered}
        />
      ) : (
        <LakeHeading variant="h3" level={3} align="center">
          {merchantProfile?.merchantName}
        </LakeHeading>
      )}

      <Space height={24} />

      <LakeText variant="medium" align="center">
        {t("merchantProfile.payments.newPayment.title")}
      </LakeText>

      <LakeText variant="light" align="center">
        {t("merchantProfile.payments.newPayment.subtitle")}
      </LakeText>

      <Space height={24} />

      <LakeButton color="current" onPress={setPickerModal.open}>
        {t("merchantProfile.payments.newPayment.button")}
      </LakeButton>
    </Box>
  );
};

type EmptyPaymentListWithPaymentMethodCtaProps = {
  accountMembershipId: string;
  merchantProfileId: string;
};
const EmptyListWithEnablePaymentMethodCta = ({
  accountMembershipId,
  merchantProfileId,
}: EmptyPaymentListWithPaymentMethodCtaProps) => {
  return (
    <Box alignItems="center">
      <BorderedIcon name="lake-merchant" />
      <Space height={24} />

      <LakeText variant="medium" align="center">
        {t("merchantProfile.payments.enablePaymentMethod.title")}
      </LakeText>

      <LakeText variant="light" align="center">
        {t("merchantProfile.payments.enablePaymentMethod.subtitle")}
      </LakeText>

      <Space height={24} />

      <LakeButton
        color="current"
        onPress={() =>
          Router.push("AccountMerchantsProfileSettings", {
            accountMembershipId,
            merchantProfileId,
          })
        }
      >
        {t("merchantProfile.payments.enablePaymentMethod.button")}
      </LakeButton>
    </Box>
  );
};

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

  const filters: MerchantPaymentFilters = useMemo(() => {
    return {
      paymentMethod: isNotNullish(params.paymentMethod)
        ? Array.filterMap(params.paymentMethod, item =>
            match(item)
              .with(
                "Card",
                "Check",
                "SepaDirectDebitB2b",
                "SepaDirectDebitCore",
                "InternalDirectDebitStandard",
                "InternalDirectDebitB2b",
                value => Option.Some(value),
              )
              .otherwise(() => Option.None()),
          )
        : undefined,
      status: isNotNullish(params.status)
        ? Array.filterMap(params.status, item =>
            match(item)
              .with("Authorized", "Captured", "Initiated", "Rejected", item => Option.Some(item))
              .otherwise(() => Option.None()),
          )
        : undefined,
    } as const;
  }, [params.paymentMethod, params.status]);

  const [data, { isLoading, reload, setVariables }] = useQuery(MerchantPaymentsDocument, {
    merchantProfileId,
    filters,
    first: PER_PAGE,
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

  const { shouldEnableCheckTile, shouldEnablePaymentLinkTile } = useMemo(() => {
    const enabledPaymentMethods = data
      .toOption()
      .flatMap(result => result.toOption())
      .flatMap(({ merchantProfile }) =>
        Option.fromNullable(merchantProfile?.merchantPaymentMethods),
      )
      .map(methods => methods.filter(method => method.statusInfo.status === "Enabled"));

    return {
      shouldEnableCheckTile: enabledPaymentMethods
        .map(methods => methods.some(method => method.type === "Check"))
        .getOr(false),

      shouldEnablePaymentLinkTile: enabledPaymentMethods
        .map(methods => methods.some(method => ALLOWED_PAYMENT_METHODS.has(method.type)))

        .getOr(false),
    };
  }, [data]);

  const [pickerVisible, setPickerModal] = useDisclosure(false);

  const search = nullishOrEmptyToUndefined(params.search);

  const [shouldShowTopbar, setShouldShowTopbar] = useState(
    data
      .toOption()
      .flatMap(result => result.toOption())
      .map(data => (data.merchantProfile?.merchantPayments?.edges.length ?? 0) > 0)
      .getOr(true),
  );

  return (
    <>
      {shouldShowTopbar && (
        <>
          <Box style={[styles.filters, large && styles.filtersLarge]}>
            <MerchantProfilePaymentListFilter
              large={large}
              filters={filters}
              search={search}
              onRefresh={reload}
              onChangeFilters={({ status, ...filters }) => {
                Router.replace("AccountMerchantsProfilePaymentsList", {
                  ...params,
                  accountMembershipId,
                  status,
                  ...filters,
                });
              }}
              onChangeSearch={search => {
                Router.replace("AccountMerchantsProfilePaymentsList", {
                  ...params,
                  accountMembershipId,
                  search,
                });
              }}
            >
              <LakeTooltip
                content={t("merchantProfile.paymentLink.button.new.disable")}
                disabled={shouldEnablePaymentLinkTile || shouldEnableCheckTile}
              >
                <LakeButton
                  disabled={!shouldEnablePaymentLinkTile || !shouldEnableCheckTile}
                  size="small"
                  icon="add-circle-filled"
                  color="current"
                  onPress={() => {
                    setShouldShowTopbar(false);
                    setPickerModal.open();
                  }}
                >
                  {t("merchantProfile.payments.button.new")}
                </LakeButton>
              </LakeTooltip>
            </MerchantProfilePaymentListFilter>
          </Box>
        </>
      )}

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
            <>
              {pickerVisible && isNotNullish(merchantProfile) ? (
                <MerchantProfilePaymentPicker
                  setPickerModal={setPickerModal}
                  setShouldShowTopbar={setShouldShowTopbar}
                  params={params}
                  shouldEnableCheckTile={shouldEnableCheckTile}
                  shouldEnablePaymentLinkTile={shouldEnablePaymentLinkTile}
                  merchantProfile={merchantProfile}
                />
              ) : (
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
                              after:
                                merchantProfile?.merchantPayments?.pageInfo.endCursor ?? undefined,
                            });
                          }
                        }}
                        renderEmptyList={() =>
                          shouldEnablePaymentLinkTile || shouldEnableCheckTile ? (
                            <EmptyListWithCreatePaymentCta
                              merchantProfile={merchantProfile}
                              setPickerModal={setPickerModal}
                            />
                          ) : (
                            <EmptyListWithEnablePaymentMethodCta
                              accountMembershipId={accountMembershipId}
                              merchantProfileId={merchantProfileId}
                            />
                            // <EmptyView
                            //   icon="lake-transfer"
                            //   borderedIcon={true}
                            //   title={t("merchantProfile.payments.noResults")}
                            // />
                          )
                        }
                      />

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
                          <MerchantProfilePaymentDetail
                            paymentLinkId={item.paymentLinkId}
                            paymentId={item.id}
                            large={large}
                          />
                        )}
                        closeLabel={t("common.closeButton")}
                        previousLabel={t("common.previous")}
                        nextLabel={t("common.next")}
                      />
                    </>
                  )}
                </Connection>
              )}
            </>
          );
        })
        .exhaustive()}
    </>
  );
};
