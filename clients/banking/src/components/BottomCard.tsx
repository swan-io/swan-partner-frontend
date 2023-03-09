import { FocusTrap } from "@swan-io/lake/src/components/FocusTrap";
import { Icon } from "@swan-io/lake/src/components/Icon";
import { Portal } from "@swan-io/lake/src/components/Portal";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { colors, invariantColors } from "@swan-io/lake/src/constants/design";
import { insets } from "@swan-io/lake/src/constants/insets";
import { useAnimatedValue } from "@swan-io/lake/src/hooks/useAnimatedValue";
import { useResponsive } from "@swan-io/lake/src/hooks/useResponsive";
import { stubTrue } from "@swan-io/lake/src/utils/function";
import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import {
  Animated,
  GestureResponderEvent,
  LayoutChangeEvent,
  PanResponder,
  PanResponderGestureState,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { querySafeSelector } from "../utils/dom";
import { t } from "../utils/i18n";
import { Touchable } from "./Touchable";

const CARD_ROOT = querySafeSelector("#card-root");
const BOUNCE_MARGIN = 100;
const UNSET = Symbol("UNSET");

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const styles = StyleSheet.create({
  blanket: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: invariantColors.black,
    cursor: "default",
  },

  card: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,

    backgroundColor: invariantColors.white,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    flexGrow: 0,
    flexShrink: 1,
    marginBottom: -BOUNCE_MARGIN,
    maxHeight: "60%",

    shadowColor: invariantColors.black,
    shadowOffset: { height: 0, width: 0 },
    shadowRadius: 24,
    shadowOpacity: 0.05,
  },
  desktopCard: {
    marginHorizontal: "auto",
  },
  header: {
    paddingLeft: insets.addToLeft(16),
    paddingRight: insets.addToRight(16),
    paddingTop: 24,
    paddingBottom: 16,
  },
  desktopHeader: {
    paddingLeft: 40,
    paddingRight: 40,
    paddingTop: 40,
    paddingBottom: 24,
  },
  content: {
    flex: 1,
    paddingBottom: BOUNCE_MARGIN,
  },

  pill: {
    alignSelf: "center",
    backgroundColor: colors.gray[400],
    borderRadius: 2,
    height: 4,
    opacity: 0.2,
    position: "absolute",
    top: 12,
    width: 40,
  },
  closeButton: {
    position: "absolute",
    top: 8,
    right: 8,
    padding: 4,
  },
  hidden: {
    ...commonStyles.hidden,
  },
});

type Props = {
  HeaderComponent: ReactNode;
  children: ReactNode;
  onClose: () => void;
  style?: StyleProp<ViewStyle>;
};

export const BottomCard = ({ children, HeaderComponent, onClose, style }: Props) => {
  const [height, setHeight] = useState<number | typeof UNSET>(UNSET);
  const anim = useAnimatedValue(0);
  const { desktop } = useResponsive();

  const handleOnLayout = useCallback(({ nativeEvent: { layout } }: LayoutChangeEvent) => {
    setHeight(layout.height);
  }, []);

  const open = useCallback(() => {
    Animated.spring(anim, {
      bounciness: 4,
      toValue: 1,
      useNativeDriver: false,
    }).start();
  }, [anim]);

  useEffect(() => {
    if (height !== UNSET) {
      open();
    }
  }, [height, open]);

  const close = useCallback(() => {
    Animated.spring(anim, {
      overshootClamping: true,
      toValue: 0,
      useNativeDriver: false,
    }).start(onClose);
  }, [anim, onClose]);

  const { panHandlers } = useMemo(() => {
    const onPanResponderMove = (_: GestureResponderEvent, { dy }: PanResponderGestureState) => {
      if (dy >= 0 && height !== UNSET) {
        anim.setValue(1 - dy / height);
      }
    };

    const onPanResponderEnd = (_: GestureResponderEvent, { dy, vy }: PanResponderGestureState) => {
      if (height === UNSET || dy <= 0) {
        return;
      }

      if (dy >= height / 4 || vy >= 1) {
        close();
      } else {
        open();
      }
    };

    return PanResponder.create({
      onStartShouldSetPanResponder: stubTrue,
      onMoveShouldSetPanResponder: stubTrue,
      onPanResponderMove,
      onPanResponderRelease: onPanResponderEnd,
      onPanResponderTerminate: onPanResponderEnd,
    });
  }, [height, anim, open, close]);

  return (
    <Portal container={CARD_ROOT}>
      <AnimatedPressable
        accessibilityRole="none"
        focusable={false}
        onPress={close}
        style={[
          styles.blanket,
          {
            opacity: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.2],
              extrapolate: "clamp",
            }),
          },
        ]}
      />

      <Animated.View
        onLayout={handleOnLayout}
        style={[
          styles.card,
          desktop && styles.desktopCard,
          style,
          height === UNSET && styles.hidden,
          height !== UNSET && {
            transform: [
              {
                translateY: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [height, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View {...panHandlers} style={[styles.header, desktop && styles.desktopHeader]}>
          {!desktop && <View style={styles.pill} />}
          {HeaderComponent}

          {desktop && (
            <Touchable
              style={styles.closeButton}
              onPress={close}
              accessibilityLabel={t("transaction.close")}
              accessibilityRole="button"
            >
              <Icon name="dismiss-filled" size={18} color={colors.gray[200]} />
            </Touchable>
          )}
        </View>

        <FocusTrap
          autoFocus={true}
          focusLock={true}
          returnFocus={true}
          onEscapeKey={close}
          style={styles.content}
        >
          {children}
        </FocusTrap>
      </Animated.View>
    </Portal>
  );
};
