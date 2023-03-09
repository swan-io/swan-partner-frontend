import { Box } from "@swan-io/lake/src/components/Box";
import { Caption } from "@swan-io/lake/src/components/Caption";
import { Icon } from "@swan-io/lake/src/components/Icon";
import { Space } from "@swan-io/lake/src/components/Space";
import { colors, invariantColors } from "@swan-io/lake/src/constants/design";
import { typography } from "@swan-io/lake/src/constants/typography";
import { useAnimatedValue } from "@swan-io/lake/src/hooks/useAnimatedValue";
import { Fragment, memo, useEffect, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

const clamp = (number: number) => Math.max(0, Math.min(number, 1));

const styles = StyleSheet.create({
  progressBarBackground: {
    position: "absolute",
    backgroundColor: colors.gray[100],
    bottom: 1,
    left: 32 / 2 - 1,
    top: 1,
    width: 2,
  },
  progressBarContent: {
    flexGrow: 1,
    flexShrink: 1,
    transformOrigin: "top",
  },
  text: {
    ...typography.bodyLarge,
    color: colors.gray[900],
  },
  bold: {
    fontWeight: typography.fontWeights.demi,
  },
  dot: {
    backgroundColor: colors.gray[50],
    borderRadius: 16,
    height: 32,
    width: 32,
    // center is used to center the checked icon only
    justifyContent: "center",
    alignItems: "center",
    transitionDuration: "150ms",
    transitionProperty: "background-color",
  },
  dotText: {
    fontWeight: typography.fontWeights.book,
    color: colors.gray[900],
    lineHeight: 30,
  },
  dotBorder: {
    borderColor: colors.gray[100],
    borderWidth: 1,
  },
});

type Props = {
  current: number;
  steps: string[];
  color?: string;
  textColor?: string;
};

export const VerticalProgressBar = memo<Props>(
  ({ current, steps, color = invariantColors.black, textColor = invariantColors.white }) => {
    const [visuallyCurrent, setVisuallyCurrent] = useState(current);
    const size = steps.length - 1;
    const clamped = clamp(current / size);
    const scaleY = useAnimatedValue(clamped);

    useEffect(() => {
      Animated.spring(scaleY, {
        overshootClamping: true,
        toValue: clamped,
        useNativeDriver: false,
      }).start(({ finished }) => {
        finished && setVisuallyCurrent(current);
      });
    }, [clamped, scaleY, current]);

    return (
      <View>
        <View accessibilityRole="progressbar" style={styles.progressBarBackground}>
          <Animated.View
            accessibilityRole="none"
            style={[
              styles.progressBarContent,
              {
                backgroundColor: color,
                transform: [{ scaleY }],
              },
            ]}
          />
        </View>

        {steps.map((text, index) => (
          <Fragment key={`step-${index}`}>
            <Box direction="row" alignItems="center">
              <View
                style={[
                  styles.dot,
                  index <= visuallyCurrent ? { backgroundColor: color } : styles.dotBorder,
                ]}
              >
                {index < visuallyCurrent ? (
                  <Icon name="checkmark-filled" size={16} color={textColor} />
                ) : (
                  <Caption
                    align="center"
                    style={[
                      styles.dotText,
                      index === visuallyCurrent && [styles.bold, { color: textColor }],
                    ]}
                  >
                    {index + 1}
                  </Caption>
                )}
              </View>

              <Space width={16} />

              <Text
                numberOfLines={1}
                style={[styles.text, index === visuallyCurrent && styles.bold]}
              >
                {text}
              </Text>
            </Box>

            {index < size && <Space height={32} />}
          </Fragment>
        ))}
      </View>
    );
  },
);
