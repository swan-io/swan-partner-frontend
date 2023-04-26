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
import { ReadOnlyFieldList } from "@swan-io/lake/src/components/ReadOnlyFieldList";
import { Separator } from "@swan-io/lake/src/components/Separator";
import { Space } from "@swan-io/lake/src/components/Space";
import { Stack } from "@swan-io/lake/src/components/Stack";
import { Tag } from "@swan-io/lake/src/components/Tag";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { backgroundColor, colors, radii, spacings } from "@swan-io/lake/src/constants/design";
import { useBoolean } from "@swan-io/lake/src/hooks/useBoolean";
import { useResponsive } from "@swan-io/lake/src/hooks/useResponsive";
import { isNotNullish, isNotNullishOrEmpty, isNullish } from "@swan-io/lake/src/utils/nullish";
import { AdditionalInfo, SupportChat } from "@swan-io/shared-business/src/components/SupportChat";
import dayjs from "dayjs";
import { ReactNode, useCallback, useMemo, useRef } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { P, match } from "ts-pattern";
import { ErrorView } from "../components/ErrorView";
import { LakeCopyTextLine } from "../components/LakeCopyTextLine";
import {
  SupportingDocumentsForm,
  SupportingDocumentsFormRef,
} from "../components/SupportingDocumentsForm";
import { AccountActivationPageDocument, AccountActivationPageQuery } from "../graphql/partner";
import { openPopup } from "../states/popup";
import { env } from "../utils/env";
import { t } from "../utils/i18n";
import { Router } from "../utils/routes";
import { useQueryWithErrorBoundary } from "../utils/urql";

const styles = StyleSheet.create({
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
});

type StepScrollViewProps = {
  children: ReactNode;
  onClose: () => void;
};

const StepScrollView = ({ children, onClose }: StepScrollViewProps) => {
  const { desktop } = useResponsive();

  return (
    <ScrollView
      style={styles.fill}
      contentContainerStyle={[
        styles.stepScrollViewContent,
        desktop && styles.stepScrollViewDesktopContent,
      ]}
    >
      {!desktop && (
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
};

const LeftPanelItemWrapper = ({ children, isSupport = false }: LeftPanelItemWrapperProps) => {
  const { desktop } = useResponsive();

  return (
    <View
      style={
        isSupport
          ? styles.supportButtonWrapper
          : [styles.leftPanelItemWrapper, desktop && styles.leftPanelItemWrapperDesktop]
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
};

const StepTile = ({ variant, title, description, onPress, footer }: StepTileProps) => {
  const { desktop } = useResponsive();

  return (
    <LeftPanelItemWrapper>
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
          {desktop && variant !== "inert" && (
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
  canViewAccountDetails: boolean;
  projectName: string;
  refetchAccountAreaQuery: () => void;
  requireFirstTransfer: boolean;
};

export const AccountActivationPage = ({
  accentColor,
  accountMembershipId,
  additionalInfo,
  canViewAccountDetails,
  projectName,
  refetchAccountAreaQuery,
  requireFirstTransfer,
}: Props) => {
  const documentsFormRef = useRef<SupportingDocumentsFormRef>(null);

  const [
    {
      data: { accountMembership, projectInfo },
    },
    reexecuteQuery,
  ] = useQueryWithErrorBoundary({
    query: AccountActivationPageDocument,
    variables: { accountMembershipId },
  });

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
  const identificationStatus = user?.identificationStatus;
  const firstName = user?.firstName;
  const lastName = user?.lastName;
  const phoneNumber = user?.mobilePhoneNumber;
  const birthDate = user?.birthDate;
  const fullName = [firstName, lastName].filter(isNotNullishOrEmpty).join(" ");

  const { supportingDocumentSettings } = projectInfo;
  const documentCollectMode = supportingDocumentSettings?.collectMode;
  const documentCollection = holder?.supportingDocumentCollections.edges[0]?.node;
  const documentCollectionStatus = documentCollection?.statusInfo.status;

  const IBAN = account?.IBAN;
  const BIC = account?.BIC;
  const hasIBAN = isNotNullish(IBAN);
  const hasTransactions = (account?.transactions?.totalCount ?? 0) >= 1;

  const initials = [firstName, lastName]
    .map(name => name?.[0])
    .filter(isNotNullishOrEmpty)
    .join("");

  const formattedBirthDate = useMemo(
    () => (isNotNullishOrEmpty(birthDate) ? dayjs(birthDate).format("LL") : undefined),
    [birthDate],
  );

  const step = useMemo<Step | undefined>(() => {
    return (
      match<
        {
          identificationStatus: typeof identificationStatus;
          account: NonNullable<AccountActivationPageQuery["accountMembership"]>["account"];
          requireFirstTransfer: boolean;
        },
        Step | undefined
      >({ identificationStatus, account, requireFirstTransfer })
        .with({ identificationStatus: P.nullish }, () => undefined)
        // handle legacy account that didn't go through the new process
        .with(
          { account: { paymentLevel: "Unlimited", paymentAccountType: "PaymentService" } },
          () => "Done",
        )
        .with(
          { identificationStatus: P.union("Uninitiated", "ReadyToSign") },
          () => "IdentityVerificationTodo",
        )
        .with({ identificationStatus: "Processing" }, () => "IdentityVerificationPending")
        .with(
          { identificationStatus: P.union("InsufficientDocumentQuality", "InvalidIdentity") },
          () => "IdentityVerificationToRedo",
        )
        .with({ identificationStatus: "ValidIdentity" }, (): Step | undefined => {
          if (isCompany) {
            return match<typeof documentCollectionStatus, Step | undefined>(
              documentCollectionStatus,
            )
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
            return canViewAccountDetails && hasIBAN
              ? "AddMoneyToYourNewAccountViaIbanTodo"
              : "AddMoneyToYourNewAccountIbanMissing";
          }
          if (!requireFirstTransfer) {
            return "StepNotDisplayed";
          }
          return "Done";
        })
        .exhaustive()
    );
  }, [
    identificationStatus,
    account,
    requireFirstTransfer,
    isCompany,
    hasTransactions,
    documentCollectionStatus,
    documentCollectMode,
    canViewAccountDetails,
    hasIBAN,
  ]);

  const [contentVisible, setContentVisible] = useBoolean(false);
  const { desktop } = useResponsive();
  const { desktop: large } = useResponsive(1520);

  const refetchQueries = useCallback(() => {
    refetchAccountAreaQuery();
    reexecuteQuery({ requestPolicy: "network-only" });
  }, [refetchAccountAreaQuery, reexecuteQuery]);

  const handleProveIdentity = useCallback(() => {
    const identificationLevel = accountMembership?.recommendedIdentificationLevel ?? "Expert";
    const params = new URLSearchParams();
    params.set("projectId", projectInfo.id);

    openPopup({
      url: match(identificationStatus)
        // means that the last started process is a QES one
        .with("ReadyToSign", () => {
          params.set("identificationLevel", "QES");
          params.set("redirectTo", Router.PopupCallback());
          return `/auth/login?${params.toString()}`;
        })
        .otherwise(() => {
          params.set("identificationLevel", identificationLevel);
          params.set("redirectTo", Router.PopupCallback());
          return `/auth/login?${params.toString()}`;
        }),
      onClose: refetchQueries,
    });
  }, [projectInfo, refetchQueries, identificationStatus, accountMembership]);

  if (isNullish(step)) {
    return <ErrorView />;
  }

  const content = match(step)
    .with(
      "IdentityVerificationPending",
      "SupportingDocumentsEmailPending",
      "SupportingDocumentsFormPending",
      () => null,
    )
    .with("IdentityVerificationTodo", "IdentityVerificationToRedo", () => (
      <StepScrollView onClose={setContentVisible.off}>
        <Box alignItems="center" justifyContent="center" style={styles.identityVerification}>
          <Avatar initials={initials} size={96} />
          <Space height={24} />

          <LakeHeading align="center" level={3} variant="h3">
            {fullName}
          </LakeHeading>

          <Space height={24} />

          <Box direction={large ? "row" : "column"} alignItems="center">
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

            {isNotNullish(formattedBirthDate) && (
              <LakeText align="center">{formattedBirthDate}</LakeText>
            )}
          </Box>

          <Space height={32} />

          <LakeButton mode="primary" color="partner" onPress={handleProveIdentity}>
            {match(identificationStatus)
              .with("ReadyToSign", () => t("accountActivation.identity.button.signVerification"))
              .otherwise(() => t("accountActivation.identity.button.verifyMyIdentity"))}
          </LakeButton>
        </Box>
      </StepScrollView>
    ))
    .with("SupportingDocumentsEmailTodo", () => (
      <StepScrollView onClose={setContentVisible.off}>
        <LakeHeading level={3} variant="h3">
          {t("accountActivation.documents.title")}
        </LakeHeading>

        <Space height={8} />
        <LakeText>{t("accountActivation.documents.subtitle")}</LakeText>
        <Space height={32} />

        <Box alignItems="center" justifyContent="center" style={styles.illustrationPanel}>
          <BorderedIcon name="lake-email" />
          <Space height={32} />

          <LakeHeading align="center" level={5} variant="h5">
            {isNotNullish(emailAddress)
              ? t("accountActivation.documents.email.title", { emailAddress })
              : t("accountActivation.documents.email.titleNoMail")}
          </LakeHeading>

          <Space height={12} />
          <LakeText align="center">{t("accountActivation.documents.email.text")}</LakeText>
        </Box>
      </StepScrollView>
    ))
    .with("SupportingDocumentsFormTodo", () => (
      <View style={styles.fill}>
        <StepScrollView onClose={setContentVisible.off}>
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
          <LakeButton color="partner" onPress={documentsFormRef.current?.submit}>
            {t("accountActivation.documents.button.submit")}
          </LakeButton>
        </Box>
      </View>
    ))
    .with("AddMoneyToYourNewAccountIbanMissing", () => (
      <StepScrollView onClose={setContentVisible.off}>
        <LakeHeading level={3} variant="h3">
          {t("accountActivation.addMoney.title")}
        </LakeHeading>

        <Space height={8} />
        <LakeText>{t("accountActivation.addMoney.subtitle")}</LakeText>
        <Space height={32} />

        <Box alignItems="center" justifyContent="center" style={styles.illustrationPanel}>
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
      <StepScrollView onClose={setContentVisible.off}>
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
      <StepScrollView onClose={setContentVisible.off}>
        <LakeHeading level={3} variant="h3">
          {t("accountActivation.done.title")}
        </LakeHeading>

        <Space height={8} />
        <LakeText>{t("accountActivation.done.subtitle")}</LakeText>
        <Space height={32} />

        <Box alignItems="center" justifyContent="center" style={styles.illustrationPanel}>
          <BorderedIcon name="lake-clock" />
          <Space height={32} />

          <LakeHeading align="center" level={5} variant="h5">
            {t("accountActivation.done.illustration.title")}
          </LakeHeading>

          <Space height={12} />
          <LakeText align="center">{t("accountActivation.done.illustration.text")}</LakeText>
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
          desktop && styles.listScrollViewDesktopContent,
        ]}
      >
        <LeftPanelItemWrapper>
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

        <Stack space={desktop ? 32 : 24}>
          <StepTile
            title={t("accountActivation.identity.title")}
            description={t("accountActivation.identity.description")}
            onPress={setContentVisible.on}
            variant={match<Step, StepTileVariant>(step)
              .with("IdentityVerificationTodo", "IdentityVerificationToRedo", () => "todo")
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

          {isCompany && STEP_INDEXES[step] >= STEP_INDEXES["SupportingDocumentsEmailTodo"] && (
            <StepTile
              title={t("accountActivation.documents.title")}
              description={t("accountActivation.documents.description")}
              onPress={setContentVisible.on}
              variant={match<Step, StepTileVariant>(step)
                .with("SupportingDocumentsEmailTodo", "SupportingDocumentsFormTodo", () => "todo")
                .with(
                  "SupportingDocumentsEmailPending",
                  "SupportingDocumentsFormPending",
                  () => "inert",
                )
                .otherwise(() => "done")}
              footer={match(step)
                .with("SupportingDocumentsEmailPending", "SupportingDocumentsFormPending", () => (
                  <LakeAlert
                    anchored={true}
                    variant="info"
                    title={t("accountActivation.pendingDocuments.title")}
                  >
                    {t("accountActivation.pendingDocuments.text")}
                  </LakeAlert>
                ))
                .otherwise(() => null)}
            />
          )}

          {!isCompany &&
            STEP_INDEXES[step] >= STEP_INDEXES["AddMoneyToYourNewAccountViaIbanTodo"] && (
              <StepTile
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

            <LeftPanelItemWrapper isSupport={true}>
              <SupportChat
                type="end-user"
                additionalInfo={additionalInfo}
                accentColor={accentColor}
              >
                {({ onPressShow }) => (
                  <LakeButton mode="tertiary" onPress={onPressShow} size="small">
                    <Icon name="chat-help-filled" size={20} color={colors.partner.primary} />
                    <Space width={8} />

                    <LakeText variant="smallMedium" color={colors.gray[900]} userSelect="none">
                      {t("needHelpButton.text")}
                    </LakeText>
                  </LakeButton>
                )}
              </SupportChat>
            </LeftPanelItemWrapper>
          </>
        )}
      </ScrollView>

      {isNotNullish(content) && (
        <>
          {desktop ? (
            <>
              <Separator horizontal={true} />

              {content}
            </>
          ) : (
            <FullViewportLayer visible={contentVisible}>{content}</FullViewportLayer>
          )}
        </>
      )}
    </Box>
  );
};
