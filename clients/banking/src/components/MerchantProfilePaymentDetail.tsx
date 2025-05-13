import { AsyncData, Option, Result } from "@swan-io/boxed";
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
import { TabView } from "@swan-io/lake/src/components/TabView";
import { Tag } from "@swan-io/lake/src/components/Tag";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { spacings } from "@swan-io/lake/src/constants/design";
import { isNotNullish, isNullish } from "@swan-io/lake/src/utils/nullish";
import dayjs from "dayjs";
import { useState } from "react";
import { StyleSheet } from "react-native";
import { match, P } from "ts-pattern";
import {
  GetFullMerchantPaymentDetailsDocument,
  GetFullMerchantPaymentDetailsQuery,
  GetMainMerchantPaymentDetailsDocument,
} from "../graphql/partner";
import { formatCurrency, t } from "../utils/i18n";
import { DetailCopiableLine, DetailLine } from "./DetailLine";
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
type Tab = "details" | "balances";

const MerchantProfilePaymentDetailView = ({
  payment,
  paymentLink,
  large,
}: {
  payment: NonNullable<GetFullMerchantPaymentDetailsQuery["merchantPayment"]>;
  paymentLink: NonNullable<GetFullMerchantPaymentDetailsQuery["merchantPaymentLink"]> | undefined;
  large: boolean;
}) => {
  const [activeTab, setActiveTab] = useState<Tab>("details");

  const tabs: { id: Tab; label: string }[] = [
    { id: "details", label: t("merchantProfile.payments.details.tabs.details") },
    { id: "balances", label: t("merchantProfile.payments.details.tabs.balances") },
  ];

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
                <Tag color="positive">{t("merchantProfile.payments.status.captured")}</Tag>
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
            .with("Disputed", () => (
              <>
                <Tag color="sunglow"> {t("merchantProfile.payments.status.disputed")} </Tag>
                <Space height={12} />
              </>
            ))
            .with("PartiallyDisputed", () => (
              <>
                <Tag color="sunglow">{t("merchantProfile.payments.status.partiallyDisputed")}</Tag>
                <Space height={12} />
              </>
            ))
            .with("Canceled", () => (
              <>
                <Tag color="gray"> {t("merchantProfile.payments.status.canceled")} </Tag>
                <Space height={12} />
              </>
            ))
            .otherwise(() => null)}

          <LakeHeading variant="h1" level={2} align="center">
            {"-" + formatCurrency(Number(payment.amount.value), payment.amount.currency)}
          </LakeHeading>

          <LakeText>{dayjs(payment.statusInfo.createdAt).format("LL")}</LakeText>
        </Tile>

        <Space height={48} />

        <TabView
          activeTabId={activeTab}
          tabs={tabs}
          onChange={tab => setActiveTab(tab as Tab)}
          otherLabel={t("common.tabs.other")}
        />

        {match(activeTab)
          .with("details", () => (
            <ScrollView style={styles.fill} contentContainerStyle={styles.content}>
              <ReadOnlyFieldList>
                {paymentLink != null && (
                  <LakeLabel
                    type="view"
                    label={t("merchantProfile.payments.details.paymentLink")}
                    render={() => (
                      <Box direction="row" alignItems="baseline">
                        <LakeTextInput readOnly={true} value={paymentLink.url} hideErrors={true} />
                        <Space width={12} />

                        <LakeCopyButton
                          valueToCopy={paymentLink.url}
                          copiedText={t("copyButton.copiedTooltip")}
                          copyText={t("copyButton.copyTooltip")}
                        />
                      </Box>
                    )}
                  />
                )}

                <DetailCopiableLine
                  label={t("merchantProfile.payments.details.id")}
                  text={payment.id}
                />

                {isNotNullish(payment.reference) && (
                  <DetailCopiableLine
                    label={t("merchantProfile.payments.details.reference")}
                    text={payment.reference}
                  />
                )}

                {match(payment.statusInfo)
                  .with({ __typename: "MerchantPaymentAuthorized" }, ({ authorizedAt }) => (
                    <DetailLine
                      label={t("merchantProfile.payments.details.authorizedAt")}
                      text={dayjs(authorizedAt).format("LLL")}
                      icon="calendar-ltr-regular"
                    />
                  ))
                  .with({ __typename: "MerchantPaymentCanceled" }, ({ canceledAt }) => (
                    <DetailLine
                      label={t("merchantProfile.payments.details.canceledAt")}
                      text={dayjs(canceledAt).format("LLL")}
                      icon="calendar-ltr-regular"
                    />
                  ))
                  .with(
                    { __typename: "MerchantPaymentCaptured" },
                    ({ authorizedAt, capturedAt }) => (
                      <ReadOnlyFieldList>
                        <DetailLine
                          label={t("merchantProfile.payments.details.authorizedAt")}
                          text={dayjs(authorizedAt).format("LLL")}
                          icon="calendar-ltr-regular"
                        />

                        <DetailLine
                          label={t("merchantProfile.payments.details.capturedAt")}
                          text={dayjs(capturedAt).format("LLL")}
                          icon="calendar-ltr-regular"
                        />
                      </ReadOnlyFieldList>
                    ),
                  )
                  .with(
                    { __typename: "MerchantPaymentDisputed" },
                    ({ authorizedAt, capturedAt, disputedAt }) => (
                      <ReadOnlyFieldList>
                        <DetailLine
                          label={t("merchantProfile.payments.details.authorizedAt")}
                          text={dayjs(authorizedAt).format("LLL")}
                          icon="calendar-ltr-regular"
                        />

                        <DetailLine
                          label={t("merchantProfile.payments.details.capturedAt")}
                          text={dayjs(capturedAt).format("LLL")}
                          icon="calendar-ltr-regular"
                        />

                        <DetailLine
                          label={t("merchantProfile.payments.details.disputedAt")}
                          text={dayjs(disputedAt).format("LLL")}
                          icon="calendar-ltr-regular"
                        />
                      </ReadOnlyFieldList>
                    ),
                  )
                  .with({ __typename: "MerchantPaymentInitiated" }, ({ createdAt }) => (
                    <DetailLine
                      label={t("merchantProfile.payments.details.createdAt")}
                      text={dayjs(createdAt).format("LLL")}
                      icon="calendar-ltr-regular"
                    />
                  ))
                  .with(
                    { __typename: "MerchantPaymentPartiallyDisputed" },
                    ({ authorizedAt, capturedAt, disputedAt }) => (
                      <ReadOnlyFieldList>
                        <DetailLine
                          label={t("merchantProfile.payments.details.authorizedAt")}
                          text={dayjs(authorizedAt).format("LLL")}
                          icon="calendar-ltr-regular"
                        />

                        <DetailLine
                          label={t("merchantProfile.payments.details.capturedAt")}
                          text={dayjs(capturedAt).format("LLL")}
                          icon="calendar-ltr-regular"
                        />

                        <DetailLine
                          label={t("merchantProfile.payments.details.disputedAt")}
                          text={dayjs(disputedAt).format("LLL")}
                          icon="calendar-ltr-regular"
                        />
                      </ReadOnlyFieldList>
                    ),
                  )
                  .with(
                    { __typename: "MerchantPaymentRejected" },
                    ({ rejectedAt, rejectedReasonCode }) => (
                      <ReadOnlyFieldList>
                        <DetailLine
                          label={t("merchantProfile.payments.details.rejectedAt")}
                          text={dayjs(rejectedAt).format("LLL")}
                          icon="calendar-ltr-regular"
                        />

                        <DetailLine
                          label={t("merchantProfile.payments.details.rejectedReasonCode")}
                          text={rejectedReasonCode}
                        />
                      </ReadOnlyFieldList>
                    ),
                  )
                  .exhaustive()}
                {match(payment)
                  .with(
                    { __typename: "CardMerchantPayment", threeDs: P.nonNullable },
                    ({ threeDs }) => (
                      <ReadOnlyFieldList>
                        <DetailLine
                          label={t("merchantProfile.payments.details.3ds")}
                          text={match(threeDs.statusInfo.__typename)
                            .with(
                              "SucceededThreeDsStatusInfo",
                              "FailedThreeDsStatusInfo",
                              "RequestedThreeDsStatusInfo",
                              () => t("common.true"),
                            )
                            .with("ExemptThreeDsStatusInfo", "NotRequestedThreeDsStatusInfo", () =>
                              t("common.false"),
                            )
                            .exhaustive()}
                        />

                        {match(threeDs.statusInfo.__typename)
                          .with("ExemptThreeDsStatusInfo", () => (
                            <DetailLine
                              label={t("merchantProfile.payments.details.3dsStatus")}
                              text={t("merchantProfile.payments.3dsStatus.exempted")}
                            />
                          ))
                          .with("FailedThreeDsStatusInfo", () => (
                            <DetailLine
                              label={t("merchantProfile.payments.details.3dsStatus")}
                              text={t("merchantProfile.payments.3dsStatus.failed")}
                            />
                          ))
                          .with("NotRequestedThreeDsStatusInfo", () => (
                            <DetailLine
                              label={t("merchantProfile.payments.details.3dsStatus")}
                              text={t("merchantProfile.payments.3dsStatus.notRequested")}
                            />
                          ))
                          .with("RequestedThreeDsStatusInfo", () => (
                            <DetailLine
                              label={t("merchantProfile.payments.details.3dsStatus")}
                              text={t("merchantProfile.payments.3dsStatus.requested")}
                            />
                          ))
                          .with("SucceededThreeDsStatusInfo", () => (
                            <DetailLine
                              label={t("merchantProfile.payments.details.3dsStatus")}
                              text={t("merchantProfile.payments.3dsStatus.successful")}
                            />
                          ))
                          .exhaustive()}
                      </ReadOnlyFieldList>
                    ),
                  )
                  .otherwise(() => null)}
              </ReadOnlyFieldList>
            </ScrollView>
          ))
          .with("balances", () => (
            <ScrollView style={styles.fill} contentContainerStyle={styles.content}>
              <ReadOnlyFieldList>
                <DetailLine
                  label={t("merchantProfile.payments.details.authorizedBalance")}
                  text={formatCurrency(
                    Number(payment.balance.totalAuthorized.value),
                    payment.balance.totalAuthorized.currency,
                  )}
                />

                <DetailLine
                  label={t("merchantProfile.payments.details.availableToCancelBalance")}
                  text={formatCurrency(
                    Number(payment.balance.availableToCancel.value),
                    payment.balance.availableToCancel.currency,
                  )}
                />

                <DetailLine
                  label={t("merchantProfile.payments.details.canceledBalance")}
                  text={formatCurrency(
                    Number(payment.balance.totalCanceled.value),
                    payment.balance.totalCanceled.currency,
                  )}
                />

                <DetailLine
                  label={t("merchantProfile.payments.details.availableToCaptureBalance")}
                  text={formatCurrency(
                    Number(payment.balance.availableToCapture.value),
                    payment.balance.availableToCapture.currency,
                  )}
                />

                <DetailLine
                  label={t("merchantProfile.payments.details.capturedBalance")}
                  text={formatCurrency(
                    Number(payment.balance.totalCaptured.value),
                    payment.balance.totalCaptured.currency,
                  )}
                />

                <DetailLine
                  label={t("merchantProfile.payments.details.availableToRefundBalance")}
                  text={formatCurrency(
                    Number(payment.balance.availableToRefund.value),
                    payment.balance.availableToRefund.currency,
                  )}
                />

                <DetailLine
                  label={t("merchantProfile.payments.details.refundedBalance")}
                  text={formatCurrency(
                    Number(payment.balance.totalRefunded.value),
                    payment.balance.totalRefunded.currency,
                  )}
                />

                <DetailLine
                  label={t("merchantProfile.payments.details.disputedBalance")}
                  text={formatCurrency(
                    Number(payment.balance.totalDisputed.value),
                    payment.balance.totalDisputed.currency,
                  )}
                />
              </ReadOnlyFieldList>
            </ScrollView>
          ))
          .exhaustive()}
      </ListRightPanelContent>
    </ScrollView>
  );
};

const MainMerchantProfilePaymentDetail = ({
  paymentId,
  large,
}: {
  paymentId: string;
  large: boolean;
}) => {
  const suspense = useIsSuspendable();
  const [data] = useQuery(GetMainMerchantPaymentDetailsDocument, { paymentId }, { suspense });

  const details = data.mapOkToResult(data =>
    Option.fromNullable(data.merchantPayment).toResult(undefined),
  );

  return match(details)
    .with(AsyncData.P.NotAsked, AsyncData.P.Loading, () => <LoadingView />)
    .with(AsyncData.P.Done(Result.P.Error(P.select())), error => <ErrorView error={error} />)
    .with(AsyncData.P.Done(Result.P.Ok(P.select())), payment => (
      <MerchantProfilePaymentDetailView payment={payment} paymentLink={undefined} large={large} />
    ))
    .exhaustive();
};

const FullMerchantProfilePaymentDetail = ({
  paymentId,
  paymentLinkId,
  large,
}: {
  paymentId: string;
  paymentLinkId: string;
  large: boolean;
}) => {
  const suspense = useIsSuspendable();

  const [data] = useQuery(
    GetFullMerchantPaymentDetailsDocument,
    { paymentId, paymentLinkId },
    { suspense },
  );

  const details = data.mapOkToResult(data =>
    Option.allFromDict({
      payment: Option.fromNullable(data.merchantPayment),
      paymentLink: Option.fromNullable(data.merchantPaymentLink),
    }).toResult(undefined),
  );

  return match(details)
    .with(AsyncData.P.NotAsked, AsyncData.P.Loading, () => <LoadingView />)
    .with(AsyncData.P.Done(Result.P.Error(P.select())), error => <ErrorView error={error} />)
    .with(AsyncData.P.Done(Result.P.Ok(P.select())), ({ payment, paymentLink }) => (
      <MerchantProfilePaymentDetailView payment={payment} paymentLink={paymentLink} large={large} />
    ))
    .exhaustive();
};

type Props = {
  paymentId: string;
  paymentLinkId: string | undefined | null;
  large: boolean;
};

export const MerchantProfilePaymentDetail = ({ paymentId, paymentLinkId, large }: Props) =>
  isNullish(paymentLinkId) ? (
    <MainMerchantProfilePaymentDetail paymentId={paymentId} large={large} />
  ) : (
    <FullMerchantProfilePaymentDetail
      paymentId={paymentId}
      paymentLinkId={paymentLinkId}
      large={large}
    />
  );
