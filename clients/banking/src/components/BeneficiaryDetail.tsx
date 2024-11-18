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
import { deriveUnion, identity } from "@swan-io/lake/src/utils/function";
import { isNotNullishOrEmpty } from "@swan-io/lake/src/utils/nullish";
import { getCountryName, isCountryCCA3 } from "@swan-io/shared-business/src/constants/countries";
import { printFormat } from "iban";
import { StyleSheet } from "react-native";
import { P, match } from "ts-pattern";
import {
  AccountCountry,
  TrustedBeneficiaryDetailsDocument,
  TrustedSepaBeneficiary,
} from "../graphql/partner";
import { formatDateTime, t } from "../utils/i18n";
import { GetRouteParams, Router } from "../utils/routes";
import { getWiseIctLabel } from "../utils/templateTranslations";
import { BeneficiaryDetailTransferList } from "./BeneficiaryDetailTransferList";
import { DetailLine } from "./DetailLine";
import { ErrorView } from "./ErrorView";

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

type Props = {
  id: string;
  params: Params;
  large: boolean;
  accountCountry: AccountCountry;
  accountId: string;
};

export const BeneficiaryDetail = ({ id, params, large, accountCountry, accountId }: Props) => {
  const activeTab: Tab = params.tab ?? "details";
  const suspense = useIsSuspendable();

  const [data] = useQuery(TrustedBeneficiaryDetailsDocument, { id }, { suspense });

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
              .with("transfers", () => (
                <BeneficiaryDetailTransferList
                  accountCountry={accountCountry}
                  accountId={accountId}
                  beneficiary={beneficiary}
                  params={params}
                />
              ))
              .exhaustive()}
          </ListRightPanelContent>
        </ScrollView>
      </>
    ))
    .exhaustive();
};
