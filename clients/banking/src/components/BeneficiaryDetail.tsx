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
import { useState } from "react";
import { StyleSheet } from "react-native";
import { P, match } from "ts-pattern";
import { TrustedBeneficiaryDocument } from "../graphql/partner";
import { formatDateTime, t } from "../utils/i18n";
import { getBeneficiaryIdentifier } from "./BeneficiaryList";
import { DetailCopiableLine } from "./DetailLine";
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

type Tab = "details" | "history";

type Props = {
  id: string;
  large: boolean;
};

export const BeneficiaryDetail = ({ id, large }: Props) => {
  const [activeTab, setActiveTab] = useState<Tab>("details");
  const suspense = useIsSuspendable();
  const [data] = useQuery(TrustedBeneficiaryDocument, { id }, { suspense });

  const beneficiary = data.mapOkToResult(data =>
    Option.fromNullable(data.trustedBeneficiary).toResult(undefined),
  );

  return match(beneficiary)
    .with(AsyncData.P.NotAsked, AsyncData.P.Loading, () => <LoadingView />)
    .with(AsyncData.P.Done(Result.P.Error(P.select())), error => <ErrorView error={error} />)
    .with(AsyncData.P.Done(Result.P.Ok(P.select())), beneficiary => (
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
              {beneficiary.name}
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
            onChange={id => setActiveTab(id as Tab)}
            otherLabel={t("common.tabs.other")}
            tabs={[
              { id: "details", label: t("beneficiaries.tabs.details") },
              { id: "history", label: t("beneficiaries.tabs.history") },
            ]}
          />

          {match(activeTab)
            .with("details", () => {
              const identifier = getBeneficiaryIdentifier(beneficiary);

              return (
                <ScrollView style={styles.fill} contentContainerStyle={styles.content}>
                  <ReadOnlyFieldList>
                    <DetailCopiableLine label={identifier.label} text={identifier.text} />
                  </ReadOnlyFieldList>
                </ScrollView>
              );
            })
            .with("history", () => (
              <ScrollView style={styles.fill} contentContainerStyle={styles.content}></ScrollView>
            ))
            .exhaustive()}
        </ListRightPanelContent>
      </ScrollView>
    ))
    .exhaustive();
};
