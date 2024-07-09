import { Array, Dict, Option } from "@swan-io/boxed";
import { AutoWidthImage } from "@swan-io/lake/src/components/AutoWidthImage";
import { Box } from "@swan-io/lake/src/components/Box";
import { ErrorBoundary } from "@swan-io/lake/src/components/ErrorBoundary";
import { Fill } from "@swan-io/lake/src/components/Fill";
import { Icon } from "@swan-io/lake/src/components/Icon";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LoadingView } from "@swan-io/lake/src/components/LoadingView";
import { Popover } from "@swan-io/lake/src/components/Popover";
import { ProjectEnvTag } from "@swan-io/lake/src/components/ProjectEnvTag";
import { ScrollView, ScrollViewRef } from "@swan-io/lake/src/components/ScrollView";
import { SidebarNavigationTracker } from "@swan-io/lake/src/components/SidebarNavigationTracker";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tag } from "@swan-io/lake/src/components/Tag";
import { WithPartnerAccentColor } from "@swan-io/lake/src/components/WithPartnerAccentColor";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import {
  backgroundColor,
  colors,
  invariantColors,
  spacings,
} from "@swan-io/lake/src/constants/design";
import { insets } from "@swan-io/lake/src/constants/insets";
import { useBoolean } from "@swan-io/lake/src/hooks/useBoolean";
import { usePersistedState } from "@swan-io/lake/src/hooks/usePersistedState";
import { useResponsive } from "@swan-io/lake/src/hooks/useResponsive";
import { isNullish } from "@swan-io/lake/src/utils/nullish";
import { CONTENT_ID, SkipToContent } from "@swan-io/shared-business/src/components/SkipToContent";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NativeScrollEvent, NativeSyntheticEvent, Pressable, StyleSheet, View } from "react-native";
import { P, match } from "ts-pattern";
import logoSwan from "../assets/images/logo-swan.svg";
import { AccountAreaQuery, AccountLanguage, IdentificationFragment } from "../graphql/partner";
import { AccountActivationPage } from "../pages/AccountActivationPage";
import { AccountNotFoundPage, NotFoundPage } from "../pages/NotFoundPage";
import { ProfilePage } from "../pages/ProfilePage";
import { env } from "../utils/env";
import { t } from "../utils/i18n";
import { getIdentificationLevelStatusInfo } from "../utils/identification";
import { logFrontendError, setSentryUser } from "../utils/logger";
import { projectConfiguration } from "../utils/projectId";
import {
  Router,
  accountMinimalRoutes,
  historyMenuRoutes,
  paymentMenuRoutes,
} from "../utils/routes";
import { signout } from "../utils/signout";
import { updateTgglContext } from "../utils/tggl";
import { AccountDetailsArea } from "./AccountDetailsArea";
import { AccountNavigation, Menu } from "./AccountNavigation";
import { AccountActivationTag, AccountPicker, AccountPickerButton } from "./AccountPicker";
import { CardsArea } from "./CardsArea";
import { ErrorView } from "./ErrorView";
import { MembershipsArea } from "./MembershipsArea";
import { NavigationTabBar, navigationTabBarHeight } from "./NavigationTabBar";
import { ProfileButton } from "./ProfileButton";
import { Redirect } from "./Redirect";
import { TransactionsArea } from "./TransactionsArea";
import { TransferArea } from "./TransferArea";

const SIDEBAR_WIDTH = 300;
const LOGO_MAX_HEIGHT = 40;
const LOGO_MAX_WIDTH = 180;

const styles = StyleSheet.create({
  background: {
    flexShrink: 1,
    flexGrow: 1,
    backgroundColor: backgroundColor.default,
  },
  content: {
    ...commonStyles.fill,
  },
  container: {
    flexShrink: 1,
    flexGrow: 1,
    backgroundColor: backgroundColor.default,
  },
  desktopContainer: {
    flexDirection: "row",
    width: "100%",
    marginHorizontal: "auto",
  },
  sidebar: {
    backgroundColor: backgroundColor.accented,
    flexGrow: 0,
    flexShrink: 0,
    minHeight: "100%",
    paddingLeft: "calc(calc(100vw - 1520px) / 2)",
  },
  sidebarContent: {
    flexGrow: 1,
    paddingHorizontal: 32,
    paddingTop: 45,
    paddingBottom: 24,
    width: SIDEBAR_WIDTH,
  },
  mobileContentContainer: {
    // be carefull to not put commonStyles.fill here, it will break sticky tabs
    minHeight: "100%",
    paddingBottom: navigationTabBarHeight,
  },
  desktopContentContainer: {
    ...commonStyles.fill,
    borderColor: colors.gray[100],
    borderLeftWidth: 1,
    maxWidth: 1220,
  },
  headerMobile: {
    paddingTop: insets.addToTop(16),
    paddingLeft: insets.addToLeft(16),
    paddingRight: insets.addToRight(16),
    paddingBottom: 0,
    backgroundColor: backgroundColor.default,
    flexDirection: "row",
    justifyContent: "center",
  },
  accountPicker: {
    maxWidth: 530,
    maxHeight: 220,
  },
  additionalLink: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacings[8],
  },
  logo: {
    height: LOGO_MAX_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
});

type Props = {
  accountMembershipLanguage: AccountLanguage;
  accountMembershipId: string;
  accountMembership: NonNullable<AccountAreaQuery["accountMembership"]>;
  user: NonNullable<AccountAreaQuery["user"]>;
  projectInfo: NonNullable<AccountAreaQuery["projectInfo"]>;
  lastRelevantIdentification: Option<IdentificationFragment>;
  shouldDisplayIdVerification: boolean;
  requireFirstTransfer: boolean;
  permissions: {
    canInitiatePayments: boolean;
    canManageBeneficiaries: boolean;
    canManageCards: boolean;
    canViewAccount: boolean;
    canManageAccountMembership: boolean;
  };
  features: {
    accountStatementsVisible: boolean;
    accountVisible: boolean;
    transferCreationVisible: boolean;
    paymentListVisible: boolean;
    virtualIbansVisible: boolean;
    memberCreationVisible: boolean;
    memberListVisible: boolean;
    physicalCardOrderVisible: boolean;
    virtualCardOrderVisible: boolean;
  };
  activationTag: AccountActivationTag;
  sections: {
    history: boolean;
    account: boolean;
    transfer: boolean;
    cards: boolean;
    members: boolean;
  };
  reload: () => void;
};

export const AccountArea = ({
  accountMembershipLanguage,
  accountMembershipId,
  accountMembership,
  projectInfo,
  user,
  sections,
  features,
  activationTag,
  lastRelevantIdentification,
  shouldDisplayIdVerification,
  requireFirstTransfer,
  permissions,
  reload,
}: Props) => {
  const { desktop } = useResponsive();

  const [isScrolled, setIsScrolled] = useState(false);
  const scrollView = useRef<ScrollViewRef | null>(null);

  const scrollToTop = useCallback(() => {
    scrollView.current?.scrollTo({ y: 0, animated: true });
  }, []);

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIsScrolled(event.nativeEvent.contentOffset.y > 0);
  }, []);

  const hasMultipleMemberships = Option.fromNullable(accountMembership.user)
    .map(({ accountMemberships: { totalCount } }) => totalCount > 1)
    .getOr(false);

  const account = accountMembership.account;
  const accountCountry = account?.country ?? undefined;
  const holder = account?.holder;

  const isIndividual = holder?.info.__typename === "AccountHolderIndividualInfo";

  const userId = user?.id ?? "";
  const firstName = user?.firstName ?? "";
  const lastName = user?.lastName ?? "";
  const phoneNumber = user?.mobilePhoneNumber ?? "";

  const [, setAccountMembershipState] = usePersistedState<unknown>(
    `swan_session_webBankingAccountMembershipState${projectConfiguration
      .map(({ projectId }) => `_${projectId}`)
      .getOr("")}`,
    {},
  );

  useEffect(() => {
    setAccountMembershipState({ accountMembershipId, userId });
  }, [setAccountMembershipState, accountMembershipId, userId]);

  useEffect(() => {
    setSentryUser({
      id: user.id,
      firstName: user.firstName ?? undefined,
      lastName: user.lastName ?? undefined,
      phoneNumber: user.mobilePhoneNumber ?? undefined,
    });
  }, [user]);

  const accentColor = projectInfo.accentColor ?? invariantColors.defaultAccentColor;
  const projectName = projectInfo.name;
  const projectLogo = projectInfo.logoUri ?? undefined;

  const menu: Menu =
    holder?.verificationStatus === "Refused"
      ? []
      : [
          {
            matchRoutes: ["AccountTransactionsArea"],
            iconActive: "apps-list-filled",
            icon: "apps-list-regular",
            name: t("navigation.history"),
            to: Router.AccountTransactionsListRoot({ accountMembershipId }),
            hidden: !sections.history,
          },
          {
            matchRoutes: ["AccountDetailsArea"],
            iconActive: "building-bank-filled",
            icon: "building-bank-regular",
            name: t("navigation.account"),
            to: Router.AccountDetailsIban({ accountMembershipId }),
            hidden: !sections.account,
          },
          {
            matchRoutes: ["AccountPaymentsArea"],
            iconActive: "arrow-swap-filled",
            icon: "arrow-swap-regular",
            name: t("navigation.transfer"),
            to: Router.AccountPaymentsRoot({ accountMembershipId }),
            hidden: !sections.transfer,
          },
          {
            matchRoutes: ["AccountCardsArea"],
            iconActive: "payment-filled",
            icon: "payment-regular",
            name: t("navigation.cards"),
            to: Router.AccountCardsList({ accountMembershipId }),
            hidden: !sections.cards,
          },
          {
            matchRoutes: ["AccountMembersArea"],
            iconActive: "people-filled",
            icon: "people-regular",
            name: t("navigation.members"),
            to: Router.AccountMembersList({ accountMembershipId }),
            hidden: !sections.members,
            hasNotifications: Option.fromNullable(accountMembership.account)
              .map(
                ({ accountMembershipsWithBindingUserError }) =>
                  accountMembershipsWithBindingUserError.totalCount > 0,
              )
              .getOr(false),
          },
        ];

  const routes = useMemo(() => {
    return [
      ...accountMinimalRoutes,
      ...(sections.history ? historyMenuRoutes : []),
      ...(sections.account ? (["AccountDetailsArea"] as const) : []),
      ...(sections.transfer ? paymentMenuRoutes : []),
      ...(sections.cards ? (["AccountCardsArea"] as const) : []),
      ...(sections.members ? (["AccountMembersArea"] as const) : []),
    ];
  }, [sections]);

  const route = Router.useRoute(routes);

  const email = accountMembership.email;
  const hasRequiredIdentificationLevel = accountMembership.hasRequiredIdentificationLevel ?? false;

  useEffect(() => {
    updateTgglContext({ accountCountry, userId, email });
  }, [accountCountry, userId, email]);

  const additionalInfo = useMemo(
    () => ({
      firstName,
      lastName,
      phoneNumber,
      userId,
      email,
      projectName,
    }),
    [firstName, lastName, phoneNumber, userId, email, projectName],
  );

  const accountPickerButtonRef = useRef<View | null>(null);
  const [isAccountPickerOpen, setAccountPickerOpen] = useBoolean(false);

  const accountId = accountMembership.accountId;

  const roots = {
    history: Router.AccountTransactionsListRoot({ accountMembershipId }),
    account: Router.AccountDetailsIban({ accountMembershipId }),
    transfer: Router.AccountPaymentsRoot({ accountMembershipId }),
    cards: Router.AccountCardsList({ accountMembershipId }),
    members: Router.AccountMembersList({ accountMembershipId }),
  };

  const firstAccesibleRoute = Array.findMap(Dict.entries(roots), ([key, route]) =>
    sections[key] ? Option.Some(route) : Option.None(),
  );

  const canQueryCardOnTransaction =
    accountMembership.statusInfo.status !== "BindingUserError" &&
    accountMembership.canManageAccountMembership;

  if (accountMembership.user?.id !== user?.id) {
    return <Redirect to={Router.ProjectRootRedirect()} />;
  }

  return (
    <WithPartnerAccentColor color={accentColor}>
      <SkipToContent />

      <View style={styles.background}>
        <View style={[styles.container, desktop && styles.desktopContainer]}>
          {desktop && (
            <SidebarNavigationTracker
              style={styles.sidebar}
              contentContainerStyle={styles.sidebarContent}
            >
              <Box alignItems="center">
                <View style={styles.logo}>
                  <AutoWidthImage
                    ariaLabel={projectName}
                    sourceUri={projectLogo ?? logoSwan}
                    height={LOGO_MAX_HEIGHT}
                    maxWidth={LOGO_MAX_WIDTH}
                    resizeMode="contain"
                  />
                </View>
              </Box>

              {env.APP_TYPE === "SANDBOX" && (
                <>
                  <Space height={12} />

                  <Box alignItems="center">
                    <ProjectEnvTag projectEnv="Sandbox" />
                  </Box>
                </>
              )}

              <Space height={32} />

              <AccountPickerButton
                ref={accountPickerButtonRef}
                desktop={true}
                accountMembershipId={accountMembershipId}
                activationTag={activationTag}
                activationLinkActive={route?.name === "AccountActivation"}
                hasMultipleMemberships={hasMultipleMemberships}
                selectedAccountMembership={accountMembership}
                onPress={setAccountPickerOpen.on}
                availableBalance={account?.balances?.available ?? undefined}
              />

              <Popover
                referenceRef={accountPickerButtonRef}
                matchReferenceMinWidth={true}
                visible={isAccountPickerOpen}
                onDismiss={setAccountPickerOpen.off}
              >
                <View style={styles.accountPicker}>
                  <AccountPicker
                    accountMembershipId={accountMembershipId}
                    onPressItem={accountMembershipId => {
                      // TODO: Prevent full reload by tweaking layout + Suspense
                      window.location.assign(Router.AccountRoot({ accountMembershipId }));
                    }}
                  />
                </View>
              </Popover>

              <Space height={32} />
              <AccountNavigation menu={menu} />
              <Fill minHeight={48} />

              <Pressable role="button" style={styles.additionalLink} onPress={signout}>
                <Icon name="sign-out-regular" size={22} color={colors.negative[500]} />
                <Space width={12} />
                <LakeText variant="medium">{t("login.signout")}</LakeText>
              </Pressable>

              <Space height={12} />

              <ProfileButton
                identificationStatusInfo={lastRelevantIdentification.map(
                  getIdentificationLevelStatusInfo,
                )}
                firstName={firstName}
                lastName={lastName}
                accountMembershipId={accountMembershipId}
                shouldDisplayIdVerification={shouldDisplayIdVerification}
                hasRequiredIdentificationLevel={hasRequiredIdentificationLevel}
              />
            </SidebarNavigationTracker>
          )}

          <ScrollView
            ref={scrollView}
            onScroll={onScroll}
            scrollEventThrottle={200}
            contentContainerStyle={
              desktop ? styles.desktopContentContainer : styles.mobileContentContainer
            }
          >
            {desktop ? null : (
              <>
                <Box role="banner" direction="row" alignItems="center" style={styles.headerMobile}>
                  <AutoWidthImage
                    ariaLabel={projectName}
                    sourceUri={projectLogo ?? logoSwan}
                    height={32}
                    resizeMode="contain"
                  />

                  {env.APP_TYPE === "SANDBOX" && (
                    <>
                      <Space width={12} />
                      <Tag color="sandbox" ariaLabel="Sandbox" icon="beaker-regular" />
                    </>
                  )}
                </Box>
              </>
            )}

            <View style={styles.content} id={CONTENT_ID} tabIndex={0}>
              <ErrorBoundary
                key={route?.name}
                onError={error => logFrontendError(error)}
                fallback={() => <ErrorView />}
              >
                {holder?.verificationStatus === "Refused" ? (
                  <AccountActivationPage
                    requireFirstTransfer={requireFirstTransfer}
                    hasRequiredIdentificationLevel={hasRequiredIdentificationLevel}
                    lastRelevantIdentification={lastRelevantIdentification}
                    accentColor={accentColor}
                    accountMembershipId={accountMembershipId}
                    additionalInfo={additionalInfo}
                    accountVisible={features.accountVisible}
                    projectName={projectName}
                    refetchAccountAreaQuery={reload}
                  />
                ) : (
                  <Suspense fallback={<LoadingView color={colors.current[500]} />}>
                    {match(route)
                      .with({ name: "AccountRoot" }, () =>
                        firstAccesibleRoute.match({
                          Some: route => <Redirect to={route} />,
                          None: () => <AccountNotFoundPage projectName={projectName} />,
                        }),
                      )
                      .with({ name: "AccountProfile" }, () => (
                        <ProfilePage
                          accentColor={accentColor}
                          recommendedIdentificationLevel={
                            accountMembership.recommendedIdentificationLevel
                          }
                          additionalInfo={additionalInfo}
                          refetchAccountAreaQuery={reload}
                          email={accountMembership.email}
                          shouldDisplayIdVerification={shouldDisplayIdVerification}
                          hasRequiredIdentificationLevel={hasRequiredIdentificationLevel}
                          lastRelevantIdentification={lastRelevantIdentification}
                        />
                      ))
                      .with({ name: "AccountDetailsArea" }, () =>
                        !features.accountVisible ? (
                          <ErrorView />
                        ) : (
                          <AccountDetailsArea
                            accountMembershipLanguage={accountMembershipLanguage}
                            accountId={accountId}
                            accountMembershipId={accountMembershipId}
                            canManageAccountMembership={permissions.canManageAccountMembership}
                            virtualIbansVisible={features.virtualIbansVisible}
                            isIndividual={isIndividual}
                          />
                        ),
                      )
                      .with(
                        { name: "AccountTransactionsArea" },
                        ({ params: { accountMembershipId } }) => (
                          <TransactionsArea
                            accountId={accountId}
                            accountMembershipId={accountMembershipId}
                            canQueryCardOnTransaction={canQueryCardOnTransaction}
                            accountStatementsVisible={features.accountStatementsVisible}
                            canViewAccount={accountMembership.canViewAccount}
                          />
                        ),
                      )

                      .with(
                        { name: "AccountPaymentsArea" },
                        ({ params: { consentId, kind, status } }) =>
                          isNullish(accountCountry) ? (
                            <ErrorView />
                          ) : (
                            <TransferArea
                              accountCountry={accountCountry}
                              accountId={accountId}
                              accountMembershipId={accountMembershipId}
                              canQueryCardOnTransaction={canQueryCardOnTransaction}
                              canViewAccount={accountMembership.canViewAccount}
                              transferConsent={
                                consentId != null && kind != null && status != null
                                  ? Option.Some({ kind, status })
                                  : Option.None()
                              }
                              transferCreationVisible={features.transferCreationVisible}
                            />
                          ),
                      )
                      .with({ name: "AccountCardsArea" }, () => (
                        <CardsArea
                          accountMembershipId={accountMembershipId}
                          accountId={accountId}
                          userId={userId}
                          refetchAccountAreaQuery={reload}
                          canAddCard={permissions.canManageCards}
                          accountMembership={accountMembership}
                          canManageAccountMembership={permissions.canManageAccountMembership}
                          cardOrderVisible={features.virtualCardOrderVisible}
                          physicalCardOrderVisible={features.physicalCardOrderVisible}
                        />
                      ))
                      .with({ name: "AccountMembersArea" }, ({ params }) =>
                        match(accountMembership)
                          .with(
                            { account: { country: P.string } },
                            currentUserAccountMembership => (
                              <MembershipsArea
                                accountMembershipId={accountMembershipId}
                                accountId={accountId}
                                memberCreationVisible={features.memberCreationVisible}
                                canAddCard={
                                  permissions.canViewAccount && permissions.canManageCards
                                }
                                onAccountMembershipUpdate={reload}
                                accountCountry={currentUserAccountMembership.account.country}
                                params={params}
                                currentUserAccountMembership={currentUserAccountMembership}
                                cardOrderVisible={features.virtualCardOrderVisible}
                                physicalCardOrderVisible={features.physicalCardOrderVisible}
                                shouldDisplayIdVerification={shouldDisplayIdVerification}
                              />
                            ),
                          )
                          .otherwise(() => <ErrorView />),
                      )
                      .with({ name: "AccountActivation" }, () => (
                        <AccountActivationPage
                          hasRequiredIdentificationLevel={hasRequiredIdentificationLevel}
                          lastRelevantIdentification={lastRelevantIdentification}
                          requireFirstTransfer={requireFirstTransfer}
                          accentColor={accentColor}
                          accountMembershipId={accountMembershipId}
                          additionalInfo={additionalInfo}
                          accountVisible={features.accountVisible}
                          projectName={projectName}
                          refetchAccountAreaQuery={reload}
                        />
                      ))
                      .otherwise(() => (
                        <NotFoundPage
                          title={firstAccesibleRoute.isNone() ? t("error.noAccount") : undefined}
                          text={
                            firstAccesibleRoute.isNone()
                              ? t("error.checkWithProvider", { projectName })
                              : undefined
                          }
                        />
                      ))}
                  </Suspense>
                )}
              </ErrorBoundary>
            </View>
          </ScrollView>

          {desktop ? null : (
            <NavigationTabBar
              identificationStatusInfo={lastRelevantIdentification.map(
                getIdentificationLevelStatusInfo,
              )}
              hasRequiredIdentificationLevel={hasRequiredIdentificationLevel}
              accountMembershipId={accountMembershipId}
              hasMultipleMemberships={hasMultipleMemberships}
              activationTag={activationTag}
              accountMembership={accountMembership}
              shouldDisplayIdVerification={shouldDisplayIdVerification}
              additionalInfo={additionalInfo}
              entries={menu}
              firstName={firstName}
              lastName={lastName}
              refetchAccountAreaQuery={reload}
              isScrolled={isScrolled}
              onScrollToTop={scrollToTop}
            />
          )}
        </View>
      </View>
    </WithPartnerAccentColor>
  );
};
