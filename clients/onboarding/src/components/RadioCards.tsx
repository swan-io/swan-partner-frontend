import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { Pressable } from "@swan-io/lake/src/components/Pressable";
import { Space } from "@swan-io/lake/src/components/Space";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { backgroundColor, colors, radii } from "@swan-io/lake/src/constants/design";
import { isNotNullish } from "@swan-io/lake/src/utils/nullish";
import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

const styles = StyleSheet.create({
  root: {
    gap: "24px",
  },
  itemAnimation: {
    transform: "translateZ(0px)",
    animationKeyframes: {
      from: {
        opacity: 0,
        transform: "translateZ(0px) translateX(50px)",
      },
      to: {
        opacity: 1,
        transform: "translateZ(0px) translateX(0px)",
      },
    },
    animationDuration: "200ms",
    animationFillMode: "backwards",
    animationTimingFunction: "ease-in-out",
  },
  container: {
    backgroundColor: colors.partner[50],
    borderRadius: radii[8],
    padding: "24px",
    overflow: "hidden",
    borderColor: colors.partner[500],
    borderWidth: 1,
  },
  unselectedContainer: {
    backgroundColor: colors.gray[0],
    borderColor: colors.gray[100],
  },
  unselectedHoveredContainer: {
    backgroundColor: backgroundColor.default,
    borderColor: colors.gray[300],
  },
  disabled: {
    opacity: 0.5,
  },
});

export type RadioCardItem<T> = {
  name: ReactNode;
  description?: ReactNode;
  value: T;
};

type Props<T> = {
  items: RadioCardItem<T>[];
  value?: T;
  getId?: (value: T) => unknown;
  onChange: (value: T) => void;
  disabled?: boolean;
};

const identity = <T,>(x: T) => x;

export const RadioCards = <T,>({
  items,
  getId = identity,
  value,
  disabled = false,
  onChange,
}: Props<T>) => {
  return (
    <View style={styles.root}>
      {items.map((item, index) => (
        <Pressable
          key={String(index)}
          disabled={disabled}
          style={[
            styles.item,
            disabled && commonStyles.disabled,
            styles.itemAnimation, // set enter animation only on desktop because it can break scroll snap
            { animationDelay: `${200 + 100 * index}ms` },
          ]}
          onPress={() => onChange(item.value)}
        >
          {({ hovered }) => (
            <Card
              title={item.name}
              description={item.description}
              hovered={hovered}
              selected={value != null && getId(item.value) === getId(value)}
            />
          )}
        </Pressable>
      ))}
    </View>
  );
};

type CardProps = {
  title: ReactNode;
  description?: ReactNode;
  hovered?: boolean;
  disabled?: boolean;
  selected?: boolean;
};

const Card = ({ title, description, hovered = false, disabled = false, selected }: CardProps) => {
  return (
    <View
      role="region"
      style={[
        styles.container,
        selected === false && styles.unselectedContainer,
        selected === false && hovered && styles.unselectedHoveredContainer,
        disabled && styles.disabled,
      ]}
    >
      <LakeText variant="medium" color={colors.gray[900]}>
        {title}
      </LakeText>
      {isNotNullish(description) && (
        <>
          <Space height={4} />
          <LakeText variant="smallRegular">{description}</LakeText>
        </>
      )}
    </View>
  );
};
