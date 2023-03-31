import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { Link } from "@swan-io/lake/src/components/Link";
import { Separator } from "@swan-io/lake/src/components/Separator";
import { Space } from "@swan-io/lake/src/components/Space";
import { Path, Svg } from "@swan-io/lake/src/components/Svg";
import { WithPartnerAccentColor } from "@swan-io/lake/src/components/WithPartnerAccentColor";
import { colors, invariantColors, shadows } from "@swan-io/lake/src/constants/design";
import { typography } from "@swan-io/lake/src/constants/typography";
import { isNotNullish } from "@swan-io/lake/src/utils/nullish";
import { isMobile } from "@swan-io/lake/src/utils/userAgent";
import { lighten } from "polished";
import { useCallback, useLayoutEffect } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { useQuery } from "urql";
import { ErrorView } from "../components/ErrorView";
import { SwanLogo } from "../components/SwanLogo";
import { AuthStatusDocument } from "../graphql/partner";
import { ProjectLoginPageDocument } from "../graphql/unauthenticated";
import { openPopup } from "../states/popup";
import { env } from "../utils/env";
import { getFirstSupportedLanguage, t } from "../utils/i18n";
import { Router } from "../utils/routes";
import { unauthenticatedContext } from "../utils/urql";

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.gray[50],
    flexGrow: 1,
  },
  contentContainer: {
    flexGrow: 1,
    padding: 16,
    justifyContent: "center",
  },
  header: {
    position: "absolute",
    left: 16,
    right: 16,
    top: 40,
    height: 112,
  },
  topFixedSpace: {
    flexShrink: 0,
    height: 112,
  },
  bottomVariableSpace: {
    flexShrink: 1,
    height: "100%",
    maxHeight: 112,
  },
  logo: {
    height: 20,
  },
  parternship: {
    ...typography.bodySmall,
    marginHorizontal: "auto",
    display: "flex",
    flexDirection: "row",
    alignItems: "baseline",
  },
  swanLogo: {
    height: 9,
  },
  card: {
    backgroundColor: invariantColors.white,
    borderRadius: 4,
    margin: "auto",
    maxWidth: 360,
    overflow: "hidden",
    width: "100%",
    boxShadow: shadows.tileHover,
  },
  gradient: {
    height: 208,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    height: 90,
    width: 90,
  },
  content: {
    padding: 32,
    flexGrow: 1,
  },
  helpTitle: {
    ...typography.bodyLarge,
    fontWeight: typography.fontWeights.demi,
  },
  link: {
    ...typography.bodySmall,
    color: colors.gray[400],
    wordBreak: "keep-all",
  },
  underline: {
    textDecorationLine: "underline",
  },
});

const HelpLink = ({ to, emoji, children }: { to: string; emoji: string; children: string }) => (
  <Text style={styles.link}>
    <span role="img" aria-label="emoji">
      {emoji}
    </span>{" "}
    <Link to={to} style={({ hovered }) => hovered && styles.underline} target="blank">
      {children}
    </Link>
  </Text>
);

const SUPPORT_ROOT_URL = `https://support.swan.io/${getFirstSupportedLanguage(["en", "fr"])}`;

export const ProjectLoginPage = ({ projectId }: { projectId: string }) => {
  const [{ data, error }] = useQuery({ query: AuthStatusDocument });
  const errorResponse = error?.response as Partial<Response> | undefined;
  const authenticated = isNotNullish(data) || Boolean(errorResponse?.ok);

  useLayoutEffect(() => {
    authenticated && Router.push("ProjectRootRedirect");
  }, [authenticated]);

  const [projectInfoQuery] = useQuery({
    query: ProjectLoginPageDocument,
    variables: {
      projectId,
      env: env.APP_TYPE === "LIVE" ? "Live" : "Sandbox",
    },
    context: unauthenticatedContext,
  });

  const invalidUUID = isNotNullish(projectInfoQuery.error);

  const handleButtonPress = useCallback(() => {
    const redirectTo = Router.ProjectRootRedirect();
    const params = new URLSearchParams();
    params.set("projectId", projectId);

    if (isMobile) {
      params.set("redirectTo", redirectTo);
      window.location.replace(`/auth/login?${params.toString()}`);
    } else {
      openPopup({
        url: `/auth/login?${params.toString()}`,
        onClose: () => {
          // We use location.replace to be sure that the auth
          // cookie is correctly written before changing page
          // (history pushState does not seem to offer these guarantees)
          window.location.replace(redirectTo);
        },
      });
    }
  }, [projectId]);

  const projectInfo = projectInfoQuery.data?.projectInfoById;
  const projectName = projectInfo?.name;
  const projectLogoUri = projectInfo?.logoUri;
  const accentColor = projectInfo?.accentColor ?? invariantColors.gray;

  if (invalidUUID) {
    return <ErrorView />;
  }

  const backgroundImage = `linear-gradient(to bottom, ${accentColor} 0%, ${lighten(
    0.05,
    accentColor,
  )} 100%)`;

  return (
    <ScrollView style={styles.base} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header} accessibilityRole="banner">
        {isNotNullish(projectLogoUri) ? (
          <>
            <Image
              source={{ uri: projectLogoUri }}
              resizeMode="contain"
              accessibilityLabel={projectName}
              style={styles.logo}
            />

            <Space height={8} />

            <Text style={styles.parternship}>
              {t("login.parternship")} <SwanLogo fill={colors.gray[900]} style={styles.swanLogo} />
            </Text>
          </>
        ) : (
          <SwanLogo fill={colors.gray[900]} style={styles.logo} />
        )}
      </View>

      <View accessibilityRole="none" style={styles.topFixedSpace} />

      <WithPartnerAccentColor color={accentColor}>
        <View accessibilityRole="main" style={styles.card}>
          <View style={[styles.gradient, { backgroundImage }]}>
            <Svg viewBox="0 0 90 90" style={styles.icon}>
              <Path
                d="M45 0a45 45 0 110 90 45 45 0 010-90zm18.44 58.1H26.56c-.56-.02-1.07.26-1.35.71a1.39 1.39 0 000 1.47c.28.45.8.73 1.35.72h36.88c.56 0 1.07-.27 1.35-.72.28-.45.28-1.01 0-1.47-.28-.45-.8-.73-1.35-.72zm-29.2-17.46h-3.07v11.63h-1.54c-.55 0-1.07.27-1.35.72a1.39 1.39 0 000 1.47c.28.45.8.73 1.35.72h30.74c.55 0 1.07-.27 1.35-.72.28-.45.28-1.01 0-1.47-.28-.45-.8-.72-1.35-.72h-1.54V40.64h-3.07v11.63h-3.08V40.64h-3.07v11.63h-3.07V40.64h-3.08v11.63H40.4V40.64h-3.07v11.63h-3.08V40.64zM45 29c-.17 0-.35.03-.51.09h-.04l-.09.04-14.81 4.39a2.2 2.2 0 00-1.45 2.03c0 .57.24 1.13.67 1.54.43.4 1.02.64 1.63.64h29.2c1.27 0 2.3-.98 2.3-2.18 0-.9-.57-1.7-1.45-2.03h-.02l-14.82-4.4-.05-.02h-.02l-.03-.02A1.7 1.7 0 0045 29zm0 2.9c.85 0 1.54.66 1.54 1.46 0 .8-.7 1.46-1.54 1.46a1.5 1.5 0 01-1.54-1.46c0-.8.7-1.45 1.54-1.45z"
                fill={invariantColors.white}
              />
            </Svg>
          </View>

          <View style={styles.content}>
            <LakeButton color="partner" onPress={handleButtonPress}>
              {t("login.buttonText")}
            </LakeButton>

            <Separator space={24} />
            <Text style={styles.helpTitle}>{t("login.needHelp")}</Text>
            <Space height={8} />

            <HelpLink
              emoji="🗝"
              to={`${SUPPORT_ROOT_URL}/articles/4516813-how-can-i-access-my-account-to-check-my-transactions-etc`}
            >
              {t("login.linkHow")}
            </HelpLink>

            <Space height={8} />

            <HelpLink emoji="👮🏻‍♂️" to={`${SUPPORT_ROOT_URL}/articles/4516824-how-do-i-report-fraud`}>
              {t("login.linkFraud")}
            </HelpLink>

            <Space height={8} />

            <HelpLink emoji="👨🏻‍💻" to={SUPPORT_ROOT_URL}>
              {t("login.linkFaq")}
            </HelpLink>
          </View>
        </View>
      </WithPartnerAccentColor>

      <View accessibilityRole="none" style={styles.bottomVariableSpace} />
    </ScrollView>
  );
};
