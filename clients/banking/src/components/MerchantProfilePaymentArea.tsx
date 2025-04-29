import { AsyncData, Option, Result } from "@swan-io/boxed";
import { Link } from "@swan-io/chicane";
import { useQuery } from "@swan-io/graphql-client";
import { AutoWidthImage } from "@swan-io/lake/src/components/AutoWidthImage";
import { BorderedIcon } from "@swan-io/lake/src/components/BorderedIcon";
import { Box } from "@swan-io/lake/src/components/Box";
import { EmptyView } from "@swan-io/lake/src/components/EmptyView";
import { Fill } from "@swan-io/lake/src/components/Fill";
import { FilterChooser } from "@swan-io/lake/src/components/FilterChooser";
import { FocusTrapRef } from "@swan-io/lake/src/components/FocusTrap";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeSearchField } from "@swan-io/lake/src/components/LakeSearchField";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { ListRightPanel } from "@swan-io/lake/src/components/ListRightPanel";
import { PlainListViewPlaceholder } from "@swan-io/lake/src/components/PlainListView";
import { Space } from "@swan-io/lake/src/components/Space";
import { LinkConfig } from "@swan-io/lake/src/components/VirtualizedList";
import { colors, spacings } from "@swan-io/lake/src/constants/design";
import { useDisclosure } from "@swan-io/lake/src/hooks/useDisclosure";
import { deriveUnion } from "@swan-io/lake/src/utils/function";
import { isNotNullish, nullishOrEmptyToUndefined } from "@swan-io/lake/src/utils/nullish";
import {
  filter,
  FiltersStack,
  FiltersState,
  useFiltersProps,
} from "@swan-io/shared-business/src/components/Filters";
import { useCallback, useMemo, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import { match, P } from "ts-pattern";
import {
  MerchantPaymentFragment,
  MerchantPaymentMethodType,
  MerchantPaymentsDocument,
  MerchantPaymentsQuery,
  MerchantPaymentStatus,
} from "../graphql/partner";
import { usePermissions } from "../hooks/usePermissions";
import { t } from "../utils/i18n";
import { GetRouteParams, Router } from "../utils/routes";
import { Connection } from "./Connection";
import { ErrorView } from "./ErrorView";
import { MerchantProfilePaymentDetail } from "./MerchantProfilePaymentDetail";
import { MerchantProfilePaymentList } from "./MerchantProfilePaymentList";
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

type Filters = FiltersState<typeof filtersDefinition>;

type SimplifiedPaymentMethod = "Card" | "Check" | "DirectDebit";

const filtersDefinition = {
  paymentMethod: filter.checkbox<SimplifiedPaymentMethod>({
    label: t("merchantProfile.payments.filter.paymentMethod"),
    items: [
      { value: "Card", label: t("paymentMethod.card") },
      { value: "Check", label: t("paymentMethod.check") },
      { value: "DirectDebit", label: t("paymentMethod.directDebit") },
    ],
  }),
  status: filter.checkbox<MerchantPaymentStatus>({
    label: t("merchantProfile.payments.filter.status"),
    items: [
      { value: "Authorized", label: t("merchantProfile.payments.filter.status.authorized") },
      { value: "Captured", label: t("merchantProfile.payments.filter.status.captured") },
      { value: "Initiated", label: t("merchantProfile.payments.filter.status.initiated") },
      { value: "Rejected", label: t("merchantProfile.payments.filter.status.rejected") },
    ],
  }),
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

const paymentStatus = deriveUnion<MerchantPaymentStatus>({
  Authorized: true,
  Canceled: true,
  Captured: true,
  Disputed: true,
  Initiated: true,
  PartiallyDisputed: true,
  Rejected: true,
});

const paymentMethodType = deriveUnion<SimplifiedPaymentMethod>({
  Card: true,
  Check: true,
  DirectDebit: true,
});

type Props = {
  params: GetRouteParams<"AccountMerchantsProfilePaymentsArea">;
  large: boolean;
};

export const MerchantProfilePaymentArea = ({ params, large }: Props) => {
  const { merchantProfileId, accountMembershipId } = params;

  const { canCreateMerchantPaymentLinks } = usePermissions();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const route = Router.useRoute([
    "AccountMerchantsProfilePaymentsList",
    "AccountMerchantsProfilePaymentsDetails",
  ]);

  const search = nullishOrEmptyToUndefined(params.search);

  const { filters, hasSearchOrFilters } = useMemo(() => {
    const filters: Filters = {
      paymentMethod: params.paymentMethod?.filter(paymentMethodType.is),
      status: params.status?.filter(paymentStatus.is),
    };

    const hasSearchOrFilters = Object.values(filters).some(isNotNullish) || isNotNullish(search);

    return { filters, hasSearchOrFilters };
  }, [params, search]);

  const filtersProps = useFiltersProps({ filtersDefinition, filters });

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

  const activePaymentLinkId = match(route)
    .with({ name: "AccountMerchantsProfilePaymentsDetails" }, ({ params }) => params.paymentId)
    .otherwise(() => null);

  const { shouldEnableCheckTile, shouldEnablePaymentLinkTile } = useMemo(() => {
    const enabledPaymentMethods = data
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
        <Box style={[styles.filters, large && styles.filtersLarge]}>
          <Box direction="row" alignItems="center">
            <FilterChooser {...filtersProps.chooser} large={large} />

            {large && (
              <>
                <Space width={8} />

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
              </>
            )}

            <Fill minWidth={16} />

            <LakeSearchField
              placeholder={t("common.search")}
              initialValue={search ?? ""}
              onChangeText={search => {
                Router.replace("AccountMerchantsProfilePaymentsList", {
                  ...params,
                  accountMembershipId,
                  search,
                });
              }}
            />
          </Box>

          <Space height={12} />

          <FiltersStack
            {...filtersProps.stack}
            onChangeFilters={filters => {
              Router.replace("AccountMerchantsProfilePaymentsList", {
                ...params,
                ...filters,
              });
            }}
          />
        </Box>
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
                  closeModal={setPickerModal.close}
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
                          hasSearchOrFilters || !canCreateMerchantPaymentLinks ? (
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
