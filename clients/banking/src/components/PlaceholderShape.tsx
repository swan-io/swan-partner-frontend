import { colors } from "@swan-io/lake/src/constants/design";
import { StyleSheet, View } from "react-native";

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.gray[50],
    borderRadius: 2,
  },
});

type Props = {
  height: number;
  width: number;
};

export const PlaceholderShape = ({ height, width }: Props) => (
  <View style={[styles.base, { height, width }]} />
);
