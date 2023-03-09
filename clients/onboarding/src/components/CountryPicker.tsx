import { Box } from "@swan-io/lake/src/components/Box";
import { Flag } from "@swan-io/lake/src/components/Flag";
import { Icon } from "@swan-io/lake/src/components/Icon";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { Picker } from "@swan-io/lake/src/components/Picker";
import { Space } from "@swan-io/lake/src/components/Space";
import { colors, texts } from "@swan-io/lake/src/constants/design";
import { typography } from "@swan-io/lake/src/constants/typography";
import { CountryItem, CountryPicker } from "@swan-io/shared-business/src/components/CountryPicker";
import { CountryCCA3 } from "@swan-io/shared-business/src/constants/countries";
import { useCallback } from "react";
import { StyleSheet, Text } from "react-native";
import { DocumentationLink } from "../components/DocumentationLink";
import { t } from "../utils/i18n";

const styles = StyleSheet.create({
  text: typography.bodyLarge,
  link: {
    ...typography.bodyLarge,
    fontWeight: typography.fontWeights.demi,
    textDecorationLine: "underline",
    textAlign: "right",
  },
  selectCountryLink: {
    ...texts.medium,
    color: colors.gray[600],
    display: "flex",
    alignItems: "center",
  },
});

type Props<T extends CountryCCA3> = {
  onValueChange: (country: T) => void;
  label: string;
  value: T;
  items: CountryItem<T>[];
  holderType: "individual" | "company";
};

export function LegacyCountryPicker<T extends CountryCCA3>({
  label,
  onValueChange,
  value,
  items,
  holderType,
}: Props<T>) {
  return (
    <Picker
      label={label}
      items={items.map(item => ({
        value: item.cca3,
        text: item.name,
      }))}
      value={value}
      onValueChange={onValueChange}
      renderItem={useCallback(
        (item: { value: CountryCCA3; text: string }) => (
          <Box direction="row" alignItems="center">
            <Flag icon={item.value} width={20} />
            <Space width={16} />

            <Text numberOfLines={1} selectable={false} style={styles.text}>
              {item.text}
            </Text>
          </Box>
        ),
        [],
      )}
      info={
        <DocumentationLink
          page={
            holderType === "company" ? "companyAvailableCountries" : "individualAvailableCountries"
          }
          style={styles.link}
        >
          {t("addressPage.countryNotAvailable")}
        </DocumentationLink>
      }
    />
  );
}

// New CountrySelect component used for the new onboarding flow
// Once the new onboarding flow is complete, we can remove the CountryPicker component
type CountrySelectProps<T extends CountryCCA3> = {
  label: string;
  onValueChange: (country: T) => void;
  value: T;
  items: CountryItem<T>[];
  holderType: "individual" | "company";
  onlyIconHelp: boolean;
};

export function OnboardingCountryPicker<T extends CountryCCA3>({
  label,
  onValueChange,
  value,
  items,
  holderType,
  onlyIconHelp,
}: CountrySelectProps<T>) {
  return (
    <LakeLabel
      label={label}
      render={() => <CountryPicker items={items} value={value} onValueChange={onValueChange} />}
      help={
        <DocumentationLink
          page={
            holderType === "company" ? "companyAvailableCountries" : "individualAvailableCountries"
          }
          style={styles.selectCountryLink}
        >
          <Icon name="question-circle-regular" size={16} color={colors.gray[600]} />

          {!onlyIconHelp && (
            <>
              <Space width={8} />

              {t("addressPage.countryNotAvailable")}
            </>
          )}
        </DocumentationLink>
      }
    />
  );
}
