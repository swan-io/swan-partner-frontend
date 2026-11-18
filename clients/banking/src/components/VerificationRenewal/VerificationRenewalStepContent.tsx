import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { ReactNode } from "react";
import { View } from "react-native";

type Props = {
  children: ReactNode;
};

export const VerificationRenewalStepContent = ({ children }: Props) => {
  return <View style={commonStyles.fill}>{children}</View>;
};
