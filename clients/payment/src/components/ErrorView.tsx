import { Array, Option } from "@swan-io/boxed";
import { ClientError } from "@swan-io/graphql-client";
import { BorderedIcon } from "@swan-io/lake/src/components/BorderedIcon";
import { Box } from "@swan-io/lake/src/components/Box";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { Space } from "@swan-io/lake/src/components/Space";
import { translateError } from "@swan-io/shared-business/src/utils/i18n";
import { useState } from "react";
import { StyleProp, StyleSheet, ViewStyle } from "react-native";
import { errorToRequestId } from "../utils/gql";

const styles = StyleSheet.create({
  base: {
    flexGrow: 1,
    flexShrink: 1,
  },
});

type Props = {
  error?: ClientError;
  style?: StyleProp<ViewStyle>;
};

export const ErrorView = ({ error, style }: Props) => {
  const [requestId] = useState<Option<string>>(() => {
    if (error == undefined) {
      return Option.None();
    }
    return Array.findMap(ClientError.toArray(error), error =>
      Option.fromNullable(errorToRequestId.get(error)),
    );
  });

  return (
    <Box alignItems="center" justifyContent="center" style={[styles.base, style]}>
      <BorderedIcon color="negative" name="lake-error" size={100} padding={24} />
      <Space height={24} />

      <LakeHeading level={1} variant="h3" align="center">
        {translateError(error)}
      </LakeHeading>

      {requestId.isSome() ? (
        <>
          <Space height={4} />
          <LakeText variant="smallRegular">ID: {requestId.get()}</LakeText>
        </>
      ) : null}
    </Box>
  );
};
