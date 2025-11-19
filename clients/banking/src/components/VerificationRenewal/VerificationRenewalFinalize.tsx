import { BorderedIcon } from "@swan-io/lake/src/components/BorderedIcon";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { Space } from "@swan-io/lake/src/components/Space";
import { t } from "../../utils/i18n";

export const VerificationRenewalFinalize = () => {
  return (
    <>
      <BorderedIcon name="lake-check" />

      <Space height={32} />
      <LakeHeading level={1}>{t("verificationRenewal.finalize.title")}</LakeHeading>
      <LakeText>{t("verificationRenewal.finalize.subtitle")}</LakeText>

      <Space height={16} />
      <LakeButton>{t("verificationRenewal.close")}</LakeButton>
    </>
  );
};
