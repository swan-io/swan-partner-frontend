import { Box } from "@swan-io/lake/src/components/Box";
import { Breadcrumbs, useCrumb } from "@swan-io/lake/src/components/Breadcrumbs";
import { Fill } from "@swan-io/lake/src/components/Fill";
import { Icon } from "@swan-io/lake/src/components/Icon";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { Pressable } from "@swan-io/lake/src/components/Pressable";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { breakpoints, colors } from "@swan-io/lake/src/constants/design";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { t } from "../utils/i18n";
import { Router } from "../utils/routes";

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: "stretch",
    justifyContent: "center",
    margin: "auto",
  },
  link: {},
  header: {
    paddingTop: 24,
    paddingHorizontal: 24,
  },
  headerDesktop: {
    paddingTop: 40,
    paddingHorizontal: 40,
  },
});

type Props = {
  accountMembershipId: string;
};

export const TransferTypePicker = ({ accountMembershipId }: Props) => {
  useCrumb(
    useMemo(() => {
      return {
        label: t("transfer.newTransfer"),
        link: Router.AccountPaymentsNew({ accountMembershipId }),
      };
    }, [accountMembershipId]),
  );

  return (
    <>
      <ResponsiveContainer breakpoint={breakpoints.large}>
        {({ small }) => (
          <Box direction="row" style={small ? styles.header : styles.headerDesktop}>
            <Breadcrumbs />
          </Box>
        )}
      </ResponsiveContainer>

      <Box direction={"column"} style={styles.container}>
        <Pressable
          onPress={() =>
            Router.push("AccountPaymentsNew", { accountMembershipId, type: "transfer" })
          }
          style={styles.link}
        >
          {({ hovered }) => (
            <Tile flexGrow={1} flexShrink={1} hovered={hovered}>
              <Box direction="row" alignItems="center">
                <Icon name="arrow-swap-regular" size={42} color={colors.current[500]} />
                <Space width={24} />

                <View>
                  <LakeHeading level={2} variant="h5" color={colors.gray[900]}>
                    {t("transfer.tile.transfer.title")}
                  </LakeHeading>

                  <LakeText variant="smallRegular">{t("transfer.tile.transfer.subtitle")}</LakeText>
                </View>

                <Fill minWidth={24} />
                <Icon name="chevron-right-filled" size={24} color={colors.gray[500]} />
              </Box>
            </Tile>
          )}
        </Pressable>

        <Space width={24} height={12} />

        <Pressable
          onPress={() =>
            Router.push("AccountPaymentsNew", { accountMembershipId, type: "recurring" })
          }
          style={styles.link}
        >
          {({ hovered }) => (
            <Tile flexGrow={1} flexShrink={1} hovered={hovered}>
              <Box direction="row" alignItems="center">
                <Icon name="lake-clock-arrow-swap" size={42} color={colors.current[500]} />
                <Space width={24} />

                <View>
                  <LakeHeading level={2} variant="h5" color={colors.gray[900]}>
                    {t("transfer.tile.recurringTransfer.title")}
                  </LakeHeading>

                  <LakeText variant="smallRegular">
                    {t("transfer.tile.recurringTransfer.subtitle")}
                  </LakeText>
                </View>

                <Fill minWidth={24} />
                <Icon name="chevron-right-filled" size={24} color={colors.gray[500]} />
              </Box>
            </Tile>
          )}
        </Pressable>
      </Box>
    </>
  );
};
