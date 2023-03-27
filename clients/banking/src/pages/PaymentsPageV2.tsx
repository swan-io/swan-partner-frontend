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
  tileContainer: {
    flex: 1,
  },
  tile: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  tileDesktop: {
    paddingVertical: 24,
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
      {({ small, large }) => (
        <>
          <View style={[styles.container, large && styles.containerDesktop]}>
            <Box direction={small ? "column" : "row"}>
              <View style={styles.tileContainer}>
                <Tile
                  flexGrow={1}
                  flexShrink={1}
                  style={[styles.tile, large && styles.tileDesktop]}
                >
                  <Box direction="row" alignItems="center" style={styles.tileContent}>
                    {large && (
                      <>
                        <Icon name="arrow-swap-regular" size={42} color={colors.current[500]} />
                        <Space width={24} />
                      </>
                    )}

                    <View style={styles.titleContainer}>
                      <TileTitle isMobile={small}>{t("transfer.tile.transfer.title")}</TileTitle>

                      {large && (
                        <LakeText variant="smallRegular">
                          {t("transfer.tile.transfer.subtitle")}
                        </LakeText>
                      )}
                    </View>

                    <Space width={12} />

                    <LakeButton
                      color="current"
                      size={small ? "small" : "large"}
                      onPress={() => Router.push("AccountPaymentsNew", { accountMembershipId })}
                    >
                      {t("transfer.tile.transfer.button")}
                    </LakeButton>
                  </Box>
                </Tile>
              </View>

              {newStandingOrderIsVisible && (
                <>
                  <Space width={24} height={12} />

                  <View style={styles.tileContainer}>
                    <Tile
                      flexGrow={1}
                      flexShrink={1}
                      style={[styles.tile, large && styles.tileDesktop]}
                    >
                      <Box direction="row" alignItems="center" style={styles.tileContent}>
                        {large && (
                          <>
                            <Icon
                              name="lake-clock-arrow-swap"
                              size={42}
                              color={colors.current[500]}
                            />

                            <Space width={24} />
                          </>
                        )}

                        <View style={styles.titleContainer}>
                          <TileTitle isMobile={small}>
                            {t("transfer.tile.recurringTransfer.title")}
                          </TileTitle>

                          {large && (
                            <LakeText variant="smallRegular">
                              {t("transfer.tile.recurringTransfer.subtitle")}
                            </LakeText>
                          )}
                        </View>

                        <Space width={12} />

                        <LakeButton
                          color="current"
                          size={small ? "small" : "large"}
                          onPress={() =>
                            Router.push("AccountPaymentsRecurringTransferNew", {
                              accountMembershipId,
                            })
                          }
                        >
                          {t("transfer.tile.recurringTransfer.button")}
                        </LakeButton>
                      </Box>
                    </Tile>
                  </View>
                </>
              )}
            </Box>
          </View>

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
