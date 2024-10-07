import { BorderedIcon } from "@swan-io/lake/src/components/BorderedIcon";
import { Box } from "@swan-io/lake/src/components/Box";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { backgroundColor, colors, spacings } from "@swan-io/lake/src/constants/design";
import { ReactNode } from "react";
import { StyleProp, StyleSheet, ViewStyle } from "react-native";
import { t } from "../utils/i18n";
import { signout } from "../utils/signout";

const styles = StyleSheet.create({
  base: {
    flexGrow: 1,
    flexShrink: 1,
  },
  noAccountPage: {
    flex: 1,
    backgroundColor: backgroundColor.default,
  },
  tile: {
    padding: 0,
    maxWidth: 800,
  },
  noAccountContainer: {
    padding: spacings[24],
  },
  noAccountContainerDesktop: {
    padding: spacings[72],
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

export const AccountNotFoundPage = ({
  projectName,
  children,
  large,
}: {
  projectName: string;
  children?: ReactNode;
  large: boolean;
}) => {
  const content = (
    <Box
      alignItems="center"
      style={[styles.noAccountContainer, large && styles.noAccountContainerDesktop]}
    >
      {children}

      <BorderedIcon name="lake-building-bank" size={100} padding={8} />
      <Space height={24} />

      <LakeText variant="medium" color={colors.gray[900]} align="center">
        {t("error.noAccount")}
      </LakeText>

      <Space height={4} />
      <LakeText align="center">{t("error.checkWithProvider", { projectName })}</LakeText>
      <Space height={32} />

      <LakeButton mode="secondary" icon="sign-out-regular" onPress={signout}>
        {t("login.signout")}
      </LakeButton>
    </Box>
  );

  return (
    <Box alignItems="center" justifyContent="center" style={styles.noAccountPage}>
      {large ? <Tile style={styles.tile}>{content}</Tile> : content}
    </Box>
  );
};
