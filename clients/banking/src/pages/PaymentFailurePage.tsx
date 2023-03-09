import { Box } from "@swan-io/lake/src/components/Box";
import { FailureIcon } from "@swan-io/lake/src/components/FailureIcon";
import { Heading } from "@swan-io/lake/src/components/Heading";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { Space } from "@swan-io/lake/src/components/Space";
import { colors } from "@swan-io/lake/src/constants/design";
import { insets } from "@swan-io/lake/src/constants/insets";
import { typography } from "@swan-io/lake/src/constants/typography";
import { useCallback } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { t } from "../utils/i18n";
import { Router } from "../utils/routes";

const styles = StyleSheet.create({
  contentContainer: {
    justifyContent: "center",
    marginHorizontal: "auto",
    maxWidth: "100%",
    minHeight: "100%",
    paddingLeft: insets.addToLeft(80),
    paddingRight: insets.addToRight(80),
    width: 560,
    paddingVertical: 56,
  },
  description: {
    ...typography.bodyLarge,
    color: colors.gray[900],
    textAlign: "center",
  },
});

type Props = {
  accountMembershipId: string;
};

export const PaymentFailurePage = ({ accountMembershipId }: Props) => {
  const close = useCallback(() => {
    Router.push("AccountRoot", { accountMembershipId });
  }, [accountMembershipId]);

  return (
    <ScrollView accessibilityRole="main" contentContainerStyle={styles.contentContainer}>
      <Box alignItems="center">
        <FailureIcon size={72} />
        <Space height={24} />

        <Heading level={1} size={32} align="center">
          {t("payments.new.failure.title")}
        </Heading>

        <Space height={8} />
        <Text style={styles.description}>{t("payments.new.failure.description")}</Text>
      </Box>

      <Space height={48} />

      <LakeButton mode="secondary" onPress={close}>
        {t("common.closeButton")}
      </LakeButton>
    </ScrollView>
  );
};
