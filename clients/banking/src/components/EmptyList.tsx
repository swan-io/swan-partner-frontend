import { Box } from "@swan-io/lake/src/components/Box";
import { Fill } from "@swan-io/lake/src/components/Fill";
import { Space } from "@swan-io/lake/src/components/Space";
import { Path, Svg } from "@swan-io/lake/src/components/Svg";
import { colors, invariantColors } from "@swan-io/lake/src/constants/design";
import { typography } from "@swan-io/lake/src/constants/typography";
import { useResponsive } from "@swan-io/lake/src/hooks/useResponsive";
import { Fragment } from "react";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { PlaceholderShape } from "./PlaceholderShape";

const styles = StyleSheet.create({
  base: {
    flex: 1,
    paddingHorizontal: 16,
  },
  desktop: {
    paddingHorizontal: 80,
  },
  iconBase: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBack: {
    alignItems: "center",
    backgroundColor: colors.gray[100],
    borderRadius: 48,
    height: 96,
    justifyContent: "center",
    width: 96,
  },
  text: {
    ...typography.bodyLarge,
    fontWeight: typography.fontWeights.demi,
  },
  svg: {
    height: 60,
    width: 60,
  },
});

type Props = {
  length?: number;
  text: string;
  style?: StyleProp<ViewStyle>;
};

export const EmptyList = ({ length = 20, text, style }: Props) => {
  const { desktop } = useResponsive();

  const Item = (
    <Box direction="row" alignItems="center">
      <View>
        <PlaceholderShape height={10} width={120} />
        <Space height={8} />
        <PlaceholderShape height={6} width={80} />
      </View>

      <Fill minWidth={16} />
      <PlaceholderShape height={6} width={80} />
    </Box>
  );

  return (
    <View accessibilityRole="main" style={[styles.base, desktop && styles.desktop, style]}>
      <Space height={8} />

      {Array(length)
        .fill(null)
        .map((_, index) => (
          <Fragment key={index}>
            {Item}

            <Space height={32} />
          </Fragment>
        ))}

      <View style={styles.iconBase}>
        <View style={styles.iconBack} accessibilityRole="image">
          {/* TODO: Replace this with an illustration */}
          <Svg pointerEvents="none" style={styles.svg} viewBox="0 0 16 16">
            <Path
              d="M12.9.62L11.69 0l-1.23.62L9.23 0 8 .62 6.77 0 5.55.62 4.32 0 3.09.62 1.87 0v14.77c0 .68.55 1.23 1.22 1.23h9.82c.67 0 1.22-.55 1.22-1.23V0l-1.22.62zm-4.29 12.3H4.93a.61.61 0 010-1.23h3.68a.61.61 0 010 1.23zM4.32 9.85c0-.34.27-.62.61-.62H7.4a.61.61 0 010 1.23H4.93a.61.61 0 01-.61-.61zM8.62 8h-3.7a.61.61 0 010-1.23H8.6A.61.61 0 018.6 8zm2.45 4.92a.61.61 0 110-1.23.61.61 0 010 1.23zm0-2.46a.61.61 0 110-1.23.61.61 0 010 1.23zm0-2.46a.61.61 0 110-1.23.61.61 0 010 1.23zm0-3.7H4.93a.61.61 0 010-1.22h6.14a.61.61 0 010 1.23z"
              fill={invariantColors.white}
            />
          </Svg>
        </View>

        <Space height={16} />
        <Text style={styles.text}>{text}</Text>
      </View>
    </View>
  );
};
