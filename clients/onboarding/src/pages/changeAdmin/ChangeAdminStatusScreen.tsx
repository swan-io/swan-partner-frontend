import { BorderedIcon } from "@swan-io/lake/src/components/BorderedIcon";
import { Box } from "@swan-io/lake/src/components/Box";
import { IconName } from "@swan-io/lake/src/components/Icon";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { Space } from "@swan-io/lake/src/components/Space";
import { SwanLogo } from "@swan-io/lake/src/components/SwanLogo";
import { ColorVariants } from "@swan-io/lake/src/constants/design";
import { StyleSheet } from "react-native";
import { match } from "ts-pattern";
import { AccountAdminChangeStatus } from "../../graphql/partner";
import { t } from "../../utils/i18n";

const styles = StyleSheet.create({
  base: {
    flexGrow: 1,
    flexShrink: 1,
  },
  partnership: {
    marginHorizontal: "auto",
    display: "flex",
    flexDirection: "row",
    alignItems: "baseline",
  },
  swanPartnershipLogo: {
    marginLeft: 4,
    height: 9,
  },
});

type Props = {
  status: Exclude<AccountAdminChangeStatus, "Ongoing">;
};

export const ChangeAdminStatusScreen = ({ status }: Props) => {
  const { icon, color, title, description, description2 } = match(status)
    .returnType<{
      icon: IconName;
      color: ColorVariants;
      title: string;
      description: string;
      description2?: string;
    }>()
    .with("Pending", () => ({
      icon: "clock-regular" as IconName,
      color: "mediumSladeBlue" as ColorVariants,
      title: t("changeAdmin.status.pending.title"),
      description: t("changeAdmin.status.pending.description"),
      description2: t("changeAdmin.status.closePage"),
    }))
    .with("WaitingForInformation", () => ({
      icon: "warning-regular" as IconName,
      color: "warning" as ColorVariants,
      title: t("changeAdmin.status.waitingForInformation.title"),
      description: t("changeAdmin.status.waitingForInformation.description"),
      description2: t("changeAdmin.status.closePage"),
    }))
    .with("InvitationSent", () => ({
      icon: "mail-regular" as IconName,
      color: "mediumSladeBlue" as ColorVariants,
      title: t("changeAdmin.status.invitationSent.title"),
      description: t("changeAdmin.status.invitationSent.description"),
      description2: t("changeAdmin.status.closePage"),
    }))
    .with("Verified", () => ({
      icon: "lake-check" as IconName,
      color: "positive" as ColorVariants,
      title: t("changeAdmin.status.verified.title"),
      description: t("changeAdmin.status.verified.description"),
      description2: t("changeAdmin.status.closePage"),
    }))
    .with("Refused", () => ({
      icon: "dismiss-circle-regular" as IconName,
      color: "negative" as ColorVariants,
      title: t("changeAdmin.status.refused.title"),
      description: t("changeAdmin.status.refused.description"),
      description2: t("changeAdmin.status.closePage"),
    }))
    .with("Expired", () => ({
      icon: "warning-regular" as IconName,
      color: "warning" as ColorVariants,
      title: t("changeAdmin.status.expired.title"),
      description: t("changeAdmin.status.expired.description"),
      description2: t("changeAdmin.status.closePage"),
    }))
    .exhaustive();

  return (
    <Box style={styles.base}>
      <Box alignItems="center" justifyContent="center" grow={1}>
        <BorderedIcon name={icon} color={color} padding={16} size={100} />

        <Space height={32} />

        <LakeHeading level={1} variant="h3" align="center">
          {title}
        </LakeHeading>

        <Space height={12} />

        <LakeText variant="smallRegular" align="center">
          {description}
        </LakeText>

        {description2 != null && (
          <>
            <Space height={12} />

            <LakeText variant="smallRegular" align="center">
              {description2}
            </LakeText>
          </>
        )}
      </Box>

      <LakeText style={styles.partnership}>
        {t("wizard.partnership")}

        <SwanLogo style={styles.swanPartnershipLogo} />
      </LakeText>

      <Space height={48} />
    </Box>
  );
};
