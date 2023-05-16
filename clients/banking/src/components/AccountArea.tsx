import { ErrorBoundary } from "@sentry/react";
import { Array, Dict, Option, Result } from "@swan-io/boxed";
import { AutoWidthImage } from "@swan-io/lake/src/components/AutoWidthImage";
import { Box } from "@swan-io/lake/src/components/Box";
import { Fill } from "@swan-io/lake/src/components/Fill";
import { Icon } from "@swan-io/lake/src/components/Icon";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LoadingView } from "@swan-io/lake/src/components/LoadingView";
import { Popover } from "@swan-io/lake/src/components/Popover";
import { ProjectEnvTag } from "@swan-io/lake/src/components/ProjectEnvTag";
import { SidebarNavigationTracker } from "@swan-io/lake/src/components/SidebarNavigationTracker";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tag } from "@swan-io/lake/src/components/Tag";
import { WithPartnerAccentColor } from "@swan-io/lake/src/components/WithPartnerAccentColor";
import { defaultAccentColor } from "@swan-io/lake/src/constants/colors";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { backgroundColor, colors, spacings } from "@swan-io/lake/src/constants/design";
import { insets } from "@swan-io/lake/src/constants/insets";
import { useBoolean } from "@swan-io/lake/src/hooks/useBoolean";
import { usePersistedState } from "@swan-io/lake/src/hooks/usePersistedState";
import { useResponsive } from "@swan-io/lake/src/hooks/useResponsive";
import { showToast } from "@swan-io/lake/src/state/toasts";
import { isEmpty, isNotEmpty, isNullish } from "@swan-io/lake/src/utils/nullish";
import { CONTENT_ID, SkipToContent } from "@swan-io/shared-business/src/components/SkipToContent";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { P, match } from "ts-pattern";
import logoSwan from "../assets/images/logo-swan.svg";
import { LegacyAccentColorProvider } from "../contexts/legacyAccentColor";
import { AccountAreaDocument, IdentificationLevelsFragment } from "../graphql/partner";
import { AccountActivationPage } from "../pages/AccountActivationPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { ProfilePage } from "../pages/ProfilePage";
import { env } from "../utils/env";
import { t } from "../utils/i18n";
import { logFrontendError, setSentryUser } from "../utils/logger";
import { projectConfiguration } from "../utils/projectId";
import {
  RouteName,
  Router,
  accountMinimalRoutes,
  historyMenuRoutes,
  paymentMenuRoutes,
} from "../utils/routes";
import { useQueryWithErrorBoundary } from "../utils/urql";
import { AccountDetailsArea } from "./AccountDetailsArea";
import { AccountNavigation, Menu } from "./AccountNavigation";
import { AccountActivationTag, AccountPicker, AccountPickerButton } from "./AccountPicker";
import { CardsArea } from "./CardsArea";
import { ErrorView } from "./ErrorView";
import { MembershipsArea } from "./MembershipsArea";
import { NavigationTabBar, navigationTabBarHeight } from "./NavigationTabBar";
import { PaymentsAreaV2 } from "./PaymentsAreaV2";
import { ProfileButton } from "./ProfileButton";
import { Redirect } from "./Redirect";
import { TransactionsArea } from "./TransactionsArea";

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
  accountMembershipId: string;
};

const defaultIdentificationLevels: IdentificationLevelsFragment = {
  __typename: "IdentificationLevels",
  expert: false,
  QES: false,
  PVID: false,
};

const COOKIE_REFRESH_INTERVAL = 30000; // 30s

export const AccountArea = ({ accountMembershipId }: Props) => {
  const { desktop } = useResponsive();

  const [isScrolled, setIsScrolled] = useState(false);
  const scrollView = useRef<ScrollView | null>(null);
  const scrollToTop = useCallback(() => {
    scrollView.current?.scrollTo({ y: 0, animated: true });
  }, []);

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIsScrolled(event.nativeEvent.contentOffset.y > 0);
  }, []);

  // call API to extend cookie TTL
  useEffect(() => {
    const intervalId = setInterval(() => {
      void fetch("/api/ping", { method: "POST" });
    }, COOKIE_REFRESH_INTERVAL);
    return () => clearInterval(intervalId);
  }, []);

  const [
    {
      data: { accountMembership, projectInfo, user },
    },
    reexecuteQuery,
  ] = useQueryWithErrorBoundary({
    query: AccountAreaDocument,
    variables: { accountMembershipId },
  });

  const currentAccountMembership = useMemo(
    () => Option.fromNullable(accountMembership).toResult(new Error("NoAccountMembership")),
    [accountMembership],
  );

  const hasMultipleMemberships = currentAccountMembership
    .toOption()
    .flatMap(data => Option.fromNullable(data.user))
    .map(({ accountMemberships: { totalCount } }) => totalCount > 1)
    .getWithDefault(false);

  const account = accountMembership?.account;
  const holder = account?.holder;

  const isIndividual = holder?.info.__typename === "AccountHolderIndividualInfo";
  const hasTransactions = (account?.transactions?.totalCount ?? 0) >= 1;

  const identificationStatus = user?.identificationStatus;
  const identificationLevels: IdentificationLevelsFragment =
    user?.identificationLevels ?? defaultIdentificationLevels;
  const userStatusIsProcessing = identificationStatus === "Processing";

  // checks that at least one identificationLevel is valid
  const idVerified = Array.filterMap(Dict.entries(identificationLevels), ([_, value]) =>
    typeof value === "boolean" ? Option.Some(value) : Option.None(),
  ).some(isValid => isValid);

  const requireFirstTransfer =
    account?.country === "FRA" &&
    user?.identificationLevels?.PVID === false &&
    user?.identificationLevels?.QES === false;

  const documentCollection = holder?.supportingDocumentCollections.edges[0]?.node;
  const documentCollectionStatus = documentCollection?.statusInfo.status;

  const userId = user?.id ?? "";
  const firstName = user?.firstName ?? "";
  const lastName = user?.lastName ?? "";
  const phoneNumber = user?.mobilePhoneNumber ?? "";

  const activationTagInput = {
    documentCollectionStatus,
    hasTransactions,
    identificationStatus,
    accountHolderType: account?.holder.info.__typename,
    isIndividual,
    isLegalRepresentative: accountMembership?.legalRepresentative ?? false,
    account,
  } as const;

  const activationTag = match<typeof activationTagInput, AccountActivationTag>(activationTagInput)
    // if payment level limitations have been lifted, no need for activation
    .with(
      { account: { paymentLevel: "Unlimited", paymentAccountType: "PaymentService" } },
      () => "none",
    )
    // never show to non-legal rep memberships
    .with({ isLegalRepresentative: false }, () => "none")
    .with({ identificationStatus: "Processing" }, () => "pending")
    .with({ identificationStatus: P.not("ValidIdentity") }, () => "actionRequired")
    .with(
      { documentCollectionStatus: "PendingReview", accountHolderType: "AccountHolderCompanyInfo" },
      () => "pending",
    )
    .with(
      {
        documentCollectionStatus: P.not("Approved"),
        accountHolderType: "AccountHolderCompanyInfo",
      },
      () => "actionRequired",
    )
    .with({ isIndividual: true, hasTransactions: false }, () => "actionRequired")
    .otherwise(() => "none");

  const [, setAccountMembershipState] = usePersistedState<unknown>(
    `swan_session_webBankingAccountMembershipState${projectConfiguration
      .map(({ projectId }) => `_${projectId}`)
      .getWithDefault("")}`,
    {},
  );

  useEffect(() => {
    match(currentAccountMembership)
      .with(Result.P.Ok({ id: P.select(), user: { id: user?.id } }), accountMembershipId =>
        setAccountMembershipState({ accountMembershipId }),
      )
      .otherwise(() => setAccountMembershipState({}));
  }, [setAccountMembershipState, currentAccountMembership, user]);

  const refetchAccountAreaQuery = useCallback(() => {
    reexecuteQuery({ requestPolicy: "network-only" });
  }, [reexecuteQuery]);

  useEffect(() => {
    if (userId) {
      const sentryUser: Record<string, unknown> = { id: userId };

      firstName && (sentryUser["firstName"] = firstName);
      lastName && (sentryUser["lastName"] = lastName);
      phoneNumber && (sentryUser["phoneNumber"] = phoneNumber);

      setSentryUser(sentryUser);
    } else {
      setSentryUser(null);
    }
  }, [firstName, lastName, phoneNumber, userId]);

  const settings = projectInfo.webBankingSettings;

  const canInitiatePaymentsToNewBeneficiaries = Boolean(
    settings?.canInitiatePaymentsToNewBeneficiaries,
  );

  const canAddNewMembers = Boolean(settings?.canAddNewMembers);
  const canManageVirtualIbans = Boolean(settings?.canManageVirtualIbans);
  const canOrderPhysicalCards = Boolean(settings?.canOrderPhysicalCards);
  const canOrderVirtualCards = Boolean(settings?.canOrderVirtualCards);
  const canViewAccountDetails = Boolean(settings?.canViewAccountDetails);
  const canViewAccountStatement = Boolean(settings?.canViewAccountStatement);
  const canViewMembers = Boolean(settings?.canViewMembers);
  const canViewPaymentList = Boolean(settings?.canViewPaymentList);

  const membership = useMemo(
    () =>
      currentAccountMembership.map(accountMembership => {
        const { canInitiatePayments, canManageBeneficiaries, canViewAccount, legalRepresentative } =
          accountMembership;

        const membershipEnabled = accountMembership.statusInfo.status === "Enabled";
        const canManageAccountMembership =
          accountMembership.canManageAccountMembership && membershipEnabled;
        const canAddCard = canManageAccountMembership && canOrderVirtualCards;

        return {
          accountMembership,
          isLegalRepresentative: legalRepresentative,
          canManageAccountMembership,
          canInitiatePayments,
          canManageBeneficiaries,
          canAddCard,
          historyMenuIsVisible: canViewAccount,
          detailsMenuIsVisible: canViewAccount && canViewAccountDetails,
          paymentMenuIsVisible:
            canInitiatePayments &&
            membershipEnabled &&
            (canInitiatePaymentsToNewBeneficiaries || canViewPaymentList),
          // In case the user doesn't have the right to manage cards
          // but has one attached to the current membership
          cardMenuIsVisible: accountMembership.allCards.totalCount > 0 || canAddCard,
          memberMenuIsVisible: canViewMembers && canManageAccountMembership,
        };
      }),
    [
      canInitiatePaymentsToNewBeneficiaries,
      canOrderVirtualCards,
      canViewAccountDetails,
      canViewMembers,
      canViewPaymentList,
      currentAccountMembership,
    ],
  );

  const accentColor = projectInfo.accentColor ?? defaultAccentColor;
  const projectName = projectInfo.name;
  const projectLogo = projectInfo.logoUri ?? undefined;

  const menu = membership
    .map<Menu>(
      ({
        accountMembership,
        historyMenuIsVisible,
        detailsMenuIsVisible,
        paymentMenuIsVisible,
        cardMenuIsVisible,
        memberMenuIsVisible,
      }) => [
        {
          matchRoutes: ["AccountTransactionsArea"],
          iconActive: "apps-list-filled",
          icon: "apps-list-regular",
          name: t("navigation.history"),
          to: Router.AccountTransactionsListRoot({ accountMembershipId }),
          hidden: !historyMenuIsVisible,
        },
        {
          matchRoutes: ["AccountDetailsArea"],
          iconActive: "building-bank-filled",
          icon: "building-bank-regular",
          name: t("navigation.account"),
          to: Router.AccountDetailsIban({ accountMembershipId }),
          hidden: !detailsMenuIsVisible,
        },
        {
          matchRoutes: ["AccountPaymentsArea"],
          iconActive: "arrow-swap-filled",
          icon: "arrow-swap-regular",
          name: t("navigation.transfer"),
          to: Router.AccountPaymentsRoot({ accountMembershipId }),
          hidden: !paymentMenuIsVisible,
        },
        {
          matchRoutes: ["AccountCardsArea"],
          iconActive: "payment-filled",
          icon: "payment-regular",
          name: t("navigation.cards"),
          to: Router.AccountCardsList({ accountMembershipId }),
          hidden: !cardMenuIsVisible,
        },
        {
          matchRoutes: ["AccountMembersArea"],
          iconActive: "people-filled",
          icon: "people-regular",
          name: t("navigation.members"),
          to: Router.AccountMembersList({ accountMembershipId }),
          hidden: !memberMenuIsVisible,
          hasNotifications: Option.fromNullable(accountMembership.account)
            .map(
              ({ accountMembershipsWithBindingUserError }) =>
                accountMembershipsWithBindingUserError.totalCount > 0,
            )
            .getWithDefault(false),
        },
      ],
    )
    .getWithDefault([]);

  const routes = useMemo(() => {
    const routes: RouteName[] = [...accountMinimalRoutes];

    membership.toOption().match({
      None: () => {},
      Some: ({
        historyMenuIsVisible,
        detailsMenuIsVisible,
        paymentMenuIsVisible,
        cardMenuIsVisible,
        memberMenuIsVisible,
      }) => {
        historyMenuIsVisible && routes.push(...historyMenuRoutes);
        detailsMenuIsVisible && routes.push("AccountDetailsArea");
        paymentMenuIsVisible && routes.push(...paymentMenuRoutes);
        cardMenuIsVisible && routes.push("AccountCardsArea");
        memberMenuIsVisible && routes.push("AccountMembersArea");
      },
    });

    return routes;
  }, [membership]);

  const route = Router.useRoute(routes);

  const email = currentAccountMembership
    .map(accountMembership => accountMembership.email)
    .toOption()
    .toUndefined();

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

  const signout = () => {
    fetch(`/auth/logout`, {
      method: "post",
      credentials: "include",
    })
      .then(async response => {
        if (response.ok) {
          Router.replace("ProjectLogin");
        } else {
          const message = await response.text();
          throw new Error(message);
        }
      })
      .catch((error: Error) => {
        showToast({ variant: "error", title: t("error.generic") });
        logFrontendError(error);
      });
  };

  const [availableBalance, setAvailableBalance] = useState(() =>
    membership
      .map(({ accountMembership }) => accountMembership.account?.balances?.available)
      .toOption()
      .toUndefined(),
  );

  useEffect(() => {
    setAvailableBalance(
      membership
        .map(({ accountMembership }) => accountMembership.account?.balances?.available)
        .toOption()
        .toUndefined(),
    );
  }, [membership]);

  if (membership.isError()) {
    return <Redirect to={Router.ProjectRootRedirect()} />;
  }

  return (
    <WithPartnerAccentColor color={accentColor}>
      {/* TODO: Remove this provider, keep WithPartnerAccentColor */}
      <LegacyAccentColorProvider value={accentColor}>
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

                {match(membership)
                  .with(Result.P.Ok(P.select()), ({ accountMembership }) => (
                    <>
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
                        availableBalance={availableBalance}
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
                            availableBalance={availableBalance}
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
                        identificationStatus={identificationStatus ?? "Uninitiated"}
                        firstName={firstName}
                        lastName={lastName}
                        accountMembershipId={accountMembershipId}
                        shouldDisplayIdVerification={
                          !(
                            projectInfo.B2BMembershipIDVerification === false &&
                            accountMembership.canManageAccountMembership === false &&
                            accountMembership.canInitiatePayments === false &&
                            accountMembership.canManageBeneficiaries === false
                          )
                        }
                      />
                    </>
                  ))
                  .otherwise(() => null)}
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
              {!desktop && (
                <>
                  <Box
                    role="banner"
                    direction="row"
                    alignItems="center"
                    style={styles.headerMobile}
                  >
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
                  fallback={({ error }) => <ErrorView error={error} />}
                >
                  {match(membership)
                    .with(
                      Result.P.Ok(P.select()),
                      ({
                        accountMembership,
                        canAddCard,
                        canManageAccountMembership,
                        cardMenuIsVisible,
                        isLegalRepresentative,
                        historyMenuIsVisible,
                        detailsMenuIsVisible,
                        memberMenuIsVisible,
                        paymentMenuIsVisible,
                      }) => {
                        const accountId = accountMembership.account?.id;

                        const indexUrl: string = historyMenuIsVisible
                          ? Router.AccountTransactionsListRoot({ accountMembershipId })
                          : detailsMenuIsVisible
                          ? Router.AccountDetailsIban({ accountMembershipId })
                          : paymentMenuIsVisible
                          ? Router.AccountPaymentsRoot({ accountMembershipId })
                          : cardMenuIsVisible
                          ? Router.AccountCardsList({ accountMembershipId })
                          : memberMenuIsVisible
                          ? Router.AccountMembersList({ accountMembershipId })
                          : "";

                        if (accountMembership.user?.id !== user?.id) {
                          return <Redirect to={Router.ProjectRootRedirect()} />;
                        }

                        const canQueryCardOnTransaction =
                          accountMembership.statusInfo.status !== "BindingUserError" &&
                          accountMembership.canManageAccountMembership;

                        return (
                          <Suspense fallback={<LoadingView color={accentColor} />}>
                            {match(route)
                              .with({ name: "AccountRoot" }, () =>
                                isNotEmpty(indexUrl) ? (
                                  <Redirect to={indexUrl} />
                                ) : (
                                  <NotFoundPage
                                    title={t("error.noAccount")}
                                    text={t("error.checkWithProvider", { projectName })}
                                  />
                                ),
                              )
                              .with({ name: "AccountProfile" }, () =>
                                currentAccountMembership.match({
                                  Ok: ({
                                    email,
                                    canManageAccountMembership,
                                    canManageBeneficiaries,
                                    canInitiatePayments,
                                    recommendedIdentificationLevel,
                                  }) => (
                                    <ProfilePage
                                      recommendedIdentificationLevel={
                                        recommendedIdentificationLevel
                                      }
                                      additionalInfo={additionalInfo}
                                      userStatusIsProcessing={userStatusIsProcessing}
                                      refetchAccountAreaQuery={refetchAccountAreaQuery}
                                      isLegalRepresentative={isLegalRepresentative}
                                      email={email}
                                      shouldDisplayIdVerification={
                                        !(
                                          projectInfo.B2BMembershipIDVerification === false &&
                                          canManageAccountMembership === false &&
                                          canInitiatePayments === false &&
                                          canManageBeneficiaries === false
                                        )
                                      }
                                    />
                                  ),
                                  Error: () => <ErrorView />,
                                }),
                              )
                              .with({ name: "AccountDetailsArea" }, () =>
                                isNullish(accountId) || !detailsMenuIsVisible ? (
                                  <ErrorView />
                                ) : (
                                  <AccountDetailsArea
                                    accountId={accountId}
                                    accountMembershipId={accountMembershipId}
                                    canManageAccountMembership={canManageAccountMembership}
                                    canManageVirtualIbans={canManageVirtualIbans}
                                    idVerified={idVerified}
                                    projectName={projectName}
                                    userStatusIsProcessing={userStatusIsProcessing}
                                    isIndividual={isIndividual}
                                  />
                                ),
                              )
                              .with(
                                { name: "AccountTransactionsArea" },
                                ({ params: { accountMembershipId } }) =>
                                  isNullish(accountId) ? (
                                    <ErrorView />
                                  ) : (
                                    <TransactionsArea
                                      accountId={accountId}
                                      accountMembershipId={accountMembershipId}
                                      canQueryCardOnTransaction={canQueryCardOnTransaction}
                                      onBalanceReceive={setAvailableBalance}
                                      canViewAccountStatement={canViewAccountStatement}
                                    />
                                  ),
                              )

                              .with(
                                { name: "AccountPaymentsArea" },
                                ({ params: { consentId, standingOrder, status: consentStatus } }) =>
                                  isNullish(accountId) ? (
                                    <ErrorView />
                                  ) : (
                                    <PaymentsAreaV2
                                      accountId={accountId}
                                      accountMembershipId={accountMembershipId}
                                      newStandingOrderIsVisible={
                                        canInitiatePaymentsToNewBeneficiaries
                                      }
                                      canQueryCardOnTransaction={canQueryCardOnTransaction}
                                      transferConsent={
                                        consentId != null && consentStatus != null
                                          ? Option.Some({
                                              status: consentStatus,
                                              isStandingOrder: isNotEmpty(standingOrder ?? ""),
                                            })
                                          : Option.None()
                                      }
                                    />
                                  ),
                              )
                              .with({ name: "AccountCardsArea" }, () => (
                                <CardsArea
                                  accountMembershipId={accountMembershipId}
                                  accountId={accountId}
                                  userId={userId}
                                  refetchAccountAreaQuery={refetchAccountAreaQuery}
                                  canAddCard={canAddCard}
                                  accountMembership={accountMembership}
                                  idVerified={idVerified}
                                  userStatusIsProcessing={userStatusIsProcessing}
                                  canManageAccountMembership={canManageAccountMembership}
                                  canOrderPhysicalCards={canOrderPhysicalCards}
                                />
                              ))
                              .with({ name: "AccountMembersArea" }, ({ params }) =>
                                match({ accountId, accountMembership })
                                  .with(
                                    {
                                      accountId: P.string,
                                      accountMembership: { account: { country: P.string } },
                                    },
                                    ({
                                      accountId,
                                      accountMembership: currentUserAccountMembership,
                                    }) => (
                                      <MembershipsArea
                                        accountMembershipId={accountMembershipId}
                                        accountId={accountId}
                                        canAddNewMembers={canAddNewMembers}
                                        canAddCard={canAddCard}
                                        onAccountMembershipUpdate={refetchAccountAreaQuery}
                                        accountCountry={
                                          currentUserAccountMembership.account.country
                                        }
                                        params={params}
                                        currentUserAccountMembership={currentUserAccountMembership}
                                        canOrderPhysicalCards={canOrderPhysicalCards}
                                      />
                                    ),
                                  )
                                  .otherwise(() => <ErrorView />),
                              )
                              .with({ name: "AccountActivation" }, () => (
                                <AccountActivationPage
                                  requireFirstTransfer={requireFirstTransfer}
                                  accentColor={accentColor}
                                  accountMembershipId={accountMembershipId}
                                  additionalInfo={additionalInfo}
                                  canViewAccountDetails={canViewAccountDetails}
                                  projectName={projectName}
                                  refetchAccountAreaQuery={refetchAccountAreaQuery}
                                />
                              ))
                              .otherwise(() => (
                                <NotFoundPage
                                  title={isEmpty(indexUrl) ? t("error.noAccount") : undefined}
                                  text={
                                    isEmpty(indexUrl)
                                      ? t("error.checkWithProvider", { projectName })
                                      : undefined
                                  }
                                />
                              ))}
                          </Suspense>
                        );
                      },
                    )
                    .otherwise(() => (
                      <LoadingView color={colors.current[500]} />
                    ))}
                </ErrorBoundary>
              </View>
            </ScrollView>

            {!desktop &&
              membership.match({
                Error: () => null,
                Ok: membership => (
                  <NavigationTabBar
                    identificationStatus={identificationStatus ?? "Uninitiated"}
                    accountMembershipId={accountMembershipId}
                    hasMultipleMemberships={hasMultipleMemberships}
                    activationTag={activationTag}
                    accountMembership={membership.accountMembership}
                    shouldDisplayIdVerification={
                      !(
                        projectInfo.B2BMembershipIDVerification === false &&
                        membership.canManageAccountMembership === false &&
                        membership.canInitiatePayments === false &&
                        membership.canManageBeneficiaries === false
                      )
                    }
                    additionalInfo={additionalInfo}
                    entries={menu}
                    firstName={firstName}
                    lastName={lastName}
                    refetchAccountAreaQuery={refetchAccountAreaQuery}
                    isScrolled={isScrolled}
                    onScrollToTop={scrollToTop}
                  />
                ),
              })}
          </View>
        </View>
      </LegacyAccentColorProvider>
    </WithPartnerAccentColor>
  );
};
