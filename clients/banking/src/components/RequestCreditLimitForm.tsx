import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { Space } from "@swan-io/lake/src/components/Space";
import { colors } from "@swan-io/lake/src/constants/design";
import { useForm } from "@swan-io/use-form";
import { t } from "../utils/i18n";

type Props = {
  accountId: string;
};

export const RequestCreditLimitForm = ({ accountId }: Props) => {
  const { Field } = useForm({
    amount: {
      initialValue: "",
    },
  });

  return (
    <>
      <LakeHeading level={2} variant="h3" color={colors.gray[700]}>
        {t("requestCreditLimit.title")}
      </LakeHeading>

      <Space height={8} />

      <LakeText color={colors.gray[600]}>{t("requestCreditLimit.description")}</LakeText>

      <Space height={24} />
    </>
  );
};
