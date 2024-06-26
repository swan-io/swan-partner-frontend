import { pushUnsafe } from "@swan-io/chicane";
import { Fill } from "@swan-io/lake/src/components/Fill";
import { Icon, IconName } from "@swan-io/lake/src/components/Icon";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { Pressable } from "@swan-io/lake/src/components/Pressable";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { animations, colors } from "@swan-io/lake/src/constants/design";
import { useCallback } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

const styles = StyleSheet.create({
  base: {
    ...animations.fadeAndSlideInFromTop.enter,
    animationFillMode: "backwards",
  },
  tile: {
    flexDirection: "row",
    alignItems: "center",
  },
  fill: {
    ...commonStyles.fill,
  },
});

type Props = {
  icon: IconName;
  style?: StyleProp<ViewStyle>;
  title: string;
  subtitle: string;
  url: string;
};

export const TypePickerLink = ({ icon, style, title, subtitle, url }: Props) => (
  <Pressable
    role="link"
    onPress={useCallback(() => pushUnsafe(url), [url])}
    style={[styles.base, style]}
  >
    {({ hovered }) => (
      <Tile hovered={hovered} style={styles.tile}>
        <Icon name={icon} size={32} color={colors.current[500]} />
        <Space width={24} />

        <View style={styles.fill}>
          <LakeHeading level={2} variant="h5" color={colors.gray[900]}>
            {title}
          </LakeHeading>

          <Space height={4} />
          <LakeText variant="smallRegular">{subtitle}</LakeText>
        </View>

        <Fill minWidth={24} />
        <Icon name="chevron-right-filled" size={24} color={colors.gray[500]} />
      </Tile>
    )}
  </Pressable>
);
