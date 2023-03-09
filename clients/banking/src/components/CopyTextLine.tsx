import { Box } from "@swan-io/lake/src/components/Box";
import { Icon } from "@swan-io/lake/src/components/Icon";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tooltip } from "@swan-io/lake/src/components/Tooltip";
import { colors, invariantColors } from "@swan-io/lake/src/constants/design";
import { typography } from "@swan-io/lake/src/constants/typography";
import { isNotNullishOrEmpty } from "@swan-io/lake/src/utils/nullish";
import { useRef, useState } from "react";
import { Clipboard, Pressable, StyleSheet, Text, View } from "react-native";
import { t } from "../utils/i18n";

const styles = StyleSheet.create({
  label: {
    ...typography.bodyLarge,
    color: colors.gray[400],
  },
  line: {
    backgroundColor: colors.gray[50],
    borderRadius: 4,
  },
  value: {
    ...typography.bodyLarge,
    lineHeight: typography.lineHeights.input,
    color: colors.gray[900],
    flexGrow: 1,
    flexShrink: 1,
    paddingLeft: 16,
    paddingRight: 8,
    paddingVertical: 12,
  },
  valueAccented: {
    fontWeight: typography.fontWeights.demi,
  },
  button: {
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    borderColor: invariantColors.white,
    paddingHorizontal: 16,
  },
  buttonSmall: {
    height: 40,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  externalButton: {
    borderLeftWidth: 2,
  },
});

type ExternalLinkButtonProps = {
  to: string;
  size: "small" | "large";
  color?: string;
};

const ExternalLinkButton = ({ to, size, color }: ExternalLinkButtonProps) => {
  const ref = useRef<View>(null);

  return (
    <>
      <Space width={4} />

      <Pressable
        ref={ref}
        style={({ pressed }) => [
          styles.button,
          styles.externalButton,
          size === "small" && styles.buttonSmall,
          pressed && styles.buttonPressed,
        ]}
        accessibilityRole="button"
        onPress={() => window.open(to, "_blank")}
      >
        <Icon name="open-filled" size={22} color={color} />
      </Pressable>

      <Tooltip describedBy="open" placement="top" referenceRef={ref} togglableOnFocus={true}>
        {t("externalLinkButton.tooltip")}
      </Tooltip>
    </>
  );
};

type Props = {
  accented?: boolean;
  label?: string;
  value: string;
  size?: "small" | "large";
  multiline?: boolean;
  openableLink?: string;
  color?: string;
};
// TODO: Improve design
export const CopyTextLine = ({
  accented = false,
  label = "",
  size = "large",
  value,
  multiline = false,
  color,
  openableLink,
}: Props) => {
  const ref = useRef<View>(null);
  const [visibleState, setVisibleState] = useState<"copy" | "copied">("copy");

  return (
    <View>
      {label !== "" && (
        <>
          <Text accessibilityRole="label" style={styles.label}>
            {label}
          </Text>

          <Space height={4} />
        </>
      )}

      <Box direction="row" alignItems="center" style={styles.line}>
        <Text
          numberOfLines={multiline ? undefined : 1}
          style={[styles.value, accented && styles.valueAccented]}
        >
          {value}
        </Text>

        <Pressable
          ref={ref}
          style={({ pressed }) => [
            styles.button,
            size === "small" && styles.buttonSmall,
            pressed && styles.buttonPressed,
          ]}
          accessibilityRole="button"
          onPress={() => {
            Clipboard.setString(value);
            setVisibleState("copied");
          }}
        >
          <Icon name="copy-regular" size={22} color={color} />
        </Pressable>

        <Tooltip
          describedBy="copy"
          placement="top"
          referenceRef={ref}
          onHide={() => setVisibleState("copy")}
          togglableOnFocus={true}
        >
          {visibleState === "copy" ? t("tooltip.copy") : t("tooltip.copied")}
        </Tooltip>

        {isNotNullishOrEmpty(openableLink) && (
          <ExternalLinkButton color={color} size={size} to={openableLink} />
        )}
      </Box>
    </View>
  );
};
