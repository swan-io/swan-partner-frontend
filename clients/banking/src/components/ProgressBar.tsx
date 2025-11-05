import { colors, ColorVariants } from "@swan-io/lake/src/constants/design";
import { StyleSheet, View } from "react-native";

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
  },
  space: {
    width: 2,
  },
  bar: {
    height: 6,
    borderRadius: 3,
  },
});

type Props = {
  min: number;
  max: number;
  value: number;
  color: ColorVariants;
};

export const ProgressBar = ({ min, max, value, color }: Props) => {
  const percentage = (value - min) / (max - min);

  return (
    <View style={styles.container}>
      <View style={[styles.bar, { flex: percentage, backgroundColor: colors[color][500] }]} />
      <View style={styles.space} />
      <View style={[styles.bar, { flex: 1 - percentage, backgroundColor: colors.gray[100] }]} />
    </View>
  );
};
