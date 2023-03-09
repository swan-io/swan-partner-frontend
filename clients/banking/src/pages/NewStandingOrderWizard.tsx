import { Box } from "@swan-io/lake/src/components/Box";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { Space } from "@swan-io/lake/src/components/Space";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { insets } from "@swan-io/lake/src/constants/insets";
import { useResponsive } from "@swan-io/lake/src/hooks/useResponsive";
import { showToast } from "@swan-io/lake/src/state/toasts";
import { Dispatch, SetStateAction, useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import { match } from "ts-pattern";
import { useMutation } from "urql";
import { ProgressBar } from "../components/ProgressBar";
import {
  NewStandingOrderPageDocument,
  ScheduleStandingOrderDocument,
  ScheduleStandingOrderInput,
} from "../graphql/partner";
import { t } from "../utils/i18n";
import { Router } from "../utils/routes";
import { useQueryWithErrorBoundary } from "../utils/urql";
import {
  CreditorAccountFormValues,
  CreditorAccountStep,
} from "./NewStandingOrderWizardSteps/CreditorAccountStep";
import {
  StandingOrderDetailsFormValues,
  StandingOrderStep,
} from "./NewStandingOrderWizardSteps/StandingOrderSteps";
import { NotFoundPage } from "./NotFoundPage";

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
  StandingOrder: StandingOrderStep,
};

type Step = keyof typeof steps;
export type SetStepAction = Dispatch<SetStateAction<"CreditorAccount" | "StandingOrder">>;

export type StandingOrderFormValues = {
  debtorAccountId: string;
  debtorAccountName: string;
  debtorAccountAmount: string;
  debtorAccountNumber: string;
  debtorAccountCurrency: string;
} & CreditorAccountFormValues &
  StandingOrderDetailsFormValues;

export type SetStandingOrderFormValues = Dispatch<SetStateAction<StandingOrderFormValues>>;

type Props = {
  accountId: string;
  accountMembershipId: string;
};

export const NewStandingOrderWizard = ({ accountId, accountMembershipId }: Props) => {
  const [scheduleStandingOrder, initiateScheduleStandingOrder] = useMutation(
    ScheduleStandingOrderDocument,
  );
  const scheduling = Boolean(scheduleStandingOrder.error ?? scheduleStandingOrder.data);

  const [{ data }] = useQueryWithErrorBoundary({
    query: NewStandingOrderPageDocument,
    variables: { accountId },
  });

  const [step, setStep] = useState<Step>("CreditorAccount");
  const [standingOrderFormValues, setStandingOrderFormValues] = useState<StandingOrderFormValues>({
    debtorAccountId: data.account?.id ?? "",
    debtorAccountName: data.account?.name ?? "",
    debtorAccountNumber: data.account?.number ?? "",
    debtorAccountAmount: data.account?.balances?.available.value ?? "0",
    debtorAccountCurrency: data.account?.currency ?? "EUR",

    creditorIban: "",
    creditorName: "",

    standingOrderPeriod: "Daily",
    standingOrderHasFixedAmount: true,
    standingOrderAmount: "",
    standingOrderTargetBalance: "",
    standingOrderLabel: "",
    standingOrderReference: "",
  });

  const { desktop } = useResponsive();

  const isPreviousButtonVisible = step === "StandingOrder";
  const onPreviousButtonPress = useCallback(() => {
    setStep(
      match<Step, Step>(step)
        .with("CreditorAccount", () => step)
        .with("StandingOrder", () => "CreditorAccount")
        .exhaustive(),
    );
  }, [step]);

  const progress = match(step)
    .with("CreditorAccount", () => 0)
    .with("StandingOrder", () => 0.5)
    .exhaustive();

  const onConfirm = async (values: StandingOrderFormValues) => {
    const consentRedirectUrl =
      window.location.origin +
      Router.AccountPaymentsConsent({ accountMembershipId }) +
      `?${new URLSearchParams({ standingOrder: "true" }).toString()}`;

    const input: ScheduleStandingOrderInput = {
      period: values.standingOrderPeriod,
      accountId: values.debtorAccountId,
      consentRedirectUrl,
      label: values.standingOrderLabel !== "" ? values.standingOrderLabel : null,
      reference:
        values.standingOrderReference !== "" && values.standingOrderPeriod !== "Daily"
          ? values.standingOrderReference
          : null,
      sepaBeneficiary: {
        name: values.creditorName,
        save: false,
        iban: values.creditorIban,
        isMyOwnIban: false,
      },
      ...(values.standingOrderHasFixedAmount
        ? {
            amount: {
              currency: "EUR",
              value: values.standingOrderAmount,
            },
          }
        : {
            targetAvailableBalance: {
              currency: "EUR",
              value: values.standingOrderTargetBalance,
            },
          }),
    };

    return initiateScheduleStandingOrder({ input }).then(({ data }) => {
      const payload = data?.scheduleStandingOrder;

      switch (payload?.__typename) {
        case "InternalErrorRejection":
        case "ForbiddenRejection": {
          return showToast({ variant: "error", title: t("error.generic") });
        }
        case "ScheduleStandingOrderSuccessPayload": {
          const { statusInfo, id: standingOrderId } = payload.standingOrder;

          switch (statusInfo.__typename) {
            case "StandingOrderConsentPendingStatusInfo": {
              window.location.assign(statusInfo.consent.consentUrl);
              return;
            }
            case "StandingOrderCanceledStatusInfo": {
              return Router.replace("AccountPaymentsStandingOrderFailure", {
                standingOrderId,
                accountMembershipId,
              });
            }
            case "StandingOrderEnabledStatusInfo": {
              return Router.replace("AccountPaymentsStandingOrderSuccess", {
                standingOrderId,
                accountMembershipId,
              });
            }
          }
        }
      }
    });
  };

  const nextButtonElement = document.querySelector("#next-button");

  if (!data.account) {
    return <NotFoundPage />;
  }

  return (
    <View style={styles.container}>
      {match(step)
        .with("CreditorAccount", () => (
          <CreditorAccountStep
            standingOrderFormValues={standingOrderFormValues}
            nextButtonElement={nextButtonElement}
            setStandingOrderForm={setStandingOrderFormValues}
            setStep={setStep}
          />
        ))
        .with("StandingOrder", () => (
          <StandingOrderStep
            standingOrderFormValues={standingOrderFormValues}
            nextButtonElement={nextButtonElement}
            onConfirm={values => void onConfirm(values)}
          />
        ))
        .exhaustive()}

      <ProgressBar value={scheduling ? 1 : progress} />

      <Box
        direction="row"
        justifyContent="spaceBetween"
        alignItems="center"
        style={[styles.footer, desktop && styles.desktopFooter]}
      >
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

        <Space width={16} />
        <View style={!desktop ? styles.button : null} nativeID="next-button" />
      </Box>
    </View>
  );
};
