import { Result } from "@swan-io/boxed";
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
import { InitiateInternationalCreditTransferDocument } from "../graphql/partner";
import { usePermissions } from "../hooks/usePermissions";
import { Currency, t } from "../utils/i18n";
import { Router } from "../utils/routes";
import {
  BeneficiaryInternationalWizardForm,
  InternationalBeneficiary,
} from "./BeneficiaryInternationalWizardForm";
import { SavedBeneficiariesForm } from "./SavedBeneficiariesForm";
import {
  Amount,
  TransferInternationalWizardAmount,
  TransferInternationalWizardAmountSummary,
} from "./TransferInternationalWizardAmount";
import { Details, TransferInternationalWizardDetails } from "./TransferInternationalWizardDetails";
import { WizardLayout } from "./WizardLayout";

const BeneficiaryStep = ({
  accountId,
  amount,
  errors,
  initialBeneficiary,
  onPressSubmit,
  onPressPrevious,
}: {
  accountId: string;
  amount: Amount;
  errors?: string[] | undefined;
  initialBeneficiary: InternationalBeneficiary | undefined;
  onPressSubmit: (beneficiary: InternationalBeneficiary) => void;
  onPressPrevious: () => void;
}) => {
  const { canInitiateCreditTransferToNewBeneficiary, canCreateTrustedBeneficiary } =
    usePermissions();
  const [activeTab, setActiveTab] = useState(
    canInitiateCreditTransferToNewBeneficiary ? (initialBeneficiary?.kind ?? "new") : "saved",
  );

  const tabs: { id: InternationalBeneficiary["kind"]; label: string }[] = [
    ...(canInitiateCreditTransferToNewBeneficiary
      ? [{ id: "new" as const, label: t("transfer.new.beneficiary.new") }]
      : []),
    { id: "saved" as const, label: t("transfer.new.beneficiary.saved") },
  ];

  return (
    <>
      <LakeHeading level={3} variant="h3">
        {t("transfer.new.internationalTransfer.beneficiary.title")}
      </LakeHeading>

      {tabs.length > 1 && (
        <>
          <Space height={24} />

          <TabView
            activeTabId={activeTab}
            tabs={tabs}
            onChange={tab => setActiveTab(tab as InternationalBeneficiary["kind"])}
            otherLabel={t("common.tabs.other")}
          />
        </>
      )}

      <Space height={32} />

      {match(activeTab)
        .with("new", () => (
          <BeneficiaryInternationalWizardForm
            mode="continue"
            amount={amount}
            errors={errors}
            onPressSubmit={onPressSubmit}
            onPressPrevious={onPressPrevious}
            saveCheckboxVisible={canCreateTrustedBeneficiary}
            initialBeneficiary={match(initialBeneficiary)
              .with({ kind: "new" }, identity)
              .with({ kind: "saved" }, P.nullish, () => undefined)
              .exhaustive()}
          />
        ))
        .with("saved", () => (
          <SavedBeneficiariesForm
            type="International"
            accountId={accountId}
            currency={amount.currency}
            onPressSubmit={onPressSubmit}
          />
        ))
        .exhaustive()}
    </>
  );
};

type Step =
  | {
      name: "Amount";
      amount?: Amount;
    }
  | {
      name: "Beneficiary";
      amount: Amount;
      beneficiary?: InternationalBeneficiary;
      errors?: string[];
    }
  | {
      name: "Details";
      amount: Amount;
      beneficiary: InternationalBeneficiary;
      details?: Details;
    };

type Props = {
  onPressClose: () => void;
  accountId: string;
  accountMembershipId: string;
  forcedCurrency?: Currency;
  // Enforce prefill with saved beneficiary data only
  initialBeneficiary?: Extract<InternationalBeneficiary, { kind: "saved" }>;
};

export const TransferInternationalWizard = ({
  onPressClose,
  accountId,
  accountMembershipId,
  forcedCurrency,
  initialBeneficiary,
}: Props) => {
  const { canReadTransaction } = usePermissions();

  const hasInitialBeneficiary = isNotNullish(initialBeneficiary);
  const [initiateTransfers, transfer] = useMutation(InitiateInternationalCreditTransferDocument);

  const [step, setStep] = useState<Step>({ name: "Amount" });

  const initiateTransfer = ({
    amount,
    beneficiary,
    details,
  }: {
    amount: Amount;
    beneficiary: InternationalBeneficiary;
    details: Details;
  }) => {
    initiateTransfers({
      input: {
        accountId,
        targetAmount: {
          value: amount.value,
          currency: amount.currency,
        },

        ...match(beneficiary)
          .with({ kind: "new" }, ({ route, values }) => ({
            internationalBeneficiary: {
              name: beneficiary.name,
              save: beneficiary.kind === "new" && beneficiary.save,
              currency: amount.currency,
              route,
              details: values,
            },
          }))
          .with({ kind: "saved" }, ({ id }) => ({
            trustedBeneficiaryId: id,
          }))
          .exhaustive(),

        internationalCreditTransferDetails: details.values,
        consentRedirectUrl:
          window.location.origin +
          (canReadTransaction
            ? Router.AccountTransactionsListRoot({ accountMembershipId, kind: "transfer" })
            : Router.AccountPaymentsRoot({ accountMembershipId, kind: "transfer" })),
      },
    })
      .mapOk(data => data.initiateInternationalCreditTransfer)
      .mapOkToResult(data => (isNotNullish(data) ? Result.Ok(data) : Result.Error(undefined)))
      .mapOkToResult(filterRejectionsToResult)
      .tapOk(({ payment }) => {
        return match(payment.statusInfo)
          .with({ __typename: "PaymentInitiated" }, () => {
            showToast({
              variant: "success",
              title: t("transfer.consent.success.title"),
              description: t("transfer.consent.success.description"),
              autoClose: false,
            });

            Router.replace("AccountTransactionsListRoot", {
              accountMembershipId,
            });
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
    <WizardLayout title={t("transfer.new.internationalTransfer.title")} onPressClose={onPressClose}>
      {({ large }) =>
        match(step)
          .with({ name: "Amount" }, ({ amount }) => (
            <>
              <LakeHeading level={2} variant="h3">
                {t("transfer.new.internationalTransfer.amount.title")}
              </LakeHeading>

              <Space height={24} />

              <TransferInternationalWizardAmount
                initialAmount={amount}
                forcedCurrency={forcedCurrency}
                accountId={accountId}
                accountMembershipId={accountMembershipId}
                onPressPrevious={onPressClose}
                onSave={amount => {
                  hasInitialBeneficiary
                    ? setStep({ name: "Details", amount, beneficiary: initialBeneficiary })
                    : setStep({ name: "Beneficiary", amount });
                }}
              />
            </>
          ))
          .with({ name: "Beneficiary" }, ({ amount, beneficiary, errors }) => (
            <>
              <TransferInternationalWizardAmountSummary
                isMobile={!large}
                amount={amount}
                onPressEdit={() => {
                  setStep({ name: "Amount", amount });
                }}
              />

              <Space height={24} />

              <BeneficiaryStep
                accountId={accountId}
                initialBeneficiary={beneficiary}
                amount={amount}
                errors={errors}
                onPressPrevious={() => {
                  setStep({ name: "Amount", amount });
                }}
                onPressSubmit={beneficiary => {
                  setStep({ name: "Details", amount, beneficiary });
                }}
              />
            </>
          ))
          .with({ name: "Details" }, ({ amount, beneficiary, details }) => (
            <>
              <TransferInternationalWizardAmountSummary
                isMobile={!large}
                amount={amount}
                onPressEdit={() => {
                  setStep({ name: "Amount", amount });
                }}
              />

              <Space height={32} />

              <LakeHeading level={2} variant="h3">
                {t("transfer.new.internationalTransfer.details.title")}
              </LakeHeading>

              <Space height={24} />

              <TransferInternationalWizardDetails
                initialDetails={details}
                amount={amount}
                beneficiary={beneficiary}
                loading={transfer.isLoading()}
                onPressPrevious={errors => {
                  hasInitialBeneficiary
                    ? setStep({ name: "Amount", amount })
                    : setStep({ name: "Beneficiary", amount, beneficiary, errors });
                }}
                onSave={details => {
                  initiateTransfer({ amount, beneficiary, details });
                }}
              />
            </>
          ))
          .otherwise(() => null)
      }
    </WizardLayout>
  );
};
