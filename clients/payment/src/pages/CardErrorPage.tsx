import { BorderedIcon } from "@swan-io/lake/src/components/BorderedIcon";
import { Box } from "@swan-io/lake/src/components/Box";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { Space } from "@swan-io/lake/src/components/Space";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { colors, spacings } from "@swan-io/lake/src/constants/design";
import { StyleSheet } from "react-native";
import { t } from "../utils/i18n";
import { Router } from "../utils/routes";

const styles = StyleSheet.create({
  fill: {
    ...commonStyles.fill,
  },
  title: {
    paddingBottom: spacings[4],
  },
  subtitle: {
    lineHeight: 24,
  },
});

type Props = {
  paymentLinkId: string;
};
export const CardErrorPage = ({ paymentLinkId }: Props) => {
  return (
    <Box alignItems="center" justifyContent="center" style={styles.fill}>
      <BorderedIcon name={"lake-warning"} color="negative" size={70} padding={16} />
      <Space height={24} />

      <LakeText variant="semibold" color={colors.gray[900]} style={styles.title}>
        {t("paymentLink.error.title")}
      </LakeText>

      <LakeText align="center" color={colors.gray[500]} style={styles.subtitle}>
        {t("paymentLink.error.subtitle")}
      </LakeText>

      <Space height={32} />

      <LakeButton
        mode="secondary"
        icon="arrow-clockwise-filled"
        onPress={() => Router.replace("PaymentForm", { paymentLinkId })}
      >
        {t("paymentLink.error.retry")}
      </LakeButton>
    </Box>
  );
};
