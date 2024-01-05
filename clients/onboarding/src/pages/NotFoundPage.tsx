import { BorderedIcon } from "@swan-io/lake/src/components/BorderedIcon";
import { Box } from "@swan-io/lake/src/components/Box";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
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
  title?: string;
  text?: string;
  style?: StyleProp<ViewStyle>;
};

export const NotFoundPage = ({ title = t("error.pageNotFound"), text = "", style }: Props) => (
  <Box alignItems="center" justifyContent="center" style={[styles.base, style]}>
    <BorderedIcon color="swan" name="lake-compass" padding={24} size={100} />
    <Space height={24} />

    <LakeHeading level={1} variant="h3" align="center">
      {title}
    </LakeHeading>

    {text !== "" && (
      <>
        <Space height={4} />
        <LakeText variant="smallRegular">{text}</LakeText>
      </>
    )}
  </Box>
);
