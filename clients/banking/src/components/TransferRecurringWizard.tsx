import { useMutation } from "@swan-io/graphql-client";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { Space } from "@swan-io/lake/src/components/Space";
import { TabView } from "@swan-io/lake/src/components/TabView";
import { identity } from "@swan-io/lake/src/utils/function";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { isNotNullishOrEmpty } from "@swan-io/lake/src/utils/nullish";
import { showToast } from "@swan-io/shared-business/src/state/toasts";
import { translateError } from "@swan-io/shared-business/src/utils/i18n";
import { useState } from "react";
import { P, match } from "ts-pattern";
import { ScheduleStandingOrderDocument } from "../graphql/partner";
import { usePermissions } from "../hooks/usePermissions";
import { encodeDateTime } from "../utils/date";
import { t } from "../utils/i18n";
import { Router } from "../utils/routes";
import {
  BeneficiarySepaWizardForm,
  SepaBeneficiary,
  TransferWizardBeneficiarySummary,
} from "./BeneficiarySepaWizardForm";
import { SavedBeneficiariesForm } from "./SavedBeneficiariesForm";
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
  accountId: string;
  accountMembershipId: string;
};

const BeneficiaryStep = ({
  accountId,
  initialBeneficiary,
  onPressSubmit,
}: {
  accountId: string;
  initialBeneficiary: SepaBeneficiary | undefined;
  onPressSubmit: (beneficiary: SepaBeneficiary) => void;
}) => {
  const { canInitiateCreditTransferToNewBeneficiary } = usePermissions();

  const [activeTab, setActiveTab] = useState(
    canInitiateCreditTransferToNewBeneficiary ? (initialBeneficiary?.kind ?? "new") : "saved",
  );

  const tabs: { id: SepaBeneficiary["kind"]; label: string }[] = [
    ...(canInitiateCreditTransferToNewBeneficiary
      ? [{ id: "new" as const, label: t("transfer.new.beneficiary.new") }]
      : []),
    { id: "saved" as const, label: t("transfer.new.beneficiary.saved") },
  ];

  return (
    <>
      <LakeHeading level={2} variant="h3">
        {t("transfer.new.beneficiary.title")}
      </LakeHeading>

      {tabs.length > 1 && (
        <>
          <Space height={24} />

          <TabView
            activeTabId={activeTab}
            tabs={tabs}
            onChange={tab => setActiveTab(tab as SepaBeneficiary["kind"])}
            otherLabel={t("common.tabs.other")}
          />
        </>
      )}

      <Space height={32} />

      {match(activeTab)
        .with("new", () => (
          <BeneficiarySepaWizardForm
            mode="continue"
            saveCheckboxVisible={false}
            onPressSubmit={onPressSubmit}
            initialBeneficiary={match(initialBeneficiary)
              .with({ kind: "new" }, identity)
              .with({ kind: "saved" }, P.nullish, () => undefined)
              .exhaustive()}
          />
        ))
        .with("saved", () => (
          <SavedBeneficiariesForm type="Sepa" accountId={accountId} onPressSubmit={onPressSubmit} />
        ))
        .exhaustive()}
    </>
  );
};

export const TransferRecurringWizard = ({
  onPressClose,
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
            <BeneficiaryStep
              accountId={accountId}
              initialBeneficiary={beneficiary}
              onPressSubmit={beneficiary => setStep({ name: "Details", beneficiary })}
            />
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
