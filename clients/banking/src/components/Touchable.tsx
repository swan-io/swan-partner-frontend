import { forwardRef, ReactNode } from "react";
import { StyleSheet, TouchableOpacity, TouchableOpacityProps } from "react-native";

const styles = StyleSheet.create({
  base: {
    transform: [{ translateZ: 0 }],
  },
});

type TouchableProps = TouchableOpacityProps & {
  children?: ReactNode;
};

export const Touchable = forwardRef<TouchableOpacity, TouchableProps>(
  ({ accessibilityRole, style, ...props }, ref) => (
    <TouchableOpacity
      ref={ref}
      accessibilityRole={accessibilityRole}
      activeOpacity={0.7}
      style={[styles.base, style]}
      {...props}
    />
  ),
);
