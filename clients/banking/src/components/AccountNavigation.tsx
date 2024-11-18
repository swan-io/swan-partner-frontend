import { Fill } from "@swan-io/lake/src/components/Fill";
import { Icon, IconName } from "@swan-io/lake/src/components/Icon";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { Link } from "@swan-io/lake/src/components/Link";
import { Separator } from "@swan-io/lake/src/components/Separator";
import { SidebarNavigationTrackerActiveMarker } from "@swan-io/lake/src/components/SidebarNavigationTracker";
import { Space } from "@swan-io/lake/src/components/Space";
import { WithCurrentColor } from "@swan-io/lake/src/components/WithCurrentColor";
import { colors, negativeSpacings, radii, spacings } from "@swan-io/lake/src/constants/design";
import { StyleSheet, View } from "react-native";
import { Fragment } from "react/jsx-runtime";
import { t } from "../utils/i18n";
import { RouteName, Router, accountRoutes } from "../utils/routes";

const TRANSPARENT = "transparent";

const styles = StyleSheet.create({
  sidebar: {
    flexGrow: 1,
    flexShrink: 0,
    marginHorizontal: negativeSpacings[32],
  },
  desktopSidebar: {
    paddingBottom: 20,
  },
  linkContainer: {
    flexGrow: 0,
  },
  navItem: {
    paddingVertical: spacings[8],
    paddingHorizontal: spacings[32],
    borderRightWidth: 3,
    borderColor: TRANSPARENT,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    color: colors.gray[500],
    borderTopLeftRadius: radii[4],
    borderBottomLeftRadius: radii[4],
    userSelect: "none",
  },
  active: {
    color: colors.current[500],
    backgroundColor: colors.gray[50],
    borderRightWidth: 3,
    borderColor: colors.gray[900],
  },
  activeWithNotification: {
    backgroundColor: colors.negative[50],
  },
  hovered: {
    color: colors.gray[900],
    borderRightWidth: 3,
    borderColor: colors.gray[900],
  },
  notificationPill: {
    width: 5,
    height: 5,
    backgroundColor: colors.negative[500],
    borderRadius: 5,
  },
  notificationPillAnimation: {
    position: "absolute",
    left: "50%",
    top: "50%",
    borderColor: colors.negative[500],
    borderWidth: 1,
    borderStyle: "solid",
    width: 20,
    height: 20,
    borderRadius: 10,
    transform: "translateX(-50%) translateY(-50%) scale(0.25)",
    animationKeyframes: {
      "100%": {
        transform: "translateX(-50%) translateY(-50%) scale(0.75)",
        opacity: 0,
      },
    },
    animationDuration: "2000ms",
    animationTimingFunction: "ease-in-out",
    animationIterationCount: "infinite",
  },
});

export type Menu = {
  matchRoutes: RouteName[];
  to: string;
  icon: IconName;
  iconActive: IconName;
  name: string;
  visible: boolean;
  hasNotifications?: boolean;
  separator?: boolean;
}[];

type Props = {
  menu: Menu;
  desktop?: boolean;
  onPressLink?: () => void;
};

export const AccountNavigation = ({ menu, desktop = true, onPressLink }: Props) => {
  const route = Router.useRoute(accountRoutes);

  return (
    <View role="navigation" style={[styles.sidebar, desktop && styles.desktopSidebar]}>
      {menu.map(({ visible = false, ...item }) => {
        const isActive = item.matchRoutes.some(name => name === route?.name);

        if (visible === false) {
          return null;
        }

        return (
          <Fragment key={`navigation-${item.to}`}>
            {item.separator === true ? <Separator space={12} /> : null}

            <WithCurrentColor
              style={styles.linkContainer}
              variant={item.hasNotifications === true ? "negative" : "partner"}
            >
              <Link
                to={item.to}
                aria-label={item.name}
                onPress={onPressLink}
                numberOfLines={1}
                style={({ hovered }) => [
                  styles.navItem,
                  isActive ? styles.active : hovered && styles.hovered,
                  isActive && item.hasNotifications === true && styles.activeWithNotification,
                ]}
              >
                {({ hovered }) => {
                  const inactiveColor = hovered ? colors.gray[900] : colors.gray[500];

                  return (
                    <>
                      <Icon
                        name={isActive ? item.iconActive : item.icon}
                        size={22}
                        color={isActive ? "currentColor" : inactiveColor}
                      />

                      <Space width={12} />

                      <LakeText color={isActive ? "currentColor" : inactiveColor} variant="medium">
                        {item.name}
                      </LakeText>

                      {item.hasNotifications === true ? (
                        <>
                          <Fill minWidth={24} />

                          <View
                            role="alert"
                            aria-label={t("common.actionRequired")}
                            style={styles.notificationPill}
                          >
                            {isActive ? null : <View style={styles.notificationPillAnimation} />}
                          </View>
                        </>
                      ) : null}

                      {isActive ? (
                        <SidebarNavigationTrackerActiveMarker
                          color={
                            item.hasNotifications === true
                              ? colors.negative[500]
                              : colors.current[500]
                          }
                        />
                      ) : null}
                    </>
                  );
                }}
              </Link>
            </WithCurrentColor>
          </Fragment>
        );
      })}
    </View>
  );
};
