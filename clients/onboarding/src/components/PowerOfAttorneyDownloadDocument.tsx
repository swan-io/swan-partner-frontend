import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { Space } from "@swan-io/lake/src/components/Space";
import { colors, radii } from "@swan-io/lake/src/constants/design";
import { StyleSheet, View } from "react-native";
import { match } from "ts-pattern";
import { t } from "../utils/i18n";

const styles = StyleSheet.create({
  container: {
    display: "block",
    width: "100%",
    backgroundColor: colors.gray[50],
    borderRadius: radii[8],
    borderWidth: 1,
    borderColor: colors.gray[100],
    padding: 24,
  },
});

type Props = {
  title: string;
  language: string;
};

export const PowerOfAttorneyDownloadDocument = ({ title, language }: Props) => {
  const templateUrl = `/power-of-attorney-template/${match(language)
    .with("fr", () => "fr")
    .with("de", () => "de")
    .with("es", () => "es")
    .with("it", () => "it")
    .otherwise(() => "en")}.pdf`;

  return (
    <View style={styles.container}>
      <LakeText variant="smallRegular">{title}</LakeText>

      <Space height={12} />

      <LakeButton
        mode="secondary"
        size="small"
        icon="arrow-download-filled"
        onPress={() => window.open(templateUrl, "_blank")}
      >
        {t("common.downloadTemplate")}
      </LakeButton>
    </View>
  );
};
