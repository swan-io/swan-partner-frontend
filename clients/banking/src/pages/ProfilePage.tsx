import { Avatar } from "@swan-io/lake/src/components/Avatar";
import { Box } from "@swan-io/lake/src/components/Box";
import { Fill } from "@swan-io/lake/src/components/Fill";
import { LakeAlert } from "@swan-io/lake/src/components/LakeAlert";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeSelect } from "@swan-io/lake/src/components/LakeSelect";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { ReadOnlyFieldList } from "@swan-io/lake/src/components/ReadOnlyFieldList";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Separator } from "@swan-io/lake/src/components/Separator";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tag } from "@swan-io/lake/src/components/Tag";
import { Tile, TileRows } from "@swan-io/lake/src/components/Tile";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { backgroundColor, breakpoints, colors, spacings } from "@swan-io/lake/src/constants/design";
import { isNotNullish } from "@swan-io/lake/src/utils/nullish";
import { AdditionalInfo, SupportChat } from "@swan-io/shared-business/src/components/SupportChat";
import dayjs from "dayjs";
import { useCallback, useMemo } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { match } from "ts-pattern";
import { useLegacyAccentColor } from "../contexts/legacyAccentColor";
import { IdentificationLevel, ProfilePageDocument } from "../graphql/partner";
import { openPopup } from "../states/popup";
import { languages, locale, setPreferredLanguage, t } from "../utils/i18n";
import { Router } from "../utils/routes";
import { useQueryWithErrorBoundary } from "../utils/urql";

const styles = StyleSheet.create({
  container: {
    backgroundColor: backgroundColor.default,
    ...commonStyles.fill,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacings[24],
    paddingVertical: spacings[24],
  },
  contentLarge: {
    paddingHorizontal: spacings[40],
    paddingVertical: spacings[40],
  },
});

type Props = {
  isLegalRepresentative: boolean;
  additionalInfo: AdditionalInfo;
  userStatusIsProcessing: boolean;
  refetchAccountAreaQuery: () => void;
  shouldDisplayIdVerification: boolean;
  email: string;
  recommendedIdentificationLevel: IdentificationLevel;
};

export const ProfilePage = ({
  recommendedIdentificationLevel,
  additionalInfo,
  refetchAccountAreaQuery,
  shouldDisplayIdVerification,
  email,
}: Props) => {
  const [{ data }] = useQueryWithErrorBoundary({ query: ProfilePageDocument });
  const accentColor = useLegacyAccentColor();

  const { user } = data;
  const firstName = user?.firstName ?? "";
  const lastName = user?.lastName ?? "";
  const phoneNumber = user?.mobilePhoneNumber ?? undefined;
  const birthDate = user?.birthDate ?? undefined;

  const initials = [firstName, lastName]
    .filter(name => name !== "")
    .map(name => name[0])
    .join("");

  const handleProveIdentity = useCallback(() => {
    const params = new URLSearchParams();
    params.set("projectId", data.projectInfo.id);
    params.set("redirectTo", Router.PopupCallback());
    openPopup({
      url: match(user?.identificationStatus)
        // means that the last started process is a QES one
        .with("ReadyToSign", () => {
          params.set("identificationLevel", "QES");
          return `/auth/login?${params.toString()}`;
        })
        .otherwise(() => {
          params.set("identificationLevel", recommendedIdentificationLevel);
          return `/auth/login?${params.toString()}`;
        }),
      onClose: () => refetchAccountAreaQuery(),
    });
  }, [data.projectInfo, refetchAccountAreaQuery, user, recommendedIdentificationLevel]);

  const languageOptions = useMemo(
    () =>
      languages.map(country => ({
        name: country.native,
        value: country.id,
      })),
    [],
  );

  const tileFooter =
    shouldDisplayIdVerification &&
    match(user?.identificationStatus)
      .with("Uninitiated", () => (
        <LakeAlert
          anchored={true}
          variant="warning"
          title={t("profile.identityVerification.uninitiated.description")}
        />
      ))
      .with("ReadyToSign", () => (
        <LakeAlert
          anchored={true}
          variant="warning"
          title={t("profile.identityVerification.readyToSign.description")}
        />
      ))
      .with("Processing", () => (
        <LakeAlert
          anchored={true}
          variant="info"
          title={t("profile.identityVerification.processing")}
        >
          <LakeText variant="smallRegular" color={colors.gray[700]}>
            {t("profile.identityVerification.processing.description")}
          </LakeText>
        </LakeAlert>
      ))
      .with("InsufficientDocumentQuality", "InvalidIdentity", () => (
        <LakeAlert
          anchored={true}
          variant="warning"
          title={t("profile.identityVerification.failed")}
        >
          <LakeText variant="smallRegular" color={colors.gray[700]}>
            {t("profile.identityVerification.failed.description")}
          </LakeText>
        </LakeAlert>
      ))
      .otherwise(() => null);

  return (
    <ResponsiveContainer style={styles.container} breakpoint={breakpoints.large}>
      {({ small, large }) => (
        <ScrollView
          style={styles.container}
          contentContainerStyle={[styles.content, large && styles.contentLarge]}
        >
          {large ? (
            <>
              <LakeHeading level={2} variant="h3">
                {t("profile.personalInformation")}
              </LakeHeading>

              <Space height={24} />
            </>
          ) : null}

          {small ? (
            <View>
              <Tile footer={tileFooter}>
                <Box alignItems="center">
                  <Avatar initials={initials} size={100} />
                  <Space height={16} />

                  <LakeHeading level={3} variant="h3">
                    {firstName} {lastName}
                  </LakeHeading>

                  {shouldDisplayIdVerification &&
                    match(user?.identificationStatus)
                      .with(
                        "Uninitiated",
                        "InsufficientDocumentQuality",
                        "InvalidIdentity",
                        "ReadyToSign",
                        () => (
                          <>
                            <Space height={12} />
                            <Tag color="warning">{t("profile.actionRequired")}</Tag>
                          </>
                        ),
                      )
                      .with("ValidIdentity", () => (
                        <>
                          <Space height={12} />
                          <Tag color="positive">{t("profile.verified")}</Tag>
                        </>
                      ))
                      .otherwise(() => null)}
                </Box>

                {shouldDisplayIdVerification &&
                  match(user?.identificationStatus)
                    .with("Uninitiated", "InsufficientDocumentQuality", "InvalidIdentity", () => (
                      <>
                        <Space height={24} />

                        <LakeButton color="current" mode="primary" onPress={handleProveIdentity}>
                          {t("profile.verifyIdentity")}
                        </LakeButton>
                      </>
                    ))
                    .with("ReadyToSign", () => (
                      <>
                        <Space height={24} />

                        <LakeButton color="current" mode="primary" onPress={handleProveIdentity}>
                          {t("profile.finalizeVerification")}
                        </LakeButton>
                      </>
                    ))
                    .otherwise(() => null)}
              </Tile>

              <Space height={24} />

              <Tile>
                <ReadOnlyFieldList>
                  <LakeLabel
                    label={t("profile.email")}
                    render={() => <LakeText color={colors.gray[900]}>{email}</LakeText>}
                  />

                  {isNotNullish(phoneNumber) && (
                    <LakeLabel
                      label={t("profile.phoneNumber")}
                      render={() => <LakeText color={colors.gray[900]}>{phoneNumber}</LakeText>}
                    />
                  )}

                  {isNotNullish(birthDate) && (
                    <LakeLabel
                      label={t("profile.birthDate")}
                      render={() => (
                        <LakeText color={colors.gray[900]}>
                          {dayjs(birthDate).format("LL")}
                        </LakeText>
                      )}
                    />
                  )}
                </ReadOnlyFieldList>
              </Tile>
            </View>
          ) : (
            <Tile footer={tileFooter}>
              <Box direction="row" alignItems="center">
                <Avatar initials={initials} size={100} />
                <Space width={32} />

                <View>
                  <LakeHeading level={3} variant="h3">
                    {firstName} {lastName}
                  </LakeHeading>

                  <Space height={8} />

                  <Box direction="row" alignItems="stretch">
                    <LakeText variant="smallRegular">{email}</LakeText>

                    {isNotNullish(phoneNumber) && (
                      <>
                        <Separator horizontal={true} space={12} />
                        <LakeText variant="smallRegular">{phoneNumber}</LakeText>
                      </>
                    )}

                    {isNotNullish(birthDate) && (
                      <>
                        <Separator horizontal={true} space={12} />
                        <LakeText variant="smallRegular">{dayjs(birthDate).format("LL")}</LakeText>
                      </>
                    )}
                  </Box>

                  {shouldDisplayIdVerification &&
                    user?.identificationStatus === "ValidIdentity" && (
                      <>
                        <Space height={12} />
                        <Tag color="positive">{t("profile.verified")}</Tag>
                      </>
                    )}
                </View>

                {shouldDisplayIdVerification &&
                  match(user?.identificationStatus)
                    .with("Uninitiated", "InsufficientDocumentQuality", "InvalidIdentity", () => (
                      <>
                        <Fill minWidth={32} />

                        <LakeButton color="current" mode="primary" onPress={handleProveIdentity}>
                          {t("profile.verifyIdentity")}
                        </LakeButton>
                      </>
                    ))
                    .with("ReadyToSign", () => (
                      <>
                        <Fill minWidth={32} />

                        <LakeButton color="current" mode="primary" onPress={handleProveIdentity}>
                          {t("profile.finalizeVerification")}
                        </LakeButton>
                      </>
                    ))
                    .otherwise(() => null)}
              </Box>
            </Tile>
          )}

          <Space height={24} />

          <Tile>
            <LakeLabel
              label={t("profile.language")}
              render={id => (
                <LakeSelect
                  id={id}
                  value={locale.language}
                  items={languageOptions}
                  onValueChange={locale => {
                    setPreferredLanguage(locale);
                  }}
                />
              )}
            />
          </Tile>

          <Space height={48} />

          <LakeHeading level={2} variant="h3">
            {t("profile.support")}
          </LakeHeading>

          <Space height={16} />

          <TileRows breakpoint={700}>
            <Tile>
              <LakeHeading variant="h5" level={3}>
                {t("profile.chat")}
              </LakeHeading>

              <Space height={12} />
              <LakeText variant="smallRegular">{t("profile.chat.description")}</LakeText>
              <Fill minHeight={12} />

              <LakeButtonGroup paddingBottom={0}>
                <SupportChat
                  type="end-user"
                  additionalInfo={additionalInfo}
                  accentColor={accentColor}
                >
                  {({ onPressShow }) => (
                    <LakeButton
                      onPress={onPressShow}
                      mode="secondary"
                      color="gray"
                      icon="send-regular"
                      grow={small}
                    >
                      {t("profile.chat.sendMessage")}
                    </LakeButton>
                  )}
                </SupportChat>
              </LakeButtonGroup>
            </Tile>

            <Tile>
              <LakeHeading variant="h5" level={3}>
                {t("profile.faq")}
              </LakeHeading>

              <Space height={12} />
              <LakeText variant="smallRegular">{t("profile.faq.description")}</LakeText>
              <Fill minHeight={12} />

              <LakeButtonGroup paddingBottom={0}>
                <LakeButton
                  href="https://support.swan.io"
                  hrefAttrs={{ target: "_blank" }}
                  mode="secondary"
                  color="gray"
                  icon="open-regular"
                  grow={small}
                >
                  {t("profile.faq.goToSupport")}
                </LakeButton>
              </LakeButtonGroup>
            </Tile>
          </TileRows>

          <Space height={16} />
        </ScrollView>
      )}
    </ResponsiveContainer>
  );
};
