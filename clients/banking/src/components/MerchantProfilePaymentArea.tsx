import { Array, AsyncData, Option, Result } from "@swan-io/boxed";
import { Link } from "@swan-io/chicane";
import { useQuery } from "@swan-io/graphql-client";
import { AutoWidthImage } from "@swan-io/lake/src/components/AutoWidthImage";
import { BorderedIcon } from "@swan-io/lake/src/components/BorderedIcon";
import { Box } from "@swan-io/lake/src/components/Box";
import { EmptyView } from "@swan-io/lake/src/components/EmptyView";
import { FocusTrapRef } from "@swan-io/lake/src/components/FocusTrap";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LakeTooltip } from "@swan-io/lake/src/components/LakeTooltip";
import { ListRightPanel } from "@swan-io/lake/src/components/ListRightPanel";
import { PlainListViewPlaceholder } from "@swan-io/lake/src/components/PlainListView";
import { Space } from "@swan-io/lake/src/components/Space";
import { LinkConfig } from "@swan-io/lake/src/components/VirtualizedList";
import { colors, spacings } from "@swan-io/lake/src/constants/design";
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
import { usePermissions } from "../hooks/usePermissions";
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

type Action = {
  actionType: "canCreatePayment" | "shouldEnablePaymentMethod" | "waitingForReview";
  title: string;
  subtitle: string;
  handleAction?: () => void;
  buttonText: string;
};

type EmptyListWithCtaProps = {
  merchantProfile: MerchantPaymentsQuery["merchantProfile"];
  action: Action;
};

const EmptyListWithCta = ({ merchantProfile, action }: EmptyListWithCtaProps) => {
  const { actionType, buttonText, handleAction, subtitle, title } = action;

  return (
    <Box justifyContent="center">
      {actionType === "canCreatePayment" &&
        (isNotNullish(merchantProfile?.merchantLogoUrl) ? (
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
        ))}

      {match(actionType)
        .with("shouldEnablePaymentMethod", () => (
          <Box alignItems="center">
            <BorderedIcon name="lake-merchant" />
          </Box>
        ))
        .with("waitingForReview", () => (
          <Box alignItems="center">
            <BorderedIcon name="lake-clock" />
          </Box>
        ))
        .otherwise(() => null)}

      <Space height={24} />

      <LakeText variant="medium" align="center" color={colors.gray[900]}>
        {title}
      </LakeText>

      <Space height={4} />

      <LakeText align="center" variant="smallRegular">
        {subtitle}
      </LakeText>

      <Space height={24} />

      <Box alignItems="center">
        <LakeButton
          color="current"
          onPress={handleAction}
          disabled={actionType === "waitingForReview"}
        >
          {buttonText}
        </LakeButton>
      </Box>
    </Box>
  );
};

type Props = {
  params: GetRouteParams<"AccountMerchantsProfilePaymentsArea">;
  large: boolean;
};

export const MerchantProfilePaymentArea = ({ params, large }: Props) => {
  const { merchantProfileId, accountMembershipId } = params;

  const { canCreateMerchantPaymentLinks } = usePermissions();

  const route = Router.useRoute([
    "AccountMerchantsProfilePaymentsList",
    "AccountMerchantsProfilePaymentsDetails",
  ]);

  const filters: MerchantPaymentFilters = useMemo(() => {
    return {
      paymentMethod: isNotNullish(params.paymentMethod)
        ? Array.filterMap(params.paymentMethod, item =>
            match(item)
              .with("Card", "Check", "DirectDebit", value => Option.Some(value))
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

  const search = nullishOrEmptyToUndefined(params.search);
  const hasSearch =
    isNotNullish(search) || isNotNullish(params.paymentMethod) || isNotNullish(params.status);

  const [data, { isLoading, reload, setVariables }] = useQuery(MerchantPaymentsDocument, {
    merchantProfileId,
    first: PER_PAGE,
    filters: {
      status: filters.status,
      search,
      paymentMethod: filters.paymentMethod?.reduce<MerchantPaymentMethodType[]>((acc, item) => {
        if (item === "DirectDebit") {
          acc.push(
            "SepaDirectDebitB2b",
            "SepaDirectDebitCore",
            "InternalDirectDebitStandard",
            "InternalDirectDebitB2b",
          );
        } else {
          acc.push(item);
        }

        return acc;
      }, []),
    },
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

  const [shouldShowTopbar, setShouldShowTopbar] = useState(
    data
      .toOption()
      .flatMap(result => result.toOption())
      .map(data => (data.merchantProfile?.merchantPayments?.edges.length ?? 0) > 0)
      .getOr(true),
  );

  const canCreatePayments = shouldEnablePaymentLinkTile || shouldEnableCheckTile;

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
              {canCreateMerchantPaymentLinks && (
                <LakeTooltip
                  content={t("merchantProfile.paymentLink.button.new.disable")}
                  disabled={canCreatePayments}
                >
                  <LakeButton
                    disabled={!canCreatePayments}
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
              )}
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
          const waitingForReview = merchantProfile?.statusInfo.status === "PendingReview";

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
                          hasSearch || !canCreateMerchantPaymentLinks ? (
                            <EmptyView
                              icon="lake-transfer"
                              borderedIcon={true}
                              title={t("merchantProfile.payments.list.noResults")}
                              subtitle={t("common.list.noResultsSuggestion")}
                            />
                          ) : (
                            <EmptyListWithCta
                              action={match({ canCreatePayments, waitingForReview })
                                .returnType<Action>()
                                .with({ canCreatePayments: true }, () => ({
                                  actionType: "canCreatePayment",
                                  title: t("merchantProfile.payments.newPayment.title"),
                                  subtitle: t("merchantProfile.payments.newPayment.subtitle"),
                                  handleAction: () => setPickerModal.open(),
                                  buttonText: t("merchantProfile.payments.newPayment.button"),
                                }))
                                .with({ waitingForReview: true }, () => ({
                                  actionType: "waitingForReview",
                                  title: t("merchantProfile.payments.waitingForReview.title"),
                                  subtitle: t("merchantProfile.payments.waitingForReview.subtitle"),
                                  buttonText: t("merchantProfile.payments.waitingForReview.button"),
                                }))
                                .otherwise(() => ({
                                  actionType: "shouldEnablePaymentMethod",
                                  title: t("merchantProfile.payments.enablePaymentMethod.title"),
                                  subtitle: t(
                                    "merchantProfile.payments.enablePaymentMethod.subtitle",
                                  ),
                                  handleAction: () =>
                                    Router.push("AccountMerchantsProfileSettings", {
                                      accountMembershipId,
                                      merchantProfileId,
                                    }),
                                  buttonText: t(
                                    "merchantProfile.payments.enablePaymentMethod.button",
                                  ),
                                }))}
                              merchantProfile={merchantProfile}
                            />
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
                            paymentLinkId={item.paymentLink?.id}
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
