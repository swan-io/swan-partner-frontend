import { AsyncData, Option, Result } from "@swan-io/boxed";
import { useMutation, useQuery } from "@swan-io/graphql-client";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LoadingView } from "@swan-io/lake/src/components/LoadingView";
import { Space } from "@swan-io/lake/src/components/Space";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { showToast } from "@swan-io/shared-business/src/state/toasts";
import { translateError } from "@swan-io/shared-business/src/utils/i18n";
import { ReactNode, useCallback, useState } from "react";
import { match, P } from "ts-pattern";
import {
  AccountCountry,
  CreditTransferInput,
  InitiateSepaCreditTransfersDocument,
  TransferBulkWizardDocument,
  VerifyBeneficiarySuccessPayloadFragment,
} from "../graphql/partner";
import { usePermissions } from "../hooks/usePermissions";
import { encodeDateTime } from "../utils/date";
import { t } from "../utils/i18n";
import { Router } from "../utils/routes";
import { ErrorView } from "./ErrorView";
import { TransferBulkReview } from "./TransferBulkReview";
import { TransferBulkUpload } from "./TransferBulkUpload";
import { TransferRegularWizardDetailsSummary } from "./TransferRegularWizardDetails";
import { Schedule, TransferRegularWizardSchedule } from "./TransferRegularWizardSchedule";
import { WizardLayout } from "./WizardLayout";

type Step =
  | { name: "Upload" }
  | {
      name: "Review";
      creditTransferInputs: (CreditTransferInput & {
        beneficiaryVerification?: VerifyBeneficiarySuccessPayloadFragment;
      })[];
      initialSelectedCreditTransferInputs?: CreditTransferInput[];
    }
  | {
      name: "Schedule";
      originalCreditTransferInputs: (CreditTransferInput & {
        beneficiaryVerification?: VerifyBeneficiarySuccessPayloadFragment;
      })[];
      creditTransferInputs: (CreditTransferInput & {
        beneficiaryVerification?: VerifyBeneficiarySuccessPayloadFragment;
      })[];
    };

type Props = {
  onPressClose?: () => void;
  accountCountry: AccountCountry;
  accountId: string;
  accountMembershipId: string;
};

export const TransferBulkWizard = ({ onPressClose, accountId, accountMembershipId }: Props) => {
  const { canReadTransaction } = usePermissions();
  const [accountData] = useQuery(TransferBulkWizardDocument, { accountId });
  const [initiateTransfers, transfer] = useMutation(InitiateSepaCreditTransfersDocument);
  const [step, setStep] = useState<Step>({ name: "Upload" });

  const initiateTransfer = ({
    creditTransferInputs,
    schedule,
  }: {
    creditTransferInputs: (CreditTransferInput & {
      beneficiaryVerification?: VerifyBeneficiarySuccessPayloadFragment;
    })[];
    schedule: Schedule;
  }) => {
    initiateTransfers({
      input: {
        accountId,
        consentRedirectUrl:
          window.location.origin +
          (canReadTransaction
            ? Router.AccountTransactionsListRoot({ accountMembershipId, kind: "transfer" })
            : Router.AccountPaymentsRoot({ accountMembershipId })),
        creditTransfers: creditTransferInputs.map(
          ({
            beneficiaryVerificationToken,
            beneficiaryVerification,
            sepaBeneficiary,
            ...creditTransferInput
          }) => ({
            ...creditTransferInput,
            ...(beneficiaryVerification?.beneficiaryVerificationToken == null
              ? { sepaBeneficiary }
              : {
                  beneficiaryVerificationToken:
                    beneficiaryVerification.beneficiaryVerificationToken,
                }),

            ...match(schedule)
              .with({ isScheduled: true }, ({ scheduledDate, scheduledTime }) => ({
                requestedExecutionAt: encodeDateTime(scheduledDate, `${scheduledTime}:00`),
              }))
              .otherwise(({ isInstant }) => ({
                mode: isInstant ? "InstantWithFallback" : "Regular",
              })),
          }),
        ),
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

  const onSave = useCallback((creditTransferInputs: CreditTransferInput[]) => {
    setStep({ name: "Review", creditTransferInputs });
  }, []);

  return (
    <WizardLayout title={t("transfer.newBulkTransfer")} onPressClose={onPressClose}>
      {({ large }) =>
        match(accountData)
          .returnType<ReactNode>()
          .with(AsyncData.P.NotAsked, AsyncData.P.Loading, () => <LoadingView />)
          .with(AsyncData.P.Done(Result.P.Error(P.select())), error => <ErrorView error={error} />)
          .with(AsyncData.P.Done(Result.P.Ok(P.select())), ({ account }) => {
            const allowBulkCreditTransfersWithoutBeneficiaryVerification = Option.fromNullable(
              account,
            )
              .flatMap(account =>
                Option.fromNullable(
                  account.settings.allowBulkCreditTransfersWithoutBeneficiaryVerification,
                ),
              )
              .getOr(false);

            return match(step)
              .returnType<ReactNode>()
              .with({ name: "Upload" }, () => {
                return (
                  <>
                    <LakeHeading variant="h3" level={2}>
                      {t("transfer.bulk.uploadFile")}
                    </LakeHeading>

                    <Space height={32} />
                    <TransferBulkUpload
                      onSave={onSave}
                      canRequestBulkCreditTransfersWithoutBeneficiaryVerification={
                        account?.holder.info.type === "Company"
                      }
                      allowBulkCreditTransfersWithoutBeneficiaryVerification={
                        allowBulkCreditTransfersWithoutBeneficiaryVerification
                      }
                    />
                  </>
                );
              })
              .with(
                { name: "Review" },
                ({ creditTransferInputs, initialSelectedCreditTransferInputs }) => (
                  <>
                    <LakeHeading variant="h3" level={2}>
                      {t("transfer.bulk.review")}
                    </LakeHeading>

                    <Space height={32} />

                    <TransferBulkReview
                      creditTransferInputs={creditTransferInputs}
                      initialSelectedCreditTransferInputs={initialSelectedCreditTransferInputs}
                      onPressPrevious={() => setStep({ name: "Upload" })}
                      onSave={selectedCreditTransferInputs => {
                        setStep({
                          name: "Schedule",
                          creditTransferInputs: selectedCreditTransferInputs,
                          originalCreditTransferInputs: creditTransferInputs,
                        });
                      }}
                    />
                  </>
                ),
              )
              .with(
                { name: "Schedule" },
                ({ originalCreditTransferInputs, creditTransferInputs }) => (
                  <>
                    <TransferRegularWizardDetailsSummary
                      isMobile={!large}
                      details={{
                        amount: {
                          value: String(
                            creditTransferInputs.reduce(
                              (acc, item) => acc + Number(item.amount.value),
                              0,
                            ),
                          ),
                          currency: "EUR",
                        },
                      }}
                      onPressEdit={() =>
                        setStep({
                          name: "Review",
                          creditTransferInputs: originalCreditTransferInputs,
                          initialSelectedCreditTransferInputs: creditTransferInputs,
                        })
                      }
                    />

                    <Space height={32} />

                    <LakeHeading level={2} variant="h3">
                      {t("transfer.new.schedule.titlePlural")}
                    </LakeHeading>

                    <Space height={32} />

                    <TransferRegularWizardSchedule
                      loading={transfer.isLoading()}
                      onPressPrevious={() =>
                        setStep({
                          name: "Review",
                          creditTransferInputs: originalCreditTransferInputs,
                          initialSelectedCreditTransferInputs: creditTransferInputs,
                        })
                      }
                      onSave={schedule => {
                        initiateTransfer({ creditTransferInputs, schedule });
                      }}
                    />
                  </>
                ),
              )
              .otherwise(() => null);
          })
          .exhaustive()
      }
    </WizardLayout>
  );
};
