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
import { backgroundColor, breakpoints, colors, spacings } from "@swan-io/lake/src/constants/design";
import { isNotNullish, isNotNullishOrEmpty } from "@swan-io/lake/src/utils/nullish";
import { AdditionalInfo, SupportChat } from "@swan-io/shared-business/src/components/SupportChat";
import dayjs from "dayjs";
import { ReactNode, useCallback, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { match, P } from "ts-pattern";
import { ErrorView } from "../components/ErrorView";
import { LakeCopyTextLine } from "../components/LakeCopyTextLine";
import { Redirect } from "../components/Redirect";
import {
  SupportingDocumentsForm,
  SupportingDocumentsFormRef,
} from "../components/SupportingDocumentsForm";
import {
  AccountActivationPageDocument,
  AccountActivationPageQuery,
  IdentificationFragment,
  SupportingDocumentSettings,
  VerificationRequirement,
} from "../graphql/partner";
import { env } from "../utils/env";
import { formatNestedMessage, t } from "../utils/i18n";
import { getIdentificationLevelStatusInfo, isReadyToSign } from "../utils/identification";
import { projectConfiguration } from "../utils/projectId";
import { accountActivationRoutes, Router } from "../utils/routes";
import { NotFoundPage } from "./NotFoundPage";

const SupportingDocPendingRightPanel = ({
  large,
  accountMembershipId,
}: {
  large: boolean;
  accountMembershipId: string;
}) => (
  <StepScrollView
    onClose={() => {
      Router.push("AccountActivationRoot", { accountMembershipId });
    }}
    large={large}
  >
    <LakeHeading level={3} variant="h3">
      {t("accountActivation.documents.title")}
    </LakeHeading>

    <Space height={8} />
    <LakeText>{t("accountActivation.pendingDocuments.subtitle")}</LakeText>
    <Space height={32} />

    <Tile style={styles.rightPanelTiles}>
      <Box alignItems="center">
        <BorderedIcon name="lake-clock" color="current" />
        <Space height={32} />

        <LakeText align="center" variant="medium" color={colors.gray[900]}>
          {t("accountActivation.pendingDocuments.title")}
        </LakeText>
        <LakeText align="center" color={colors.gray[500]}>
          {t("accountActivation.pendingDocuments.text")}
        </LakeText>
      </Box>
    </Tile>
  </StepScrollView>
);

const SupportingDocFormTodoRightPanel = ({
  large,
  documentCollection,
  templateLanguage,
  refetchQueries,
  accountMembershipId,
}: {
  large: boolean;
  documentCollection: SupportingDocumentCollection | undefined;
  templateLanguage: "en" | "es" | "de" | "fr";
  refetchQueries: () => void;
  accountMembershipId: string;
}) => {
  const [isSendingDocumentCollection, setIsSendingDocumentCollection] = useState(false);
  const documentsFormRef = useRef<SupportingDocumentsFormRef>(null);

  return (
    <View style={styles.fill}>
      <StepScrollView
        onClose={() => {
          Router.push("AccountActivationRoot", { accountMembershipId });
        }}
        large={large}
      >
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
  );
};

const IdentificationTodoRightPanel = ({
  large,
  user,
  emailAddress,
  phoneNumber,
  birthDate,
  lastIdentification,
  handleProveIdentity,
  accountMembershipId,
}: {
  large: boolean;
  user: User | null | undefined;
  emailAddress: string | null | undefined;
  phoneNumber: string | null | undefined;
  birthDate: string | null | undefined;
  lastIdentification: Option<IdentificationFragment>;
  handleProveIdentity: () => void;
  accountMembershipId: string;
}) => {
  return (
    <StepScrollView
      onClose={() => {
        Router.push("AccountActivationRoot", { accountMembershipId });
      }}
      large={large}
    >
      <Box alignItems="center" justifyContent="center" style={styles.identityVerification}>
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
          {lastIdentification.map(isReadyToSign).getOr(false)
            ? t("accountActivation.identity.button.signVerification")
            : t("accountActivation.identity.button.verifyMyIdentity")}
        </LakeButton>
      </Box>
    </StepScrollView>
  );
};

const AdditionalInfoTodoRightPanel = ({
  large,
  additionalRequiredInfo,
  supportingDocumentSettings,
  emailAddress,
  accountMembershipId,
}: {
  large: boolean;
  additionalRequiredInfo: {
    verificationRequirements: VerificationRequirement[];
    waitingForInformationAt: string;
  } | null;
  supportingDocumentSettings: SupportingDocumentSettings | undefined | null;
  emailAddress: string | undefined;
  accountMembershipId: string;
}) => {
  const filteredRequirements = additionalRequiredInfo?.verificationRequirements.filter(
    requirement =>
      requirement.type === "LegalRepresentativeDetailsRequired" ||
      requirement.type === "OrganizationDetailsRequired" ||
      requirement.type === "Other" ||
      requirement.type === "TaxIdRequired" ||
      requirement.type === "UboDetailsRequired",
  );
  return (
    <StepScrollView
      onClose={() => {
        Router.push("AccountActivationRoot", { accountMembershipId });
      }}
      large={large}
    >
      <LakeHeading level={3} variant="h3">
        {t("accountActivation.additionalInformation")}
      </LakeHeading>

      <Space height={8} />
      <LakeText>{t("accountActivation.additionalInformation.subtitle")}</LakeText>
      <Space height={32} />

      {isNotNullish(filteredRequirements) &&
        filteredRequirements.map(info => (
          <Box key={info.id}>
            <Tile style={styles.rightPanelTiles} paddingVertical={16}>
              <LakeText>
                {match(info.type)
                  .with("FirstTransferRequired", () =>
                    t("accountActivation.additionalInformation.FirstTransferRequired"),
                  )
                  .with("LegalRepresentativeDetailsRequired", () =>
                    t("accountActivation.additionalInformation.LegalRepresentativeDetailsRequired"),
                  )
                  .with("OrganizationDetailsRequired", () =>
                    t("accountActivation.additionalInformation.OrganizationDetailsRequired"),
                  )
                  .with("SupportingDocumentsRequired", () =>
                    t("accountActivation.additionalInformation.SupportingDocumentsRequired"),
                  )
                  .with("TaxIdRequired", () =>
                    t("accountActivation.additionalInformation.TaxIdRequired"),
                  )
                  .with("UboDetailsRequired", () =>
                    t("accountActivation.additionalInformation.UboDetailsRequired"),
                  )
                  .with("Other", () => t("accountActivation.additionalInformation.Other"))
                  .exhaustive()}
              </LakeText>
            </Tile>
            <Space height={8} />
          </Box>
        ))}
      <Space height={32} />

      <Tile style={styles.rightPanelTiles}>
        <Box alignItems="center">
          <BorderedIcon name="lake-email" color="current" padding={8} />
          <Space height={32} />

          {match(supportingDocumentSettings?.collectMode)
            .with("API", "Partner", () => (
              <LakeText color={colors.gray[900]} variant="semibold" align="center">
                {t("accountActivation.additionalInformation.tileInfo")}
              </LakeText>
            ))
            .with("EndCustomer", "EndCustomerCcPartner", () =>
              isNotNullish(emailAddress) && isNotNullish(additionalRequiredInfo) ? (
                <LakeText align="center">
                  {formatNestedMessage(
                    "accountActivation.additionalInformation.tileInfoExtraInfo",
                    {
                      bold: text => (
                        <LakeText variant="semibold" color={colors.gray[900]}>
                          {text}
                        </LakeText>
                      ),
                      email: emailAddress,
                      date: dayjs(additionalRequiredInfo.waitingForInformationAt).format("LL"),
                    },
                  )}
                </LakeText>
              ) : (
                <LakeText align="center">
                  {t("accountActivation.additionalInformation.tileInfo")}
                </LakeText>
              ),
            )
            .otherwise(() => null)}
        </Box>
      </Tile>
    </StepScrollView>
  );
};

const FirstTransferIbanMissingRightPanel = ({
  large,
  projectName,
  accountMembershipId,
}: {
  large: boolean;
  projectName: string;
  accountMembershipId: string;
}) => {
  return (
    <StepScrollView
      onClose={() => {
        Router.push("AccountActivationRoot", { accountMembershipId });
      }}
      large={large}
    >
      <LakeHeading level={3} variant="h3">
        {t("accountActivation.addMoney.title")}
      </LakeHeading>

      <Space height={8} />
      <LakeText>{t("accountActivation.addMoney.description")}</LakeText>
      <Space height={32} />
      <Tile style={styles.rightPanelTiles}>
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
      </Tile>
    </StepScrollView>
  );
};

const FirstTransferViaIbanRightPanel = ({
  large,
  holderName,
  IBAN,
  BIC,
  accountMembershipId,
}: {
  large: boolean;
  holderName: string | undefined;
  IBAN: string | undefined;
  BIC: string | undefined;
  accountMembershipId: string;
}) => {
  return (
    <StepScrollView
      onClose={() => {
        Router.push("AccountActivationRoot", { accountMembershipId });
      }}
      large={large}
    >
      <LakeHeading level={3} variant="h3">
        {t("accountActivation.addMoney.title")}
      </LakeHeading>

      <Space height={8} />
      <LakeText>{t("accountActivation.addMoney.description")}</LakeText>
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
          <LakeCopyTextLine accented={true} text={BIC} label={t("accountDetails.iban.bicLabel")} />
        )}
      </ReadOnlyFieldList>
    </StepScrollView>
  );
};

type StepStatus = "todo" | "pending" | "done";

const getLastIdentificationStatus = (
  lastIdentification: Option<IdentificationFragment>,
): StepStatus => {
  return (
    match(lastIdentification.map(getIdentificationLevelStatusInfo))
      .returnType<StepStatus>()
      // this branch shouldn't occur but is required to typecheck
      .with(Option.P.Some({ status: P.union("Valid", "NotSupported") }), () => "done")
      .with(
        Option.P.None,
        Option.P.Some({
          status: P.union("NotStarted", "Started", "Canceled", "Expired"),
        }),
        () => "todo",
      )
      .with(Option.P.Some({ status: "Pending" }), () => "pending")
      .with(Option.P.Some({ status: "Invalid" }), () => "todo")
      .exhaustive()
  );
};

const getFirstTransferStatus = (
  verificationRequirements: VerificationRequirement[],
): StepStatus => {
  return verificationRequirements.some(info => info.type === "FirstTransferRequired")
    ? "todo"
    : "done";
};

type SupportingDocumentCollection = NonNullable<
  NonNullable<AccountActivationPageQuery["accountMembership"]>["account"]
>["holder"]["supportingDocumentCollections"]["edges"][number]["node"];

type User = NonNullable<AccountActivationPageQuery["accountMembership"]>["user"];

const getSupportingDocumentsStatus = (
  supportingDocumentCollection: Option<SupportingDocumentCollection>,
): StepStatus => {
  return supportingDocumentCollection.match({
    None: () => "todo" as StepStatus,
    Some: collection => {
      return match(collection.statusInfo.status)
        .returnType<StepStatus>()
        .with("WaitingForDocument", "Rejected", "Canceled", () => "todo")
        .with("PendingReview", () => "pending")
        .with("Approved", () => "done")
        .exhaustive();
    },
  });
};

const getAdditionalInfoStatus = (
  verificationRequirements: VerificationRequirement[],
): StepStatus => {
  const isTodo = verificationRequirements.some(info =>
    match(info.type)
      .with(
        "LegalRepresentativeDetailsRequired",
        "OrganizationDetailsRequired",
        "Other",
        "TaxIdRequired",
        "UboDetailsRequired",
        () => true,
      )
      .with("FirstTransferRequired", "SupportingDocumentsRequired", () => false)
      .exhaustive(() => false),
  );

  return isTodo ? "todo" : "done";
};

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
  rightPanelTiles: {
    boxShadow: "0",
    borderColor: colors.gray[100],
    borderWidth: 1,
  },
});

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

type StepTileProps = {
  variant: StepStatus;
  title: string;
  description: string;
  footer?: ReactNode;
  large: boolean;
  to: string;
  disabled?: boolean;
};

const StepTile = ({ variant, title, description, footer, large, to, disabled }: StepTileProps) => {
  return (
    <LeftPanelItemWrapper large={large}>
      <Link to={to} disabled={disabled}>
        {({ hovered, active }) => (
          <Tile hovered={hovered} paddingVertical={24} footer={footer} style={{ width: "100%" }}>
            <>
              <>
                {large && active && <View role="none" style={styles.stepTileActiveIndicator} />}
                <Box direction="row" justifyContent="spaceBetween">
                  <LakeHeading level={5} variant="h5">
                    {title}
                  </LakeHeading>

                  <Box>
                    {match(variant)
                      .with("todo", () => (
                        <Tag color="warning">{t("accountActivation.tag.todo")}</Tag>
                      ))
                      .with("pending", () => (
                        <Tag color="shakespear">{t("accountActivation.tag.pending")}</Tag>
                      ))
                      .with("done", () => (
                        <Tag color="positive">{t("accountActivation.tag.done")}</Tag>
                      ))
                      .otherwise(() => null)}

                    <Space width={20} />
                  </Box>
                </Box>
                <Space height={8} />

                <LakeText>{description}</LakeText>
              </>
              <Space width={24} />
            </>
          </Tile>
        )}
      </Link>
    </LeftPanelItemWrapper>
  );
};

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

type Props = {
  accentColor: string;
  accountMembershipId: string;
  additionalInfo: AdditionalInfo;
  projectName: string;
  refetchAccountAreaQuery: () => void;
  hasRequiredIdentificationLevel: boolean | undefined;
  lastIdentification: Option<IdentificationFragment>;
  largeViewport: boolean;
};

export const AccountActivationPage = ({
  accentColor,
  accountMembershipId,
  additionalInfo,
  projectName,
  refetchAccountAreaQuery,
  hasRequiredIdentificationLevel,
  lastIdentification,
  largeViewport,
}: Props) => {
  const [data, { reload }] = useQuery(AccountActivationPageDocument, { accountMembershipId });

  const route = Router.useRoute(accountActivationRoutes);

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
        const documentCollection = holder?.supportingDocumentCollections.edges[0]?.node;

        const IBAN = account?.IBAN;
        const BIC = account?.BIC;
        const hasIBAN = isNotNullish(IBAN);

        const additionalRequiredInfo = match(holder?.verificationStatusInfo)
          .with(
            { __typename: "AccountHolderWaitingForInformationVerificationStatusInfo" },
            ({ verificationRequirements, waitingForInformationAt }) => ({
              verificationRequirements,
              waitingForInformationAt,
            }),
          )
          .otherwise(() => null);

        const handleProveIdentity = () => {
          const params = new URLSearchParams();

          match(projectConfiguration.map(({ projectId }) => projectId))
            .with(Option.P.Some(P.select()), projectId => params.set("projectId", projectId))
            .otherwise(() => {});

          params.set("identificationLevel", "Auto");
          params.set("redirectTo", Router.AccountActivationRoot({ accountMembershipId }));

          window.location.assign(`/auth/login?${params.toString()}`);
        };

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
                      link: value => (
                        <Link to="https://support.swan.io/hc/requests/new" target="blank">
                          <LakeText color={colors.gray[900]}>{value}</LakeText>
                        </Link>
                      ),
                    })}
                  </LakeText>
                </Box>
              )}
            </ResponsiveContainer>
          );
        }

        const lastIdentificationStatus =
          hasRequiredIdentificationLevel === true
            ? "done"
            : getLastIdentificationStatus(lastIdentification);

        const firstTransferStatus = getFirstTransferStatus(
          additionalRequiredInfo?.verificationRequirements ?? [],
        );

        const supportingDocumentsStatus = getSupportingDocumentsStatus(
          isNotNullish(documentCollection) ? Option.Some(documentCollection) : Option.None(),
        );

        const additionalInfoStatus = getAdditionalInfoStatus(
          additionalRequiredInfo?.verificationRequirements ?? [],
        );

        const firstTodoOrPending:
          | { name: (typeof accountActivationRoutes)[number]; status: StepStatus }
          | undefined = [
          {
            name: "AccountActivationIdentification" as const,
            status: lastIdentificationStatus,
          },
          { name: "AccountActivationFirstTransfer" as const, status: firstTransferStatus },
          {
            name: "AccountActivationSupportingDocs" as const,
            status: supportingDocumentsStatus,
          },
          { name: "AccountActivationAdditionalInfos" as const, status: additionalInfoStatus },
        ].find(status => status.status === "pending" || status.status === "todo");

        return (
          <ResponsiveContainer breakpoint={breakpoints.large} style={styles.root}>
            {({ large }) => {
              const content = match({ route, lastIdentificationStatus })
                .with({ route: { name: "AccountActivationRoot" } }, () => null)
                .with({ route: { name: "AccountActivationAdditionalInfos" } }, () =>
                  match({ additionalInfoStatus, lastIdentificationStatus })
                    .with({ additionalInfoStatus: "pending" }, () => null)
                    .with({ additionalInfoStatus: "todo" }, () => (
                      <AdditionalInfoTodoRightPanel
                        additionalRequiredInfo={additionalRequiredInfo}
                        emailAddress={emailAddress}
                        large={large}
                        supportingDocumentSettings={supportingDocumentSettings}
                        accountMembershipId={accountMembershipId}
                      />
                    ))
                    .with(
                      {
                        additionalInfoStatus: "done",
                        lastIdentificationStatus: P.union("done", "pending"),
                      },
                      () => <Redirect to={Router.AccountActivationRoot({ accountMembershipId })} />,
                    )
                    .otherwise(() => null),
                )
                .with({ route: { name: "AccountActivationFirstTransfer" } }, () =>
                  match(firstTransferStatus)
                    .with("done", () => null)
                    .with("pending", () => null)
                    .with("todo", () =>
                      hasIBAN ? (
                        <FirstTransferViaIbanRightPanel
                          BIC={BIC}
                          IBAN={IBAN}
                          holderName={holderName}
                          large={large}
                          accountMembershipId={accountMembershipId}
                        />
                      ) : (
                        <FirstTransferIbanMissingRightPanel
                          large={large}
                          projectName={projectName}
                          accountMembershipId={accountMembershipId}
                        />
                      ),
                    )
                    .exhaustive(),
                )
                .with(
                  {
                    route: { name: "AccountActivationIdentification" },
                    lastIdentificationStatus: "todo",
                  },
                  () => (
                    <IdentificationTodoRightPanel
                      birthDate={birthDate}
                      emailAddress={emailAddress}
                      handleProveIdentity={handleProveIdentity}
                      large={large}
                      lastIdentification={lastIdentification}
                      phoneNumber={phoneNumber}
                      user={user}
                      accountMembershipId={accountMembershipId}
                    />
                  ),
                )
                .with({ route: { name: "AccountActivationSupportingDocs" } }, () =>
                  match(supportingDocumentsStatus)
                    .with("todo", () => (
                      <SupportingDocFormTodoRightPanel
                        accountMembershipId={accountMembershipId}
                        documentCollection={documentCollection}
                        large={large}
                        refetchQueries={refetchQueries}
                        templateLanguage={templateLanguage}
                      />
                    ))
                    .with("pending", () => (
                      <SupportingDocPendingRightPanel
                        accountMembershipId={accountMembershipId}
                        large={large}
                      />
                    ))
                    .with("done", () => null)
                    .exhaustive(),
                )
                .with(P.nullish, () => null)
                .otherwise(() => null);

              if (largeViewport && route?.name === "AccountActivationRoot") {
                if (isNotNullish(firstTodoOrPending?.name)) {
                  return <Redirect to={Router[firstTodoOrPending.name]({ accountMembershipId })} />;
                } else {
                  <NotFoundPage />;
                }
              }

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

                      {(holder?.verificationStatus === "Pending" ||
                        holder?.verificationStatus === "WaitingForInformation" ||
                        holder?.verificationStatus === "NotStarted") && (
                        <>
                          <Space height={24} />

                          {holder.verificationStatus === "WaitingForInformation" && (
                            <LakeAlert
                              tag={t("accountActivation.tag.waitingForInformation")}
                              title={t("accountActivation.alert.title")}
                              variant={"warning"}
                            >
                              <LakeText>{t("accountActivation.description")}</LakeText>
                            </LakeAlert>
                          )}
                          {holder.verificationStatus === "Pending" && (
                            <LakeAlert
                              title={t("accountActivation.alert.title")}
                              variant={"info"}
                              tag={t("accountActivation.tag.pendingVerification")}
                            >
                              <LakeText>{t("accountActivation.description.pending")}</LakeText>
                            </LakeAlert>
                          )}
                        </>
                      )}
                      <Space height={12} />
                    </LeftPanelItemWrapper>

                    <Space height={32} />
                    <Stack space={large ? 32 : 24}>
                      {
                        <StepTile
                          large={large}
                          title={t("accountActivation.identity.title")}
                          description={t("accountActivation.identity.description")}
                          variant={lastIdentificationStatus}
                          to={
                            lastIdentificationStatus === "todo"
                              ? Router.AccountActivationIdentification({ accountMembershipId })
                              : Router.AccountActivationRoot({ accountMembershipId })
                          }
                          disabled={lastIdentificationStatus === "done"}
                        />
                      }

                      {firstTransferStatus !== "done" && (
                        <StepTile
                          large={large}
                          title={t("accountActivation.addMoney.title")}
                          description={t("accountActivation.addMoney.description")}
                          variant={firstTransferStatus}
                          to={Router.AccountActivationFirstTransfer({ accountMembershipId })}
                        />
                      )}

                      {
                        <StepTile
                          large={large}
                          title={t("accountActivation.documents.title")}
                          description={t("accountActivation.documents.description")}
                          variant={supportingDocumentsStatus}
                          to={Router.AccountActivationSupportingDocs({ accountMembershipId })}
                          disabled={supportingDocumentsStatus === "done"}
                        />
                      }

                      {additionalInfoStatus !== "done" && (
                        <StepTile
                          large={large}
                          title={t("accountActivation.additionalInformation")}
                          description={t("accountActivation.additionalInformation.description")}
                          variant={additionalInfoStatus}
                          to={Router.AccountActivationAdditionalInfos({ accountMembershipId })}
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
                  {large ? (
                    <>
                      <Separator horizontal={true} />
                      {content}
                    </>
                  ) : (
                    <FullViewportLayer
                      visible={
                        (route?.name === "AccountActivationAdditionalInfos" && !large) ||
                        (route?.name === "AccountActivationFirstTransfer" &&
                          lastIdentificationStatus !== "done" &&
                          !large) ||
                        (route?.name === "AccountActivationIdentification" && !large) ||
                        (route?.name === "AccountActivationSupportingDocs" && !large)
                      }
                    >
                      {content}
                    </FullViewportLayer>
                  )}
                </Box>
              );
            }}
          </ResponsiveContainer>
        );
      },
    )
    .otherwise(() => <ErrorView />);
};
