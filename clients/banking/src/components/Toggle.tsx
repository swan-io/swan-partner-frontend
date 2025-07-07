import { Icon } from "@swan-io/lake/src/components/Icon";
import { Pressable } from "@swan-io/lake/src/components/Pressable";
import { colors, radii, spacings, texts } from "@swan-io/lake/src/constants/design";
import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { match, P } from "ts-pattern";

const BORDER_WIDTH = 1;

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: colors.gray[200],
    borderRadius: radii[8],
    borderWidth: BORDER_WIDTH,
    height: 28,
  },
  handle: {
    position: "absolute",
    // Allow handle to bleed on container border
    bottom: -BORDER_WIDTH,
    left: -BORDER_WIDTH,
    right: -BORDER_WIDTH,
    top: -BORDER_WIDTH,
    borderWidth: BORDER_WIDTH,
    borderRadius: radii[8],
    transitionDuration: "300ms",
    transitionProperty: "transform, width",
    transitionTimingFunction: "ease-in-out",
  },
  item: {
    paddingHorizontal: spacings[8],
  },
  text: {
    ...texts.smallMedium,
    color: colors.gray[700],
    userSelect: "none",
  },
  hidden: {
    visibility: "hidden",
  },
  textOn: {
    color: colors.positive[500],
  },
  textOff: {
    color: colors.negative[500],
  },
});

const getItemWidth = (node: unknown) =>
  match(node)
    .returnType<number>()
    .with(P.instanceOf(HTMLElement), element => element.offsetWidth)
    .otherwise(() => 0);

type Props = {
  compact?: boolean;
  value: boolean;
  labelOff: string;
  labelOn: string;
  onToggle: (value: boolean) => void;
};

export const Toggle = ({ compact = false, value, labelOff, labelOn, onToggle }: Props) => {
  const [itemsWidth, setItemsWidth] = useState<{ on: number; off: number }>();
  const onViewRef = useRef<Text>(null);
  const offViewRef = useRef<Text>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies(compact):
  useEffect(() => {
    // batch measurements
    setTimeout(() => {
      setItemsWidth({
        on: getItemWidth(onViewRef.current),
        off: getItemWidth(offViewRef.current),
      });
    }, 0);
  }, [compact]);

  const onPress = useCallback(() => {
    onToggle(!value);
  }, [onToggle, value]);

  return (
    <Pressable role="switch" onPress={onPress} aria-checked={value} style={styles.base}>
      <View
        role="presentation"
        style={[
          styles.handle,
          itemsWidth == null
            ? styles.hidden
            : {
                backgroundColor: value ? colors.positive[50] : colors.negative[50],
                borderColor: value ? colors.positive[500] : colors.negative[500],
                transform: `translateX(${value ? 0 : itemsWidth.on + BORDER_WIDTH}px)`,
                width: (value ? itemsWidth.on : itemsWidth.off) + BORDER_WIDTH,
              },
        ]}
      />

      <View ref={onViewRef} style={styles.item}>
        {compact ? (
          <Icon
            color={value ? colors.positive[500] : colors.gray[500]}
            size={16}
            name="checkmark-circle-regular"
          />
        ) : (
          <Text style={[styles.text, value && styles.textOn]}>{labelOn}</Text>
        )}
      </View>

      <View ref={offViewRef} style={styles.item}>
        {compact ? (
          <Icon
            color={!value ? colors.negative[500] : colors.gray[500]}
            size={16}
            name="subtract-circle-regular"
          />
        ) : (
          <Text style={[styles.text, !value && styles.textOff]}>{labelOff}</Text>
        )}
      </View>
    </Pressable>
  );
};
