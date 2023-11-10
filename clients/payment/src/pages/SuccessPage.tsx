import { BorderedIcon } from "@swan-io/lake/src/components/BorderedIcon";
import { Box } from "@swan-io/lake/src/components/Box";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { Space } from "@swan-io/lake/src/components/Space";
import { SwanLogo } from "@swan-io/lake/src/components/SwanLogo";
import { colors } from "@swan-io/lake/src/constants/design";
import { StyleSheet } from "react-native";
import { t } from "../utils/i18n";

const styles = StyleSheet.create({
  swanLogo: {
    display: "inline-flex",
    height: 9,
    width: 45 * (9 / 10),
  },
});

export const SuccessPage = () => {
  return (
    <Box direction="column" alignItems="center" justifyContent="spaceBetween">
      <SwanLogo />

      <Box direction="column" alignItems="center">
        <BorderedIcon name={"checkmark-filled"} color="positive" />

        <LakeText variant="semibold" color={colors.gray[900]}>
          {t("paymentLink.success.title")}
        </LakeText>

        <LakeText color={colors.gray[500]}>{t("paymentLink.success.subtitle")}</LakeText>

        <LakeButtonGroup>
          <LakeButton
            ariaLabel={t("paymentLink.button.returnToWebsite")}
            icon="dismiss-regular"
            mode="secondary"
            grow={true}
            onPress={() => {}}
          >
            {t("paymentLink.button.returnToWebsite")}
          </LakeButton>

          <LakeButton
            ariaLabel={t("paymentLink.button.downloadMandate")}
            icon="arrow-down-regular"
            mode="primary"
            grow={true}
            onPress={() => {}}
          >
            {t("paymentLink.button.downloadMandate")}
          </LakeButton>
        </LakeButtonGroup>
      </Box>

      <Box direction="row" alignItems="baseline">
        <LakeText>{t("paymentLink.poweredBySwan")}</LakeText>
        <Space width={4} />
        <SwanLogo color={colors.swan[500]} style={styles.swanLogo} />
      </Box>
    </Box>
  );
};
