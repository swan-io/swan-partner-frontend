import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Separator } from "@swan-io/lake/src/components/Separator";
import { Space } from "@swan-io/lake/src/components/Space";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { breakpoints, spacings } from "@swan-io/lake/src/constants/design";
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { match } from "ts-pattern";
import { t } from "../utils/i18n";
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
  | { name: "Amount"; amount?: Amount }
  | { name: "Beneficiary"; amount: Amount; beneficiary?: Beneficiary }
  | { name: "Details"; amount: Amount; beneficiary: Beneficiary; details?: Details };

type Props = {
  onPressClose: () => void;
  accountId: string;
  accountMembershipId: string;
};

// [NC] FIXME
const onSave = console.log;

export const TransferInternationalWizard = ({
  onPressClose,
  accountId,
  accountMembershipId,
}: Props) => {
  const [step, setStep] = useState<Step>({ name: "Amount" });

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
              .with({ name: "Beneficiary" }, ({ amount, beneficiary }) => {
                return (
                  <>
                    <TransferInternationamWizardAmountSummary
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
                      onPressPrevious={() => setStep({ name: "Beneficiary", amount, beneficiary })}
                      onSave={details =>
                        onSave({ name: "Beneficiary", amount, beneficiary, details })
                      }
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
