import { Heading } from "@swan-io/lake/src/components/Heading";
import { Icon, IconName } from "@swan-io/lake/src/components/Icon";
import { Link } from "@swan-io/lake/src/components/Link";
import { Space } from "@swan-io/lake/src/components/Space";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { colors, invariantColors } from "@swan-io/lake/src/constants/design";
import { typography } from "@swan-io/lake/src/constants/typography";
import { useComputedColors } from "@swan-io/lake/src/hooks/useComputedColors";
import { isNotNullish } from "@swan-io/lake/src/utils/nullish";
import { ReactNode, useCallback } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useLegacyAccentColor } from "../contexts/legacyAccentColor";

const styles = StyleSheet.create({
  container: {
    ...commonStyles.fill,
  },
  white: { color: invariantColors.white },
  // eslint-disable-next-line react-native/no-color-literals
  light: { color: "rgba(255,255,255,0.6)" },

  base: {
    backgroundColor: invariantColors.white,
    borderColor: colors.gray[100],
    borderRadius: 4,
    borderWidth: 1,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    transitionProperty: "background-color",
    transitionDuration: "150ms",
  },
  hovered: {
    backgroundColor: colors.gray[50],
  },
  pressed: {
    backgroundColor: colors.gray[100],
  },
  subtitle: {
    ...typography.bodyLarge,
    color: colors.gray[400],
    textAlign: "left",
  },
});

type Props = {
  accented?: boolean;
  title: string;
  subtitle?: ReactNode;
  details?: ReactNode;
  disabled?: boolean;
  to?: string;
  target?: "blank" | "parent" | "self" | "top";
  onPress?: () => void;
  children?: ReactNode;
  icon?: IconName;
};

export const BorderedRow = ({
  accented = false,
  title,
  subtitle,
  disabled = false,
  to = "",
  target,
  details,
  onPress,
  children,
  icon,
}: Props) => {
  const accentColor = useLegacyAccentColor();
  const computedColors = useComputedColors(accentColor);

  const content = (
    <>
      <View style={styles.container}>
        <Heading level={3} numberOfLines={1} size={20} style={accented && styles.white}>
          {title}
        </Heading>

        {typeof subtitle === "string" ? (
          <Text numberOfLines={1} style={[styles.subtitle, accented && styles.light]}>
            {subtitle}
          </Text>
        ) : isNotNullish(subtitle) ? (
          subtitle
        ) : null}

        {isNotNullish(details) && (
          <>
            <Space height={8} />

            {details}
          </>
        )}
      </View>

      <Space width={16} />

      {children}

      {icon && (
        <>
          <Space width={32} />
          <Icon name={icon} size={20} color={accentColor} />
        </>
      )}
    </>
  );

  const getStyle = useCallback(
    ({ hovered = false, pressed = false }: { hovered: boolean; pressed: boolean }) => {
      const contextAccentColor = pressed
        ? computedColors.pressed
        : hovered
        ? computedColors.hovered
        : accentColor;

      return [
        styles.base,
        accented
          ? { borderColor: contextAccentColor, backgroundColor: contextAccentColor }
          : [hovered && styles.hovered, pressed && styles.pressed],
      ];
    },
    [accented, accentColor, computedColors],
  );

  if (disabled) {
    return <View style={styles.base}>{content}</View>;
  }

  return to !== "" ? (
    <Link to={to} target={target} onPress={onPress} style={getStyle}>
      {content}
    </Link>
  ) : (
    <Pressable accessibilityRole="button" onPress={onPress} style={getStyle}>
      {content}
    </Pressable>
  );
};
