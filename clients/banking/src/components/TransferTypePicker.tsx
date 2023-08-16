import { pushUnsafe } from "@swan-io/chicane";
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
import { animations, breakpoints, colors } from "@swan-io/lake/src/constants/design";
import { Fragment, useMemo } from "react";
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
  link: {
    ...animations.fadeAndSlideInFromTop.enter,
    animationFillMode: "backwards",
  },
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

  const links = useMemo(() => {
    return [
      {
        url: Router.AccountPaymentsNew({ accountMembershipId, type: "transfer" }),
        icon: "arrow-swap-regular" as const,
        title: t("transfer.tile.transfer.title"),
        subtitle: t("transfer.tile.transfer.subtitle"),
      },
      {
        url: Router.AccountPaymentsNew({ accountMembershipId, type: "recurring" }),
        icon: "lake-clock-arrow-swap" as const,
        title: t("transfer.tile.recurringTransfer.title"),
        subtitle: t("transfer.tile.recurringTransfer.subtitle"),
      },
    ];
  }, [accountMembershipId]);

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
        {links.map(({ url, icon, title, subtitle }, index) => {
          return (
            <Fragment key={index}>
              {index > 0 ? <Space width={24} height={12} /> : null}

              <Pressable
                role="button"
                onPress={() => pushUnsafe(url)}
                style={[styles.link, { animationDelay: `${index * 150}ms` }]}
              >
                {({ hovered }) => (
                  <Tile flexGrow={1} flexShrink={1} hovered={hovered}>
                    <Box direction="row" alignItems="center">
                      <Icon name={icon} size={42} color={colors.current[500]} />
                      <Space width={24} />

                      <View>
                        <LakeHeading level={2} variant="h5" color={colors.gray[900]}>
                          {title}
                        </LakeHeading>

                        <LakeText variant="smallRegular">{subtitle}</LakeText>
                      </View>

                      <Fill minWidth={24} />
                      <Icon name="chevron-right-filled" size={24} color={colors.gray[500]} />
                    </Box>
                  </Tile>
                )}
              </Pressable>
            </Fragment>
          );
        })}
      </Box>
    </>
  );
};
