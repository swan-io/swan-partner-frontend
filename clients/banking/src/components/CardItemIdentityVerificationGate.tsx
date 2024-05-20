import { Option } from "@swan-io/boxed";
import { LakeAlert } from "@swan-io/lake/src/components/LakeAlert";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { StyleSheet, View } from "react-native";
import { IdentificationFragment, IdentificationLevel } from "../graphql/partner";
import { t } from "../utils/i18n";
import { getIdentificationLevelStatusInfo } from "../utils/identification";
import { openPopup } from "../utils/popup";
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
  lastRelevantIdentification: Option<IdentificationFragment>;
  recommendedIdentificationLevel: IdentificationLevel;
  description: string;
  descriptionForOtherMember: string;
  projectId: string;
  onComplete: () => void;
};

export const CardItemIdentityVerificationGate = ({
  isCurrentUserCardOwner,
  lastRelevantIdentification,
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

    openPopup(`/auth/login?${params.toString()}`).onResolve(() => {
      onComplete();
    });
  };

  const isProcessing = lastRelevantIdentification
    .map(getIdentificationLevelStatusInfo)
    .map(({ status }) => status === "Pending")
    .getOr(false);

  return (
    <View style={styles.container}>
      {isCurrentUserCardOwner ? (
        <Tile footer={<LakeAlert anchored={true} variant="warning" title={description} />}>
          <LakeButton color="current" onPress={onPressProve} disabled={isProcessing}>
            {isProcessing ? t("profile.verifyIdentity.processing") : t("profile.verifyIdentity")}
          </LakeButton>
        </Tile>
      ) : (
        <LakeAlert variant="warning" title={descriptionForOtherMember} />
      )}
    </View>
  );
};
