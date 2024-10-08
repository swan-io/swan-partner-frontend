import { useQuery } from "@swan-io/graphql-client";
import { Box } from "@swan-io/lake/src/components/Box";
import { LakeCopyButton } from "@swan-io/lake/src/components/LakeCopyButton";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { ListRightPanelContent } from "@swan-io/lake/src/components/ListRightPanel";
import { LoadingView } from "@swan-io/lake/src/components/LoadingView";
import { ReadOnlyFieldList } from "@swan-io/lake/src/components/ReadOnlyFieldList";
import { ScrollView } from "@swan-io/lake/src/components/ScrollView";
import { Space } from "@swan-io/lake/src/components/Space";
import { useIsSuspendable } from "@swan-io/lake/src/components/Suspendable";
import { Tag } from "@swan-io/lake/src/components/Tag";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { colors, spacings } from "@swan-io/lake/src/constants/design";
import { isNotNullishOrEmpty } from "@swan-io/lake/src/utils/nullish";
import { StyleSheet } from "react-native";
import { match } from "ts-pattern";
import { MerchantPaymentLinkDocument } from "../graphql/partner";
import { NotFoundPage } from "../pages/NotFoundPage";
import { formatCurrency, t } from "../utils/i18n";
import { CopyTextButton } from "./CopyTextButton";
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
  unknownValue: {
    fontStyle: "italic",
  },
});

const UNKNOWN_VALUE = <LakeText style={styles.unknownValue}>{t("common.unknown")}</LakeText>;

type Props = {
  paymentLinkId: string;
  large: boolean;
};

export const MerchantProfilePaymentLinkDetail = ({ paymentLinkId, large }: Props) => {
  const suspense = useIsSuspendable();
  const [data] = useQuery(MerchantPaymentLinkDocument, { paymentLinkId }, { suspense });

  if (data.isNotAsked() || data.isLoading()) {
    return <LoadingView />;
  }

  const result = data.get();

  if (result.isError()) {
    return <ErrorView error={result.getError()} />;
  }

  const paymentLink = result.get().merchantPaymentLink;

  if (paymentLink == null) {
    return <NotFoundPage />;
  }

  return (
    <ScrollView contentContainerStyle={large ? styles.fill : undefined}>
      <ListRightPanelContent large={large} style={styles.fill}>
        <Tile style={styles.tile}>
          {match(paymentLink.statusInfo.status)
            .with("Active", () => (
              <>
                <Tag color="shakespear">{t("merchantProfile.paymentLink.status.active")}</Tag>
                <Space height={12} />
              </>
            ))
            .with("Expired", () => (
              <>
                <Tag color="gray">{t("merchantProfile.paymentLink.status.expired")}</Tag>
                <Space height={12} />
              </>
            ))
            .with("Completed", () => (
              <>
                <Tag color="positive">{t("merchantProfile.paymentLink.status.completed")}</Tag>
                <Space height={12} />
              </>
            ))
            .otherwise(() => null)}

          <LakeHeading variant="h1" level={2} align="center">
            {"-" + formatCurrency(Number(paymentLink.amount.value), paymentLink.amount.currency)}
          </LakeHeading>
        </Tile>

        <ScrollView style={styles.fill} contentContainerStyle={styles.content}>
          <ReadOnlyFieldList>
            <LakeLabel
              type="view"
              label={t("merchantProfile.paymentLink.list.link")}
              render={() => (
                <Box direction="row">
                  <LakeTextInput readOnly={true} value={paymentLink.url} hideErrors={true} />
                  <Space width={12} />
                  <CopyTextButton value={paymentLink.url} />
                </Box>
              )}
            />

            <LakeLabel
              type="view"
              label={t("merchantProfile.paymentLink.list.label")}
              render={() =>
                isNotNullishOrEmpty(paymentLink.label) ? (
                  <LakeText color={colors.gray[900]}>{paymentLink.label}</LakeText>
                ) : (
                  UNKNOWN_VALUE
                )
              }
            />

            <LakeLabel
              type="view"
              label={t("merchantProfile.paymentLink.list.reference")}
              render={() =>
                isNotNullishOrEmpty(paymentLink.reference) ? (
                  <LakeText color={colors.gray[900]}>{paymentLink.reference}</LakeText>
                ) : (
                  UNKNOWN_VALUE
                )
              }
            />

            <LakeLabel
              type="view"
              label={t("merchantProfile.paymentLink.list.externalReference")}
              render={() =>
                isNotNullishOrEmpty(paymentLink.externalReference) ? (
                  <LakeText color={colors.gray[900]}>{paymentLink.externalReference}</LakeText>
                ) : (
                  UNKNOWN_VALUE
                )
              }
            />

            <LakeLabel
              type="view"
              label={t("merchantProfile.paymentLink.list.id")}
              render={() => <LakeText color={colors.gray[900]}>{paymentLink.id}</LakeText>}
              actions={
                isNotNullishOrEmpty(paymentLink.id) ? (
                  <LakeCopyButton
                    copyText={t("copyButton.copyTooltip")}
                    copiedText={t("copyButton.copiedTooltip")}
                    valueToCopy={paymentLink.id}
                    color={colors.gray[900]}
                  />
                ) : null
              }
            />
          </ReadOnlyFieldList>
        </ScrollView>
      </ListRightPanelContent>
    </ScrollView>
  );
};
