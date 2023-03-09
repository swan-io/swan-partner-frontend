import { AutoWidthImage } from "@swan-io/lake/src/components/AutoWidthImage";
import { Box } from "@swan-io/lake/src/components/Box";
import { Fill } from "@swan-io/lake/src/components/Fill";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { Separator } from "@swan-io/lake/src/components/Separator";
import { Space } from "@swan-io/lake/src/components/Space";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { colors, invariantColors } from "@swan-io/lake/src/constants/design";
import { useComputedColors } from "@swan-io/lake/src/hooks/useComputedColors";
import { useResponsive } from "@swan-io/lake/src/hooks/useResponsive";
import { memo, ReactNode, useMemo } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import logoSwan from "../assets/imgs/logo-swan.svg";
import { t } from "../utils/i18n";
import { NeedHelpButton } from "./NeedHelpButton";
import { PartnershipMention } from "./PartnershipMention";
import { ProgressBar } from "./ProgressBar";
import { VerticalProgressBar } from "./VerticalProgressBar";

const styles = StyleSheet.create({
  background: {
    flexShrink: 1,
    flexGrow: 1,
    backgroundImage: `linear-gradient(to right, ${colors.gray[50]} 50%, ${invariantColors.white} 50%)`,
  },
  container: {
    flexShrink: 1,
    flexGrow: 1,
    backgroundColor: invariantColors.white,
  },
  desktopContainer: {
    flexDirection: "row",
    width: "100%",
    maxWidth: 1520,
    marginHorizontal: "auto",
  },
  sidebar: {
    width: 256,
    backgroundColor: colors.gray[50],
    flexGrow: 0,
    minHeight: "100%",
  },
  sidebarContent: {
    flexGrow: 1,
    paddingHorizontal: 32,
    paddingTop: 56,
    paddingBottom: 24,
  },
  header: {
    alignItems: "center",
    backgroundColor: colors.gray[50],
    zIndex: 1,
    minHeight: 88,
  },
  headerContent: {
    flexWrap: "wrap",
    flexGrow: 1,
    flexShrink: 1,
    maxWidth: 688,
    padding: 16,
    width: "100%",
  },
  headerRight: {
    flexGrow: 1,
    flexShrink: 1,
    alignItems: "flex-end",
  },
  logo: {
    maxWidth: "100%",
  },
  wrapper: {
    flexGrow: 1,
    marginHorizontal: "auto",
    maxWidth: 688,
    paddingHorizontal: 16,
    paddingTop: 32,
    paddingBottom: 32,
    transform: [{ translate3d: "0,0,0" }],
    width: "100%",
  },
  wrapperDesktop: {
    paddingTop: 56,
  },
  wrapperFullWidth: {
    paddingHorizontal: 0,
    maxWidth: "100%",
  },
  navBar: {
    alignItems: "center",
    backgroundColor: invariantColors.white,
    height: 88,
    zIndex: 1,
  },
  desktopNavBar: {
    shadowColor: invariantColors.black,
    shadowRadius: 1,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: -1 },
  },
  fakeNavBar: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: "50%",
    backgroundColor: invariantColors.white,
    height: 88,

    shadowColor: invariantColors.black,
    shadowRadius: 1,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: -1 },
  },
  navBarContent: {
    flexShrink: 1,
    flexGrow: 1,
    justifyContent: "space-between",
    maxWidth: 688,
    paddingHorizontal: 16,
    width: "100%",
  },
  navBarButton: {
    flexBasis: "0%",
    flexGrow: 1,
    flexShrink: 1,
    maxWidth: 200,
    transitionProperty: "opacity",
    transitionDuration: "150ms",
  },
  invisibleButton: {
    cursor: "default",
    opacity: 0,
  },

  page: {
    flexGrow: 1,
    flexShrink: 1,
    opacity: 0,
    marginTop: -16,

    animationKeyframes: {
      from: { marginTop: -16, opacity: 0 },
      to: { marginTop: 0, opacity: 1 },
    },
    animationDuration: "250ms",
    animationFillMode: "forwards",
    animationTimingFunction: "ease-in-out",
  },
});

export const pageStyle = styles.page;

type Props = {
  children: ReactNode;
  email: string;
  steps: string[];
  currentStepIndex: number;
  projectColor: string;
  projectName: string;
  projectLogo: string;
  fullWidth?: boolean;
  onPressBack?: () => void;
  onPressNext?: () => void;
  nextDisabled?: boolean;
  isNavbarHidden?: boolean;
};

export const Wizard = memo<Props>(
  ({
    children,
    email,
    steps,
    currentStepIndex,
    projectColor,
    projectName,
    projectLogo,
    onPressBack,
    onPressNext,
    fullWidth = false,
    nextDisabled = false,
    isNavbarHidden = false,
  }) => {
    const computedColors = useComputedColors(projectColor);
    const { desktop } = useResponsive();

    const additionalInfo = useMemo(() => ({ email, projectName }), [email, projectName]);

    return (
      <View style={styles.background}>
        {desktop && (
          <View accessibilityRole="none" style={[styles.fakeNavBar, styles.fakeNavBar]} />
        )}

        <View style={[styles.container, desktop && styles.desktopContainer]}>
          {desktop ? (
            <>
              <ScrollView
                accessibilityRole="banner"
                style={styles.sidebar}
                contentContainerStyle={styles.sidebarContent}
              >
                <AutoWidthImage
                  accessibilityLabel={projectName}
                  sourceUri={projectLogo || logoSwan}
                  height={40}
                  resizeMode="contain"
                  style={styles.logo}
                />

                <Space height={48} />

                <VerticalProgressBar
                  color={computedColors.original}
                  textColor={computedColors.text}
                  steps={steps}
                  current={currentStepIndex}
                />

                <Fill minHeight={48} />

                <NeedHelpButton
                  additionalInfo={additionalInfo}
                  color={computedColors.original}
                  style={commonStyles.centerSelf}
                  messengerAlignment="left"
                />

                {projectLogo !== "" && <PartnershipMention style={commonStyles.centerSelf} />}
              </ScrollView>

              <Separator horizontal={true} />
            </>
          ) : (
            <View accessibilityRole="banner" style={styles.header}>
              <Box direction="row" alignItems="center" style={styles.headerContent}>
                <AutoWidthImage
                  height={28}
                  resizeMode="contain"
                  sourceUri={projectLogo || logoSwan}
                />

                <Fill minWidth={8} />

                <View style={styles.headerRight}>
                  <NeedHelpButton
                    additionalInfo={additionalInfo}
                    color={computedColors.original}
                    messengerAlignment="right"
                  />

                  {projectLogo !== "" && <PartnershipMention />}
                </View>
              </Box>
            </View>
          )}

          <View style={commonStyles.fill}>
            <ScrollView
              accessibilityRole="main"
              style={commonStyles.fill}
              contentContainerStyle={[
                styles.wrapper,
                desktop && styles.wrapperDesktop,
                fullWidth && styles.wrapperFullWidth,
              ]}
            >
              {children}
            </ScrollView>

            {!desktop && !isNavbarHidden && (
              <ProgressBar
                color={computedColors.original}
                steps={steps}
                current={currentStepIndex}
              />
            )}

            {!isNavbarHidden && (
              <View
                // TODO add spinner on Next
                accessibilityRole="contentinfo"
                style={[styles.navBar, desktop && styles.desktopNavBar]}
              >
                <Box direction="row" alignItems="center" style={styles.navBarContent}>
                  <LakeButton
                    mode="secondary"
                    onPress={onPressBack}
                    disabled={!onPressBack}
                    style={[styles.navBarButton, !onPressBack && styles.invisibleButton]}
                  >
                    {t("wizard.back")}
                  </LakeButton>

                  <Space width={16} />

                  <LakeButton
                    color="partner"
                    onPress={onPressNext}
                    disabled={nextDisabled}
                    style={styles.navBarButton}
                  >
                    {t("wizard.next")}
                  </LakeButton>
                </Box>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  },
);
