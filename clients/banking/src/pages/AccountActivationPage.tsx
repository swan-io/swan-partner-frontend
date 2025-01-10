import { AsyncData, Option, Result } from "@swan-io/boxed";
import { useQuery } from "@swan-io/graphql-client";
import { Avatar } from "@swan-io/lake/src/components/Avatar";
import { BorderedIcon } from "@swan-io/lake/src/components/BorderedIcon";
import { Box } from "@swan-io/lake/src/components/Box";
import { Fill } from "@swan-io/lake/src/components/Fill";
import { FullViewportLayer } from "@swan-io/lake/src/components/FullViewportLayer";
import { Icon } from "@swan-io/lake/src/components/Icon";
import { LakeAlert } from "@swan-io/lake/src/components/LakeAlert";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { Link } from "@swan-io/lake/src/components/Link";
import { LoadingView } from "@swan-io/lake/src/components/LoadingView";
import { ReadOnlyFieldList } from "@swan-io/lake/src/components/ReadOnlyFieldList";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { ScrollView } from "@swan-io/lake/src/components/ScrollView";
import { Separator } from "@swan-io/lake/src/components/Separator";
import { Space } from "@swan-io/lake/src/components/Space";
import { Stack } from "@swan-io/lake/src/components/Stack";
import { Tag } from "@swan-io/lake/src/components/Tag";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import {
  backgroundColor,
  breakpoints,
  colors,
  radii,
  spacings,
} from "@swan-io/lake/src/constants/design";
import { useBoolean } from "@swan-io/lake/src/hooks/useBoolean";
import { isNotNullish, isNotNullishOrEmpty, isNullish } from "@swan-io/lake/src/utils/nullish";
import { AdditionalInfo, SupportChat } from "@swan-io/shared-business/src/components/SupportChat";
import dayjs from "dayjs";
import { ReactNode, useCallback, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { P, match } from "ts-pattern";
import { ErrorView } from "../components/ErrorView";
import { LakeCopyTextLine } from "../components/LakeCopyTextLine";
import {
  SupportingDocumentsForm,
  SupportingDocumentsFormRef,
} from "../components/SupportingDocumentsForm";
import { AccountActivationPageDocument, IdentificationFragment } from "../graphql/partner";
import { env } from "../utils/env";
import { formatNestedMessage, t } from "../utils/i18n";
import { getIdentificationLevelStatusInfo, isReadyToSign } from "../utils/identification";
import { openPopup } from "../utils/popup";
import { projectConfiguration } from "../utils/projectId";
import { Router } from "../utils/routes";

const styles = StyleSheet.create({
  root: {
    ...commonStyles.fill,
  },
  container: {
    ...commonStyles.fill,
  },
  fill: {
    flex: 1,
  },
  stepScrollViewContent: {
    backgroundColor: backgroundColor.accented,
    minHeight: "100%",
    padding: spacings[24],
  },
  stepScrollViewDesktopContent: {
    padding: spacings[40],
  },
  leftPanelItemWrapper: {
    paddingHorizontal: spacings[24],
  },
  leftPanelItemWrapperDesktop: {
    paddingHorizontal: spacings[40],
  },
  supportButtonWrapper: {
    alignItems: "flex-start",
    paddingHorizontal: spacings[16],
  },
  stepTileActiveIndicator: {
    backgroundColor: colors.current[500],
    bottom: 0,
    position: "absolute",
    right: 0,
    top: 0,
    width: 3,
  },
  stepDoneTile: {
    flexShrink: 1,
    flexGrow: 1,
    alignItems: "center",
    borderColor: colors.gray[100],
    borderRadius: radii[8],
    borderWidth: 1,
    flexDirection: "row",
    paddingHorizontal: spacings[32],
    paddingVertical: spacings[24],
  },
  stepDoneTileContents: {
    ...commonStyles.fill,
  },
  stepTile: {
    alignItems: "center",
    flexDirection: "row",
    flexGrow: 1,
    flexShrink: 1,
  },
  stepTileContents: {
    ...commonStyles.fill,
  },
  listScrollViewContent: {
    paddingTop: spacings[24],
    paddingBottom: spacings[24],
    minHeight: "100%",
  },
  listScrollViewDesktopContent: {
    paddingTop: spacings[40],
    paddingBottom: spacings[24],
  },
  phoneNumber: {
    whiteSpace: "nowrap",
  },
  submitSupportedDocs: {
    position: "absolute",
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: backgroundColor.accented,
    borderColor: colors.gray[100],
    borderTopWidth: 1,
    paddingVertical: spacings[24],
    paddingHorizontal: spacings[40],
  },
  identityVerification: {
    ...commonStyles.fill,
  },
  illustrationPanel: {
    ...commonStyles.fill,
  },
  errorContainer: {
    ...commonStyles.fill,
  },
});

type StepScrollViewProps = {
  children: ReactNode;
  onClose: () => void;
  large: boolean;
};

const StepScrollView = ({ children, onClose, large }: StepScrollViewProps) => {
  return (
    <ScrollView
      style={styles.fill}
      contentContainerStyle={[
        styles.stepScrollViewContent,
        large && styles.stepScrollViewDesktopContent,
      ]}
    >
      {!large && (
        <>
          <LakeButton
            ariaLabel={t("common.closeButton")}
            mode="tertiary"
            icon="dismiss-regular"
            onPress={onClose}
          />

          <Space height={8} />
        </>
      )}

      {children}
    </ScrollView>
  );
};

type LeftPanelItemWrapperProps = {
  children: ReactNode;
  isSupport?: boolean;
  large: boolean;
};

const LeftPanelItemWrapper = ({
  children,
  isSupport = false,
  large,
}: LeftPanelItemWrapperProps) => {
  return (
    <View
      style={
        isSupport
          ? styles.supportButtonWrapper
          : [styles.leftPanelItemWrapper, large && styles.leftPanelItemWrapperDesktop]
      }
    >
      {children}
    </View>
  );
};

type StepTileVariant = "inert" | "todo" | "done";

type StepTileProps = {
  variant: StepTileVariant;
  title: string;
  description: string;
  onPress: () => void;
  footer?: ReactNode;
  large: boolean;
};

const StepTile = ({ variant, title, description, onPress, footer, large }: StepTileProps) => {
  return (
    <LeftPanelItemWrapper large={large}>
      {variant === "done" ? (
        <View style={styles.stepDoneTile}>
          <View style={styles.stepDoneTileContents}>
            <LakeHeading level={5} variant="h5">
              {title}
            </LakeHeading>

            <Space height={8} />
            <LakeText>{description}</LakeText>
          </View>

          <Space width={24} />
          <Tag color="positive">{t("accountActivation.tag.done")}</Tag>
        </View>
      ) : (
        <>
          {large && variant !== "inert" && (
            <View role="none" style={styles.stepTileActiveIndicator} />
          )}

          <Pressable disabled={variant === "inert"} onPress={onPress}>
            {({ hovered }) => (
              <Tile hovered={hovered} paddingVertical={24} footer={footer}>
                <View style={styles.stepTile}>
                  <View style={styles.stepTileContents}>
                    <LakeHeading level={5} variant="h5">
                      {title}
                    </LakeHeading>

                    <Space height={8} />
                    <LakeText>{description}</LakeText>
                  </View>

                  <Space width={24} />

                  {variant === "todo" && (
                    <>
                      <Tag color="warning">{t("accountActivation.tag.todo")}</Tag>
                      <Space width={20} />
                    </>
                  )}

                  {variant !== "inert" && (
                    <Icon name="chevron-right-filled" size={20} color={colors.gray[500]} />
                  )}
                </View>
              </Tile>
            )}
          </Pressable>
        </>
      )}
    </LeftPanelItemWrapper>
  );
};

const STEP_INDEXES = {
  StepNotDisplayed: 0,

  IdentityVerificationTodo: 1,
  IdentityVerificationPending: 1,
  IdentityVerificationToRedo: 1,

  SupportingDocumentsEmailTodo: 2,
  SupportingDocumentsEmailPending: 2,
  SupportingDocumentsFormTodo: 2,
  SupportingDocumentsFormPending: 2,

  AddMoneyToYourNewAccountIbanMissing: 3,
  AddMoneyToYourNewAccountViaIbanTodo: 3,

  Done: 4,
} as const;

type Step = keyof typeof STEP_INDEXES;

type Props = {
  accentColor: string;
  accountMembershipId: string;
  additionalInfo: AdditionalInfo;
  projectName: string;
  refetchAccountAreaQuery: () => void;
  requireFirstTransfer: boolean;
  hasRequiredIdentificationLevel: boolean | undefined;
  lastRelevantIdentification: Option<IdentificationFragment>;
};

export const AccountActivationPage = ({
  accentColor,
  accountMembershipId,
  additionalInfo,
  projectName,
  refetchAccountAreaQuery,
  requireFirstTransfer,
  hasRequiredIdentificationLevel,
  lastRelevantIdentification,
}: Props) => {
  const documentsFormRef = useRef<SupportingDocumentsFormRef>(null);

  const [data, { reload }] = useQuery(AccountActivationPageDocument, { accountMembershipId });

  const [isSendingDocumentCollection, setIsSendingDocumentCollection] = useState(false);

  const [contentVisible, setContentVisible] = useBoolean(false);

  const refetchQueries = useCallback(() => {
    refetchAccountAreaQuery();
    reload();
  }, [refetchAccountAreaQuery, reload]);

  return match(data)
    .with(AsyncData.P.NotAsked, AsyncData.P.Loading, () => <LoadingView />)
    .with(
      AsyncData.P.Done(
        Result.P.Ok({
          accountMembership: P.select("accountMembership", P.nonNullable),
          projectInfo: P.select("projectInfo", P.nonNullable),
        }),
      ),
      ({ accountMembership, projectInfo }) => {
        const account = accountMembership?.account;
        const emailAddress = account?.legalRepresentativeMembership.email;

        const holder = account?.holder;
        const holderName = holder?.info.name;
        const isCompany = holder?.info.__typename === "AccountHolderCompanyInfo";
        const country = holder?.residencyAddress.country;
        const templateLanguage = match(country)
          .with("FR", () => "fr" as const)
          .with("DE", () => "de" as const)
          .with("ES", () => "es" as const)
          .otherwise(() => "en" as const);

        const user = accountMembership?.user;
        const phoneNumber = user?.mobilePhoneNumber;
        const birthDate = user?.birthDate;

        const { supportingDocumentSettings } = projectInfo;
        const documentCollectMode = supportingDocumentSettings?.collectMode;
        const documentCollection = holder?.supportingDocumentCollections.edges[0]?.node;
        const documentCollectionStatus = documentCollection?.statusInfo.status;

        const IBAN = account?.IBAN;
        const BIC = account?.BIC;
        const hasIBAN = isNotNullish(IBAN);
        const hasTransactions = (account?.transactions?.totalCount ?? 0) >= 1;

        const step = match({
          hasRequiredIdentificationLevel,
          account,
          requireFirstTransfer,
        })
          .returnType<Step | undefined>()
          // Handle legacy account that didn't go through the new process
          .with(
            { account: { pantLevel: "Unlimited", paymentAccountType: "PaymentService" } },
            () => "Done",
          )
          // Case where the membership doesn't yet have a user, should occur
          .with({ hasRequiredIdentificationLevel: undefined }, () => undefined)
          .with(
            {
              hasRequiredIdentificationLevel: false,
            },
            () =>
              match(lastRelevantIdentification.map(getIdentificationLevelStatusInfo))
                .returnType<Step | undefined>()
                // this branch shouldn't occur but is required to typecheck
                .with(Option.P.Some({ status: P.union("Valid", "NotSupported") }), () => undefined)
                .with(
                  Option.P.None,
                  Option.P.Some({
                    status: P.union("NotStarted", "Started", "Canceled", "Expired"),
                  }),
                  () => "IdentityVerificationTodo",
                )
                .with(Option.P.Some({ status: "Pending" }), () => "IdentityVerificationPending")
                .with(Option.P.Some({ status: "Invalid" }), () => "IdentityVerificationToRedo")
                .exhaustive(),
          )
          .with({ hasRequiredIdentificationLevel: true }, ({ account }): Step | undefined => {
            if (isCompany) {
              return match(documentCollectionStatus)
                .returnType<Step | undefined>()
                .with(P.nullish, () => undefined)
                .with("WaitingForDocument", "Canceled", "Rejected", () =>
                  documentCollectMode === "EndCustomer"
                    ? "SupportingDocumentsEmailTodo"
                    : "SupportingDocumentsFormTodo",
                )
                .with("PendingReview", () =>
                  documentCollectMode === "EndCustomer"
                    ? "SupportingDocumentsEmailPending"
                    : "SupportingDocumentsFormPending",
                )
                .with("Approved", () => "Done")
                .exhaustive();
            }

            if (requireFirstTransfer && !hasTransactions) {
              return hasIBAN
                ? "AddMoneyToYourNewAccountViaIbanTodo"
                : "AddMoneyToYourNewAccountIbanMissing";
            }
            if (!requireFirstTransfer) {
              return match([account?.holder.verificationStatus, documentCollectMode])
                .with([P.union("NotStarted", "Pending"), P._], () => "Done" as const)
                .with([P.union("Pending", "WaitingForInformation"), "API"], () => "Done" as const)
                .otherwise(() => "StepNotDisplayed" as const);
            }
            return "Done";
          })
          .exhaustive();

        const handleProveIdentity = () => {
          const params = new URLSearchParams();

          match(projectConfiguration.map(({ projectId }) => projectId))
            .with(Option.P.Some(P.select()), projectId => params.set("projectId", projectId))
            .otherwise(() => {});

          params.set("identificationLevel", "Auto");
          params.set("redirectTo", Router.PopupCallback());

          openPopup(`/auth/login?${params.toString()}`).onResolve(() => {
            refetchQueries();
          });
        };

        if (isNullish(step)) {
          return <ErrorView />;
        }

        if (holder?.verificationStatus === "Refused") {
          return (
            <ResponsiveContainer breakpoint={breakpoints.large} style={styles.root}>
              {({ large }) => (
                <Box alignItems="center" justifyContent="center" style={styles.errorContainer}>
                  <BorderedIcon name="lake-denied" size={100} padding={16} color="negative" />
                  <Space height={24} />

                  <LakeHeading variant="h1" level={1} align="center" color={colors.gray[900]}>
                    {t("accountActivation.refused.title")}
                  </LakeHeading>

                  <Space height={large ? 12 : 4} />

                  <LakeText align="center">
                    {formatNestedMessage("accountActivation.refused.description", {
                      name: holder.info.name,
                      email: (
                        <Link to="mailto:support@swan.io">
                          <LakeText color={colors.gray[900]}>support@swan.io</LakeText>
                        </Link>
                      ),
                    })}
                  </LakeText>
                </Box>
              )}
            </ResponsiveContainer>
          );
        }

        return (
          <ResponsiveContainer breakpoint={breakpoints.large} style={styles.root}>
            {({ large }) => {
              const content = match(step)
                .with(
                  "IdentityVerificationPending",
                  "SupportingDocumentsEmailPending",
                  "SupportingDocumentsFormPending",
                  () => null,
                )
                .with("IdentityVerificationTodo", "IdentityVerificationToRedo", () => (
                  <StepScrollView onClose={setContentVisible.off} large={large}>
                    <Box
                      alignItems="center"
                      justifyContent="center"
                      style={styles.identityVerification}
                    >
                      <Avatar user={user} size={96} />
                      <Space height={24} />

                      <LakeHeading align="center" level={3} variant="h3">
                        {user?.fullName}
                      </LakeHeading>

                      <Space height={24} />

                      <Box direction="column" alignItems="center">
                        {isNotNullishOrEmpty(emailAddress) && (
                          <>
                            <LakeText align="center">{emailAddress}</LakeText>

                            {large && <Separator horizontal={true} space={12} />}
                          </>
                        )}

                        {isNotNullishOrEmpty(phoneNumber) && (
                          <>
                            <LakeText align="center" style={styles.phoneNumber}>
                              {phoneNumber}
                            </LakeText>

                            {large && <Separator horizontal={true} space={12} />}
                          </>
                        )}

                        {isNotNullish(birthDate) && (
                          <LakeText align="center">{dayjs(birthDate).format("LL")}</LakeText>
                        )}
                      </Box>

                      <Space height={32} />

                      <LakeButton mode="primary" color="partner" onPress={handleProveIdentity}>
                        {lastRelevantIdentification.map(isReadyToSign).getOr(false)
                          ? t("accountActivation.identity.button.signVerification")
                          : t("accountActivation.identity.button.verifyMyIdentity")}
                      </LakeButton>
                    </Box>
                  </StepScrollView>
                ))
                .with("SupportingDocumentsEmailTodo", () => (
                  <StepScrollView onClose={setContentVisible.off} large={large}>
                    <LakeHeading level={3} variant="h3">
                      {t("accountActivation.documents.title")}
                    </LakeHeading>

                    <Space height={8} />
                    <LakeText>{t("accountActivation.documents.subtitle")}</LakeText>
                    <Space height={32} />

                    <Box
                      alignItems="center"
                      justifyContent="center"
                      style={styles.illustrationPanel}
                    >
                      <BorderedIcon name="lake-email" />
                      <Space height={32} />

                      <LakeHeading align="center" level={5} variant="h5">
                        {isNotNullish(emailAddress)
                          ? t("accountActivation.documents.email.title", { emailAddress })
                          : t("accountActivation.documents.email.titleNoMail")}
                      </LakeHeading>

                      <Space height={12} />

                      <LakeText align="center">
                        {t("accountActivation.documents.email.text")}
                      </LakeText>
                    </Box>
                  </StepScrollView>
                ))
                .with("SupportingDocumentsFormTodo", () => (
                  <View style={styles.fill}>
                    <StepScrollView onClose={setContentVisible.off} large={large}>
                      <LakeHeading level={3} variant="h3">
                        {t("accountActivation.documents.title")}
                      </LakeHeading>

                      <Space height={8} />
                      <LakeText>{t("accountActivation.documents.subtitle")}</LakeText>
                      <Space height={32} />

                      {isNotNullish(documentCollection) && (
                        <SupportingDocumentsForm
                          ref={documentsFormRef}
                          templateLanguage={templateLanguage}
                          collection={documentCollection}
                          refetchCollection={refetchQueries}
                        />
                      )}
                    </StepScrollView>

                    <Space height={96} />

                    <Box alignItems="start" style={styles.submitSupportedDocs}>
                      <LakeButton
                        color="partner"
                        loading={isSendingDocumentCollection}
                        onPress={() => {
                          const ref = documentsFormRef.current;
                          if (ref == null) {
                            return;
                          }
                          setIsSendingDocumentCollection(true);
                          ref.submit().tap(() => setIsSendingDocumentCollection(false));
                        }}
                      >
                        {t("accountActivation.documents.button.submit")}
                      </LakeButton>
                    </Box>
                  </View>
                ))
                .with("AddMoneyToYourNewAccountIbanMissing", () => (
                  <StepScrollView onClose={setContentVisible.off} large={large}>
                    <LakeHeading level={3} variant="h3">
                      {t("accountActivation.addMoney.title")}
                    </LakeHeading>

                    <Space height={8} />
                    <LakeText>{t("accountActivation.addMoney.subtitle")}</LakeText>
                    <Space height={32} />

                    <Box
                      alignItems="center"
                      justifyContent="center"
                      style={styles.illustrationPanel}
                    >
                      <BorderedIcon name="lake-email" />
                      <Space height={32} />

                      <LakeHeading align="center" level={5} variant="h5">
                        {t("accountActivation.addMoney.illustration.title")}
                      </LakeHeading>

                      <Space height={12} />

                      <LakeText align="center">
                        {t("accountActivation.addMoney.illustration.text", { projectName })}
                      </LakeText>
                    </Box>
                  </StepScrollView>
                ))
                .with("AddMoneyToYourNewAccountViaIbanTodo", () => (
                  <StepScrollView onClose={setContentVisible.off} large={large}>
                    <LakeHeading level={3} variant="h3">
                      {t("accountActivation.addMoney.title")}
                    </LakeHeading>

                    <Space height={8} />
                    <LakeText>{t("accountActivation.addMoney.subtitle")}</LakeText>
                    <Space height={40} />

                    <ReadOnlyFieldList>
                      {isNotNullishOrEmpty(holderName) && (
                        <LakeCopyTextLine
                          accented={true}
                          text={holderName}
                          label={t("accountDetails.iban.holderLabel")}
                        />
                      )}

                      {isNotNullishOrEmpty(IBAN) && (
                        <LakeCopyTextLine
                          accented={true}
                          text={IBAN}
                          label={t("accountDetails.iban.ibanLabel")}
                        />
                      )}

                      {isNotNullishOrEmpty(BIC) && (
                        <LakeCopyTextLine
                          accented={true}
                          text={BIC}
                          label={t("accountDetails.iban.bicLabel")}
                        />
                      )}
                    </ReadOnlyFieldList>
                  </StepScrollView>
                ))
                .with("Done", () => (
                  <StepScrollView onClose={setContentVisible.off} large={large}>
                    <LakeHeading level={3} variant="h3">
                      {t("accountActivation.done.title")}
                    </LakeHeading>

                    <Space height={8} />
                    <LakeText>{t("accountActivation.done.subtitle")}</LakeText>
                    <Space height={32} />

                    <Box
                      alignItems="center"
                      justifyContent="center"
                      style={styles.illustrationPanel}
                    >
                      <BorderedIcon name="lake-clock" />
                      <Space height={32} />

                      <LakeHeading align="center" level={5} variant="h5">
                        {t("accountActivation.done.illustration.title")}
                      </LakeHeading>

                      <Space height={12} />

                      <LakeText align="center">
                        {t("accountActivation.done.illustration.text")}
                      </LakeText>
                    </Box>
                  </StepScrollView>
                ))
                .with("StepNotDisplayed", () => null)
                .exhaustive();

              return (
                <Box
                  role="main"
                  direction="row"
                  style={[
                    styles.container,
                    // TODO: Remove this when the background layout is removed
                    { backgroundColor: backgroundColor.default },
                  ]}
                >
                  <ScrollView
                    style={styles.fill}
                    contentContainerStyle={[
                      styles.listScrollViewContent,
                      large && styles.listScrollViewDesktopContent,
                    ]}
                  >
                    <LeftPanelItemWrapper large={large}>
                      <LakeHeading level={3} variant="h3">
                        {t("accountActivation.title")}
                      </LakeHeading>

                      <Space height={8} />

                      <Box direction="row" alignItems="center">
                        <Icon
                          name={isCompany ? "building-multiple-regular" : "person-regular"}
                          size={20}
                          color={colors.partner.primary}
                        />

                        {isNotNullishOrEmpty(holderName) && (
                          <>
                            <Space width={12} />

                            <LakeHeading level={5} variant="h5">
                              {holderName}
                            </LakeHeading>
                          </>
                        )}
                      </Box>

                      <Space height={12} />
                      <LakeText>{t("accountActivation.description")}</LakeText>
                    </LeftPanelItemWrapper>

                    <Space height={32} />

                    <Stack space={large ? 32 : 24}>
                      <StepTile
                        large={large}
                        title={t("accountActivation.identity.title")}
                        description={t("accountActivation.identity.description")}
                        onPress={setContentVisible.on}
                        variant={match(step)
                          .returnType<StepTileVariant>()
                          .with(
                            "IdentityVerificationTodo",
                            "IdentityVerificationToRedo",
                            () => "todo",
                          )
                          .with("IdentityVerificationPending", () => "inert")
                          .otherwise(() => "done")}
                        footer={match(step)
                          .with("IdentityVerificationPending", () => (
                            <LakeAlert
                              anchored={true}
                              variant="info"
                              title={t("accountActivation.identity.alert.pending.title")}
                            >
                              {t("accountActivation.identity.alert.pending.text")}
                            </LakeAlert>
                          ))
                          .with("IdentityVerificationToRedo", () => (
                            <LakeAlert
                              anchored={true}
                              variant="warning"
                              title={t("accountActivation.identity.alert.error.title")}
                            >
                              {t("accountActivation.identity.alert.error.text")}
                            </LakeAlert>
                          ))
                          .otherwise(() => null)}
                      />

                      {isCompany &&
                        STEP_INDEXES[step] >= STEP_INDEXES["SupportingDocumentsEmailTodo"] && (
                          <StepTile
                            large={large}
                            title={t("accountActivation.documents.title")}
                            description={t("accountActivation.documents.description")}
                            onPress={setContentVisible.on}
                            variant={match(step)
                              .returnType<StepTileVariant>()
                              .with(
                                "SupportingDocumentsEmailTodo",
                                "SupportingDocumentsFormTodo",
                                () => "todo",
                              )
                              .with(
                                "SupportingDocumentsEmailPending",
                                "SupportingDocumentsFormPending",
                                () => "inert",
                              )
                              .otherwise(() => "done")}
                            footer={match(step)
                              .with(
                                "SupportingDocumentsEmailPending",
                                "SupportingDocumentsFormPending",
                                () => (
                                  <LakeAlert
                                    anchored={true}
                                    variant="info"
                                    title={t("accountActivation.pendingDocuments.title")}
                                  >
                                    {t("accountActivation.pendingDocuments.text")}
                                  </LakeAlert>
                                ),
                              )
                              .otherwise(() => null)}
                          />
                        )}

                      {!isCompany &&
                        requireFirstTransfer &&
                        STEP_INDEXES[step] >=
                          STEP_INDEXES["AddMoneyToYourNewAccountViaIbanTodo"] && (
                          <StepTile
                            large={large}
                            title={t("accountActivation.addMoney.title")}
                            description={t("accountActivation.addMoney.description")}
                            onPress={setContentVisible.on}
                            variant={step === "Done" ? "done" : "todo"}
                          />
                        )}
                    </Stack>

                    {env.APP_TYPE === "LIVE" && (
                      <>
                        <Fill minHeight={32} />

                        <LeftPanelItemWrapper isSupport={true} large={large}>
                          <SupportChat
                            type="end-user"
                            additionalInfo={additionalInfo}
                            accentColor={accentColor}
                          >
                            {({ onPressShow }) => (
                              <LakeButton mode="tertiary" onPress={onPressShow} size="small">
                                <Icon
                                  name="chat-help-filled"
                                  size={20}
                                  color={colors.partner.primary}
                                />

                                <Space width={8} />

                                <LakeText
                                  variant="smallMedium"
                                  color={colors.gray[900]}
                                  userSelect="none"
                                >
                                  {t("needHelpButton.text")}
                                </LakeText>
                              </LakeButton>
                            )}
                          </SupportChat>
                        </LeftPanelItemWrapper>
                      </>
                    )}
                  </ScrollView>

                  {isNotNullish(content) &&
                    (large ? (
                      <>
                        <Separator horizontal={true} />

                        {content}
                      </>
                    ) : (
                      <FullViewportLayer visible={contentVisible}>{content}</FullViewportLayer>
                    ))}
                </Box>
              );
            }}
          </ResponsiveContainer>
        );
      },
    )
    .otherwise(() => <ErrorView />);
};
