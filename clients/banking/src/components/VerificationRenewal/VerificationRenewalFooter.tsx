import { Box } from "@swan-io/lake/src/components/Box";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { spacings } from "@swan-io/lake/src/constants/design";
import { StyleSheet } from "react-native";
import { t, TranslationKey } from "../../utils/i18n";

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
//TODO: put this footer in lake for rekyc and onboarding
export const VerificationRenewalFooter = ({
  onPrevious,
  onNext,
  nextLabel = "verificationRenewal.next",
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
              <LakeButton
                color="gray"
                mode="secondary"
                size={large ? "large" : "small"}
                onPress={onPrevious}
                grow={small}
              >
                {t("verificationRenewal.back")}
              </LakeButton>

              <Space width={16} />
            </>
          ) : null}

          <LakeButton
            loading={loading}
            color="partner"
            size={large ? "large" : "small"}
            onPress={onNext}
            grow={small}
          >
            {t(nextLabel)}
          </LakeButton>
        </Box>
      )}
    </ResponsiveContainer>
  );
};
