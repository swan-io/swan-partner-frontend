import { ScrollView } from "@swan-io/lake/src/components/ScrollView";
import { invariantColors, spacings } from "@swan-io/lake/src/constants/design";
import { ReactNode } from "react";
import { StyleSheet } from "react-native";

const fadeOnRightMask = `linear-gradient(to left, ${invariantColors.transparent}, ${invariantColors.black} ${spacings[12]})`;

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacings[12],
    maskImage: fadeOnRightMask,
    WebkitMaskImage: fadeOnRightMask,
  },
});

type Props = {
  children: ReactNode;
};

export const FiltersFadingScrollView = ({ children }: Props) => (
  <ScrollView horizontal={true} style={styles.base}>
    {children}
  </ScrollView>
);
