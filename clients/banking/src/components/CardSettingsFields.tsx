import { Icon } from "@swan-io/lake/src/components/Icon";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Separator } from "@swan-io/lake/src/components/Separator";
import { Space } from "@swan-io/lake/src/components/Space";
import { Switch } from "@swan-io/lake/src/components/Switch";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { breakpoints, colors, spacings } from "@swan-io/lake/src/constants/design";
import { StyleSheet, View } from "react-native";
import { t } from "../utils/i18n";
import { CardNameField } from "./CardNameField";

const styles = StyleSheet.create({
  root: {
    display: "block",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacings[16],
  },
  settingText: {
    flex: 1,
    marginHorizontal: spacings[16],
  },
});

export type CardSettings = {
  cardName?: string;
  eCommerce: boolean;
  withdrawal: boolean;
  international: boolean;
  nonMainCurrencyTransactions: boolean;
};

type Props = {
  value: CardSettings;
  onChange: (value: CardSettings) => void;
  disabled?: boolean;
};

export const CardSettingsFields = ({ value, onChange, disabled = false }: Props) => {
  const cardSettingItems = [
    {
      key: "eCommerce",
      title: t("card.settings.eCommerce"),
      description: t("card.settings.eCommerce.description"),
      icon: "cart-regular",
      checked: value.eCommerce,
      onChange: (eCommerce: boolean) => onChange({ ...value, eCommerce }),
    },
    {
      key: "withdrawal",
      title: t("card.settings.withdrawal"),
      description: t("card.settings.withdrawal.description"),
      icon: "money-regular",
      checked: value.withdrawal,
      onChange: (withdrawal: boolean) => onChange({ ...value, withdrawal }),
    },
    {
      key: "international",
      title: t("card.settings.international"),
      description: t("card.settings.international.description"),
      icon: "earth-regular",
      checked: value.international,
      onChange: (international: boolean) => onChange({ ...value, international }),
    },
    {
      key: "nonMainCurrencyTransactions",
      title: t("card.settings.nonMainCurrencyTransactions"),
      description: t("card.settings.nonMainCurrencyTransactions.description"),
      icon: "lake-currencies",
      checked: value.nonMainCurrencyTransactions,
      onChange: (nonMainCurrencyTransactions: boolean) =>
        onChange({ ...value, nonMainCurrencyTransactions }),
    },
  ] as const;

  return (
    <ResponsiveContainer breakpoint={breakpoints.medium} style={styles.root}>
      {() => (
        <>
          <Tile title={t("card.settings.title")}>
            {cardSettingItems.map((item, index, arr) => (
              <View key={item.key}>
                <View style={styles.settingRow}>
                  <Icon name={item.icon} color={colors.current[500]} size={24} />

                  <View style={styles.settingText}>
                    <LakeHeading level={3} variant="h5">
                      {item.title}
                    </LakeHeading>

                    <LakeText variant="smallRegular" color={colors.gray[500]}>
                      {item.description}
                    </LakeText>
                  </View>

                  <Switch disabled={disabled} value={item.checked} onValueChange={item.onChange} />
                </View>

                {index < arr.length - 1 && <Separator />}
              </View>
            ))}
          </Tile>

          <Space height={24} />

          <CardNameField
            disabled={disabled}
            value={value.cardName}
            onChange={cardName => onChange({ ...value, cardName })}
          />
        </>
      )}
    </ResponsiveContainer>
  );
};
