import { AsyncData, Option, Result } from "@swan-io/boxed";
import { useQuery } from "@swan-io/graphql-client";
import { Box } from "@swan-io/lake/src/components/Box";
import { Fill } from "@swan-io/lake/src/components/Fill";
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
import { deriveUnion, identity, noop } from "@swan-io/lake/src/utils/function";
import { isNotNullishOrEmpty } from "@swan-io/lake/src/utils/nullish";
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
import { formatDateTime, t } from "../utils/i18n";
import { GetRouteParams, Router } from "../utils/routes";
import { getWiseIctLabel } from "../utils/templateTranslations";
import { Connection } from "./Connection";
import { DetailLine } from "./DetailLine";
import { ErrorView } from "./ErrorView";
import { TransactionDetail } from "./TransactionDetail";
import { TransactionList } from "./TransactionList";
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
  historyContent: {
    ...commonStyles.fill,
    paddingTop: spacings[16],
    paddingBottom: spacings[24],
  },
});

type Params = GetRouteParams<"AccountPaymentsBeneficiariesDetails">;
type Tab = NonNullable<Params["tab"]>;

const tabs = deriveUnion<Tab>({
  history: true,
  details: true,
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

  const [data, { isLoading, setVariables }] = useQuery(
    TrustedBeneficiaryDetailsDocument,
    {
      id,
      first: PAGE_SIZE,
      filters: {
        includeRejectedWithFallback: false,
        status: DEFAULT_STATUSES,
      },
      canViewAccount,
      canQueryCardOnTransaction,
    },
    { suspense },
  );

  const beneficiary = data.mapOkToResult(data =>
    Option.fromNullable(data.trustedBeneficiary).toResult(undefined),
  );

  return match(beneficiary)
    .with(AsyncData.P.NotAsked, AsyncData.P.Loading, () => <LoadingView />)
    .with(AsyncData.P.Done(Result.P.Error(P.select())), error => <ErrorView error={error} />)
    .with(AsyncData.P.Done(Result.P.Ok(P.select())), beneficiary => {
      const { transactions } = beneficiary;
      const totalCount = transactions?.totalCount ?? 0;
      const tabsVisible = totalCount > 0;

      return (
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

              {tabsVisible && (
                <>
                  <Space height={24} />

                  <TabView
                    activeTabId={activeTab}
                    onChange={tab => {
                      Router.push("AccountPaymentsBeneficiariesDetails", {
                        ...params,
                        tab: match(tab)
                          .with(tabs.P, identity)
                          .otherwise(() => undefined),
                      });
                    }}
                    otherLabel={t("common.tabs.other")}
                    tabs={[
                      { id: "details", label: t("beneficiaries.tabs.details") },
                      { id: "history", label: t("beneficiaries.tabs.history") },
                    ]}
                  />
                </>
              )}

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
                .with("history", () => (
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
                              new: "transfer",
                            });
                          }}
                        >
                          {t("common.new")}
                        </LakeButton>
                      ) : (
                        <Fill />
                      )}

                      {/* TODO: plug search in */}
                      <LakeSearchField
                        initialValue=""
                        placeholder={t("common.search")}
                        onChangeText={noop}
                      />
                    </Box>

                    <ScrollView
                      style={styles.transactions}
                      contentContainerStyle={styles.historyContent}
                    >
                      <Connection connection={beneficiary.transactions}>
                        {transactions => (
                          <TransactionList
                            withStickyTabs={true}
                            withGrouping={false}
                            transactions={transactions?.edges ?? []}
                            renderEmptyList={() => null}
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
                      items={transactions?.edges ?? []}
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
            .with({ __typename: "TrustedSepaBeneficiary" }, beneficiary => (
              <FullViewportLayer visible={params.new === "transfer"}>
                <TransferRegularWizard
                  accountCountry={accountCountry}
                  accountId={accountId}
                  accountMembershipId={params.accountMembershipId}
                  canViewAccount={canViewAccount}
                  canManageBeneficiaries={canManageBeneficiaries}
                  onPressClose={() => {
                    Router.push("AccountPaymentsBeneficiariesDetails", omit(params, ["new"]));
                  }}
                  initialBeneficiary={{
                    kind: "saved",
                    iban: beneficiary.iban,
                    id: beneficiary.id,
                    name: beneficiary.name,
                  }}
                />
              </FullViewportLayer>
            ))
            .with({ __typename: "TrustedInternationalBeneficiary" }, () => {})
            .otherwise(() => null)}
        </>
      );
    })
    .exhaustive();
};
