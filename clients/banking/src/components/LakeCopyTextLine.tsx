import { LakeCopyButton } from "@swan-io/lake/src/components/LakeCopyButton";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { colors } from "@swan-io/lake/src/constants/design";
import { t } from "../utils/i18n";

type Props = {
  accented?: boolean;
  label: string;
  text: string;
};

export const LakeCopyTextLine = ({ accented = false, label, text }: Props) => (
  <LakeLabel
    type={accented ? "viewSmall" : "formSmall"}
    label={label}
    render={() => <LakeText color={colors.gray[900]}>{text}</LakeText>}
    actions={
      <LakeCopyButton
        valueToCopy={text}
        copyText={t("copyButton.copyTooltip")}
        copiedText={t("copyButton.copiedTooltip")}
      />
    }
  />
);
