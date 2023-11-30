import { BorderedIcon } from "@swan-io/lake/src/components/BorderedIcon";
import { Box } from "@swan-io/lake/src/components/Box";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { Space } from "@swan-io/lake/src/components/Space";
import { SwanLogo } from "@swan-io/lake/src/components/SwanLogo";
import { colors, spacings } from "@swan-io/lake/src/constants/design";
import { useResponsive } from "@swan-io/lake/src/hooks/useResponsive";
import { isNotNullish } from "@swan-io/lake/src/utils/nullish";
import { StyleSheet } from "react-native";
import { GetMerchantPaymentLinkQuery } from "../graphql/unauthenticated";
import { t } from "../utils/i18n";
import { IMAGE_STYLE } from "./PaymentPage";

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingVertical: spacings[40],
  },
  containerItems: {
    width: "100%",
  },
  containerButtonsDesktop: {
    width: "auto",
  },
  containerButtons: { width: "100%", paddingHorizontal: spacings[24] },
  swanLogo: {
    display: "inline-flex",
    height: 9,
    width: 45 * (9 / 10),
  },
  title: {
    paddingBottom: spacings[4],
  },
  subtitle: {
    lineHeight: 24,
  },
});

type Props = {
  mandateUrl?: string;
  paymentLink: NonNullable<GetMerchantPaymentLinkQuery["merchantPaymentLink"]>;
};

export const SuccessPage = ({ paymentLink, mandateUrl }: Props) => {
  const { desktop } = useResponsive();

  return (
    <Box
      direction="column"
      alignItems="center"
      justifyContent="spaceBetween"
      style={styles.container}
    >
      {isNotNullish(paymentLink.merchantProfile.merchantLogoUrl) ? (
        <img src={paymentLink.merchantProfile.merchantLogoUrl} style={IMAGE_STYLE} />
      ) : (
        <LakeHeading variant="h3" level={3} align="center">
          {paymentLink.merchantProfile.merchantName}
        </LakeHeading>
      )}

      <Box direction="column" alignItems="center" style={styles.containerItems}>
        <BorderedIcon name={"lake-check"} color="positive" size={70} padding={16} />
        <Space height={24} />

        <LakeText variant="semibold" color={colors.gray[900]} style={styles.title}>
          {t("paymentLink.success.title")}
        </LakeText>

        <LakeText align="center" color={colors.gray[500]} style={styles.subtitle}>
          {t("paymentLink.success.subtitle")}
        </LakeText>

        <Space height={32} />

        <Box
          direction={desktop ? "row" : "column"}
          style={desktop ? styles.containerButtonsDesktop : styles.containerButtons}
        >
          <LakeButton
            ariaLabel={t("paymentLink.button.returnToWebsite")}
            mode="secondary"
            grow={true}
            href={paymentLink.redirectUrl}
          >
            {t("paymentLink.button.returnToWebsite")}
          </LakeButton>

          <Space height={12} width={16} />

          {isNotNullish(mandateUrl) && (
            <LakeButton
              color="current"
              ariaLabel={t("paymentLink.button.downloadMandate")}
              icon="arrow-down-regular"
              mode="primary"
              grow={true}
              href={mandateUrl}
            >
              {t("paymentLink.button.downloadMandate")}
            </LakeButton>
          )}
        </Box>
      </Box>

      <Box direction="row" alignItems="baseline">
        <LakeText>{t("paymentLink.poweredBySwan")}</LakeText>
        <Space width={4} />
        <SwanLogo color={colors.swan[500]} style={styles.swanLogo} />
      </Box>
    </Box>
  );
};
