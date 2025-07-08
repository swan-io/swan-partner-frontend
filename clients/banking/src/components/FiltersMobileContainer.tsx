import { ScrollView } from "@swan-io/lake/src/components/ScrollView";
import {
  backgroundColor,
  invariantColors,
  negativeSpacings,
  spacings,
} from "@swan-io/lake/src/constants/design";
import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

const styles = StyleSheet.create({
  base: {
    marginHorizontal: negativeSpacings[8],
    flexGrow: 1,
    flexShrink: 1,
  },
  content: {
    paddingHorizontal: spacings[8],
  },
  gradient: {
    bottom: 0,
    pointerEvents: "none",
    position: "absolute",
    top: 0,
    width: spacings[8],
  },
  gradientLeft: {
    left: 0,
    backgroundImage: `linear-gradient(to right, ${backgroundColor.default}, ${invariantColors.transparent})`,
  },
  gradientRight: {
    right: 0,
    backgroundImage: `linear-gradient(to left, ${backgroundColor.default}, ${invariantColors.transparent})`,
  },
});

type Props = {
  children: ReactNode;
  large: boolean;
};

export const FiltersContainer = ({ children, large }: Props) => {
  if (large) {
    return children;
  }

  return (
    <View style={styles.base}>
      <ScrollView
        showsScrollIndicators={false}
        horizontal={true}
        contentContainerStyle={styles.content}
      >
        {children}
      </ScrollView>

      <View role="presentation" style={[styles.gradient, styles.gradientLeft]} />
      <View role="presentation" style={[styles.gradient, styles.gradientRight]} />
    </View>
  );
};
