import { LakeAlert } from "@swan-io/lake/src/components/LakeAlert";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { StyleSheet, View } from "react-native";
import { IdentificationLevel, IdentificationStatus } from "../graphql/partner";
import { openPopup } from "../states/popup";
import { t } from "../utils/i18n";
import { Router } from "../utils/routes";

const styles = StyleSheet.create({
  container: {
    maxWidth: 390,
    width: "100%",
    alignSelf: "center",
  },
});

type Props = {
  isCurrentUserCardOwner: boolean;
  identificationStatus?: IdentificationStatus;
  recommendedIdentificationLevel: IdentificationLevel;
  description: string;
  descriptionForOtherMember: string;
  projectId: string;
  onComplete: () => void;
};

export const CardItemIdentityVerificationGate = ({
  isCurrentUserCardOwner,
  identificationStatus,
  recommendedIdentificationLevel,
  description,
  descriptionForOtherMember,
  projectId,
  onComplete,
}: Props) => {
  const onPressProve = () => {
    const params = new URLSearchParams();
    params.set("redirectTo", Router.PopupCallback());
    params.set("identificationLevel", recommendedIdentificationLevel);
    params.set("projectId", projectId);
    openPopup({
      url: `/auth/login?${params.toString()}`,
      onClose: () => onComplete(),
    });
  };

  return (
    <View style={styles.container}>
      {isCurrentUserCardOwner ? (
        <Tile footer={<LakeAlert anchored={true} variant="warning" title={description} />}>
          <LakeButton
            color="current"
            onPress={onPressProve}
            disabled={identificationStatus === "Processing"}
          >
            {identificationStatus === "Processing"
              ? t("profile.verifyIdentity.processing")
              : t("profile.verifyIdentity")}
          </LakeButton>
        </Tile>
      ) : (
        <LakeAlert variant="warning" title={descriptionForOtherMember} />
      )}
    </View>
  );
};
