import { AsyncData, Result } from "@swan-io/boxed";
import { BorderedIcon } from "@swan-io/lake/src/components/BorderedIcon";
import { LakeAlert } from "@swan-io/lake/src/components/LakeAlert";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { Link } from "@swan-io/lake/src/components/Link";
import { LoadingView } from "@swan-io/lake/src/components/LoadingView";
import { Separator } from "@swan-io/lake/src/components/Separator";
import { Space } from "@swan-io/lake/src/components/Space";
import { SwanLogo } from "@swan-io/lake/src/components/SwanLogo";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { WithPartnerAccentColor } from "@swan-io/lake/src/components/WithPartnerAccentColor";
import {
  backgroundColor,
  breakpoints,
  colors,
  invariantColors,
  spacings,
} from "@swan-io/lake/src/constants/design";
import { useResponsive } from "@swan-io/lake/src/hooks/useResponsive";
import { isNotNullish } from "@swan-io/lake/src/utils/nullish";
import { isMobile } from "@swan-io/lake/src/utils/userAgent";
import { useCallback, useLayoutEffect, useState } from "react";
import { Image, ScrollView, StyleSheet, View } from "react-native";
import { P, match } from "ts-pattern";
import { ErrorView } from "../components/ErrorView";
import { AuthStatusDocument } from "../graphql/partner";
import { ProjectLoginPageDocument } from "../graphql/unauthenticated";
import { openPopup } from "../states/popup";
import { env } from "../utils/env";
import { getFirstSupportedLanguage, t } from "../utils/i18n";
import { Router } from "../utils/routes";
import { parseOperationResult, partnerClient, unauthenticatedClient } from "../utils/urql";

const styles = StyleSheet.create({
  base: {
    backgroundColor: backgroundColor.default,
    flexGrow: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: spacings[16],
    paddingVertical: spacings[16],
    justifyContent: "center",
  },
  contentContainerDesktop: {
    paddingVertical: spacings[40],
  },
  parternship: {
    marginHorizontal: "auto",
    display: "flex",
    flexDirection: "row",
    alignItems: "baseline",
  },
  swanPartnerLogo: {
    height: 9,
  },
  defaultLogo: {
    height: 18,
    width: "initial",
  },
  defaultLogoDesktop: {
    height: 24,
  },
  content: {
    margin: "auto",
  },
  tile: {
    paddingHorizontal: spacings[72],
    paddingVertical: spacings[72],
  },
  mobileContainer: {
    paddingHorizontal: spacings[24],
    paddingVertical: spacings[48],
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
});

const HelpLink = ({ to, children }: { to: string; children: string }) => (
  <LakeText variant="smallRegular" style={styles.link}>
    <Link to={to} style={({ hovered }) => hovered && styles.underline} target="blank">
      {children}
    </Link>
  </LakeText>
);

const SUPPORT_ROOT_URL = `https://support.swan.io/hc/${getFirstSupportedLanguage([
  "en",
  "fr",
  "de",
  "es",
  "it",
])}`;

type LoginContentProps = {
  accentColor: string;
  onLogin: () => void;
};

const LoginContent = ({ accentColor, onLogin }: LoginContentProps) => {
  return (
    <WithPartnerAccentColor color={accentColor}>
      <View style={styles.iconContainer}>
        <BorderedIcon name="building-bank-regular" size={100} padding={16} color="partner" />
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

      <HelpLink to={`${SUPPORT_ROOT_URL}-150/articles/5490446960797-How-do-I-report-fraud-`}>
        {t("login.linkFraud")}
      </HelpLink>
    </WithPartnerAccentColor>
  );
};

export const ProjectLoginPage = ({
  projectId,
  sessionExpired,
}: {
  projectId: string;
  sessionExpired?: boolean;
}) => {
  const { desktop } = useResponsive(breakpoints.medium);
  const [projectInfos, setProjectInfos] = useState<
    AsyncData<Result<{ accentColor: string; name: string; logoUri?: string }, Error>>
  >(AsyncData.Loading());

  useLayoutEffect(() => {
    const envType = env.APP_TYPE === "LIVE" ? "Live" : "Sandbox";

    Promise.all([
      partnerClient.query(AuthStatusDocument, {}).toPromise(),
      unauthenticatedClient
        .query(ProjectLoginPageDocument, { projectId, env: envType })
        .toPromise(),
    ])
      .then(([authStatusQuery, projectInfosQuery]) => {
        const authenticated = isNotNullish(authStatusQuery.data?.user);

        if (authenticated) {
          return Router.push("ProjectRootRedirect");
        }

        const { projectInfoById } = parseOperationResult(projectInfosQuery);

        setProjectInfos(
          AsyncData.Done(
            Result.Ok({
              accentColor: projectInfoById.accentColor ?? invariantColors.gray,
              name: projectInfoById.name,
              logoUri: projectInfoById.logoUri ?? undefined,
            }),
          ),
        );
      })
      .catch(error => {
        setProjectInfos(AsyncData.Done(Result.Error(error)));
      });
  }, [projectId]);

  const handleButtonPress = useCallback(() => {
    const redirectTo = Router.ProjectRootRedirect();
    const params = new URLSearchParams();
    params.set("projectId", projectId);

    if (isMobile) {
      params.set("redirectTo", redirectTo);
      window.location.replace(`/auth/login?${params.toString()}`);
    } else {
      params.set("redirectTo", Router.PopupCallback());
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

  return match(projectInfos)
    .with(AsyncData.P.Done(Result.P.Ok(P.select())), ({ accentColor, name, logoUri }) => {
      return (
        <ScrollView
          style={styles.base}
          contentContainerStyle={[
            styles.contentContainer,
            desktop && styles.contentContainerDesktop,
          ]}
        >
          <View role="banner">
            {isNotNullish(logoUri) ? (
              <Image
                source={{ uri: logoUri }}
                resizeMode="contain"
                aria-label={name}
                style={[styles.defaultLogo, desktop && styles.defaultLogoDesktop]}
              />
            ) : (
              <SwanLogo style={[styles.defaultLogo, desktop && styles.defaultLogoDesktop]} />
            )}
          </View>

          <View style={styles.content}>
            {sessionExpired === true && (
              <>
                <Space height={24} />
                <LakeAlert variant="warning" title={t("login.sessionExpired.title")} />
              </>
            )}

            {desktop ? (
              <>
                <Space height={24} />

                <Tile style={styles.tile}>
                  <LoginContent accentColor={accentColor} onLogin={handleButtonPress} />
                </Tile>

                <Space height={24} />
              </>
            ) : (
              <View style={styles.mobileContainer}>
                <LoginContent accentColor={accentColor} onLogin={handleButtonPress} />
              </View>
            )}
          </View>

          {isNotNullish(logoUri) && (
            <LakeText variant="smallRegular" style={styles.parternship}>
              {t("login.parternship")} <SwanLogo style={styles.swanPartnerLogo} />
            </LakeText>
          )}
        </ScrollView>
      );
    })
    .with(AsyncData.P.Done(Result.P.Error(P.select())), error => <ErrorView error={error} />)
    .otherwise(() => <LoadingView color={colors.gray[400]} style={styles.base} />);
};
