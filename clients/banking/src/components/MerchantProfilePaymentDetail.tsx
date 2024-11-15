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
import { isNotNullish, isNotNullishOrEmpty } from "@swan-io/lake/src/utils/nullish";
import dayjs from "dayjs";
import { StyleSheet } from "react-native";
import { match } from "ts-pattern";
import { GetMerchantPaymentDetailsDocument } from "../graphql/partner";
import { NotFoundPage } from "../pages/NotFoundPage";
import { formatCurrency, t } from "../utils/i18n";
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
  unknownValue: {
    fontStyle: "italic",
  },
});

const UNKNOWN_VALUE = <LakeText style={styles.unknownValue}>{t("common.unknown")}</LakeText>;

type Props = {
  paymentId: string;
  paymentLinkId: string;
  large: boolean;
};

export const MerchantProfilePaymentDetail = ({ paymentLinkId, paymentId, large }: Props) => {
  const suspense = useIsSuspendable();
  const [data] = useQuery(
    GetMerchantPaymentDetailsDocument,
    { paymentId, paymentLinkId },
    { suspense },
  );

  if (data.isNotAsked() || data.isLoading()) {
    return <LoadingView />;
  }

  const result = data.get();

  if (result.isError()) {
    return <ErrorView error={result.getError()} />;
  }

  const payment = result.get().merchantPayment;
  const paymentLink = result.get().merchantPaymentLink;

  if (payment == null) {
    return <NotFoundPage />;
  }

  return (
    <ScrollView contentContainerStyle={large ? styles.fill : undefined}>
      <ListRightPanelContent large={large} style={styles.fill}>
        <Tile style={styles.tile}>
          {match(payment.statusInfo.status)
            .with("Authorized", () => (
              <>
                <Tag color="shakespear">{t("merchantProfile.payments.status.authorized")}</Tag>
                <Space height={12} />
              </>
            ))
            .with("Captured", () => (
              <>
                <Tag color="gray">{t("merchantProfile.payments.status.captured")}</Tag>
                <Space height={12} />
              </>
            ))
            .with("Initiated", () => (
              <>
                <Tag color="gray">{t("merchantProfile.payments.status.initiated")}</Tag>
                <Space height={12} />
              </>
            ))
            .with("Rejected", () => (
              <>
                <Tag color="negative">{t("merchantProfile.payments.status.rejected")}</Tag>
                <Space height={12} />
              </>
            ))
            .otherwise(() => null)}

          <LakeHeading variant="h1" level={2} align="center">
            {"-" + formatCurrency(Number(payment.amount.value), payment.amount.currency)}
          </LakeHeading>

          <LakeText>{dayjs(payment.createdAt).format("LLL")}</LakeText>
        </Tile>

        <Space height={24} />

        <ScrollView style={styles.fill} contentContainerStyle={styles.content}>
          <ReadOnlyFieldList>
            <LakeLabel
              type="view"
              label={t("merchantProfile.payments.details.authorizedBalance")}
              render={() => (
                <LakeText variant="regular" color={colors.gray[900]}>
                  {formatCurrency(
                    Number(payment.balance.totalAuthorized.value),
                    payment.balance.totalAuthorized.currency,
                  )}
                </LakeText>
              )}
            />

            <LakeLabel
              type="view"
              label={t("merchantProfile.payments.details.capturedBalance")}
              render={() => (
                <LakeText variant="regular" color={colors.gray[900]}>
                  {formatCurrency(
                    Number(payment.balance.totalCaptured.value),
                    payment.balance.totalCaptured.currency,
                  )}
                </LakeText>
              )}
            />

            <LakeLabel
              type="view"
              label={t("merchantProfile.payments.details.availableToCaptureBalance")}
              render={() => (
                <LakeText variant="regular" color={colors.gray[900]}>
                  {formatCurrency(
                    Number(payment.balance.availableToCapture.value),
                    payment.balance.availableToCapture.currency,
                  )}
                </LakeText>
              )}
            />

            <LakeLabel
              type="view"
              label={t("merchantProfile.payments.details.refundedBalance")}
              render={() => (
                <LakeText variant="regular" color={colors.gray[900]}>
                  {formatCurrency(
                    Number(payment.balance.totalRefunded.value),
                    payment.balance.totalRefunded.currency,
                  )}
                </LakeText>
              )}
            />

            <LakeLabel
              type="view"
              label={t("merchantProfile.payments.details.availableToRefundBalance")}
              render={() => (
                <LakeText variant="regular" color={colors.gray[900]}>
                  {formatCurrency(
                    Number(payment.balance.availableToRefund.value),
                    payment.balance.availableToRefund.currency,
                  )}
                </LakeText>
              )}
            />

            <LakeLabel
              type="view"
              label={t("merchantProfile.payments.details.availableToCancelBalance")}
              render={() => (
                <LakeText variant="regular" color={colors.gray[900]}>
                  {formatCurrency(
                    Number(payment.balance.availableToCancel.value),
                    payment.balance.availableToCancel.currency,
                  )}
                </LakeText>
              )}
            />

            {/* <LakeLabel
              type="view"
              label={t("merchantProfile.payments.details.chargebackBalance")}
              render={() => (
                <LakeText variant="regular" color={colors.gray[900]}>
                  {formatCurrency(
                        Number(payment.balance.chargebackBalance.value),
                        payment.balance.chargebackBalance.currency,
                      )}
                </LakeText>
              )}
            /> */}

            <LakeLabel
              type="view"
              label={t("merchantProfile.payments.details.paymentLink")}
              render={() => (
                <Box direction="row" alignItems="baseline">
                  <LakeTextInput readOnly={true} value={paymentLink?.url} hideErrors={true} />
                  <Space width={12} />

                  <LakeCopyButton
                    valueToCopy={paymentLink?.url}
                    copiedText={t("copyButton.copiedTooltip")}
                    copyText={t("copyButton.copyTooltip")}
                  />
                </Box>
              )}
            />

            <DetailCopiableLine
              label={t("merchantProfile.payments.details.id")}
              text={payment.id}
            />

            <LakeLabel
              type="view"
              label={t("merchantProfile.payments.details.reference")}
              render={() =>
                isNotNullishOrEmpty(payment.reference) ? (
                  <DetailCopiableLine
                    label={t("merchantProfile.payments.details.reference")}
                    text={isNotNullish(payment.reference) ? payment.reference : "—"}
                  />
                ) : (
                  UNKNOWN_VALUE
                )
              }
            />

            <LakeLabel
              type="view"
              label={t("merchantProfile.payments.details.3ds")}
              render={() =>
                isNotNullish(payment.threeDS) ? (
                  <LakeText variant="regular" color={colors.gray[900]}>
                    {payment.threeDS.requested}
                  </LakeText>
                ) : (
                  UNKNOWN_VALUE
                )
              }
            />

            <LakeLabel
              type="view"
              label={t("merchantProfile.payments.details.3dsStatus")}
              render={() =>
                isNotNullish(payment.threeDS) ? (
                  <LakeText variant="regular" color={colors.gray[900]}>
                    {payment.threeDS.statusInfo}
                  </LakeText>
                ) : (
                  UNKNOWN_VALUE
                )
              }
            />
          </ReadOnlyFieldList>
        </ScrollView>
      </ListRightPanelContent>
    </ScrollView>
  );
};
