import { Icon } from "@swan-io/lake/src/components/Icon";
import { Space } from "@swan-io/lake/src/components/Space";
import { colors } from "@swan-io/lake/src/constants/design";
import { typography } from "@swan-io/lake/src/constants/typography";
import { AdditionalInfo, SupportChat } from "@swan-io/shared-business/src/components/SupportChat";
import { StyleProp, StyleSheet, Text, TouchableOpacity, ViewStyle } from "react-native";
import { t } from "../utils/i18n";

const styles = StyleSheet.create({
  base: {
    paddingVertical: 6,
    flexDirection: "row",
  },
  text: {
    ...typography.bodySmall,
    fontWeight: typography.fontWeights.demi,
  },
});

type Props = {
  additionalInfo: AdditionalInfo;
  color?: string;
  style?: StyleProp<ViewStyle>;
  messengerAlignment: "left" | "right";
};

export const NeedHelpButton = ({ color = colors.gray[900], style, additionalInfo }: Props) => {
  return (
    <SupportChat additionalInfo={additionalInfo} accentColor={color} type="end-user">
      {({ onPressShow }) => (
        <TouchableOpacity activeOpacity={0.7} style={[styles.base, style]} onPress={onPressShow}>
          <Text numberOfLines={1} style={styles.text}>
            {t("needHelpButton.text")}
          </Text>

          <Space width={8} />
          <Icon name="chat-help-filled" size={22} color={color} />
        </TouchableOpacity>
      )}
    </SupportChat>
  );
};
