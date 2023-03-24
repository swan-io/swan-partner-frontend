import { LakeScrollView } from "@swan-io/lake/src/components/LakeScrollView";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

const styles = StyleSheet.create({
  content: {
    width: "100%",
    maxWidth: 1280,
    margin: "auto",
    paddingHorizontal: 24,
    paddingBottom: 24,
    flex: 1,
  },
  contentDesktop: {
    paddingHorizontal: 40,
    paddingBottom: 48,
  },
});

type Props = {
  children: ReactNode;
};

export const OnboardingStepContent = ({ children }: Props) => {
  return (
    <LakeScrollView contentContainerStyle={commonStyles.fill}>
      <ResponsiveContainer style={commonStyles.fill}>
        {({ large }) => (
          <View style={[styles.content, large && styles.contentDesktop]}>
            {children}

            <Space height={large ? 32 : 24} />
          </View>
        )}
      </ResponsiveContainer>
    </LakeScrollView>
  );
};
