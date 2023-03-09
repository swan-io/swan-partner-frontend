import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { invariantColors } from "@swan-io/lake/src/constants/design";
import { insets } from "@swan-io/lake/src/constants/insets";
import { useAnimatedValue } from "@swan-io/lake/src/hooks/useAnimatedValue";
import { useResponsive } from "@swan-io/lake/src/hooks/useResponsive";
import { ComponentType, forwardRef, ReactNode, Ref } from "react";
import {
  Animated,
  FlatList,
  FlatListProps,
  ScrollView,
  ScrollViewProps,
  SectionList,
  SectionListProps,
  StyleSheet,
  View,
  ViewProps,
} from "react-native";

const styles = StyleSheet.create({
  container: {
    ...commonStyles.fill,
  },
  component: {
    ...commonStyles.fill,
  },
  viewContainer: {
    ...commonStyles.fill,
  },
  desktop: {
    paddingBottom: 56,
    paddingLeft: 80,
    paddingRight: 80,
  },
  mobile: {
    paddingBottom: 16,
    paddingLeft: insets.addToLeft(16),
    paddingRight: insets.addToRight(16),
  },
  noHorizontalPadding: {
    paddingLeft: 0,
    paddingRight: 0,
  },
  noTopPadding: {
    paddingTop: 0,
  },
  noBottomPadding: {
    paddingBottom: 0,
  },
  shadow: {
    position: "absolute",
    backgroundImage: `linear-gradient(180deg, ${invariantColors.black}, ${invariantColors.transparent})`,
    left: 0,
    right: 0,
    top: 0,
    height: 4,
  },
});

type Props<T extends ScrollViewProps> = Omit<T, "onScroll" | "scrollEventThrottle" | "style"> & {
  ref?: unknown;
  noHorizontalPadding?: boolean;
  noTopPadding?: boolean;
};

function wrap<P extends Props<ScrollViewProps>>(Component: ComponentType<P>) {
  return forwardRef((props: P, ref: Ref<P>) => {
    const { contentContainerStyle, noHorizontalPadding = false, noTopPadding = false } = props;

    const { desktop } = useResponsive();
    const y = useAnimatedValue(0);

    const opacity = y.interpolate({
      extrapolate: "clamp",
      inputRange: [0, 16],
      outputRange: [0, 0.05],
    });

    return (
      <View accessibilityRole="main" style={styles.container}>
        <Component
          ref={ref}
          style={styles.component}
          scrollEventThrottle={16}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y } } }], {
            useNativeDriver: false,
          })}
          {...props}
          contentContainerStyle={[
            desktop ? styles.desktop : styles.mobile,
            contentContainerStyle,
            noHorizontalPadding && styles.noHorizontalPadding,
            noTopPadding && styles.noTopPadding,
          ]}
        />

        <Animated.View style={[styles.shadow, { opacity }]} />
      </View>
    );
  });
}

export const Main = {
  View: ({
    noTopPadding = false,
    noBottomPadding = false,
    children,
    ...props
  }: Omit<ViewProps, "style"> & {
    noTopPadding?: boolean;
    noBottomPadding?: boolean;
    children: ReactNode;
  }) => {
    const { desktop } = useResponsive();

    return (
      <View
        accessibilityRole="main"
        style={[
          styles.viewContainer,
          desktop ? styles.desktop : styles.mobile,
          noTopPadding && styles.noTopPadding,
          noBottomPadding && styles.noBottomPadding,
        ]}
        {...props}
      >
        {children}
      </View>
    );
  },

  ScrollView: wrap(ScrollView) as (
    props: Props<ScrollViewProps> & { children?: ReactNode },
  ) => JSX.Element,

  FlatList: wrap<FlatListProps<unknown>>(FlatList) as <P>(
    props: Props<FlatListProps<P>>,
  ) => JSX.Element,

  SectionList: wrap<SectionListProps<unknown>>(SectionList) as <P>(
    props: Props<SectionListProps<P>>,
  ) => JSX.Element,
};
