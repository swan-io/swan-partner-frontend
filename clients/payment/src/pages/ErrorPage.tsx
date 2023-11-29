import { BorderedIcon } from "@swan-io/lake/src/components/BorderedIcon";
import { Box } from "@swan-io/lake/src/components/Box";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { Space } from "@swan-io/lake/src/components/Space";
import { SwanLogo } from "@swan-io/lake/src/components/SwanLogo";
import { colors, spacings } from "@swan-io/lake/src/constants/design";
import { StyleSheet } from "react-native";
import { t } from "../utils/i18n";

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingVertical: spacings[40],
  },
  containerItems: {
    width: "100%",
  },
  swanLogo: {
    display: "inline-flex",
    height: 9,
    width: 45 * (9 / 10),
  },
  title: {
    paddingBottom: spacings[4],
  },
  subtitle: {
    lineHeight: 24,
  },
});

export const ErrorPage = () => {
  return (
    <Box
      direction="column"
      alignItems="center"
      justifyContent="spaceBetween"
      style={styles.container}
    >
      <SwanLogo />

      <Box direction="column" alignItems="center" style={styles.containerItems}>
        <BorderedIcon name={"lake-warning"} color="negative" size={70} padding={16} />
        <Space height={24} />

        <LakeText variant="semibold" color={colors.gray[900]} style={styles.title}>
          {t("paymentLink.error.title")}
        </LakeText>

        <LakeText align="center" color={colors.gray[500]} style={styles.subtitle}>
          {t("paymentLink.error.subtitle")}
        </LakeText>
      </Box>

      <Box direction="row" alignItems="baseline">
        <LakeText>{t("paymentLink.poweredBySwan")}</LakeText>
        <Space width={4} />
        <SwanLogo color={colors.swan[500]} style={styles.swanLogo} />
      </Box>
    </Box>
  );
};
