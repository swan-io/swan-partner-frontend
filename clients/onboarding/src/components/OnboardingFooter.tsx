import { Box } from "@swan-io/lake/src/components/Box";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { spacings } from "@swan-io/lake/src/constants/design";
import { StyleSheet } from "react-native";
import { TranslationKey, t } from "../utils/i18n";
import { TrackPressable } from "./TrackPressable";

const styles = StyleSheet.create({
  root: {
    alignSelf: "stretch",
  },
  container: {
    paddingVertical: 16,
  },
  containerDesktop: {
    paddingVertical: spacings[32],
  },
});

type Props = {
  onPrevious?: () => void;
  onNext: () => void;
  nextLabel?: TranslationKey;
  loading?: boolean;
  justifyContent?: "start" | "center" | "end";
};

export const OnboardingFooter = ({
  onPrevious,
  onNext,
  nextLabel = "wizard.next",
  loading,
  justifyContent = "start",
}: Props) => {
  return (
    <ResponsiveContainer style={styles.root}>
      {({ large, small }) => (
        <Box
          direction="row"
          justifyContent={justifyContent}
          style={[styles.container, large && styles.containerDesktop]}
        >
          {onPrevious ? (
            <>
              <TrackPressable action="Go back">
                <LakeButton
                  color="gray"
                  mode="secondary"
                  size={large ? "large" : "small"}
                  onPress={onPrevious}
                  grow={small}
                >
                  {t("wizard.back")}
                </LakeButton>
              </TrackPressable>

              <Space width={16} />
            </>
          ) : null}

          <TrackPressable action="Go next">
            <LakeButton
              loading={loading}
              color="partner"
              size={large ? "large" : "small"}
              onPress={onNext}
              grow={small}
            >
              {t(nextLabel)}
            </LakeButton>
          </TrackPressable>
        </Box>
      )}
    </ResponsiveContainer>
  );
};
