import { Box } from "@swan-io/lake/src/components/Box";
import { Icon } from "@swan-io/lake/src/components/Icon";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { TabView } from "@swan-io/lake/src/components/TabView";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { breakpoints, colors } from "@swan-io/lake/src/constants/design";
import { StyleSheet, View } from "react-native";
import { StandingOrdersList } from "../components/StandingOrdersList";
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
  tileContent: {
    height: "100%",
    flexShrink: 1,
  },
  titleContainer: {
    flexGrow: 1,
    flexShrink: 1,
  },
});

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
      {({ small, large }) => (
        <>
          <View style={[styles.container, large && styles.containerDesktop]}>
            {large && (
              <>
                <LakeHeading level={1} variant="h3">
                  {t("transfer.title")}
                </LakeHeading>

                <Space height={24} />
              </>
            )}

            <Box direction={small ? "column" : "row"}>
              <Tile flexGrow={1} flexShrink={1}>
                <Box direction="row" alignItems="center" style={styles.tileContent}>
                  <Icon name="arrow-swap-regular" size={42} color={colors.current[500]} />
                  <Space width={24} />

                  <View style={styles.titleContainer}>
                    <LakeHeading level={2} variant="h3">
                      {t("transfer.tile.transfer.title")}
                    </LakeHeading>

                    <LakeText variant="smallRegular">
                      {t("transfer.tile.transfer.subtitle")}
                    </LakeText>
                  </View>

                  <Space width={12} />

                  <LakeButton
                    color="current"
                    onPress={() => Router.push("AccountPaymentsV2New", { accountMembershipId })}
                  >
                    {t("transfer.tile.transfer.button")}
                  </LakeButton>
                </Box>
              </Tile>

              {newStandingOrderIsVisible && (
                <>
                  <Space width={24} height={12} />

                  <Tile flexGrow={1} flexShrink={1}>
                    <Box direction="row" alignItems="center" style={styles.tileContent}>
                      <Icon name="lake-clock-arrow-swap" size={42} color={colors.current[500]} />
                      <Space width={24} />

                      <View style={styles.titleContainer}>
                        <LakeHeading level={2} variant="h3">
                          {t("transfer.tile.recurringTransfer.title")}
                        </LakeHeading>

                        <LakeText variant="smallRegular">
                          {t("transfer.tile.recurringTransfer.subtitle")}
                        </LakeText>
                      </View>

                      <Space width={12} />

                      <LakeButton
                        color="current"
                        onPress={() =>
                          Router.push("AccountPaymentsV2StandingOrderNew", {
                            accountMembershipId,
                          })
                        }
                      >
                        {t("transfer.tile.recurringTransfer.button")}
                      </LakeButton>
                    </Box>
                  </Tile>
                </>
              )}
            </Box>

            <Space height={24} />

            <TabView
              hideIfSingleItem={false}
              tabs={[
                {
                  label: t("transfer.tabs.recurringTransfer"),
                  url: Router.AccountPaymentsV2Root({ accountMembershipId }),
                },
              ]}
              otherLabel={t("common.tabs.other")}
            />
          </View>

          <Space height={24} />

          <StandingOrdersList
            accountId={accountId}
            accountMembershipId={accountMembershipId}
            canQueryCardOnTransaction={canQueryCardOnTransaction}
          />
        </>
      )}
    </ResponsiveContainer>
  );
};
