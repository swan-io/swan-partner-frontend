import { Icon } from "@swan-io/lake/src/components/Icon";
import { Input } from "@swan-io/lake/src/components/Input";
import { colors, invariantColors } from "@swan-io/lake/src/constants/design";
import { insets } from "@swan-io/lake/src/constants/insets";
import { StyleSheet, View } from "react-native";
import { t } from "../utils/i18n";

const styles = StyleSheet.create({
  base: {
    flex: 1,
    backgroundColor: invariantColors.white,
    marginLeft: insets.left,
    marginRight: insets.right,
  },
  input: {
    paddingLeft: 36,
  },
  icon: {
    position: "absolute",
    left: 10,
    top: 10,
  },
});

type Props = {
  value: string;
  onChange?: (text: string) => void;
};

export const HeaderSearchInput = ({ value, onChange }: Props) => {
  return (
    <View style={styles.base}>
      <View>
        <Input
          placeholder={t("header.search.placeholder")}
          inputStyle={styles.input}
          size="small"
          keyboardType="web-search"
          returnKeyType="search"
          value={value}
          onValueChange={onChange}
          hideErrorMessage={true}
        />

        <Icon name="search-filled" color={colors.gray[200]} size={20} style={styles.icon} />
      </View>
    </View>
  );
};
