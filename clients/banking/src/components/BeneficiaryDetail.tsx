import { AsyncData, Option, Result } from "@swan-io/boxed";
import { useQuery } from "@swan-io/graphql-client";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { ListRightPanelContent } from "@swan-io/lake/src/components/ListRightPanel";
import { LoadingView } from "@swan-io/lake/src/components/LoadingView";
import { ReadOnlyFieldList } from "@swan-io/lake/src/components/ReadOnlyFieldList";
import { ScrollView } from "@swan-io/lake/src/components/ScrollView";
import { Space } from "@swan-io/lake/src/components/Space";
import { useIsSuspendable } from "@swan-io/lake/src/components/Suspendable";
import { TabView } from "@swan-io/lake/src/components/TabView";
import { Tag } from "@swan-io/lake/src/components/Tag";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { spacings } from "@swan-io/lake/src/constants/design";
import { deriveUnion, identity, noop } from "@swan-io/lake/src/utils/function";
import { isNotNullishOrEmpty } from "@swan-io/lake/src/utils/nullish";
import { getCountryName, isCountryCCA3 } from "@swan-io/shared-business/src/constants/countries";
import { printFormat } from "iban";
import { StyleSheet, View } from "react-native";
import { P, match } from "ts-pattern";
import { TrustedBeneficiaryDetailsDocument, TrustedSepaBeneficiary } from "../graphql/partner";
import { formatDateTime, t } from "../utils/i18n";
import { GetRouteParams, Router } from "../utils/routes";
import { getWiseIctLabel } from "../utils/templateTranslations";
import { Connection } from "./Connection";
import { DetailLine } from "./DetailLine";
import { ErrorView } from "./ErrorView";
import { TransactionList } from "./TransactionList";

const NUM_TO_RENDER = 20;

const styles = StyleSheet.create({
  fill: {
    ...commonStyles.fill,
  },
  tile: {
    alignItems: "center",
  },
  content: {
    ...commonStyles.fill,
    paddingVertical: spacings[24],
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

type Props = {
  id: string;
  canViewAccount: boolean;
  canQueryCardOnTransaction: boolean;
  large: boolean;
  params: Params;
};

export const BeneficiaryDetail = ({
  id,
  canViewAccount,
  canQueryCardOnTransaction,
  large,
  params,
}: Props) => {
  const activeTab: Tab = params.tab ?? "details";
  const suspense = useIsSuspendable();

  const [data] = useQuery(
    TrustedBeneficiaryDetailsDocument,
    {
      id,
      first: NUM_TO_RENDER,
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
                <ScrollView style={styles.fill} contentContainerStyle={styles.content}>
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
                <ScrollView style={styles.fill} contentContainerStyle={styles.content}>
                  <Connection connection={beneficiary.transactions}>
                    {transactions => (
                      <TransactionList
                        withStickyTabs={true}
                        transactions={transactions?.edges ?? []}
                        pageSize={NUM_TO_RENDER}
                        getRowLink={() => <View />}
                        onEndReached={noop}
                        onActiveRowChange={noop}
                        renderEmptyList={() => null}
                      />
                    )}
                  </Connection>
                </ScrollView>
              ))
              .exhaustive()}
          </ListRightPanelContent>
        </ScrollView>
      );
    })
    .exhaustive();
};
