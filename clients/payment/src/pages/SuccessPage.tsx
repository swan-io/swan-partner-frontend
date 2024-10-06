import { BorderedIcon } from "@swan-io/lake/src/components/BorderedIcon";
import { Box } from "@swan-io/lake/src/components/Box";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { Space } from "@swan-io/lake/src/components/Space";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { colors, spacings } from "@swan-io/lake/src/constants/design";
import { isNotNullishOrEmpty } from "@swan-io/lake/src/utils/nullish";
import { StyleSheet } from "react-native";
import { t } from "../utils/i18n";

const styles = StyleSheet.create({
  fill: {
    ...commonStyles.fill,
  },
  mobileButtons: {
    paddingHorizontal: spacings[16],
    width: "100%",
  },
  title: {
    paddingBottom: spacings[4],
  },
  subtitle: {
    lineHeight: 24,
  },
});

type Props = {
  mandateUrl?: string;
  redirectUrl?: string;
  large: boolean;
};

export const SuccessPage = ({ mandateUrl, redirectUrl, large }: Props) => {
  return (
    <Box alignItems="center" justifyContent="center" style={styles.fill}>
      <BorderedIcon name={"lake-check"} color="positive" size={70} padding={16} />
      <Space height={24} />

      <LakeText variant="semibold" color={colors.gray[900]} style={styles.title}>
        {t("paymentLink.success.title")}
      </LakeText>

      <LakeText align="center" color={colors.gray[500]} style={styles.subtitle}>
        {t("paymentLink.success.subtitle")}
      </LakeText>

      {isNotNullishOrEmpty(mandateUrl) && (
        <>
          <Space height={32} />

          <Box direction={large ? "row" : "column"} style={!large && styles.mobileButtons}>
            <LakeButton
              color="current"
              ariaLabel={t("paymentLink.button.downloadMandate")}
              icon="arrow-down-regular"
              mode="primary"
              href={mandateUrl}
            >
              {t("paymentLink.button.downloadMandate")}
            </LakeButton>
          </Box>
        </>
      )}

      {isNotNullishOrEmpty(redirectUrl) && (
        <>
          <Space height={32} />

          <Box direction={large ? "row" : "column"} style={!large && styles.mobileButtons}>
            <LakeButton
              color="gray"
              ariaLabel={t("paymentLink.button.returnToWebsite")}
              mode="secondary"
              href={redirectUrl}
            >
              {t("paymentLink.button.returnToWebsite")}
            </LakeButton>
          </Box>
        </>
      )}
    </Box>
  );
};
