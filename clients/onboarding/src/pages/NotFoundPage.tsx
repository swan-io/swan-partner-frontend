import { BorderedIcon } from "@swan-io/lake/src/components/BorderedIcon";
import { Box } from "@swan-io/lake/src/components/Box";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { Space } from "@swan-io/lake/src/components/Space";
import { StyleProp, StyleSheet, ViewStyle } from "react-native";
import { t } from "../utils/i18n";

const styles = StyleSheet.create({
  base: {
    flexGrow: 1,
    flexShrink: 1,
  },
});

type Props = {
  style?: StyleProp<ViewStyle>;
};

export const NotFoundPage = ({ style }: Props) => (
  <Box alignItems="center" justifyContent="center" style={[styles.base, style]}>
    <BorderedIcon color="partner" name="lake-compass" padding={24} size={100} />
    <Space height={24} />

    <LakeHeading level={1} variant="h3" align="center">
      {t("error.pageNotFound")}
    </LakeHeading>
  </Box>
);
