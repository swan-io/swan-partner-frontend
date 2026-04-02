import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { colors } from "@swan-io/lake/src/constants/design";

type Props = {
  children: string;
};

export const StepTitle = ({ children }: Props) => {
  return (
    <LakeHeading level={2} variant="h3" color={colors.gray[700]}>
      {children}
    </LakeHeading>
  );
};
