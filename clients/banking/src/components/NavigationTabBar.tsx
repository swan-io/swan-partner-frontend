import { Option } from "@swan-io/boxed";
import { ClientContext } from "@swan-io/graphql-client";
import { Avatar } from "@swan-io/lake/src/components/Avatar";
import { BottomPanel } from "@swan-io/lake/src/components/BottomPanel";
import { Box } from "@swan-io/lake/src/components/Box";
import { Fill } from "@swan-io/lake/src/components/Fill";
import { Icon } from "@swan-io/lake/src/components/Icon";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { Link } from "@swan-io/lake/src/components/Link";
import { Pressable } from "@swan-io/lake/src/components/Pressable";
import { Separator } from "@swan-io/lake/src/components/Separator";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tag } from "@swan-io/lake/src/components/Tag";
import { TransitionView } from "@swan-io/lake/src/components/TransitionView";
import {
  animations,
  backgroundColor,
  colors,
  negativeSpacings,
  radii,
  shadows,
  spacings,
} from "@swan-io/lake/src/constants/design";
import { insets } from "@swan-io/lake/src/constants/insets";
import { isNotNullish } from "@swan-io/lake/src/utils/nullish";
import { Request, badStatusToError } from "@swan-io/request";
import { showToast } from "@swan-io/shared-business/src/state/toasts";
import { translateError } from "@swan-io/shared-business/src/utils/i18n";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { P, match } from "ts-pattern";
import { AccountAreaQuery, IdentificationLevelFragment } from "../graphql/partner";
import { env } from "../utils/env";
import { partnerAdminClient } from "../utils/gql";
import { t } from "../utils/i18n";
import { Router, accountRoutes } from "../utils/routes";
import { AccountNavigation, Menu } from "./AccountNavigation";
import { AccountActivationTag, AccountPicker, AccountPickerButton } from "./AccountPicker";
import { SandboxUserPickerContents, SandboxUserTag } from "./SandboxUserPicker";

const HEIGHT = 40;
const PADDING_TOP = 12;
const PADDING_BOTTOM = 24;
const PADDING_HORIZONTAL = 24;
export const navigationTabBarHeight = HEIGHT + PADDING_TOP + PADDING_BOTTOM;

const styles = StyleSheet.create({
  tabBarContainer: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: PADDING_TOP,
    paddingBottom: PADDING_BOTTOM,
    paddingHorizontal: PADDING_HORIZONTAL,
    backgroundColor: backgroundColor.default75Transparency,
    backdropFilter: "blur(4px)",
  },
  tabBar: {
    height: 40,
    borderRadius: radii[8],
    backgroundColor: backgroundColor.accented,
    boxShadow: shadows.tile,
    flexDirection: "row",
    justifyContent: "center",
    overflow: "hidden",
  },
  scrollTopButtonContainer: {
    zIndex: 1,
    position: "absolute",
    left: 0,
    height: 40,
    width: 40,
    borderRightWidth: 1,
    borderColor: colors.gray[100],
  },
  scrollTopButton: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  tabBarItem: {
    paddingHorizontal: spacings[16],
    paddingVertical: spacings[8],
    flexDirection: "row",
    justifyContent: "center",
    flexGrow: 1,
    flexShrink: 1,
  },
  menuIcon: {
    position: "absolute",
    right: spacings[16],
    top: "50%",
    transform: "translateY(-50%)",
  },
  additionalLink: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacings[8],
  },
  profile: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacings[8],
    marginHorizontal: negativeSpacings[24],
    paddingHorizontal: spacings[24],
  },
  modalContents: {
    paddingHorizontal: spacings[24],
    paddingVertical: spacings[24],
    paddingBottom: insets.addToBottom(spacings[32]),
  },
  notificationBadge: {
    backgroundColor: colors.negative[500],
    width: 8,
    height: 8,
    borderRadius: 4,
    position: "absolute",
    top: 8,
    right: 8,
  },
  active: {
    color: colors.current[500],
    backgroundColor: colors.gray[50],
  },
  accountPicker: {
    marginHorizontal: negativeSpacings[24],
    height: 220,
  },
});

type Props = {
  accountMembership: NonNullable<AccountAreaQuery["accountMembership"]>;
  hasMultipleMemberships: boolean;
  activationTag: AccountActivationTag;
  entries: Menu;
  user: NonNullable<AccountAreaQuery["user"]>;
  accountMembershipId: string;
  identificationStatusInfo: Option<IdentificationLevelFragment>;
  refetchAccountAreaQuery: () => void;
  shouldDisplayIdVerification: boolean;
  isScrolled: boolean;
  onScrollToTop: () => void;
  hasRequiredIdentificationLevel: boolean | undefined;
};

export const NavigationTabBar = ({
  accountMembership,
  hasMultipleMemberships,
  activationTag,
  entries,
  accountMembershipId,
  user,
  identificationStatusInfo,
  shouldDisplayIdVerification,
  isScrolled,
  hasRequiredIdentificationLevel,
  onScrollToTop,
}: Props) => {
  const fullName = user.fullName;

  const [screen, setScreen] = useState<null | "menu" | "memberships" | "sandboxUsers">(null);
  const route = Router.useRoute(accountRoutes);

  const activeMenuItem =
    entries.find(item => item.matchRoutes.some(name => name === route?.name)) ?? entries[0];

  const signout = () => {
    Request.make({ url: "/auth/logout", method: "POST", withCredentials: true })
      .mapOkToResult(badStatusToError)
      .tapOk(() => window.location.replace(Router.ProjectLogin()))
      .tapError(error => {
        showToast({ variant: "error", error, title: translateError(error) });
      });
  };

  if (!activeMenuItem) {
    return null;
  }

  return (
    <View style={styles.tabBarContainer}>
      <View style={styles.tabBar}>
        <TransitionView
          style={styles.scrollTopButtonContainer}
          {...animations.fadeAndSlideInFromBottom}
        >
          {isScrolled ? (
            <Pressable onPress={onScrollToTop} style={styles.scrollTopButton}>
              <Icon name="arrow-up-filled" color={colors.gray[600]} size={20} />
            </Pressable>
          ) : null}
        </TransitionView>

        <Pressable style={styles.tabBarItem} onPress={() => setScreen("menu")}>
          {match(route)
            .with({ name: "AccountActivation" }, () => (
              <>
                <Icon name="person-lock-regular" size={22} color={colors.current[500]} />
                <Space width={12} />

                <LakeText numberOfLines={1} variant="regular" color={colors.gray[700]}>
                  {t("accountActivation.title")}
                </LakeText>
              </>
            ))
            .with({ name: "AccountProfile" }, () => (
              <>
                <Avatar size={22} user={user} />
                <Space width={12} />

                <LakeText numberOfLines={1} variant="regular" color={colors.gray[700]}>
                  {fullName}
                </LakeText>
              </>
            ))
            .otherwise(() => (
              <>
                <Icon name={activeMenuItem.icon} size={22} color={colors.current[500]} />
                <Space width={12} />

                <LakeText numberOfLines={1} variant="regular" color={colors.gray[700]}>
                  {activeMenuItem.name}
                </LakeText>
              </>
            ))}

          <Icon name="lake-menu" size={22} style={styles.menuIcon} />

          {shouldDisplayIdVerification && hasRequiredIdentificationLevel === false
            ? match({
                identificationStatusInfo,
                hasNotifications: entries.some(item => item.hasNotifications),
                hasActivationTag: activationTag !== "none",
              })
                .with(
                  {
                    identificationStatusInfo: P.union("Started", "Invalid", "Canceled", "Expired"),
                  },
                  { hasNotifications: true },
                  { hasActivationTag: true },
                  () => <View style={styles.notificationBadge} />,
                )
                .otherwise(() => null)
            : null}
        </Pressable>

        <BottomPanel visible={screen != null} onPressClose={() => setScreen(null)}>
          <View style={styles.modalContents}>
            {match(screen)
              .with("menu", () => (
                <>
                  {env.APP_TYPE === "SANDBOX" ? (
                    <>
                      <Box direction="row" justifyContent="start">
                        <ClientContext.Provider value={partnerAdminClient}>
                          <SandboxUserTag onPress={() => setScreen("sandboxUsers")} />
                        </ClientContext.Provider>
                      </Box>

                      <Space height={16} />
                    </>
                  ) : null}

                  <AccountPickerButton
                    selectedAccountMembership={accountMembership}
                    desktop={false}
                    hasMultipleMemberships={hasMultipleMemberships}
                    activationTag={activationTag}
                    activationLinkActive={false}
                    onPress={() => setScreen("memberships")}
                    accountMembershipId={accountMembershipId}
                    onPressActivationLink={() => setScreen(null)}
                  />

                  <Space height={24} />

                  <LakeHeading level={2} variant="h3">
                    {t("navigation.menu")}
                  </LakeHeading>

                  <Space height={16} />

                  <AccountNavigation
                    menu={entries}
                    desktop={false}
                    onPressLink={() => setScreen(null)}
                  />

                  <Separator space={16} />

                  <Link
                    to={Router.AccountProfile({ accountMembershipId })}
                    onPress={() => setScreen(null)}
                    style={({ active }) => [styles.profile, active && styles.active]}
                  >
                    {({ active }) => (
                      <>
                        <Avatar size={22} user={user} />

                        {isNotNullish(fullName) && (
                          <>
                            <Space width={12} />

                            <LakeText
                              numberOfLines={1}
                              userSelect="none"
                              variant="medium"
                              color={active ? colors.current[500] : colors.gray[500]}
                            >
                              {fullName}
                            </LakeText>

                            {shouldDisplayIdVerification && hasRequiredIdentificationLevel === false
                              ? match(identificationStatusInfo)
                                  .with(
                                    Option.P.None,
                                    Option.P.Some({
                                      status: P.union("Started", "Invalid", "Canceled", "Expired"),
                                    }),
                                    () => (
                                      <>
                                        <Fill minWidth={24} />
                                        <Tag color="warning">{t("profile.actionRequired")}</Tag>
                                      </>
                                    ),
                                  )
                                  .otherwise(() => null)
                              : null}
                          </>
                        )}
                      </>
                    )}
                  </Link>

                  <Pressable style={styles.additionalLink} onPress={signout}>
                    <Icon name="sign-out-regular" size={22} color={colors.negative[500]} />
                    <Space width={12} />
                    <LakeText variant="medium">{t("login.signout")}</LakeText>
                  </Pressable>
                </>
              ))
              .with("memberships", () => (
                <TransitionView {...animations.fadeAndSlideInFromRight}>
                  <>
                    <LakeHeading level={2} variant="h3">
                      {t("navigation.accounts")}
                    </LakeHeading>

                    <Space height={16} />

                    <View style={styles.accountPicker}>
                      <AccountPicker
                        accountMembershipId={accountMembershipId}
                        onPressItem={accountMembershipId => {
                          Router.push("AccountRoot", { accountMembershipId });
                          setScreen(null);
                        }}
                      />
                    </View>

                    <Fill minHeight={24} />

                    <LakeButton
                      mode="secondary"
                      icon="arrow-left-filled"
                      onPress={() => setScreen("menu")}
                    >
                      {t("common.back")}
                    </LakeButton>
                  </>
                </TransitionView>
              ))
              .with("sandboxUsers", () => (
                <TransitionView {...animations.fadeAndSlideInFromRight}>
                  <>
                    <LakeHeading level={2} variant="h3">
                      {t("sandboxUser.impersonatedAs")}
                    </LakeHeading>

                    <Space height={16} />

                    <View style={styles.accountPicker}>
                      <ClientContext.Provider value={partnerAdminClient}>
                        <SandboxUserPickerContents
                          onEndorse={() => {
                            window.location.replace(Router.ProjectRootRedirect());
                          }}
                        />
                      </ClientContext.Provider>
                    </View>

                    <Fill minHeight={24} />

                    <LakeButton
                      mode="secondary"
                      icon="arrow-left-filled"
                      onPress={() => setScreen("menu")}
                    >
                      {t("common.back")}
                    </LakeButton>
                  </>
                </TransitionView>
              ))
              .otherwise(() => null)}
          </View>
        </BottomPanel>
      </View>
    </View>
  );
};
