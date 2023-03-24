import { Box } from "@swan-io/lake/src/components/Box";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { colors } from "@swan-io/lake/src/constants/design";
import { StyleSheet, View } from "react-native";
import { t } from "../utils/i18n";

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  containerDesktop: {
    paddingHorizontal: 40,
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
  nextLabel?: string;
  loading?: boolean;
};

export const OnboardingFooter = ({
  onPrevious,
  onNext,
  nextLabel = t("wizard.next"),
  loading,
}: Props) => {
  return (
    <ResponsiveContainer>
      {({ large }) => (
        <Box
          direction="row"
          justifyContent="center"
          style={[styles.container, large && styles.containerDesktop]}
        >
          <Box style={styles.buttons} direction="row" alignItems="center">
            {onPrevious ? (
              <LakeButton
                color="gray"
                mode="secondary"
                size={large ? "large" : "small"}
                style={styles.button}
                onPress={onPrevious}
              >
                {t("wizard.back")}
              </LakeButton>
            ) : (
              <View style={styles.emptySpace} />
            )}

            <Space width={16} />

            <LakeButton
              loading={loading}
              color="partner"
              size={large ? "large" : "small"}
              style={styles.button}
              onPress={onNext}
            >
              {nextLabel}
            </LakeButton>
          </Box>
        </Box>
      )}
    </ResponsiveContainer>
  );
};
