import { Box } from "@swan-io/lake/src/components/Box";
import { Separator } from "@swan-io/lake/src/components/Separator";
import { Space } from "@swan-io/lake/src/components/Space";
import { Toggle } from "@swan-io/lake/src/components/Toggle";
import { ReactNode } from "react";
import { t } from "../utils/i18n";

type Props = {
  children?: ReactNode;
  large?: boolean;
  status: "Enabled" | "Canceled";
  onChangeStatus: (status: "Enabled" | "Canceled") => void;
};

export const VirtualIbanListFilter = ({
  children,
  large = true,
  status,
  onChangeStatus,
}: Props) => {
  return (
    <>
      <Box direction="row" alignItems="center">
        {children != null ? (
          <>
            {children}
            <Separator horizontal={true} space={12} />
          </>
        ) : null}

        <Toggle
          compact={!large}
          value={status === "Enabled"}
          onToggle={value => onChangeStatus(value ? "Enabled" : "Canceled")}
          labelOn={t("accountDetails.virtualIbans.status.enabled")}
          labelOff={t("accountDetails.virtualIbans.status.canceled")}
        />
      </Box>

      <Space height={12} />
    </>
  );
};
