import { Box } from "@swan-io/lake/src/components/Box";
import { Icon, IconName } from "@swan-io/lake/src/components/Icon";
import { LakeCopyButton } from "@swan-io/lake/src/components/LakeCopyButton";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { Space } from "@swan-io/lake/src/components/Space";
import { colors } from "@swan-io/lake/src/constants/design";
import { ReactNode } from "react";
import { t } from "../utils/i18n";

type DetailLineProps = {
  icon?: IconName;
  label: string;
  text: ReactNode;
};

export const DetailLine = ({ icon, label, text }: DetailLineProps) => (
  <LakeLabel
    type="viewSmall"
    label={label}
    render={() =>
      icon ? (
        <Box direction="row" alignItems="center">
          <Icon name={icon} size={16} />
          <Space width={8} />

          <LakeText variant="regular" color={colors.gray[900]}>
            {text}
          </LakeText>
        </Box>
      ) : (
        <LakeText variant="regular" color={colors.gray[900]}>
          {text}
        </LakeText>
      )
    }
  />
);

type DetailCopiableLineProps = {
  label: string;
  text: string;
};

export const DetailCopiableLine = ({ label, text }: DetailCopiableLineProps) => (
  <LakeLabel
    type="viewSmall"
    label={label}
    actions={
      <LakeCopyButton
        valueToCopy={text}
        copiedText={t("copyButton.copiedTooltip")}
        copyText={t("copyButton.copyTooltip")}
      />
    }
    render={() => (
      <LakeText variant="regular" color={colors.gray[900]}>
        {text}
      </LakeText>
    )}
  />
);
