import { Box } from "@swan-io/lake/src/components/Box";
import { Heading } from "@swan-io/lake/src/components/Heading";
import { Icon } from "@swan-io/lake/src/components/Icon";
import { Space } from "@swan-io/lake/src/components/Space";
import { colors } from "@swan-io/lake/src/constants/design";
import { typography } from "@swan-io/lake/src/constants/typography";
import { useResponsive } from "@swan-io/lake/src/hooks/useResponsive";
import { StyleSheet, Text } from "react-native";
import { BorderedRow } from "../components/BorderedRow";
import { Main } from "../components/Main";
import { useLegacyAccentColor } from "../contexts/legacyAccentColor";
import { t } from "../utils/i18n";
import { Router } from "../utils/routes";

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
  },
  headerDesktop: {
    paddingTop: 56,
    paddingHorizontal: 80,
  },
  subtitle: {
    ...typography.bodyLarge,
    color: colors.gray[400],
  },
});

type Props = {
  accountMembershipId: string;
  newStandingOrderIsVisible: boolean;
};

export const PaymentsPage = ({ accountMembershipId, newStandingOrderIsVisible }: Props) => {
  const accentColor = useLegacyAccentColor();
  const { desktop, media } = useResponsive();

  return (
    <>
      <Box style={[styles.header, desktop && styles.headerDesktop]}>
        <Heading level={1} size={media({ mobile: 24, desktop: 32 })}>
          {t("payments.title")}
        </Heading>

        <Space height={16} />
        <Text style={styles.subtitle}>{t("payments.subtitle")}</Text>
      </Box>

      <Space height={media({ mobile: 24, desktop: 40 })} />

      <Main.ScrollView>
        <BorderedRow
          title={t("payments.newTransferTitle")}
          subtitle={t("payments.newTransferSubtitle")}
          to={Router.AccountPaymentsNew({ accountMembershipId })}
        >
          <Icon name="add-filled" color={accentColor} size={24} />
        </BorderedRow>

        <Space height={16} />

        {newStandingOrderIsVisible && (
          <BorderedRow
            icon="arrow-right-filled"
            title={t("payments.standingOrderList.title")}
            subtitle={t("payments.standingOrderList.subtitle")}
            to={Router.AccountStandingOrders({ accountMembershipId })}
          />
        )}

        {/* <Space height={16} />

        <BorderedRow
          title={t("payments.newDirectDebitTitle")}
          subtitle={t("payments.newDirectDebitSubtitle", { clientName: name })}
          to="#"
        >
          <Icon name="add" color={accentColor} size={24} />
        </BorderedRow> */}

        {/* <Fill />

        <Space height={16} />

        <BorderedRow
          title={t("payments.manageBeneficiariesTitle")}
          subtitle={t("payments.manageBeneficiariesSubtitle")}
          to="#"
        >
          <Icon name="next" color={accentColor} size={24} />
        </BorderedRow> */}

        {/* <Space height={16} />

        <BorderedRow
          title={t("payments.transfersHistoryTitle")}
          subtitle={t("payments.transfersHistorySubtitle")}
          to="#"
        >
          <Icon name="next" color={accentColor} size={24} />
        </BorderedRow> */}
      </Main.ScrollView>
    </>
  );
};
