import { AsyncData, Result } from "@swan-io/boxed";
import { LoadingView } from "@swan-io/lake/src/components/LoadingView";
import { backgroundColor, colors, spacings } from "@swan-io/lake/src/constants/design";
import { useUrqlQuery } from "@swan-io/lake/src/hooks/useUrqlQuery";
import { ScrollView, StyleSheet, View } from "react-native";
import { P, match } from "ts-pattern";

import { AutoWidthImage } from "@swan-io/lake/src/components/AutoWidthImage";
import { Box } from "@swan-io/lake/src/components/Box";
import { Fill } from "@swan-io/lake/src/components/Fill";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeSelect } from "@swan-io/lake/src/components/LakeSelect";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { Space } from "@swan-io/lake/src/components/Space";
import { SwanLogo } from "@swan-io/lake/src/components/SwanLogo";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { useResponsive } from "@swan-io/lake/src/hooks/useResponsive";
import { isNotNullish, isNullish } from "@swan-io/lake/src/utils/nullish";
import { useEffect, useMemo, useState } from "react";
import { GetMerchantPaymentLinkDocument } from "../graphql/unauthenticated";
import { ExpiredPage } from "../pages/ExpiredPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { PaymentPage } from "../pages/PaymentPage";
import { SuccessPage } from "../pages/SuccessPage";
import { languages, locale, setPreferredLanguage, t } from "../utils/i18n";
import { Router } from "../utils/routes";
import { ErrorView } from "./ErrorView";
import { Redirect } from "./Redirect";

const styles = StyleSheet.create({
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
  const { desktop } = useResponsive();
  const route = Router.useRoute(["PaymentForm", "PaymentSuccess"]);
  const [mandateUrl, setMandateUrl] = useState<string>();

  const languageOptions = useMemo(() => {
    return languages.map(country => ({
      name: country.native,
      value: country.id,
    }));
  }, []);

  const { data } = useUrqlQuery(
    {
      query: GetMerchantPaymentLinkDocument,
      variables: { paymentLinkId },
    },
    [],
  );

  useEffect(() => {
    if (isNotNullish(mandateUrl)) {
      Router.replace("PaymentSuccess", { paymentLinkId });
    }
  }, [mandateUrl, paymentLinkId]);

  return (
    <View style={styles.base}>
      {match(data)
        .with(AsyncData.P.NotAsked, () => null)
        .with(AsyncData.P.Loading, () => <LoadingView color={colors.gray[400]} />)
        .with(
          AsyncData.P.Done(Result.P.Ok({ merchantPaymentLink: P.select(P.not(P.nullish)) })),
          merchantPaymentLink => {
            const { cancelRedirectUrl, merchantProfile, statusInfo } = merchantPaymentLink;
            const { merchantLogoUrl, merchantName } = merchantProfile;
            const status = isNullish(mandateUrl) ? statusInfo.status : "Completed";

            return (
              <ScrollView contentContainerStyle={styles.content}>
                {route?.name === "PaymentForm" && (
                  <>
                    <Box direction="row" alignItems="center">
                      <LakeButton
                        ariaLabel={t("common.back")}
                        icon="arrow-left-filled"
                        mode="tertiary"
                        onPress={() => {
                          window.location.replace(cancelRedirectUrl);
                        }}
                      >
                        {desktop ? t("common.back") : null}
                      </LakeButton>

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

                {match({ route: route?.name, status })
                  .with({ route: "PaymentForm", status: "Active" }, () => (
                    <PaymentPage paymentLink={merchantPaymentLink} setMandateUrl={setMandateUrl} />
                  ))
                  .with({ route: "PaymentSuccess", status: "Completed" }, () => (
                    <SuccessPage paymentLink={merchantPaymentLink} mandateUrl={mandateUrl} />
                  ))
                  .with({ route: "PaymentSuccess" }, () => (
                    <Redirect to={Router.PaymentForm({ paymentLinkId })} />
                  ))
                  .with({ status: "Expired" }, () => (
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
        .otherwise(() => (
          <ErrorView />
        ))}
    </View>
  );
};
