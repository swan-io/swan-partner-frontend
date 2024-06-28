import { Result } from "@swan-io/boxed";
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
import { isNotNullish } from "@swan-io/lake/src/utils/nullish";
import { translateError } from "@swan-io/shared-business/src/utils/i18n";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { match } from "ts-pattern";
import {
  InitiateInternationalCreditTransferDocument,
  InternationalCreditTransferRouteInput,
} from "../graphql/partner";
import { t } from "../utils/i18n";
import { Router } from "../utils/routes";
import {
  Amount,
  TransferInternationalWizardAmount,
  TransferInternationamWizardAmountSummary,
} from "./TransferInternationalWizardAmount";
import {
  Beneficiary,
  TransferInternationalWizardBeneficiary,
} from "./TransferInternationalWizardBeneficiary";
import { Details, TransferInternationalWizardDetails } from "./TransferInternationalWizardDetails";

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
  | { name: "Amount"; amount?: Amount }
  | { name: "Beneficiary"; amount: Amount; beneficiary?: Beneficiary; errors?: string[] }
  | { name: "Details"; amount: Amount; beneficiary: Beneficiary; details?: Details };

type Props = {
  onPressClose: () => void;
  accountId: string;
  accountMembershipId: string;
};
export const TransferInternationalWizard = ({
  onPressClose,
  accountId,
  accountMembershipId,
}: Props) => {
  const [step, setStep] = useState<Step>({ name: "Amount" });

  const [initiateTransfers, transfer] = useMutation(InitiateInternationalCreditTransferDocument);

  const initiateTransfer = ({
    amount,
    beneficiary,
    details,
  }: {
    amount: Amount;
    beneficiary: Beneficiary;
    details: Details;
  }) => {
    initiateTransfers({
      input: {
        accountId,
        targetAmount: { value: amount.value, currency: amount.currency },
        internationalBeneficiary: {
          name: beneficiary.name,
          currency: amount.currency,
          route: beneficiary.route as InternationalCreditTransferRouteInput,
          details: beneficiary.results,
        },
        internationalCreditTransferDetails: details.results,
        consentRedirectUrl:
          window.location.origin +
          Router.AccountTransactionsListRoot({ accountMembershipId, kind: "transfer" }),
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
                  {t("transfer.new.internationalTransfer.title")}
                </LakeHeading>
              </View>
            </View>
          </View>

          <Separator />

          <ScrollView contentContainerStyle={[styles.contents, large && styles.desktopContents]}>
            {match(step)
              .with({ name: "Amount" }, ({ amount }) => {
                return (
                  <>
                    <LakeHeading level={2} variant="h3">
                      {t("transfer.new.internationalTransfer.amount.title")}
                    </LakeHeading>

                    <Space height={32} />

                    <TransferInternationalWizardAmount
                      initialAmount={amount}
                      accountId={accountId}
                      accountMembershipId={accountMembershipId}
                      onPressPrevious={onPressClose}
                      onSave={amount => setStep({ name: "Beneficiary", amount })}
                    />
                  </>
                );
              })
              .with({ name: "Beneficiary" }, ({ amount, beneficiary, errors }) => {
                return (
                  <>
                    <TransferInternationamWizardAmountSummary
                      isMobile={!large}
                      amount={amount}
                      onPressEdit={() => setStep({ name: "Amount", amount })}
                    />

                    <Space height={24} />

                    <LakeHeading level={3} variant="h3">
                      {t("transfer.new.internationalTransfer.beneficiary.title")}
                    </LakeHeading>

                    <Space height={32} />

                    <TransferInternationalWizardBeneficiary
                      initialBeneficiary={beneficiary}
                      amount={amount}
                      errors={errors}
                      onPressPrevious={() => setStep({ name: "Amount", amount })}
                      onSave={beneficiary => setStep({ name: "Details", amount, beneficiary })}
                    />
                  </>
                );
              })
              .with({ name: "Details" }, ({ amount, beneficiary, details }) => {
                return (
                  <>
                    <TransferInternationamWizardAmountSummary
                      isMobile={!large}
                      amount={amount}
                      onPressEdit={() => setStep({ name: "Amount", amount })}
                    />

                    <Space height={24} />

                    <LakeHeading level={2} variant="h3">
                      {t("transfer.new.internationalTransfer.details.title")}
                    </LakeHeading>

                    <Space height={32} />

                    <TransferInternationalWizardDetails
                      initialDetails={details}
                      amount={amount}
                      beneficiary={beneficiary}
                      onPressPrevious={errors =>
                        setStep({ name: "Beneficiary", amount, beneficiary, errors })
                      }
                      loading={transfer.isLoading()}
                      onSave={details => {
                        initiateTransfer({ amount, beneficiary, details });
                      }}
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
