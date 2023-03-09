import { colors, invariantColors } from "@swan-io/lake/src/constants/design";
import { useAnimatedValue } from "@swan-io/lake/src/hooks/useAnimatedValue";
import { useEffect } from "react";
import { Animated, StyleSheet, View } from "react-native";

const clamp = (number: number) => Math.max(0, Math.min(number, 1));

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.gray[100],
    height: 3,
    overflow: "hidden",
  },
  content: {
    flexGrow: 1,
    flexShrink: 1,
    transformOrigin: "left",
  },
});

type Props = {
  current: number;
  steps: string[];
  color?: string;
};

export const ProgressBar = ({ current, steps, color = invariantColors.black }: Props) => {
  const clamped = clamp(current / (steps.length - 1));
  const scaleX = useAnimatedValue(clamped);

  useEffect(() => {
    Animated.spring(scaleX, {
      toValue: clamped,
      useNativeDriver: false,
    }).start();
  }, [clamped, scaleX]);

  return (
    <View accessibilityRole="progressbar" style={styles.base}>
      <Animated.View
        accessibilityRole="none"
        style={[
          styles.content,
          {
            backgroundColor: color,
            transform: [{ scaleX }],
          },
        ]}
      />
    </View>
  );
};
