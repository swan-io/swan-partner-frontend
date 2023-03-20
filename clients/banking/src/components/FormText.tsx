import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { Space } from "@swan-io/lake/src/components/Space";
import { colors } from "@swan-io/lake/src/constants/design";

type Props = {
  children: string;
  isMobile: boolean;
};

export const FieldsetTitle = ({ children, isMobile }: Props) => {
  if (isMobile) {
    return (
      <>
        <LakeText variant="medium" color={colors.gray[900]}>
          {children}
        </LakeText>

        <Space height={12} />
      </>
    );
  }

  return (
    <>
      <LakeHeading level={2} variant="h3" color={colors.gray[700]}>
        {children}
      </LakeHeading>

      <Space height={24} />
    </>
  );
};
