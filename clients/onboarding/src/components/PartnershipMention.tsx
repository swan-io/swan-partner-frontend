import { SwanLogo } from "@swan-io/lake/src/components/SwanLogo";
import { colors } from "@swan-io/lake/src/constants/design";
import { typography } from "@swan-io/lake/src/constants/typography";
import { StyleProp, StyleSheet, Text, ViewStyle } from "react-native";
import { t } from "../utils/i18n";

const styles = StyleSheet.create({
  text: {
    ...typography.bodySmall,
    lineHeight: typography.lineHeights.title,
    color: colors.gray[400],
  },
  logo: {
    display: "inline-block",
    height: 8,
    width: 36,
  },
});

type Props = {
  style?: StyleProp<ViewStyle>;
};

export const PartnershipMention = ({ style }: Props) => {
  return (
    <Text style={[styles.text, style]}>
      {t("partnershipMention.text")} <SwanLogo color={colors.gray[400]} style={styles.logo} />
    </Text>
  );
};
