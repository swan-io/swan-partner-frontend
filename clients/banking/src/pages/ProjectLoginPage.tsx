import { AsyncData, Result } from "@swan-io/boxed";
import { useQuery } from "@swan-io/graphql-client";
import { BorderedIcon } from "@swan-io/lake/src/components/BorderedIcon";
import { Box } from "@swan-io/lake/src/components/Box";
import { Fill } from "@swan-io/lake/src/components/Fill";
import { LakeAlert } from "@swan-io/lake/src/components/LakeAlert";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { Link } from "@swan-io/lake/src/components/Link";
import { LoadingView } from "@swan-io/lake/src/components/LoadingView";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { ScrollView } from "@swan-io/lake/src/components/ScrollView";
import { Separator } from "@swan-io/lake/src/components/Separator";
import { Space } from "@swan-io/lake/src/components/Space";
import { SwanLogo } from "@swan-io/lake/src/components/SwanLogo";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { WithPartnerAccentColor } from "@swan-io/lake/src/components/WithPartnerAccentColor";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import {
  backgroundColor,
  breakpoints,
  colors,
  invariantColors,
  spacings,
} from "@swan-io/lake/src/constants/design";
import { isNotNullish } from "@swan-io/lake/src/utils/nullish";
import { useCallback, useEffect, useRef } from "react";
import { Image, StyleSheet, View } from "react-native";
import { P, match } from "ts-pattern";
import { ErrorView } from "../components/ErrorView";
import { ProjectLoginPageDocument } from "../graphql/unauthenticated";
import { locale, t } from "../utils/i18n";
import { Router } from "../utils/routes";

const styles = StyleSheet.create({
  root: {
    ...commonStyles.fill,
  },
  base: {
    backgroundColor: backgroundColor.default,
    flexGrow: 1,
  },
  content: {
    flexGrow: 1,
    marginHorizontal: "auto",
    padding: spacings[24],
  },
  clientLogo: {
    height: 25,
    width: "100%",
  },
  swanLogo: {
    height: 20,
    paddingVertical: 5,
    width: "100%",
  },
  tile: {
    paddingHorizontal: spacings[72],
    paddingVertical: spacings[72],
  },
  iconContainer: {
    margin: "auto",
  },
  link: {
    wordBreak: "keep-all",
  },
  underline: {
    textDecorationLine: "underline",
  },
  partnership: {
    marginHorizontal: "auto",
    display: "flex",
    flexDirection: "row",
    alignItems: "baseline",
  },
  swanPartnershipLogo: {
    height: 9,
  },
});

const HelpLink = ({ to, children }: { to: string; children: string }) => (
  <LakeText variant="smallRegular" style={styles.link}>
    <Link to={to} style={({ hovered }) => hovered && styles.underline} target="blank">
      {children}
    </Link>
  </LakeText>
);

const SUPPORT_ROOT_URL = `https://support.swan.io/hc/${locale.language}`;

type LoginContentProps = {
  accentColor: string;
  onLogin: () => void;
};

const LoginContent = ({ accentColor, onLogin }: LoginContentProps) => {
  return (
    <WithPartnerAccentColor color={accentColor}>
      <View style={styles.iconContainer}>
        <BorderedIcon name="lake-building-bank" size={100} padding={8} color="partner" />
      </View>

      <Space height={32} />

      <LakeButton color="partner" onPress={onLogin}>
        {t("login.buttonText")}
      </LakeButton>

      <Separator space={32} />

      <LakeText color={colors.gray[900]} variant="semibold">
        {t("login.needHelp")}
      </LakeText>

      <Space height={8} />
      <HelpLink to={`${SUPPORT_ROOT_URL}-150`}>{t("login.linkHow")}</HelpLink>
      <Space height={8} />

      <HelpLink
        to={`${SUPPORT_ROOT_URL}-150/articles/17099978406045-Credit-transfer-and-card-payment-fraud-disputes`}
      >
        {t("login.linkFraud")}
      </HelpLink>
    </WithPartnerAccentColor>
  );
};

export const ProjectLoginPage = ({
  projectId,
  redirectTo: redirectToFromQueryParams,
  sessionExpired = false,
}: {
  projectId: string;
  redirectTo: string | undefined;
  sessionExpired?: boolean;
}) => {
  const [projectInfos] = useQuery(ProjectLoginPageDocument, { projectId });

  // we store initial sessionExpired value, then remove it from the url
  const sessionExpiredWarningVisible = useRef(sessionExpired).current;

  useEffect(() => {
    Router.replace("ProjectLogin", { redirectTo: redirectToFromQueryParams });
  }, [redirectToFromQueryParams]);

  const handleButtonPress = useCallback(() => {
    const redirectTo = redirectToFromQueryParams ?? Router.ProjectRootRedirect();
    const params = new URLSearchParams();

    params.set("projectId", projectId);
    params.set("redirectTo", redirectTo);

    window.location.assign(`/auth/login?${params.toString()}`);
  }, [projectId, redirectToFromQueryParams]);

  return match(
    projectInfos.mapOk(({ projectInfoById }) => ({
      accentColor: projectInfoById.accentColor ?? invariantColors.gray,
      name: projectInfoById.name,
      logoUri: projectInfoById.logoUri ?? undefined,
    })),
  )
    .with(AsyncData.P.Done(Result.P.Ok(P.select())), ({ accentColor, name, logoUri }) => {
      return (
        <ResponsiveContainer breakpoint={breakpoints.medium} style={styles.root}>
          {({ large }) => (
            <ScrollView style={styles.base} contentContainerStyle={styles.content}>
              <Box role="banner" alignItems="center">
                {isNotNullish(logoUri) ? (
                  <Image
                    source={{ uri: logoUri }}
                    resizeMode="contain"
                    aria-label={name}
                    style={styles.clientLogo}
                  />
                ) : (
                  <SwanLogo style={styles.swanLogo} />
                )}
              </Box>

              <Fill minHeight={48} />

              {sessionExpiredWarningVisible && (
                <>
                  <LakeAlert variant="warning" title={t("login.sessionExpired.title")} />
                  <Space height={large ? 24 : 48} />
                </>
              )}

              {large ? (
                <Tile style={styles.tile}>
                  <LoginContent accentColor={accentColor} onLogin={handleButtonPress} />
                </Tile>
              ) : (
                <View>
                  <LoginContent accentColor={accentColor} onLogin={handleButtonPress} />
                </View>
              )}

              <Fill minHeight={48} />

              {isNotNullish(logoUri) && (
                <LakeText variant="smallRegular" style={styles.partnership}>
                  {t("login.partnership")} <SwanLogo style={styles.swanPartnershipLogo} />
                </LakeText>
              )}
            </ScrollView>
          )}
        </ResponsiveContainer>
      );
    })
    .with(AsyncData.P.Done(Result.P.Error(P.select())), error => <ErrorView error={error} />)
    .otherwise(() => <LoadingView color={colors.gray[400]} style={styles.base} />);
};
