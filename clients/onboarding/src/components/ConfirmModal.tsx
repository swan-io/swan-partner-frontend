import { Box } from "@swan-io/lake/src/components/Box";
import { IconName } from "@swan-io/lake/src/components/Icon";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeModal } from "@swan-io/lake/src/components/LakeModal";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { Space } from "@swan-io/lake/src/components/Space";
import { ColorVariants } from "@swan-io/lake/src/constants/design";
import { StyleSheet } from "react-native";
import { t } from "../utils/i18n";

const styles = StyleSheet.create({
  confirmButton: {
    flex: 1,
  },
});

type Props = {
  visible: boolean;
  title: string;
  message?: string;
  confirmText: string;
  cancelText?: string;
  color?: ColorVariants;
  icon: IconName;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export const ConfirmModal = ({
  visible,
  title,
  message,
  confirmText,
  cancelText,
  color = "partner",
  icon,
  loading,
  onConfirm,
  onCancel,
}: Props) => {
  return (
    <LakeModal visible={visible} title={title} icon={icon} color={color}>
      {message != null && <LakeText>{message}</LakeText>}

      <Space height={48} />

      <Box direction="row">
        <LakeButton style={styles.confirmButton} mode="secondary" onPress={onCancel}>
          {cancelText ?? t("common.cancel")}
        </LakeButton>

        <Space width={24} />

        <LakeButton
          style={styles.confirmButton}
          color={color}
          onPress={onConfirm}
          loading={loading}
        >
          {confirmText}
        </LakeButton>
      </Box>
    </LakeModal>
  );
};
