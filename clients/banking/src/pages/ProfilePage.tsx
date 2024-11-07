import { AsyncData, Option, Result } from "@swan-io/boxed";
import { useQuery } from "@swan-io/graphql-client";
import { Avatar } from "@swan-io/lake/src/components/Avatar";
import { Box } from "@swan-io/lake/src/components/Box";
import { Fill } from "@swan-io/lake/src/components/Fill";
import { LakeAlert } from "@swan-io/lake/src/components/LakeAlert";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeSelect } from "@swan-io/lake/src/components/LakeSelect";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LoadingView } from "@swan-io/lake/src/components/LoadingView";
import { ReadOnlyFieldList } from "@swan-io/lake/src/components/ReadOnlyFieldList";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { ScrollView } from "@swan-io/lake/src/components/ScrollView";
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
import { StyleSheet, View } from "react-native";
import { P, match } from "ts-pattern";
import { ErrorView } from "../components/ErrorView";
import {
  IdentificationFragment,
  IdentificationLevel,
  ProfilePageDocument,
} from "../graphql/partner";
import { languages, locale, setPreferredLanguage, t } from "../utils/i18n";
import { getIdentificationLevelStatusInfo, isReadyToSign } from "../utils/identification";
import { openPopup } from "../utils/popup";
import { projectConfiguration } from "../utils/projectId";
import { Router } from "../utils/routes";
import { NotFoundPage } from "./NotFoundPage";

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
  additionalInfo: AdditionalInfo;
  refetchAccountAreaQuery: () => void;
  shouldDisplayIdVerification: boolean;
  email: string;
  recommendedIdentificationLevel: IdentificationLevel;
  accentColor: string;
  hasRequiredIdentificationLevel: boolean | undefined;
  lastRelevantIdentification: Option<IdentificationFragment>;
};

export const ProfilePage = ({
  recommendedIdentificationLevel,
  additionalInfo,
  refetchAccountAreaQuery,
  shouldDisplayIdVerification,
  email,
  accentColor,
  hasRequiredIdentificationLevel,
  lastRelevantIdentification,
}: Props) => {
  const [data] = useQuery(ProfilePageDocument, {});

  const handleProveIdentity = useCallback(() => {
    const params = new URLSearchParams();

    match(projectConfiguration.map(({ projectId }) => projectId))
      .with(Option.P.Some(P.select()), projectId => params.set("projectId", projectId))
      .otherwise(() => {});

    params.set("redirectTo", Router.PopupCallback());
    params.set("identificationLevel", recommendedIdentificationLevel);

    openPopup(`/auth/login?${params.toString()}`).onResolve(() => {
      refetchAccountAreaQuery();
    });
  }, [refetchAccountAreaQuery, recommendedIdentificationLevel]);

  const languageOptions = useMemo(
    () =>
      languages.map(country => ({
        name: country.native,
        value: country.id,
      })),
    [],
  );

  const tileFooter =
    shouldDisplayIdVerification && hasRequiredIdentificationLevel === false
      ? match(lastRelevantIdentification.map(getIdentificationLevelStatusInfo))
          .with(
            Option.P.None,
            Option.P.Some({ status: P.union("NotStarted", "Started", "Canceled", "Expired") }),
            () =>
              lastRelevantIdentification.map(isReadyToSign).getOr(false) ? (
                <LakeAlert
                  anchored={true}
                  variant="warning"
                  title={t("profile.identityVerification.readyToSign.description")}
                />
              ) : (
                <LakeAlert
                  anchored={true}
                  variant="warning"
                  title={t("profile.identityVerification.uninitiated.description")}
                />
              ),
          )
          .with(Option.P.Some({ status: "Pending" }), () => (
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
          .with(Option.P.Some({ status: "Invalid" }), () => (
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
          .otherwise(() => null)
      : null;

  return match(data)
    .with(AsyncData.P.NotAsked, AsyncData.P.Loading, () => <LoadingView />)
    .with(AsyncData.P.Done(Result.P.Error(P.select())), error => <ErrorView error={error} />)
    .with(AsyncData.P.Done(Result.P.Ok({ user: P.select(P.nonNullable) })), user => {
      const phoneNumber = user.mobilePhoneNumber ?? undefined;
      const birthDate = user.birthDate ?? undefined;

      return (
        <ResponsiveContainer style={styles.container} breakpoint={breakpoints.large}>
          {({ small, large }) => (
            <ScrollView
              style={styles.container}
              role="main"
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
                      <Avatar user={user} size={100} />
                      <Space height={16} />

                      <LakeHeading level={3} variant="h3">
                        {user.fullName}
                      </LakeHeading>

                      {shouldDisplayIdVerification ? (
                        hasRequiredIdentificationLevel === true ? (
                          <>
                            <Space height={12} />
                            <Tag color="positive">{t("profile.verified")}</Tag>
                          </>
                        ) : (
                          match(lastRelevantIdentification.map(getIdentificationLevelStatusInfo))
                            .with(
                              Option.P.None,
                              Option.P.Some({
                                status: P.union(
                                  "NotStarted",
                                  "Started",
                                  "Canceled",
                                  "Expired",
                                  "Invalid",
                                ),
                              }),
                              () => (
                                <>
                                  <Space height={12} />
                                  <Tag color="warning">{t("profile.actionRequired")}</Tag>
                                </>
                              ),
                            )
                            .otherwise(() => null)
                        )
                      ) : null}
                    </Box>

                    {shouldDisplayIdVerification ? (
                      <>
                        {hasRequiredIdentificationLevel === false &&
                          match(lastRelevantIdentification.map(getIdentificationLevelStatusInfo))
                            .with(
                              Option.P.None,
                              Option.Some({
                                status: P.union(
                                  "NotStarted",
                                  "Started",
                                  "Invalid",
                                  "Canceled",
                                  "Expired",
                                ),
                              }),
                              () => (
                                <>
                                  <Space height={24} />

                                  <LakeButton
                                    color="current"
                                    mode="primary"
                                    onPress={handleProveIdentity}
                                  >
                                    {lastRelevantIdentification.map(isReadyToSign).getOr(false)
                                      ? t("profile.finalizeVerification")
                                      : t("profile.verifyIdentity")}
                                  </LakeButton>
                                </>
                              ),
                            )
                            .otherwise(() => null)}
                      </>
                    ) : null}
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
                    <Avatar user={user} size={100} />
                    <Space width={32} />

                    <View>
                      <LakeHeading level={3} variant="h3">
                        {user.fullName}
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

                            <LakeText variant="smallRegular">
                              {dayjs(birthDate).format("LL")}
                            </LakeText>
                          </>
                        )}
                      </Box>

                      {shouldDisplayIdVerification ? (
                        hasRequiredIdentificationLevel === true ? (
                          <>
                            <Space height={12} />
                            <Tag color="positive">{t("profile.verified")}</Tag>
                          </>
                        ) : null
                      ) : null}
                    </View>

                    {shouldDisplayIdVerification
                      ? hasRequiredIdentificationLevel === false
                        ? match(lastRelevantIdentification.map(getIdentificationLevelStatusInfo))
                            .with(
                              Option.P.None,
                              Option.Some({
                                status: P.union(
                                  "NotStarted",
                                  "Started",
                                  "Invalid",
                                  "Canceled",
                                  "Expired",
                                ),
                              }),
                              () => (
                                <>
                                  <Fill minWidth={32} />

                                  <LakeButton
                                    color="current"
                                    mode="primary"
                                    onPress={handleProveIdentity}
                                  >
                                    {lastRelevantIdentification.map(isReadyToSign).getOr(false)
                                      ? t("profile.finalizeVerification")
                                      : t("profile.verifyIdentity")}
                                  </LakeButton>
                                </>
                              ),
                            )
                            .otherwise(() => null)
                        : null
                      : null}
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
                      hrefAttrs={{ target: "blank" }}
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
    })
    .otherwise(() => <NotFoundPage />);
};
