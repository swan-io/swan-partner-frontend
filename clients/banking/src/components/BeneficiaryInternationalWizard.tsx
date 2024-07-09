import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { ScrollView } from "@swan-io/lake/src/components/ScrollView";
import { Separator } from "@swan-io/lake/src/components/Separator";
import { Space } from "@swan-io/lake/src/components/Space";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { breakpoints, spacings } from "@swan-io/lake/src/constants/design";
import { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { AccountCountry } from "../graphql/partner";
import { t } from "../utils/i18n";
import {
  Beneficiary,
  BeneficiaryInternationalWizardForm,
} from "./BeneficiaryInternationalWizardForm";

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
    paddingVertical: spacings[32],
    width: "100%",
  },
  desktopContents: {
    marginVertical: "auto",
    paddingHorizontal: spacings[96],
  },
});

type Props = {
  onPressClose?: () => void;
  accountCountry: AccountCountry;
  accountId: string;
  accountMembershipId: string;
};

export const BeneficiaryInternationalWizard = ({
  onPressClose,
  accountCountry,
  accountId,
  accountMembershipId,
}: Props) => {
  const handleOnSubmit = useCallback((beneficiary: Beneficiary) => {}, []);

  return (
    <ResponsiveContainer style={styles.fill} breakpoint={breakpoints.medium}>
      {({ large }) => (
        <View style={styles.fill}>
          <View style={styles.header}>
            <View style={[styles.headerContents, !large && styles.mobileZonePadding]}>
              {onPressClose != null && (
                <>
                  <LakeButton
                    ariaLabel={t("common.closeButton")}
                    mode="tertiary"
                    icon="dismiss-regular"
                    onPress={onPressClose}
                  />

                  <Space width={large ? 32 : 8} />
                </>
              )}

              <View style={styles.fill}>
                <LakeHeading level={2} variant="h3">
                  {t("beneficiaries.wizards.international.title")}
                </LakeHeading>
              </View>
            </View>
          </View>

          <Separator />

          <ScrollView contentContainerStyle={[styles.contents, large && styles.desktopContents]}>
            <LakeHeading level={2} variant="h3">
              {t("beneficiaries.wizards.international.subtitle")}
            </LakeHeading>

            <Space height={32} />

            <BeneficiaryInternationalWizardForm
              mode="add"
              onPressPrevious={onPressClose}
              onPressSubmit={handleOnSubmit}
            />
          </ScrollView>
        </View>
      )}
    </ResponsiveContainer>
  );
};
