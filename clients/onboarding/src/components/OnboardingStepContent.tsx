import { LakeScrollView } from "@swan-io/lake/src/components/LakeScrollView";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

const styles = StyleSheet.create({
  content: {
    width: "100%",
    maxWidth: 1280,
    margin: "auto",
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  contentDesktop: {
    paddingHorizontal: 40,
    paddingVertical: 48,
  },
});

type Props = {
  children: ReactNode;
};

export const OnboardingStepContent = ({ children }: Props) => {
  return (
    <LakeScrollView>
      <ResponsiveContainer>
        {({ large }) => (
          <View style={[styles.content, large && styles.contentDesktop]}>{children}</View>
        )}
      </ResponsiveContainer>
    </LakeScrollView>
  );
};
