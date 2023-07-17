import { Box } from "@swan-io/lake/src/components/Box";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { TabView } from "@swan-io/lake/src/components/TabView";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { breakpoints, colors } from "@swan-io/lake/src/constants/design";
import { StyleSheet } from "react-native";
import { RecurringTransferList } from "../components/RecurringTransferList";
import { t } from "../utils/i18n";
import { Router } from "../utils/routes";

const styles = StyleSheet.create({
  container: {
    paddingTop: 24,
    paddingHorizontal: 24,
  },
  containerDesktop: {
    paddingTop: 40,
    paddingHorizontal: 40,
  },
});

const TileTitle = ({ children, isMobile }: { children: string; isMobile: boolean }) => {
  if (isMobile) {
    return (
      <LakeText variant="medium" color={colors.gray[900]}>
        {children}
      </LakeText>
    );
  }

  return (
    <LakeHeading level={2} variant="h3" color={colors.gray[900]}>
      {children}
    </LakeHeading>
  );
};

type Props = {
  accountId: string;
  accountMembershipId: string;
  newStandingOrderIsVisible: boolean;
  canQueryCardOnTransaction: boolean;
};

export const PaymentsPageV2 = ({
  accountId,
  accountMembershipId,
  newStandingOrderIsVisible,
  canQueryCardOnTransaction,
}: Props) => {
  return (
    <ResponsiveContainer breakpoint={breakpoints.large} style={commonStyles.fill}>
      {({ small }) => (
        <>
          <Box
            direction="row"
            justifyContent="end"
            style={small ? styles.container : styles.containerDesktop}
          >
            <LakeButton
              onPress={() => Router.push("AccountPaymentsNew", { accountMembershipId })}
              icon="add-circle-filled"
              size="small"
              color="current"
            >
              {t("transfer.newTransfer")}
            </LakeButton>
          </Box>

          <Space height={24} />

          <TabView
            padding={small ? 24 : 40}
            sticky={true}
            hideIfSingleItem={false}
            tabs={[
              {
                label: t("transfer.tabs.recurringTransfer"),
                url: Router.AccountPaymentsRoot({ accountMembershipId }),
              },
            ]}
            otherLabel={t("common.tabs.other")}
          />

          <Space height={24} />

          <RecurringTransferList
            accountId={accountId}
            accountMembershipId={accountMembershipId}
            canQueryCardOnTransaction={canQueryCardOnTransaction}
          />
        </>
      )}
    </ResponsiveContainer>
  );
};
