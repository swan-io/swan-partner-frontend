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
  text: {
    ...texts.smallMedium,
    color: colors.gray[700],
    paddingHorizontal: spacings[8],
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

type Layout = {
  left: number;
  width: number;
};

const getLayout = (node: unknown) =>
  match(node)
    .returnType<Layout>()
    .with(P.instanceOf(HTMLElement), element => ({
      left: element.offsetLeft,
      width: element.offsetWidth,
    }))
    .otherwise(() => ({
      left: 0,
      width: 0,
    }));

type Props = {
  value: boolean;
  labelOff: string;
  labelOn: string;
  onToggle: (value: boolean) => void;
};

export const Toggle = ({ value, labelOff, labelOn, onToggle }: Props) => {
  const [layout, setLayout] = useState<{ on: Layout; off: Layout }>();
  const onTextRef = useRef<Text>(null);
  const offTextRef = useRef<Text>(null);

  useEffect(() => {
    // batch measurements
    setTimeout(() => {
      setLayout({
        on: getLayout(onTextRef.current),
        off: getLayout(offTextRef.current),
      });
    }, 0);
  }, []);

  const onPress = useCallback(() => {
    onToggle(!value);
  }, [onToggle, value]);

  return (
    <Pressable role="switch" onPress={onPress} aria-checked={value} style={styles.base}>
      <View
        role="presentation"
        style={[
          styles.handle,
          layout == null
            ? styles.hidden
            : {
                backgroundColor: value ? colors.positive[50] : colors.negative[50],
                borderColor: value ? colors.positive[500] : colors.negative[500],
                transform: `translateX(${value ? 0 : layout.off.left + BORDER_WIDTH}px)`,
                width: (value ? layout.on.width : layout.off.width) + 2 * BORDER_WIDTH,
              },
        ]}
      />

      <Text ref={onTextRef} style={[styles.text, value && styles.textOn]}>
        {labelOn}
      </Text>

      <Text ref={offTextRef} style={[styles.text, !value && styles.textOff]}>
        {labelOff}
      </Text>
    </Pressable>
  );
};
