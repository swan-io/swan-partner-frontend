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
import { isNotNullishOrEmpty } from "@swan-io/lake/src/utils/nullish";
import { translateError } from "@swan-io/shared-business/src/utils/i18n";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { match } from "ts-pattern";
import { AccountCountry, ScheduleStandingOrderDocument } from "../graphql/partner";
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
  TransferRecurringWizardDetails,
  TransferRecurringWizardDetailsSummary,
} from "./TransferRecurringWizardDetails";
import { Schedule, TransferRecurringWizardSchedule } from "./TransferRecurringWizardSchedule";

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
    paddingVertical: spacings[24],
    width: "100%",
  },
  desktopContents: {
    marginVertical: "auto",
    paddingHorizontal: spacings[96],
    paddingVertical: spacings[24],
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

export const TransferRecurringWizard = ({
  onPressClose,
  accountCountry,
  accountId,
  accountMembershipId,
}: Props) => {
  const [scheduleStandingOrder, standingOrderScheduling] = useMutation(
    ScheduleStandingOrderDocument,
  );
  const [step, setStep] = useState<Step>({ name: "Beneficiary" });

  const onSave = ({
    beneficiary,
    details,
    schedule,
  }: {
    beneficiary: Beneficiary;
    details: Details;
    schedule: Schedule;
  }) => {
    const consentRedirectUrl =
      window.location.origin +
      Router.AccountPaymentsRecurringTransferList({ accountMembershipId }) +
      `?${new URLSearchParams({ standingOrder: "true" }).toString()}`;

    scheduleStandingOrder({
      input: {
        accountId,
        consentRedirectUrl,
        firstExecutionDate: encodeDateTime(
          schedule.firstExecutionDate,
          `${schedule.firstExecutionTime}:00`,
        ),
        lastExecutionDate:
          isNotNullishOrEmpty(schedule.lastExecutionDate) &&
          isNotNullishOrEmpty(schedule.lastExecutionTime)
            ? encodeDateTime(schedule.lastExecutionDate, `${schedule.lastExecutionTime}:00`)
            : undefined,
        period: schedule.period,
        sepaBeneficiary: {
          name: beneficiary.name,
          save: false,
          iban: beneficiary.iban,
          isMyOwnIban: false, // TODO
        },
        label: details.label,
        reference: details.reference,
        ...match(details)
          .with({ type: "FixedAmount" }, ({ amount }) => ({ amount }))
          .with({ type: "TargetAccountBalance" }, ({ targetAmount }) => ({
            targetAvailableBalance: targetAmount,
          }))
          .exhaustive(),
      },
    })
      .mapOk(data => data.scheduleStandingOrder)
      .mapOkToResult(filterRejectionsToResult)
      .tapOk(({ standingOrder }) => {
        match(standingOrder.statusInfo)
          .with({ __typename: "StandingOrderConsentPendingStatusInfo" }, ({ consent }) => {
            window.location.assign(consent.consentUrl);
          })
          .with({ __typename: "StandingOrderCanceledStatusInfo" }, () => {
            showToast({
              variant: "error",
              title: t("recurringTransfer.consent.error.rejected.title"),
              description: t("recurringTransfer.consent.error.rejected.description"),
            });
          })
          .with({ __typename: "StandingOrderEnabledStatusInfo" }, () => {
            showToast({
              variant: "success",
              title: t("recurringTransfer.consent.success.title"),
              description: t("recurringTransfer.consent.success.description"),
              autoClose: false,
            });
            Router.replace("AccountPaymentsRoot", { accountMembershipId });
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
                  {t("transfer.newRecurringTransfer")}
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
                      accountCountry={accountCountry}
                      accountId={accountId}
                      initialBeneficiary={beneficiary}
                      onSave={beneficiary => setStep({ name: "Details", beneficiary })}
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

                    <TransferRecurringWizardDetails
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

                    <TransferRecurringWizardDetailsSummary
                      isMobile={!large}
                      details={details}
                      onPressEdit={() => setStep({ name: "Details", beneficiary, details })}
                    />

                    <Space height={32} />

                    <LakeHeading level={2} variant="h3">
                      {t("transfer.new.schedule.title")}
                    </LakeHeading>

                    <Space height={32} />

                    <TransferRecurringWizardSchedule
                      loading={standingOrderScheduling.isLoading()}
                      onPressPrevious={() => setStep({ name: "Details", beneficiary, details })}
                      onSave={schedule => onSave({ beneficiary, details, schedule })}
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
