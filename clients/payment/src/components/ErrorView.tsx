import { BorderedIcon } from "@swan-io/lake/src/components/BorderedIcon";
import { Box } from "@swan-io/lake/src/components/Box";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { Space } from "@swan-io/lake/src/components/Space";
import { isNotNullish } from "@swan-io/lake/src/utils/nullish";
import { translateError } from "@swan-io/shared-business/src/utils/i18n";
import { StyleProp, StyleSheet, ViewStyle } from "react-native";
import { isCombinedError } from "../utils/urql";

const styles = StyleSheet.create({
  base: {
    flexGrow: 1,
    flexShrink: 1,
  },
});

type Props = {
  error?: Error;
  style?: StyleProp<ViewStyle>;
};

export const ErrorView = ({ error, style }: Props) => (
  <Box alignItems="center" justifyContent="center" style={[styles.base, style]}>
    <BorderedIcon color="negative" name="lake-error" size={100} padding={24} />
    <Space height={24} />

    <LakeHeading level={1} variant="h3" align="center">
      {translateError(error)}
    </LakeHeading>

    {isCombinedError(error) && isNotNullish(error.requestId) ? (
      <>
        <Space height={4} />
        <LakeText variant="smallRegular">ID: {error.requestId}</LakeText>
      </>
    ) : null}
  </Box>
);
