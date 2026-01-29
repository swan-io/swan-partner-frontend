import { BorderedIcon } from "@swan-io/lake/src/components/BorderedIcon";
import { Box } from "@swan-io/lake/src/components/Box";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { Space } from "@swan-io/lake/src/components/Space";
import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  base: {
    flexGrow: 1,
    flexShrink: 1,
  },
});

type Props = {
  title: string;
  subtitle?: string;
};

export const ForbiddenView = ({ title, subtitle }: Props) => {
  return (
    <Box alignItems="center" justifyContent="center" style={styles.base}>
      <BorderedIcon color="negative" name="dismiss-circle-regular" size={100} padding={24} />
      <Space height={24} />

      <LakeHeading level={1} variant="h3" align="center">
        {title}
      </LakeHeading>

      <>
        <Space height={8} />
        {subtitle && (
          <LakeText variant="smallRegular" align="center">
            {subtitle}
          </LakeText>
        )}
      </>
    </Box>
  );
};
