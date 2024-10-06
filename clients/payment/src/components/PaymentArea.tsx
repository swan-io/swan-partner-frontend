import { AsyncData, Result } from "@swan-io/boxed";
import { useQuery } from "@swan-io/graphql-client";
import { AutoWidthImage } from "@swan-io/lake/src/components/AutoWidthImage";
import { Box } from "@swan-io/lake/src/components/Box";
import { Fill } from "@swan-io/lake/src/components/Fill";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeSelect } from "@swan-io/lake/src/components/LakeSelect";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LoadingView } from "@swan-io/lake/src/components/LoadingView";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { ScrollView } from "@swan-io/lake/src/components/ScrollView";
import { Space } from "@swan-io/lake/src/components/Space";
import { SwanLogo } from "@swan-io/lake/src/components/SwanLogo";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { backgroundColor, breakpoints, colors, spacings } from "@swan-io/lake/src/constants/design";
import { isNotNullish, isNullish } from "@swan-io/lake/src/utils/nullish";
import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { P, match } from "ts-pattern";
import { GetMerchantPaymentLinkDocument } from "../graphql/unauthenticated";
import { CardErrorPage } from "../pages/CardErrorPage";
import { ExpiredPage } from "../pages/ExpiredPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { PaymentPage } from "../pages/PaymentPage";
import { SuccessPage } from "../pages/SuccessPage";
import { languages, locale, setPreferredLanguage, t } from "../utils/i18n";
import { Router } from "../utils/routes";
import { ErrorView } from "./ErrorView";

const styles = StyleSheet.create({
  root: {
    ...commonStyles.fill,
  },
  base: {
    ...commonStyles.fill,
    backgroundColor: backgroundColor.default,
  },
  content: {
    marginHorizontal: "auto",
    maxWidth: 960,
    width: "100%",
    paddingHorizontal: spacings[24],
    paddingVertical: spacings[32],
    minHeight: "100%",
  },
  centered: {
    marginHorizontal: "auto",
  },
  swanLogo: {
    display: "inline-flex",
    height: 9,
    width: 45 * (9 / 10),
  },
});

type Props = {
  paymentLinkId: string;
};

export const PaymentArea = ({ paymentLinkId }: Props) => {
  const route = Router.useRoute(["PaymentForm", "PaymentSuccess", "PaymentExpired"]);
  const [mandateUrl, setMandateUrl] = useState<string>();

  const languageOptions = useMemo(() => {
    return languages.map(country => ({
      name: country.native,
      value: country.id,
    }));
  }, []);

  const [data] = useQuery(GetMerchantPaymentLinkDocument, { paymentLinkId });

  return (
    <ResponsiveContainer breakpoint={breakpoints.large} style={styles.root}>
      {({ large }) => (
        <View style={styles.base}>
          {match(data)
            .with(AsyncData.P.NotAsked, () => null)
            .with(AsyncData.P.Loading, () => <LoadingView color={colors.gray[400]} />)
            .with(
              AsyncData.P.Done(
                Result.P.Ok({
                  nonEEACountries: P.select("nonEEACountries"),
                  merchantPaymentLink: P.select("merchantPaymentLink", P.nonNullable),
                }),
              ),
              paymentLink => {
                const { merchantPaymentLink, nonEEACountries } = paymentLink;
                const { cancelRedirectUrl, merchantProfile, statusInfo } = merchantPaymentLink;
                const redirectUrl = merchantPaymentLink.redirectUrl ?? undefined;
                const { merchantLogoUrl, merchantName } = merchantProfile;
                const mandateUrlStatus = isNullish(mandateUrl) ? statusInfo.status : "Completed";

                return (
                  <ScrollView contentContainerStyle={styles.content}>
                    {route?.name === "PaymentForm" && (
                      <>
                        <Box direction="row" alignItems="center">
                          {isNotNullish(cancelRedirectUrl) && (
                            <LakeButton
                              ariaLabel={t("common.cancel")}
                              icon="dismiss-regular"
                              mode="tertiary"
                              onPress={() => {
                                window.location.replace(cancelRedirectUrl);
                              }}
                            >
                              {large ? t("common.cancel") : null}
                            </LakeButton>
                          )}

                          <Fill minWidth={16} />

                          <View>
                            <LakeSelect
                              value={locale.language}
                              items={languageOptions}
                              hideErrors={true}
                              mode="borderless"
                              onValueChange={locale => {
                                setPreferredLanguage(locale);
                              }}
                            />
                          </View>
                        </Box>

                        <Space height={24} />
                      </>
                    )}

                    {isNotNullish(merchantLogoUrl) ? (
                      <AutoWidthImage
                        alt={merchantName}
                        height={40}
                        maxWidth={180}
                        resizeMode="contain"
                        sourceUri={merchantLogoUrl}
                        style={styles.centered}
                      />
                    ) : (
                      <LakeHeading variant="h3" level={3} align="center">
                        {merchantName}
                      </LakeHeading>
                    )}

                    <Space height={24} />

                    {match({
                      route: route?.name,
                      params: route?.params,
                      mandateUrlStatus,
                      merchantPaymentLink,
                    })
                      .with({ route: "PaymentForm", mandateUrlStatus: "Active" }, () =>
                        match({
                          paymentMethods: merchantPaymentLink.paymentMethods,
                          params: route?.params,
                        })
                          .with({ params: { error: "true" } }, () => (
                            <CardErrorPage paymentLinkId={merchantPaymentLink.id} />
                          ))
                          .with(
                            { paymentMethods: [P.nonNullable, ...P.array()] },
                            ({ paymentMethods }) => (
                              <PaymentPage
                                merchantPaymentMethods={paymentMethods}
                                paymentLink={merchantPaymentLink}
                                setMandateUrl={setMandateUrl}
                                nonEeaCountries={nonEEACountries}
                                large={large}
                              />
                            ),
                          )
                          .otherwise(() => <ErrorView />),
                      )
                      .with(
                        {
                          merchantPaymentLink: {
                            statusInfo: { status: "Completed" },
                          },
                        },
                        () => (
                          <SuccessPage
                            mandateUrl={mandateUrl}
                            redirectUrl={redirectUrl}
                            large={large}
                          />
                        ),
                      )

                      .with(
                        {
                          route: "PaymentSuccess",
                          mandateUrlStatus: "Completed",
                        },
                        () => (
                          <SuccessPage
                            mandateUrl={mandateUrl}
                            redirectUrl={redirectUrl}
                            large={large}
                          />
                        ),
                      )
                      .with({ route: "PaymentSuccess" }, () => (
                        <SuccessPage redirectUrl={redirectUrl} large={large} />
                      ))
                      .with({ route: "PaymentExpired" }, { mandateUrlStatus: "Expired" }, () => (
                        <ExpiredPage paymentLink={merchantPaymentLink} />
                      ))
                      .otherwise(() => (
                        <NotFoundPage />
                      ))}

                    <Space height={32} />

                    <Box
                      role="contentinfo"
                      direction="row"
                      alignItems="baseline"
                      style={route?.name !== "PaymentForm" && styles.centered}
                    >
                      <LakeText variant="smallRegular">{t("paymentLink.poweredBySwan")}</LakeText>
                      <Space width={4} />
                      <SwanLogo color={colors.swan[500]} style={styles.swanLogo} />
                    </Box>
                  </ScrollView>
                );
              },
            )
            .with(AsyncData.P.Done(Result.P.Error(P.select())), error => (
              <ErrorView error={error} />
            ))
            .otherwise(() => (
              <ErrorView />
            ))}
        </View>
      )}
    </ResponsiveContainer>
  );
};
