import { colors } from "@swan-io/lake/src/constants/design";
import { useAnimatedValue } from "@swan-io/lake/src/hooks/useAnimatedValue";
import { useEffect } from "react";
import { Animated, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { useLegacyAccentColor } from "../contexts/legacyAccentColor";

const clamp = (number: number) => Math.max(0, Math.min(number, 1));

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.gray[100],
    height: 4,
  },
  content: {
    flex: 1,
    transformOrigin: "left",
  },
});

type Props = {
  value: number;
  style?: StyleProp<ViewStyle>;
};

export const ProgressBar = ({ value, style }: Props) => {
  const clamped = clamp(value);
  const scaleX = useAnimatedValue(clamped);
  const accentColor = useLegacyAccentColor();

  useEffect(() => {
    Animated.spring(scaleX, {
      overshootClamping: true,
      toValue: clamped,
      useNativeDriver: false,
    }).start();
  }, [clamped, scaleX]);

  return (
    <View accessibilityRole="progressbar" style={[styles.container, style]}>
      <Animated.View
        style={[styles.content, { backgroundColor: accentColor, transform: [{ scaleX }] }]}
        accessibilityRole="none"
      />
    </View>
  );
};
