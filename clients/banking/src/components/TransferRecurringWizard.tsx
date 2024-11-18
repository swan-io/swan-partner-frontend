import { useMutation } from "@swan-io/graphql-client";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { Space } from "@swan-io/lake/src/components/Space";
import { identity } from "@swan-io/lake/src/utils/function";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { isNotNullishOrEmpty } from "@swan-io/lake/src/utils/nullish";
import { showToast } from "@swan-io/shared-business/src/state/toasts";
import { translateError } from "@swan-io/shared-business/src/utils/i18n";
import { useState } from "react";
import { P, match } from "ts-pattern";
import { AccountCountry, ScheduleStandingOrderDocument } from "../graphql/partner";
import { usePermissions } from "../hooks/usePermissions";
import { encodeDateTime } from "../utils/date";
import { t } from "../utils/i18n";
import { Router } from "../utils/routes";
import {
  BeneficiarySepaWizardForm,
  SepaBeneficiary,
  TransferWizardBeneficiarySummary,
} from "./BeneficiarySepaWizardForm";
import {
  Details,
  TransferRecurringWizardDetails,
  TransferRecurringWizardDetailsSummary,
} from "./TransferRecurringWizardDetails";
import { Schedule, TransferRecurringWizardSchedule } from "./TransferRecurringWizardSchedule";
import { WizardLayout } from "./WizardLayout";

type Step =
  | {
      name: "Beneficiary";
      beneficiary?: SepaBeneficiary;
    }
  | {
      name: "Details";
      beneficiary: SepaBeneficiary;
      details?: Details;
    }
  | {
      name: "Schedule";
      beneficiary: SepaBeneficiary;
      details: Details;
    };

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
  const { canReadTransaction } = usePermissions();
  const [scheduleStandingOrder, standingOrderScheduling] = useMutation(
    ScheduleStandingOrderDocument,
  );
  const [step, setStep] = useState<Step>({ name: "Beneficiary" });

  const onSave = ({
    beneficiary,
    details,
    schedule,
  }: {
    beneficiary: SepaBeneficiary;
    details: Details;
    schedule: Schedule;
  }) => {
    const consentRedirectUrl =
      window.location.origin +
      (canReadTransaction
        ? Router.AccountPaymentsRecurringTransferList({
            accountMembershipId,
            kind: "standingOrder",
          })
        : Router.AccountPaymentsRoot({ accountMembershipId, kind: "standingOrder" }));

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
    <WizardLayout title={t("transfer.newRecurringTransfer")} onPressClose={onPressClose}>
      {({ large }) =>
        match(step)
          .with({ name: "Beneficiary" }, ({ beneficiary }) => (
            <>
              <LakeHeading level={2} variant="h3">
                {t("transfer.new.beneficiary.title")}
              </LakeHeading>

              <Space height={32} />

              <BeneficiarySepaWizardForm
                mode="continue"
                accountCountry={accountCountry}
                accountId={accountId}
                saveCheckboxVisible={false}
                onPressSubmit={beneficiary => setStep({ name: "Details", beneficiary })}
                initialBeneficiary={match(beneficiary)
                  .with({ kind: "new" }, identity)
                  .with({ kind: "saved" }, P.nullish, () => undefined)
                  .exhaustive()}
              />
            </>
          ))
          .with({ name: "Details" }, ({ beneficiary, details }) => (
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
          ))
          .with({ name: "Schedule" }, ({ beneficiary, details }) => (
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
          ))
          .otherwise(() => null)
      }
    </WizardLayout>
  );
};
