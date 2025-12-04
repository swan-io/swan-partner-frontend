import { BorderedIcon } from "@swan-io/lake/src/components/BorderedIcon";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { Space } from "@swan-io/lake/src/components/Space";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { backgroundColor } from "@swan-io/lake/src/constants/design";
import { StyleSheet, View } from "react-native";
import { t } from "../../utils/i18n";

const styles = StyleSheet.create({
  container: {
    ...commonStyles.fill,
    backgroundColor: backgroundColor.default,
  },
  successContainer: {
    ...commonStyles.fill,
    alignItems: "center",
    justifyContent: "center",
  },
});

export const VerificationRenewalFinalizeSuccess = () => {
  return (
    <View style={styles.successContainer}>
      <BorderedIcon padding={24} name="lake-check" size={100} />

      <Space height={32} />
      <LakeHeading variant="h4" level={1}>
        {t("verificationRenewal.finalize.title")}
      </LakeHeading>

      <Space height={16} />
      <LakeText align="center">{t("verificationRenewal.finalize.subtitle")}</LakeText>

      <Space height={16} />
      <LakeButton color="partner">{t("verificationRenewal.close")}</LakeButton>
    </View>
  );
};
