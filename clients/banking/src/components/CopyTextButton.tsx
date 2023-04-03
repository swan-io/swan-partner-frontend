import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeTooltip } from "@swan-io/lake/src/components/LakeTooltip";
import { useState } from "react";
import { Clipboard } from "react-native";
import { t } from "../utils/i18n";

export const CopyTextButton = ({
  value,
  disabled = false,
}: {
  value: string;
  disabled?: boolean;
}) => {
  const [visibleState, setVisibleState] = useState<"copy" | "copied">("copy");
  return (
    <LakeTooltip
      describedBy="copy"
      placement="top"
      onHide={() => setVisibleState("copy")}
      togglableOnFocus={true}
      content={
        visibleState === "copy" ? t("copyButton.copyTooltip") : t("copyButton.copiedTooltip")
      }
    >
      <LakeButton
        disabled={disabled}
        mode="secondary"
        size="small"
        icon="copy-regular"
        ariaLabel={t("copyButton.copyTooltip")}
        onPress={() => {
          Clipboard.setString(value);
          setVisibleState("copied");
        }}
      />
    </LakeTooltip>
  );
};
