import { BorderedIcon } from "@swan-io/lake/src/components/BorderedIcon";
import { Box } from "@swan-io/lake/src/components/Box";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { Space } from "@swan-io/lake/src/components/Space";
import { SwanLogo } from "@swan-io/lake/src/components/SwanLogo";
import { colors, spacings } from "@swan-io/lake/src/constants/design";
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
  swanLogo: {
    display: "inline-flex",
    height: 9,
    width: 45 * (9 / 10),
  },
  title: {
    paddingBottom: spacings[4],
  },
});

type Props = {
  paymentLink: NonNullable<GetMerchantPaymentLinkQuery["merchantPaymentLink"]>;
};

export const ExpiredPage = ({ paymentLink }: Props) => {
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
        <BorderedIcon name={"lake-warning"} color="warning" size={70} padding={16} />
        <Space height={24} />

        <LakeText variant="semibold" color={colors.gray[900]} style={styles.title}>
          {t("paymentLink.linkExpired")}
        </LakeText>

        <Space height={32} />

        <LakeButton
          ariaLabel={t("paymentLink.button.returnToWebsite")}
          mode="secondary"
          grow={true}
          href={paymentLink.redirectUrl}
        >
          {t("paymentLink.button.returnToWebsite")}
        </LakeButton>
      </Box>

      <Box direction="row" alignItems="baseline">
        <LakeText>{t("paymentLink.poweredBySwan")}</LakeText>
        <Space width={4} />
        <SwanLogo color={colors.swan[500]} style={styles.swanLogo} />
      </Box>
    </Box>
  );
};
