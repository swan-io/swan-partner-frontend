import { AsyncData, Option, Result } from "@swan-io/boxed";
import { useQuery } from "@swan-io/graphql-client";
import { Box } from "@swan-io/lake/src/components/Box";
import { Fill } from "@swan-io/lake/src/components/Fill";
import { FixedListViewEmpty } from "@swan-io/lake/src/components/FixedListView";
import { FocusTrapRef } from "@swan-io/lake/src/components/FocusTrap";
import { FullViewportLayer } from "@swan-io/lake/src/components/FullViewportLayer";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeSearchField } from "@swan-io/lake/src/components/LakeSearchField";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { ListRightPanel, ListRightPanelContent } from "@swan-io/lake/src/components/ListRightPanel";
import { LoadingView } from "@swan-io/lake/src/components/LoadingView";
import { Pressable } from "@swan-io/lake/src/components/Pressable";
import { ReadOnlyFieldList } from "@swan-io/lake/src/components/ReadOnlyFieldList";
import { ScrollView } from "@swan-io/lake/src/components/ScrollView";
import { Space } from "@swan-io/lake/src/components/Space";
import { useIsSuspendable } from "@swan-io/lake/src/components/Suspendable";
import { TabView } from "@swan-io/lake/src/components/TabView";
import { Tag } from "@swan-io/lake/src/components/Tag";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { negativeSpacings, spacings } from "@swan-io/lake/src/constants/design";
import { deriveUnion, identity } from "@swan-io/lake/src/utils/function";
import {
  isNotNullish,
  isNotNullishOrEmpty,
  nullishOrEmptyToUndefined,
} from "@swan-io/lake/src/utils/nullish";
import { omit } from "@swan-io/lake/src/utils/object";
import { getCountryName, isCountryCCA3 } from "@swan-io/shared-business/src/constants/countries";
import { printFormat } from "iban";
import { useCallback, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import { P, match } from "ts-pattern";
import {
  AccountCountry,
  TransactionStatus,
  TrustedBeneficiaryDetailsDocument,
  TrustedSepaBeneficiary,
} from "../graphql/partner";
import { formatDateTime, isSupportedCurrency, t } from "../utils/i18n";
import { GetRouteParams, Router } from "../utils/routes";
import { getWiseIctLabel } from "../utils/templateTranslations";
import { Connection } from "./Connection";
import { DetailLine } from "./DetailLine";
import { ErrorView } from "./ErrorView";
import { TransactionDetail } from "./TransactionDetail";
import { TransactionList } from "./TransactionList";
import { TransferInternationalWizard } from "./TransferInternationalWizard";
import { TransferRegularWizard } from "./TransferRegularWizard";

const PAGE_SIZE = 20;

const styles = StyleSheet.create({
  fill: {
    ...commonStyles.fill,
  },
  tile: {
    alignItems: "center",
  },
  transactions: {
    marginLeft: negativeSpacings[24],
    marginRight: negativeSpacings[20],
  },
  detailsContent: {
    ...commonStyles.fill,
    paddingVertical: spacings[24],
  },
  transfersContent: {
    ...commonStyles.fill,
    paddingTop: spacings[16],
    paddingBottom: spacings[24],
  },
});

type Params = GetRouteParams<"AccountPaymentsBeneficiariesDetails">;
type Tab = NonNullable<Params["tab"]>;

const tabs = deriveUnion<Tab>({
  details: true,
  transfers: true,
});

export const concatSepaBeneficiaryAddress = (address: TrustedSepaBeneficiary["address"]) => {
  if (address == null) {
    return;
  }

  const items = [
    address.addressLine1,
    address.addressLine2,
    ...[address.postalCode, address.city].filter(isNotNullishOrEmpty).join(" "),
    isCountryCCA3(address.country) ? getCountryName(address.country) : undefined,
  ].filter(isNotNullishOrEmpty);

  if (items.length > 0) {
    return items.join(", ");
  }
};

const DEFAULT_STATUSES = [
  "Booked",
  "Canceled",
  "Pending",
  "Rejected",
] satisfies TransactionStatus[];

type Props = {
  id: string;
  large: boolean;
  params: Params;
  transferCreationVisible: boolean;
  accountCountry: AccountCountry;
  accountId: string;
  canManageBeneficiaries: boolean;
  canQueryCardOnTransaction: boolean;
  canViewAccount: boolean;
};

export const BeneficiaryDetail = ({
  id,
  large,
  params,
  transferCreationVisible,
  accountCountry,
  accountId,
  canManageBeneficiaries,
  canQueryCardOnTransaction,
  canViewAccount,
}: Props) => {
  const activeTab: Tab = params.tab ?? "details";
  const suspense = useIsSuspendable();
  const [activeTransactionId, setActiveTransactionId] = useState<string | null>(null);
  const panelRef = useRef<FocusTrapRef | null>(null);

  const onActiveRowChange = useCallback(
    (element: HTMLElement) => panelRef.current?.setInitiallyFocusedElement(element),
    [],
  );

  const search = nullishOrEmptyToUndefined(params.search);
  const hasSearch = isNotNullish(search);

  const [data, { isLoading, setVariables }] = useQuery(
    TrustedBeneficiaryDetailsDocument,
    {
      id,
      first: PAGE_SIZE,
      canViewAccount,
      canQueryCardOnTransaction,
      filters: {
        includeRejectedWithFallback: false,
        search,
        status: DEFAULT_STATUSES,
      },
    },
    { suspense },
  );

  const beneficiary = data.mapOkToResult(data =>
    Option.fromNullable(data.trustedBeneficiary).toResult(undefined),
  );

  return match(beneficiary)
    .with(AsyncData.P.NotAsked, AsyncData.P.Loading, () => <LoadingView />)
    .with(AsyncData.P.Done(Result.P.Error(P.select())), error => <ErrorView error={error} />)
    .with(AsyncData.P.Done(Result.P.Ok(P.select())), beneficiary => (
      <>
        <ScrollView contentContainerStyle={large && styles.fill}>
          <ListRightPanelContent large={large} style={styles.fill}>
            <Tile style={styles.tile}>
              {match(beneficiary.__typename)
                .with("TrustedInternalBeneficiary", () => (
                  <Tag color="gray">{t("beneficiaries.type.internal")}</Tag>
                ))
                .with("TrustedInternationalBeneficiary", () => (
                  <Tag color="gray">{t("beneficiaries.type.international")}</Tag>
                ))
                .with("TrustedSepaBeneficiary", () => (
                  <Tag color="gray">{t("beneficiaries.type.sepa")}</Tag>
                ))
                .otherwise(() => null)}

              <Space height={12} />

              <LakeHeading variant="h1" level={2} align="center">
                {beneficiary.label}
              </LakeHeading>

              <Space height={12} />

              <LakeText>
                {t("beneficiaries.additionDate", {
                  date: formatDateTime(beneficiary.createdAt, "LL"),
                })}
              </LakeText>
            </Tile>

            <Space height={24} />

            <TabView
              activeTabId={activeTab}
              otherLabel={t("common.tabs.other")}
              onChange={tab => {
                Router.push("AccountPaymentsBeneficiariesDetails", {
                  ...params,
                  tab: match(tab)
                    .with(tabs.P, identity)
                    .otherwise(() => undefined),
                });
              }}
              tabs={
                [
                  { id: "details", label: t("beneficiaries.tabs.details") },
                  { id: "transfers", label: t("beneficiaries.tabs.transfers") },
                ] satisfies { id: Tab; label: string }[]
              }
            />

            {match(activeTab)
              .with("details", () => (
                <ScrollView style={styles.fill} contentContainerStyle={styles.detailsContent}>
                  <ReadOnlyFieldList>
                    <DetailLine label={t("beneficiaries.details.name")} text={beneficiary.name} />

                    {match(beneficiary)
                      .with({ __typename: "TrustedSepaBeneficiary" }, ({ address, iban }) => (
                        <>
                          <DetailLine
                            label={t("beneficiaries.details.iban")}
                            text={printFormat(iban)}
                          />

                          {match(concatSepaBeneficiaryAddress(address))
                            .with(P.nonNullable, address => (
                              <DetailLine
                                label={t("beneficiaries.details.address")}
                                text={address}
                              />
                            ))
                            .otherwise(() => null)}
                        </>
                      ))
                      .with({ __typename: "TrustedInternationalBeneficiary" }, ({ details }) =>
                        details.map(detail => (
                          <DetailLine
                            key={detail.key}
                            label={getWiseIctLabel(detail.key)}
                            text={match(detail)
                              .with({ key: "IBAN" }, ({ value }) => printFormat(value))
                              .otherwise(({ value }) => value)}
                          />
                        )),
                      )
                      .otherwise(() => null)}
                  </ReadOnlyFieldList>
                </ScrollView>
              ))
              .with("transfers", () => (
                <>
                  <Space height={24} />

                  <Box alignItems="center" direction="row">
                    {transferCreationVisible ? (
                      <LakeButton
                        icon="add-circle-filled"
                        size="small"
                        color="current"
                        onPress={() => {
                          Router.push("AccountPaymentsBeneficiariesDetails", {
                            ...params,
                            new:
                              beneficiary.__typename === "TrustedInternationalBeneficiary"
                                ? "international"
                                : "transfer",
                          });
                        }}
                      >
                        {t("common.new")}
                      </LakeButton>
                    ) : (
                      <Fill />
                    )}

                    <LakeSearchField
                      initialValue={search ?? ""}
                      placeholder={t("common.search")}
                      onChangeText={search => {
                        // TODO: Fix rerender
                        Router.replace("AccountPaymentsBeneficiariesDetails", {
                          ...params,
                          search,
                        });
                      }}
                    />
                  </Box>

                  <ScrollView
                    style={styles.transactions}
                    contentContainerStyle={styles.transfersContent}
                  >
                    <Connection connection={beneficiary.transactions}>
                      {transactions => (
                        <TransactionList
                          withStickyTabs={true}
                          withGrouping={false}
                          transactions={transactions?.edges ?? []}
                          renderEmptyList={() =>
                            hasSearch ? (
                              <FixedListViewEmpty
                                icon="lake-transfer"
                                borderedIcon={true}
                                title={t("transfer.list.noResults")}
                                subtitle={t("common.list.noResultsSuggestion")}
                              />
                            ) : (
                              <FixedListViewEmpty
                                borderedIcon={true}
                                icon="lake-transfer"
                                title={t("transfer.list.noResults")}
                              />
                            )
                          }
                          getRowLink={({ item }) => (
                            <Pressable onPress={() => setActiveTransactionId(item.id)} />
                          )}
                          pageSize={PAGE_SIZE}
                          activeRowId={activeTransactionId ?? undefined}
                          onActiveRowChange={onActiveRowChange}
                          loading={{
                            isLoading,
                            count: PAGE_SIZE,
                          }}
                          onEndReached={() => {
                            if (transactions?.pageInfo.hasNextPage ?? false) {
                              setVariables({
                                after: transactions?.pageInfo.endCursor ?? undefined,
                              });
                            }
                          }}
                        />
                      )}
                    </Connection>
                  </ScrollView>

                  <ListRightPanel
                    ref={panelRef}
                    keyExtractor={item => item.node.id}
                    items={beneficiary.transactions?.edges ?? []}
                    activeId={activeTransactionId}
                    onActiveIdChange={setActiveTransactionId}
                    onClose={() => setActiveTransactionId(null)}
                    previousLabel={t("common.previous")}
                    nextLabel={t("common.next")}
                    closeLabel={t("common.closeButton")}
                    render={({ node }, large) => (
                      <TransactionDetail
                        accountMembershipId={params.accountMembershipId}
                        large={large}
                        transactionId={node.id}
                        canQueryCardOnTransaction={canQueryCardOnTransaction}
                        canViewAccount={canViewAccount}
                      />
                    )}
                  />
                </>
              ))
              .exhaustive()}
          </ListRightPanelContent>
        </ScrollView>

        {match(beneficiary)
          .with({ __typename: "TrustedSepaBeneficiary" }, ({ iban, id, name }) => {
            return (
              <FullViewportLayer visible={params.new === "transfer"}>
                <TransferRegularWizard
                  accountCountry={accountCountry}
                  accountId={accountId}
                  accountMembershipId={params.accountMembershipId}
                  canViewAccount={canViewAccount}
                  canManageBeneficiaries={canManageBeneficiaries}
                  initialBeneficiary={{ kind: "saved", iban, id, name }}
                  onPressClose={() => {
                    Router.push("AccountPaymentsBeneficiariesDetails", omit(params, ["new"]));
                  }}
                />
              </FullViewportLayer>
            );
          })
          .with(
            {
              __typename: "TrustedInternationalBeneficiary",
              route: P.not("Unknown"),
              currency: P.when(isSupportedCurrency),
            },
            ({ currency, id, name, route, details }) => {
              const values = details.map(({ key, value }) => ({ key, value })); // remove typenames

              return (
                <FullViewportLayer visible={params.new === "international"}>
                  <TransferInternationalWizard
                    accountId={accountId}
                    accountMembershipId={params.accountMembershipId}
                    forcedCurrency={currency}
                    canViewAccount={canViewAccount}
                    canManageBeneficiaries={canManageBeneficiaries}
                    initialBeneficiary={{ kind: "saved", currency, id, name, route, values }}
                    onPressClose={() => {
                      Router.push("AccountPaymentsBeneficiariesDetails", omit(params, ["new"]));
                    }}
                  />
                </FullViewportLayer>
              );
            },
          )
          .otherwise(() => null)}
      </>
    ))
    .exhaustive();
};
