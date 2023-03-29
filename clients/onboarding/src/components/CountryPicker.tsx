import { Icon } from "@swan-io/lake/src/components/Icon";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { Space } from "@swan-io/lake/src/components/Space";
import { colors, texts } from "@swan-io/lake/src/constants/design";
import { CountryItem, CountryPicker } from "@swan-io/shared-business/src/components/CountryPicker";
import { CountryCCA3 } from "@swan-io/shared-business/src/constants/countries";
import { StyleSheet } from "react-native";
import { DocumentationLink } from "../components/DocumentationLink";
import { t } from "../utils/i18n";

const styles = StyleSheet.create({
  selectCountryLink: {
    ...texts.medium,
    color: colors.gray[600],
    display: "flex",
    alignItems: "center",
  },
});

// New CountrySelect component used for the new onboarding flow
// Once the new onboarding flow is complete, we can remove the CountryPicker component
type CountrySelectProps<T extends CountryCCA3> = {
  label: string;
  onValueChange: (country: T) => void;
  value: T;
  items: CountryItem<T>[];
  holderType: "individual" | "company";
  onlyIconHelp: boolean;
  hideError?: boolean;
};

export function OnboardingCountryPicker<T extends CountryCCA3>({
  label,
  onValueChange,
  value,
  items,
  holderType,
  onlyIconHelp,
  hideError,
}: CountrySelectProps<T>) {
  return (
    <LakeLabel
      label={label}
      render={() => (
        <CountryPicker
          items={items}
          value={value}
          hideErrors={hideError}
          onValueChange={onValueChange}
        />
      )}
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
