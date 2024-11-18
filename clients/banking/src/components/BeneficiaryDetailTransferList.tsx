import { AsyncData, Option, Result } from "@swan-io/boxed";
import { useQuery } from "@swan-io/graphql-client";
import { Box } from "@swan-io/lake/src/components/Box";
import { EmptyView } from "@swan-io/lake/src/components/EmptyView";
import { Fill } from "@swan-io/lake/src/components/Fill";
import { FocusTrapRef } from "@swan-io/lake/src/components/FocusTrap";
import { FullViewportLayer } from "@swan-io/lake/src/components/FullViewportLayer";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeSearchField } from "@swan-io/lake/src/components/LakeSearchField";
import { ListRightPanel } from "@swan-io/lake/src/components/ListRightPanel";
import { PlainListViewPlaceholder } from "@swan-io/lake/src/components/PlainListView";
import { Pressable } from "@swan-io/lake/src/components/Pressable";
import { ScrollView } from "@swan-io/lake/src/components/ScrollView";
import { Space } from "@swan-io/lake/src/components/Space";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { negativeSpacings } from "@swan-io/lake/src/constants/design";
import { isNotNullish, nullishOrEmptyToUndefined } from "@swan-io/lake/src/utils/nullish";
import { omit } from "@swan-io/lake/src/utils/object";
import { useCallback, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import { P, match } from "ts-pattern";
import {
  AccountCountry,
  TransactionStatus,
  TrustedBeneficiaryDetailsFragment,
  TrustedBeneficiaryTransfersDocument,
} from "../graphql/partner";
import { usePermissions } from "../hooks/usePermissions";
import { isSupportedCurrency, t } from "../utils/i18n";
import { GetRouteParams, Router } from "../utils/routes";
import { Connection } from "./Connection";
import { ErrorView } from "./ErrorView";
import { TransactionDetail } from "./TransactionDetail";
import { TransactionList } from "./TransactionList";
import { TransferInternationalWizard } from "./TransferInternationalWizard";
import { TransferRegularWizard } from "./TransferRegularWizard";
import { WizardLayout } from "./WizardLayout";

const PAGE_SIZE = 20;

const DEFAULT_STATUSES = [
  "Booked",
  "Canceled",
  "Pending",
  "Rejected",
] satisfies TransactionStatus[];

const styles = StyleSheet.create({
  base: {
    ...commonStyles.fill,
    marginLeft: negativeSpacings[24],
    marginRight: negativeSpacings[20],
  },
  content: {
    ...commonStyles.fill,
  },
});

type Props = {
  accountCountry: AccountCountry;
  accountId: string;
  beneficiary: TrustedBeneficiaryDetailsFragment;
  params: GetRouteParams<"AccountPaymentsBeneficiariesDetails">;
};

export const BeneficiaryDetailTransferList = ({
  accountCountry,
  accountId,
  beneficiary,
  params,
}: Props) => {
  const [activeTransactionId, setActiveTransactionId] = useState<string | null>(null);
  const panelRef = useRef<FocusTrapRef | null>(null);

  const onActiveRowChange = useCallback(
    (element: HTMLElement) => panelRef.current?.setInitiallyFocusedElement(element),
    [],
  );

  const search = nullishOrEmptyToUndefined(params.search);
  const hasSearch = isNotNullish(search);

  const {
    canReadOtherMembersCards: canQueryCardOnTransaction,
    canInitiateCreditTransferToExistingBeneficiary,
  } = usePermissions();

  const [data, { isLoading, setVariables }] = useQuery(TrustedBeneficiaryTransfersDocument, {
    id: beneficiary.id,
    first: PAGE_SIZE,
    canQueryCardOnTransaction,
    filters: {
      status: DEFAULT_STATUSES,
      includeRejectedWithFallback: false,
      search,
    },
  });

  const transactions = data.mapOkToResult(data =>
    Option.fromNullable(data.trustedBeneficiary?.transactions).toResult(undefined),
  );

  return (
    <>
      <Space height={24} />

      <Box alignItems="center" direction="row">
        {canInitiateCreditTransferToExistingBeneficiary ? (
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
            Router.replace("AccountPaymentsBeneficiariesDetails", {
              ...params,
              search,
            });
          }}
        />
      </Box>

      <ScrollView style={styles.base} contentContainerStyle={styles.content}>
        {match(transactions)
          .with(AsyncData.P.NotAsked, AsyncData.P.Loading, () => (
            <PlainListViewPlaceholder count={PAGE_SIZE} headerHeight={16} rowHeight={72} />
          ))
          .with(AsyncData.P.Done(Result.P.Error(P.select())), error => <ErrorView error={error} />)
          .with(AsyncData.P.Done(Result.P.Ok(P.select())), transactionsPage => (
            <Connection connection={transactionsPage}>
              {transactions => (
                <>
                  <Space height={16} />

                  <TransactionList
                    withStickyTabs={true}
                    withGrouping={false}
                    transactions={transactions?.edges ?? []}
                    renderEmptyList={() =>
                      hasSearch ? (
                        <EmptyView
                          icon="lake-transfer"
                          borderedIcon={true}
                          title={t("transfer.list.noResults")}
                          subtitle={t("common.list.noResultsSuggestion")}
                        />
                      ) : (
                        <EmptyView
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
                      />
                    )}
                  />
                </>
              )}
            </Connection>
          ))
          .exhaustive()}
      </ScrollView>

      {match(beneficiary)
        .with({ __typename: "TrustedSepaBeneficiary" }, ({ iban, id, name }) => {
          const onPressClose = () => {
            Router.push("AccountPaymentsBeneficiariesDetails", omit(params, ["new"]));
          };

          return (
            <FullViewportLayer visible={params.new === "transfer"}>
              <WizardLayout title={t("transfer.newTransfer")} onPressClose={onPressClose}>
                {({ large }) => (
                  <TransferRegularWizard
                    large={large}
                    accountCountry={accountCountry}
                    accountId={accountId}
                    accountMembershipId={params.accountMembershipId}
                    initialBeneficiary={{ kind: "saved", iban, id, name }}
                    onPressClose={onPressClose}
                  />
                )}
              </WizardLayout>
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
  );
};
