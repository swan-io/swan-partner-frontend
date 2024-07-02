import { BorderedIcon } from "@swan-io/lake/src/components/BorderedIcon";
import { Box } from "@swan-io/lake/src/components/Box";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { Space } from "@swan-io/lake/src/components/Space";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { colors, spacings } from "@swan-io/lake/src/constants/design";
import { isNotNullish } from "@swan-io/lake/src/utils/nullish";
import { StyleSheet } from "react-native";
import { GetMerchantPaymentLinkQuery } from "../graphql/unauthenticated";
import { t } from "../utils/i18n";

const styles = StyleSheet.create({
  fill: {
    ...commonStyles.fill,
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
    <Box alignItems="center" justifyContent="center" style={styles.fill}>
      <BorderedIcon name={"lake-warning"} color="warning" size={70} padding={16} />
      <Space height={24} />

      <LakeText variant="semibold" color={colors.gray[900]} style={styles.title}>
        {t("paymentLink.linkExpired")}
      </LakeText>

      <Space height={32} />

      {isNotNullish(paymentLink.redirectUrl) && (
        <LakeButton
          ariaLabel={t("paymentLink.button.returnToWebsite")}
          mode="secondary"
          href={paymentLink.redirectUrl}
        >
          {t("paymentLink.button.returnToWebsite")}
        </LakeButton>
      )}
    </Box>
  );
};
