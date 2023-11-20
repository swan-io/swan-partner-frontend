import { Box } from "@swan-io/lake/src/components/Box";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { colors } from "@swan-io/lake/src/constants/design";
import { StyleSheet, View } from "react-native";
import { TranslationKey, t } from "../utils/i18n";
import { TrackPressable } from "./TrackPressable";

const styles = StyleSheet.create({
  topBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    alignSelf: "center",
    height: 1,
    position: "absolute",
    top: 0,
    width: "100vw",
  },
  container: {
    paddingVertical: 16,
  },
  containerDesktop: {
    paddingVertical: 20,
  },
  buttons: {
    flex: 1,
    maxWidth: 1200,
  },
  button: {
    flex: 1,
  },
  emptySpace: {
    flex: 1,
    paddingHorizontal: 26,
  },
});

type Props = {
  onPrevious?: () => void;
  onNext: () => void;
  nextLabel?: TranslationKey;
  loading?: boolean;
};

export const OnboardingFooter = ({
  onPrevious,
  onNext,
  nextLabel = "wizard.next",
  loading,
}: Props) => {
  return (
    <ResponsiveContainer>
      {({ large }) => (
        <>
          <View style={styles.topBorder} />

          <Box
            direction="row"
            justifyContent="center"
            style={[styles.container, large && styles.containerDesktop]}
          >
            <Box style={styles.buttons} direction="row" alignItems="center">
              {onPrevious ? (
                <TrackPressable action="Go back">
                  <LakeButton
                    color="gray"
                    mode="secondary"
                    size={large ? "large" : "small"}
                    style={styles.button}
                    onPress={onPrevious}
                  >
                    {t("wizard.back")}
                  </LakeButton>
                </TrackPressable>
              ) : (
                <View style={styles.emptySpace} />
              )}

              <Space width={16} />

              <TrackPressable action="Go next">
                <LakeButton
                  loading={loading}
                  color="partner"
                  size={large ? "large" : "small"}
                  style={styles.button}
                  onPress={onNext}
                >
                  {t(nextLabel)}
                </LakeButton>
              </TrackPressable>
            </Box>
          </Box>
        </>
      )}
    </ResponsiveContainer>
  );
};
