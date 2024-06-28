import { useMutation } from "@swan-io/graphql-client";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { ScrollView } from "@swan-io/lake/src/components/ScrollView";
import { Separator } from "@swan-io/lake/src/components/Separator";
import { Space } from "@swan-io/lake/src/components/Space";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { breakpoints, spacings } from "@swan-io/lake/src/constants/design";
import { showToast } from "@swan-io/lake/src/state/toasts";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { translateError } from "@swan-io/shared-business/src/utils/i18n";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { match } from "ts-pattern";
import { AccountCountry, InitiateSepaCreditTransfersDocument } from "../graphql/partner";
import { encodeDateTime } from "../utils/date";
import { t } from "../utils/i18n";
import { Router } from "../utils/routes";
import {
  Beneficiary,
  BeneficiaryWizard,
  TransferWizardBeneficiarySummary,
} from "./BeneficiaryWizard";
import {
  Details,
  TransferRegularWizardDetails,
  TransferRegularWizardDetailsSummary,
} from "./TransferRegularWizardDetails";
import { Schedule, TransferRegularWizardSchedule } from "./TransferRegularWizardSchedule";

const styles = StyleSheet.create({
  root: {
    ...commonStyles.fill,
  },
  container: {
    ...commonStyles.fill,
  },
  header: {
    paddingVertical: spacings[12],
  },
  headerContents: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    maxWidth: 1336,
    marginHorizontal: "auto",
    paddingHorizontal: spacings[96],
  },
  headerTitle: {
    ...commonStyles.fill,
  },
  mobileZonePadding: {
    paddingHorizontal: spacings[24],
    flexGrow: 1,
  },
  contents: {
    flexShrink: 1,
    flexGrow: 1,
    marginHorizontal: "auto",
    maxWidth: 1172,
    paddingHorizontal: spacings[24],
    paddingVertical: spacings[32],
    width: "100%",
  },
  desktopContents: {
    marginVertical: "auto",
    paddingHorizontal: spacings[96],
  },
});

type Step =
  | { name: "Beneficiary"; beneficiary?: Beneficiary }
  | {
      name: "Details";
      beneficiary: Beneficiary;
      details?: Details;
    }
  | { name: "Schedule"; beneficiary: Beneficiary; details: Details };

type Props = {
  onPressClose?: () => void;
  accountCountry: AccountCountry;
  accountId: string;
  accountMembershipId: string;
};

export const TransferRegularWizard = ({
  onPressClose,
  accountCountry,
  accountId,
  accountMembershipId,
}: Props) => {
  const [initiateTransfers, transfer] = useMutation(InitiateSepaCreditTransfersDocument);
  const [step, setStep] = useState<Step>({ name: "Beneficiary" });

  const initiateTransfer = ({
    beneficiary,
    details,
    schedule,
  }: {
    beneficiary: Beneficiary;
    details: Details;
    schedule: Schedule;
  }) => {
    initiateTransfers({
      input: {
        accountId,
        consentRedirectUrl:
          window.location.origin +
          Router.AccountTransactionsListRoot({ accountMembershipId, kind: "transfer" }),
        creditTransfers: [
          {
            amount: details.amount,
            label: details.label,
            reference: details.reference,
            ...match(schedule)
              .with({ isScheduled: true }, ({ scheduledDate, scheduledTime }) => ({
                requestedExecutionAt: encodeDateTime(scheduledDate, `${scheduledTime}:00`),
              }))
              .otherwise(({ isInstant }) => ({
                mode: isInstant ? "InstantWithFallback" : "Regular",
              })),
            sepaBeneficiary: {
              name: beneficiary.name,
              save: false,
              iban: beneficiary.iban,
              isMyOwnIban: false, // TODO
            },
          },
        ],
      },
    })
      .mapOk(data => data.initiateCreditTransfers)
      .mapOkToResult(filterRejectionsToResult)
      .tapOk(({ payment }) => {
        const status = payment.statusInfo;
        const params = { paymentId: payment.id, accountMembershipId };

        return match(status)
          .with({ __typename: "PaymentInitiated" }, () => {
            showToast({
              variant: "success",
              title: t("transfer.consent.success.title"),
              description: t("transfer.consent.success.description"),
              autoClose: false,
            });
            Router.replace("AccountTransactionsListRoot", params);
          })
          .with({ __typename: "PaymentRejected" }, () =>
            showToast({
              variant: "error",
              title: t("transfer.consent.error.rejected.title"),
              description: t("transfer.consent.error.rejected.description"),
            }),
          )
          .with({ __typename: "PaymentConsentPending" }, ({ consent }) => {
            window.location.assign(consent.consentUrl);
          })
          .exhaustive();
      })
      .tapError(error => {
        showToast({ variant: "error", error, title: translateError(error) });
      });
  };

  return (
    <ResponsiveContainer style={styles.root} breakpoint={breakpoints.medium}>
      {({ large }) => (
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={[styles.headerContents, !large && styles.mobileZonePadding]}>
              {onPressClose != null && (
                <>
                  <LakeButton
                    mode="tertiary"
                    icon="dismiss-regular"
                    onPress={onPressClose}
                    ariaLabel={t("common.closeButton")}
                  />

                  <Space width={large ? 32 : 8} />
                </>
              )}

              <View style={styles.headerTitle}>
                <LakeHeading level={2} variant="h3">
                  {t("transfer.newTransfer")}
                </LakeHeading>
              </View>
            </View>
          </View>

          <Separator />

          <ScrollView contentContainerStyle={[styles.contents, large && styles.desktopContents]}>
            {match(step)
              .with({ name: "Beneficiary" }, ({ beneficiary }) => {
                return (
                  <>
                    <LakeHeading level={2} variant="h3">
                      {t("transfer.new.benefiary.title")}
                    </LakeHeading>

                    <Space height={32} />

                    <BeneficiaryWizard
                      mode="continue"
                      accountCountry={accountCountry}
                      accountId={accountId}
                      initialBeneficiary={beneficiary}
                      onPressSubmit={beneficiary => setStep({ name: "Details", beneficiary })}
                    />
                  </>
                );
              })
              .with({ name: "Details" }, ({ beneficiary, details }) => {
                return (
                  <>
                    <TransferWizardBeneficiarySummary
                      isMobile={!large}
                      beneficiary={beneficiary}
                      onPressEdit={() => setStep({ name: "Beneficiary", beneficiary })}
                    />

                    <Space height={32} />

                    <LakeHeading level={2} variant="h3">
                      {t("transfer.new.details.title")}
                    </LakeHeading>

                    <Space height={32} />

                    <TransferRegularWizardDetails
                      accountMembershipId={accountMembershipId}
                      initialDetails={details}
                      onPressPrevious={() => setStep({ name: "Beneficiary", beneficiary })}
                      onSave={details => setStep({ name: "Schedule", beneficiary, details })}
                    />

                    <Space height={32} />
                  </>
                );
              })
              .with({ name: "Schedule" }, ({ beneficiary, details }) => {
                return (
                  <>
                    <TransferWizardBeneficiarySummary
                      isMobile={!large}
                      beneficiary={beneficiary}
                      onPressEdit={() => setStep({ name: "Beneficiary", beneficiary })}
                    />

                    <Space height={32} />

                    <TransferRegularWizardDetailsSummary
                      isMobile={!large}
                      details={details}
                      onPressEdit={() => setStep({ name: "Details", beneficiary, details })}
                    />

                    <Space height={32} />

                    <LakeHeading level={2} variant="h3">
                      {t("transfer.new.schedule.title")}
                    </LakeHeading>

                    <Space height={32} />

                    <TransferRegularWizardSchedule
                      beneficiary={beneficiary}
                      loading={transfer.isLoading()}
                      onPressPrevious={() => setStep({ name: "Details", beneficiary, details })}
                      onSave={schedule => initiateTransfer({ beneficiary, details, schedule })}
                    />
                  </>
                );
              })
              .otherwise(() => null)}
          </ScrollView>
        </View>
      )}
    </ResponsiveContainer>
  );
};
