import { useMutation } from "@swan-io/graphql-client";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { ScrollView } from "@swan-io/lake/src/components/ScrollView";
import { Separator } from "@swan-io/lake/src/components/Separator";
import { Space } from "@swan-io/lake/src/components/Space";
import { TabView } from "@swan-io/lake/src/components/TabView";
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
  BeneficiarySepaWizardForm,
  TransferWizardBeneficiarySummary,
} from "./BeneficiarySepaWizardForm";
import { SavedBeneficiariesForm } from "./SavedBeneficiariesForm";
import {
  Details,
  TransferRegularWizardDetails,
  TransferRegularWizardDetailsSummary,
} from "./TransferRegularWizardDetails";
import { Schedule, TransferRegularWizardSchedule } from "./TransferRegularWizardSchedule";

const styles = StyleSheet.create({
  fill: {
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
    paddingTop: spacings[32],
    paddingBottom: spacings[16],
    width: "100%",
  },
  desktopContents: {
    marginVertical: "auto",
    paddingHorizontal: spacings[96],
  },
});

const BeneficiaryStep = ({
  accountCountry,
  accountId,
  initialBeneficiary,
  onPressSubmit,
}: {
  accountCountry: AccountCountry;
  accountId: string;
  initialBeneficiary: Beneficiary | undefined;
  onPressSubmit: (beneficiary: Beneficiary) => void;
}) => {
  const [activeTab, setActiveTab] = useState(initialBeneficiary?.type ?? "new");

  return (
    <>
      <LakeHeading level={2} variant="h3">
        {t("transfer.new.beneficiary.title")}
      </LakeHeading>

      <Space height={24} />

      <TabView
        activeTabId={activeTab}
        onChange={tab => setActiveTab(tab as Beneficiary["type"])}
        otherLabel={t("common.tabs.other")}
        tabs={
          [
            { id: "new", label: t("transfer.new.beneficiary.new") },
            { id: "saved", label: t("transfer.new.beneficiary.saved") },
          ] satisfies { id: Beneficiary["type"]; label: string }[]
        }
      />

      <Space height={32} />

      {match(activeTab)
        .with("new", () => (
          <BeneficiarySepaWizardForm
            mode="continue"
            accountCountry={accountCountry}
            accountId={accountId}
            initialBeneficiary={initialBeneficiary}
            onPressSubmit={onPressSubmit}
          />
        ))
        .with("saved", () => (
          <SavedBeneficiariesForm accountId={accountId} onPressSubmit={onPressSubmit} />
        ))
        .exhaustive()}
    </>
  );
};

type Step =
  | {
      name: "Beneficiary";
      beneficiary?: Beneficiary;
    }
  | {
      name: "Details";
      beneficiary: Beneficiary;
      details?: Details;
    }
  | {
      name: "Schedule";
      beneficiary: Beneficiary;
      details: Details;
    };

type Props = {
  onPressClose?: () => void;
  accountCountry: AccountCountry;
  accountId: string;
  accountMembershipId: string;
  canViewAccount: boolean;
};

export const TransferRegularWizard = ({
  onPressClose,
  accountCountry,
  accountId,
  accountMembershipId,
  canViewAccount,
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
          (canViewAccount
            ? Router.AccountTransactionsListRoot({ accountMembershipId, kind: "transfer" })
            : Router.AccountPaymentsRoot({ accountMembershipId, kind: "transfer" })),
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
              .with({ type: "new" }, () => ({
                sepaBeneficiary: {
                  name: beneficiary.name,
                  save: false,
                  iban: beneficiary.iban,
                  isMyOwnIban: false, // TODO
                },
              }))
              .with({ type: "saved" }, ({ id }) => ({
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
    <ResponsiveContainer style={styles.fill} breakpoint={breakpoints.medium}>
      {({ large }) => (
        <View style={styles.fill}>
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

              <View style={styles.fill}>
                <LakeHeading level={2} variant="h3">
                  {t("transfer.newTransfer")}
                </LakeHeading>
              </View>
            </View>
          </View>

          <Separator />

          <ScrollView contentContainerStyle={[styles.contents, large && styles.desktopContents]}>
            {match(step)
              .with({ name: "Beneficiary" }, ({ beneficiary }) => (
                <BeneficiaryStep
                  accountCountry={accountCountry}
                  accountId={accountId}
                  initialBeneficiary={beneficiary}
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
              ))
              .with({ name: "Schedule" }, ({ beneficiary, details }) => (
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
              ))
              .otherwise(() => null)}
          </ScrollView>
        </View>
      )}
    </ResponsiveContainer>
  );
};
