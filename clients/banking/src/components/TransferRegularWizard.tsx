import { useMutation } from "@swan-io/graphql-client";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { Space } from "@swan-io/lake/src/components/Space";
import { TabView } from "@swan-io/lake/src/components/TabView";
import { identity } from "@swan-io/lake/src/utils/function";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { isNotNullish } from "@swan-io/lake/src/utils/nullish";
import { showToast } from "@swan-io/shared-business/src/state/toasts";
import { translateError } from "@swan-io/shared-business/src/utils/i18n";
import { useState } from "react";
import { P, match } from "ts-pattern";
import { AccountCountry, InitiateSepaCreditTransfersDocument } from "../graphql/partner";
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
  TransferRegularWizardDetails,
  TransferRegularWizardDetailsSummary,
} from "./TransferRegularWizardDetails";
import { Schedule, TransferRegularWizardSchedule } from "./TransferRegularWizardSchedule";

const BeneficiaryStep = ({
  accountCountry,
  accountId,
  initialBeneficiary,
  isAccountClosing,
  onPressSubmit,
}: {
  accountCountry: AccountCountry;
  accountId: string;
  initialBeneficiary: SepaBeneficiary | undefined;
  isAccountClosing: boolean;
  onPressSubmit: (beneficiary: SepaBeneficiary) => void;
}) => {
  const { canInitiateCreditTransferToNewBeneficiary, canCreateTrustedBeneficiary } =
    usePermissions();

  const [activeTab, setActiveTab] = useState(
    canInitiateCreditTransferToNewBeneficiary || isAccountClosing
      ? (initialBeneficiary?.kind ?? "new")
      : "saved",
  );

  const tabs: { id: SepaBeneficiary["kind"]; label: string }[] = [
    ...(canInitiateCreditTransferToNewBeneficiary || isAccountClosing
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
            accountCountry={accountCountry}
            accountId={accountId}
            onPressSubmit={onPressSubmit}
            saveCheckboxVisible={canCreateTrustedBeneficiary && !isAccountClosing}
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
  large: boolean;
  isAccountClosing?: boolean;
  onPressClose?: () => void;
  accountCountry: AccountCountry;
  accountId: string;
  accountMembershipId: string;
  // Enforce prefill with saved beneficiary data only
  initialBeneficiary?: Extract<SepaBeneficiary, { kind: "saved" }>;
};

export const TransferRegularWizard = ({
  large,
  isAccountClosing = false,
  onPressClose,
  accountCountry,
  accountId,
  accountMembershipId,
  initialBeneficiary,
}: Props) => {
  const hasInitialBeneficiary = isNotNullish(initialBeneficiary);
  const [initiateTransfers, transfer] = useMutation(InitiateSepaCreditTransfersDocument);

  const [step, setStep] = useState<Step>(() =>
    hasInitialBeneficiary
      ? { name: "Details", beneficiary: initialBeneficiary }
      : { name: "Beneficiary" },
  );

  const { canReadTransaction } = usePermissions();

  const initiateTransfer = ({
    beneficiary,
    details,
    schedule,
  }: {
    beneficiary: SepaBeneficiary;
    details: Details;
    schedule: Schedule;
  }) => {
    initiateTransfers({
      input: {
        accountId,
        consentRedirectUrl:
          window.location.origin +
          match({ isAccountClosing, canReadTransaction })
            .with({ isAccountClosing: true }, () => Router.AccountClose({ accountId }))
            .with({ canReadTransaction: true }, () =>
              Router.AccountTransactionsListRoot({ accountMembershipId, kind: "transfer" }),
            )
            .with({ canReadTransaction: false }, () =>
              Router.AccountPaymentsRoot({ accountMembershipId, kind: "transfer" }),
            )
            .exhaustive(),
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

            ...match(beneficiary)
              .with({ kind: "new" }, () => ({
                sepaBeneficiary: {
                  name: beneficiary.name,
                  save: beneficiary.kind === "new" && beneficiary.save,
                  iban: beneficiary.iban,
                  isMyOwnIban: false, // TODO
                },
              }))
              .with({ kind: "saved" }, ({ id }) => ({
                trustedBeneficiaryId: id,
              }))
              .exhaustive(),
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
    <>
      {match(step)
        .with({ name: "Beneficiary" }, ({ beneficiary }) => (
          <BeneficiaryStep
            accountCountry={accountCountry}
            accountId={accountId}
            initialBeneficiary={beneficiary}
            isAccountClosing={isAccountClosing}
            onPressSubmit={beneficiary => {
              setStep({ name: "Details", beneficiary });
            }}
          />
        ))
        .with({ name: "Details" }, ({ beneficiary, details }) => (
          <>
            <TransferWizardBeneficiarySummary
              isMobile={!large}
              beneficiary={beneficiary}
              onPressEdit={
                hasInitialBeneficiary
                  ? undefined
                  : () => setStep({ name: "Beneficiary", beneficiary })
              }
            />

            <Space height={32} />

            <LakeHeading level={2} variant="h3">
              {t("transfer.new.details.title")}
            </LakeHeading>

            <Space height={32} />

            <TransferRegularWizardDetails
              accountMembershipId={accountMembershipId}
              isAccountClosing={isAccountClosing}
              initialDetails={details}
              onPressPrevious={() => {
                hasInitialBeneficiary
                  ? onPressClose?.()
                  : setStep({ name: "Beneficiary", beneficiary });
              }}
              onSave={details => {
                setStep({ name: "Schedule", beneficiary, details });
              }}
            />

            <Space height={32} />
          </>
        ))
        .with({ name: "Schedule" }, ({ beneficiary, details }) => (
          <>
            <TransferWizardBeneficiarySummary
              isMobile={!large}
              beneficiary={beneficiary}
              onPressEdit={
                hasInitialBeneficiary
                  ? undefined
                  : () => setStep({ name: "Beneficiary", beneficiary })
              }
            />

            <Space height={32} />

            <TransferRegularWizardDetailsSummary
              isMobile={!large}
              details={details}
              onPressEdit={() => {
                setStep({ name: "Details", beneficiary, details });
              }}
            />

            <Space height={32} />

            <LakeHeading level={2} variant="h3">
              {t("transfer.new.schedule.title")}
            </LakeHeading>

            <Space height={32} />

            <TransferRegularWizardSchedule
              beneficiary={beneficiary}
              loading={transfer.isLoading()}
              onPressPrevious={() => {
                setStep({ name: "Details", beneficiary, details });
              }}
              onSave={schedule => {
                initiateTransfer({ beneficiary, details, schedule });
              }}
            />
          </>
        ))
        .otherwise(() => null)}
    </>
  );
};
