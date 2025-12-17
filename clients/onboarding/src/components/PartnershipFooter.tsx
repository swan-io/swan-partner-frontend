import { Fill } from "@swan-io/lake/src/components/Fill";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { Space } from "@swan-io/lake/src/components/Space";
import { SwanLogo } from "@swan-io/lake/src/components/SwanLogo";
import { StyleSheet } from "react-native";
import { t } from "../utils/i18n";

const styles = StyleSheet.create({
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

export const PartnershipFooter = () => {
  return (
    <>
      <Fill minHeight={24} />
      <LakeText style={styles.partnership}>
        {t("wizard.partnership")}
        <SwanLogo style={styles.swanPartnershipLogo} />
      </LakeText>
      <Space height={24} />
    </>
  );
};
