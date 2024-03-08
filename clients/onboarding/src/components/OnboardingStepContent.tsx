import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

const styles = StyleSheet.create({
  content: {
    width: "100%",
    maxWidth: 1280,
    margin: "auto",
    paddingHorizontal: 24,
    flex: 1,
  },
  contentDesktop: {
    paddingHorizontal: 40,
  },
});

type Props = {
  children: ReactNode;
};

export const OnboardingStepContent = ({ children }: Props) => {
  return (
    <ResponsiveContainer style={commonStyles.fill}>
      {({ large }) => (
        <View style={[styles.content, large && styles.contentDesktop]}>{children}</View>
      )}
    </ResponsiveContainer>
  );
};
