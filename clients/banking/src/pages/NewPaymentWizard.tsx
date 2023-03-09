import { Box } from "@swan-io/lake/src/components/Box";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { Space } from "@swan-io/lake/src/components/Space";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { insets } from "@swan-io/lake/src/constants/insets";
import { useResponsive } from "@swan-io/lake/src/hooks/useResponsive";
import { showToast } from "@swan-io/lake/src/state/toasts";
import { isNotNullish } from "@swan-io/lake/src/utils/nullish";
import { Dispatch, SetStateAction, useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import { match, P } from "ts-pattern";
import { useMutation, useQuery } from "urql";
import { ProgressBar } from "../components/ProgressBar";
import {
  GetAccountDocument,
  InitiateCreditTransfersInput,
  InitiateSepaCreditTransfersDocument,
} from "../graphql/partner";
import { t } from "../utils/i18n";
import { logFrontendError } from "../utils/logger";
import { Router } from "../utils/routes";
import {
  CreditorAccountFormValues,
  CreditorAccountStep,
} from "./NewPaymentWizardSteps/CreditorAccountStep";
import { DebtorAccountFormValues } from "./NewPaymentWizardSteps/DebtorAccountStep";
import {
  TransferDetailsFormValues,
  TransferDetailsStep,
} from "./NewPaymentWizardSteps/TransferDetailsStep";

const styles = StyleSheet.create({
  container: {
    ...commonStyles.fill,
  },
  button: {
    flexShrink: 1,
    flexGrow: 1,
    flexBasis: "50%",
  },
  desktopButton: {
    maxWidth: 200,
  },
  footer: {
    padding: 16,
    paddingBottom: insets.addToBottom(16),
  },
  desktopFooter: {
    paddingHorizontal: 80,
    paddingTop: 24,
    paddingBottom: 24,
  },
  hidden: {
    ...commonStyles.hidden,
  },
});

const steps = {
  CreditorAccount: CreditorAccountStep,
  TransferDetails: TransferDetailsStep,
};
type Step = keyof typeof steps;

export type SetStepAction = Dispatch<SetStateAction<"CreditorAccount" | "TransferDetails">>;
export type NewPaymentFormValues = DebtorAccountFormValues &
  CreditorAccountFormValues &
  TransferDetailsFormValues;
export type SetNewPaymentFormValues = Dispatch<SetStateAction<NewPaymentFormValues>>;

type Props = {
  accountId: string;
  accountMembershipId: string;
};

export const NewPaymentWizard = ({ accountId, accountMembershipId }: Props) => {
  const [step, setStep] = useState<Step>("CreditorAccount");
  const [{ data }] = useQuery({ query: GetAccountDocument, variables: { accountId } });
  const [newPaymentFormValues, setNewPaymentFormValues] = useState<NewPaymentFormValues>({
    debtorAccountId: accountId,
    debtorAccountName: data?.account?.name ?? "",
    debtorAccountNumber: data?.account?.number ?? "",
    debtorAccountAmount: data?.account?.balances?.available.value ?? "",
    debtorAccountCurrency: data?.account?.balances?.available.currency ?? "EUR",

    creditorIban: "",
    creditorName: "",

    transferAmount: "",
    transferLabel: "",
    transferReference: "",
    isInstant: false,
  });

  const [transfer, initiateTransfers] = useMutation(InitiateSepaCreditTransfersDocument);
  const transfering = Boolean(transfer.error ?? transfer.data);

  const { desktop } = useResponsive();

  const isPreviousButtonVisible = step === "CreditorAccount" || step === "TransferDetails";

  const onPreviousButtonPress = useCallback(() => {
    setStep(
      match<Step, Step>(step)
        .with("CreditorAccount", () => step)
        .with("TransferDetails", () => "CreditorAccount")
        .exhaustive(),
    );
  }, [step]);

  const onConfirm = async (values: NewPaymentFormValues) => {
    const input: InitiateCreditTransfersInput = {
      accountId: values.debtorAccountId,
      consentRedirectUrl:
        window.location.origin + Router.AccountPaymentsConsent({ accountMembershipId }),
      creditTransfers: [
        {
          amount: { currency: "EUR", value: values.transferAmount },
          label: values.transferLabel ? values.transferLabel : null,
          reference: values.transferReference ? values.transferReference : null,
          sepaBeneficiary: {
            name: values.creditorName,
            save: false,
            iban: values.creditorIban,
            isMyOwnIban: false, // TODO
          },
          isInstant: values.isInstant,
        },
      ],
    };

    return initiateTransfers({ input })
      .then(({ data, error }) => {
        if (isNotNullish(error)) {
          return Promise.reject(error);
        }

        const transfer = data?.initiateCreditTransfers;

        return match(transfer)
          .with(
            P.nullish,
            { __typename: "AccountNotFoundRejection" },
            { __typename: "ForbiddenRejection" },
            () => showToast({ variant: "error", title: t("error.generic") }),
          )
          .with({ __typename: "InitiateCreditTransfersSuccessPayload" }, ({ payment }) => {
            const status = payment.statusInfo;
            const params = { paymentId: payment.id, accountMembershipId };

            return match(status)
              .with({ __typename: "PaymentInitiated" }, () =>
                Router.replace("AccountPaymentsSuccess", params),
              )
              .with({ __typename: "PaymentRejected" }, () =>
                Router.replace("AccountPaymentsFailure", params),
              )
              .with({ __typename: "PaymentConsentPending" }, ({ consent }) => {
                window.location.assign(consent.consentUrl);
              })
              .exhaustive();
          })
          .exhaustive();
      })
      .catch(error => {
        logFrontendError(error);
        showToast({ variant: "error", title: t("error.generic") });
      });
  };

  const progress = match(step)
    .with("CreditorAccount", () => 0.0)
    .with("TransferDetails", () => 0.5)
    .exhaustive();

  const nextButtonElement = document.querySelector("#next-button");

  return (
    <View style={styles.container}>
      {match(step)
        .with("CreditorAccount", () => (
          <CreditorAccountStep
            nextButtonElement={nextButtonElement}
            newPaymentFormValues={newPaymentFormValues}
            setNewPaymentFormValues={setNewPaymentFormValues}
            setStep={setStep}
          />
        ))
        .with("TransferDetails", () => (
          <TransferDetailsStep
            nextButtonElement={nextButtonElement}
            newPaymentFormValues={newPaymentFormValues}
            onConfirm={values => void onConfirm(values)}
          />
        ))
        .exhaustive()}

      <ProgressBar value={transfering ? 1 : progress} />

      <Box
        direction="row"
        justifyContent="spaceBetween"
        alignItems="center"
        style={[styles.footer, desktop && styles.desktopFooter]}
      >
        {step === "CreditorAccount" ? (
          <View />
        ) : (
          <LakeButton
            mode="secondary"
            disabled={!isPreviousButtonVisible}
            onPress={onPreviousButtonPress}
            style={[
              styles.button,
              desktop && styles.desktopButton,
              !isPreviousButtonVisible && styles.hidden,
            ]}
          >
            {t("payments.new.previous")}
          </LakeButton>
        )}

        <Space width={16} />
        <View style={!desktop ? styles.button : null} nativeID="next-button" />
      </Box>
    </View>
  );
};
