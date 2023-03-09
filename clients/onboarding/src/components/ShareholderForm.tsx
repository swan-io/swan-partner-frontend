import { Box } from "@swan-io/lake/src/components/Box";
import { CheckBox } from "@swan-io/lake/src/components/Checkbox";
import { Fill } from "@swan-io/lake/src/components/Fill";
import { Heading } from "@swan-io/lake/src/components/Heading";
import { Input } from "@swan-io/lake/src/components/Input";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { Picker } from "@swan-io/lake/src/components/Picker";
import { SegmentedControl } from "@swan-io/lake/src/components/SegmentedControl";
import { Space } from "@swan-io/lake/src/components/Space";
import { Svg, Use } from "@swan-io/lake/src/components/Svg";
import { typography } from "@swan-io/lake/src/constants/typography";
import { useBoolean } from "@swan-io/lake/src/hooks/useBoolean";
import { useResponsive } from "@swan-io/lake/src/hooks/useResponsive";
import { getFlagGlyphName } from "@swan-io/lake/src/utils/flagCountry";
import { isNotNullishOrEmpty, isNullish } from "@swan-io/lake/src/utils/nullish";
import {
  countries as countryList,
  CountryCCA3,
  individualCountriesItems,
} from "@swan-io/shared-business/src/constants/countries";
import { validateCompanyTaxNumber } from "@swan-io/shared-business/src/utils/validation";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, Text } from "react-native";
import { combineValidators, hasDefinedKeys, useForm } from "react-ux-form";
import { Rifm } from "rifm";
import { match } from "ts-pattern";
import { Except } from "type-fest";
import {
  AccountCountry,
  AddressInformationInput,
  IndividualUltimateBeneficialOwnerTypeEnum,
} from "../graphql/unauthenticated";
import { decodeBirthDate } from "../utils/date";
import { env } from "../utils/env";
import { rifmDateProps, SupportedLanguage, t, TranslationKey } from "../utils/i18n";
import {
  validateBirthDate,
  validateMandatoryCompanyTaxNumber,
  validateRequired,
} from "../utils/validation";
import { AddressInput, PlaceDetail } from "./AddressInput";
import { CityInput } from "./CityInput";
import { LegacyCountryPicker } from "./CountryPicker";

const isWindows = window.navigator.userAgent.includes("Windows NT");

const styles = StyleSheet.create({
  input: {
    flex: 1,
  },
  half: {
    maxWidth: "50%",
  },
  quarter: {
    maxWidth: "25%",
  },
  itemText: {
    ...typography.bodyLarge,
    lineHeight: 20,
  },
  desktopButton: {
    flexShrink: 1,
    width: 200,
  },
  countryFlag: {
    ...typography.bodyLarge,
    fontSize: 22,
    width: 30,
    position: "relative",
    top: 1,
  },
  countryName: {
    ...typography.bodyLarge,
  },
  windowsFlag: {
    height: 18,
    width: 18,
  },
});

export type OwnerInput = {
  reference: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  birthCountryCode: string;
  birthCity: string;
  birthCityPostalCode: string;
  type: IndividualUltimateBeneficialOwnerTypeEnum;
  indirect?: boolean;
  direct?: boolean;
  totalCapitalPercentage?: number;
  residencyAddress?: {
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    country?: string;
    postalCode?: string;
    state?: string;
  };
  taxIdentificationNumber?: string;
};

type Props = {
  type: "add" | "edit";
  country: CountryCCA3;
  language: SupportedLanguage;
  owner: OwnerInput;
  title: string;
  color: string;
  rootRemainingShare: number;
  onPressConfirm: (
    owner: Omit<OwnerInput, "residencyAddress"> & { residencyAddress?: AddressInformationInput },
  ) => void;
  onPressCancel: () => void;
  accountCountry?: AccountCountry;
};

type Form = Except<OwnerInput, "reference" | "totalCapitalPercentage"> & {
  totalCapitalPercentage: string;
};

const shareholderTypes: { value: Form["type"]; text: TranslationKey }[] = [
  { value: "LegalRepresentative", text: "shareholderForm.legalRepresentative" },
  { value: "HasCapital", text: "shareholderForm.hasCapital" },
  { value: "Other", text: "shareholderForm.other" },
];

export const ShareholderForm = ({
  type,
  language,
  country,
  owner,
  title,
  rootRemainingShare,
  onPressConfirm,
  onPressCancel,
  accountCountry,
}: Props) => {
  const [flagListUrl, setFlagListUrl] = useState("");
  const { desktop, media } = useResponsive();

  useEffect(() => {
    if (isWindows) {
      void import("@swan-io/lake/src/assets/images/flags.svg")
        .then(module => module.default)
        .then(setFlagListUrl);
    }
  }, []);

  const { Field, FieldsListener, submitForm, setFieldValue } = useForm({
    type: {
      initialValue: owner.type,
    },

    holdingType: {
      initialValue: {
        direct: Boolean(owner.direct),
        indirect: Boolean(owner.indirect),
      },
      validate: (value, { getFieldState }) => {
        const { value: ownerType } = getFieldState("type");

        if (ownerType !== "HasCapital") {
          return;
        }
        if (!value.direct && !value.indirect) {
          return t("error.requiredField");
        }
      },
    },

    firstName: {
      initialValue: owner.firstName,
      validate: validateRequired,
      sanitize: value => value.trim(),
    },
    lastName: {
      initialValue: owner.lastName,
      validate: validateRequired,
      sanitize: value => value.trim(),
    },
    birthDate: {
      initialValue: dayjs(owner.birthDate, "YYYY-MM-DD").isValid()
        ? decodeBirthDate(owner.birthDate)
        : owner.birthDate,
      validate: combineValidators(validateRequired, validateBirthDate),
    },
    birthCountryCode: {
      initialValue: owner.birthCountryCode || country,
      validate: validateRequired,
    },
    birthCity: {
      initialValue: owner.birthCity,
      validate: validateRequired,
      sanitize: value => value.trim(),
    },
    birthCityPostalCode: {
      initialValue: owner.birthCityPostalCode,
      validate: validateRequired,
      sanitize: value => value.trim(),
    },

    totalCapitalPercentage: {
      initialValue: owner.totalCapitalPercentage?.toString() ?? "",
      validate: (value, { getFieldState }) => {
        const { value: ownerType } = getFieldState("type");

        if (ownerType !== "HasCapital") {
          return;
        }
        if (!value) {
          return t("error.requiredField");
        }
        const number = Number(value);

        if (
          Number.isNaN(number) ||
          number <= 0 ||
          number > 100 ||
          (type === "add" && number > rootRemainingShare) ||
          (type === "edit" && number > rootRemainingShare + (owner.totalCapitalPercentage ?? 0))
        ) {
          return t("error.invalidPercentage");
        }
      },
      sanitize: value => value.replace(/ /g, "").replace(/,/g, "."),
    },
    address: {
      initialValue: owner.residencyAddress?.addressLine1 ?? "",
      validate: validateRequired,
      sanitize: value => value.trim(),
    },
    city: {
      initialValue: owner.residencyAddress?.city ?? "",
      validate: validateRequired,
      sanitize: value => value.trim(),
    },
    postalCode: {
      initialValue: owner.residencyAddress?.postalCode ?? "",
      validate: validateRequired,
      sanitize: value => value.trim(),
    },
    state: {
      initialValue: owner.residencyAddress?.state ?? "",
      validate: validateRequired,
      sanitize: value => value.trim(),
    },
    country: {
      initialValue: (owner.residencyAddress?.country ?? accountCountry ?? "FRA") as CountryCCA3,
      validate: validateRequired,
    },
    taxIdentificationNumber: {
      initialValue: owner.taxIdentificationNumber ?? "",
      validate: (value, { getFieldState }) => {
        return accountCountry === "DEU" && getFieldState("country").value === "DEU"
          ? validateMandatoryCompanyTaxNumber(value)
          : validateCompanyTaxNumber(value);
      },
      sanitize: value => value.trim(),
    },
  });

  const confirm = useCallback(() => {
    submitForm(values => {
      if (
        !hasDefinedKeys(values, [
          "type",
          "firstName",
          "lastName",
          "birthDate",
          "birthCountryCode",
          "birthCity",
          "birthCityPostalCode",
        ])
      ) {
        return;
      }

      const common = {
        reference: owner.reference,
        type: values.type,
        firstName: values.firstName,
        lastName: values.lastName,
        birthDate: values.birthDate,
        birthCountryCode: values.birthCountryCode,
        birthCity: values.birthCity,
        birthCityPostalCode: values.birthCityPostalCode,
        taxIdentificationNumber: values.taxIdentificationNumber,
        residencyAddress: hasDefinedKeys(values, ["address", "city", "postalCode", "country"])
          ? {
              addressLine1: values.address,
              city: values.city,
              postalCode: values.postalCode,
              country: values.country,
              state: values.state,
            }
          : undefined,
      };

      match(values.type)
        .with("LegalRepresentative", "Other", () => {
          onPressConfirm(common);
        })
        .with("HasCapital", () => {
          onPressConfirm({
            ...common,
            direct: values.holdingType?.direct,
            indirect: values.holdingType?.indirect,
            totalCapitalPercentage: Number(values.totalCapitalPercentage ?? "0"),
          });
        })
        .exhaustive();
    });
  }, [owner.reference, onPressConfirm, submitForm]);

  const countries = useMemo(() => {
    const hasIntl = "Intl" in window && "DisplayNames" in window.Intl;
    const countryResolver =
      hasIntl && Intl.DisplayNames.supportedLocalesOf([language]).length
        ? new Intl.DisplayNames([language], { type: "region" })
        : undefined;

    const seen = new Set();
    return countryList
      .filter(item => {
        const hasBeenSeen = seen.has(item.cca3);
        seen.add(item.cca3);
        return !hasBeenSeen;
      })
      .map(country => ({
        name: (countryResolver ? countryResolver.of(country.cca2) : undefined) ?? country.name,
        flag: isWindows ? getFlagGlyphName(country.flag) : country.flag,
        value: country.cca3,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [language]);

  const [manualModeEnabled, setManualMode] = useBoolean(
    isNotNullishOrEmpty(owner.residencyAddress?.addressLine1) ||
      isNotNullishOrEmpty(owner.residencyAddress?.city) ||
      isNotNullishOrEmpty(owner.residencyAddress?.postalCode) ||
      isNullish(env.GOOGLE_MAP_API_KEY),
  );

  const onSuggestion = useCallback(
    (place: PlaceDetail) => {
      setFieldValue("address", place.completeAddress);
      setFieldValue("city", place.city);
      setFieldValue("postalCode", place.postalCode);

      if (!manualModeEnabled) {
        setManualMode.toggle();
      }
    },
    [manualModeEnabled, setManualMode, setFieldValue],
  );

  return (
    <>
      <Heading level={1} size={media({ mobile: 24, desktop: 32 })}>
        {title}
      </Heading>

      <Space height={media({ mobile: 20, desktop: 40 })} />

      <Box direction={media({ mobile: "column", desktop: "row" })}>
        <Field name="firstName">
          {({ value, valid, error, onChange, onBlur }) => (
            <Input
              label={t("shareholderForm.firstNameLabel")}
              onBlur={onBlur}
              onValueChange={onChange}
              placeholder="John"
              value={value}
              successful={valid}
              error={error}
              style={styles.input}
            />
          )}
        </Field>

        {desktop && <Space width={20} />}

        <Field name="lastName">
          {({ value, valid, error, onChange, onBlur }) => (
            <Input
              label={t("shareholderForm.lastNameLabel")}
              onBlur={onBlur}
              onValueChange={onChange}
              placeholder="Doe"
              value={value}
              successful={valid}
              error={error}
              style={styles.input}
            />
          )}
        </Field>
      </Box>

      <Box direction={media({ mobile: "column", desktop: "row" })}>
        <Field name="birthDate">
          {({ value, valid, error, onChange, onBlur }) => (
            <Rifm value={value} onChange={onChange} {...rifmDateProps}>
              {({ value, onChange }) => (
                <Input
                  label={t("shareholderForm.birthDateLabel")}
                  onBlur={onBlur}
                  onChange={onChange}
                  placeholder="DD/MM/YYYY"
                  value={value}
                  successful={valid}
                  error={error}
                  style={styles.input}
                />
              )}
            </Rifm>
          )}
        </Field>

        {desktop && <Space width={20} />}

        <Field name="birthCountryCode">
          {({ value, onChange }) => (
            <Picker
              style={styles.input}
              label={t("shareholderForm.birthCountryLabel")}
              value={value}
              items={countries}
              onValueChange={onChange}
              renderItem={({ name, flag }) => (
                <Box direction="row" alignItems="center">
                  {flagListUrl !== "" ? (
                    <Svg style={styles.windowsFlag}>
                      <Use xlinkHref={`${flagListUrl}#${flag}`} />
                    </Svg>
                  ) : (
                    <Text style={styles.countryFlag}>{flag}</Text>
                  )}

                  <Space width={isWindows ? 8 : 4} />

                  <Text numberOfLines={1} style={styles.countryName}>
                    {name}
                  </Text>
                </Box>
              )}
            />
          )}
        </Field>
      </Box>

      <Box direction={media({ mobile: "column", desktop: "row" })}>
        <FieldsListener names={["birthCountryCode"]}>
          {({ birthCountryCode: { value: country } }) => (
            <Field name="birthCity">
              {({ value, error, onChange }) => (
                <CityInput
                  label={t("shareholderForm.birthCityLabel")}
                  country={country as CountryCCA3}
                  value={value}
                  onValueChange={onChange}
                  onSuggestion={({ city, postalCode }) => {
                    onChange(city);

                    if (isNotNullishOrEmpty(postalCode)) {
                      setFieldValue("birthCityPostalCode", postalCode);
                    }
                  }}
                  error={error}
                  style={styles.input}
                />
              )}
            </Field>
          )}
        </FieldsListener>

        {desktop && <Space width={20} />}

        <Field name="birthCityPostalCode">
          {({ value, valid, error, onChange, onBlur }) => (
            <Input
              label={t("shareholderForm.birthCityPostalCodeLabel")}
              onBlur={onBlur}
              onValueChange={onChange}
              value={value}
              successful={valid}
              error={error}
              style={styles.input}
            />
          )}
        </Field>
      </Box>

      <Field name="type">
        {({ value, onChange }) => (
          <SegmentedControl
            label={t("shareholderForm.shareholderTypeLabel")}
            onValueChange={onChange}
            value={value}
            items={shareholderTypes}
            renderItem={item => <Text style={styles.itemText}>{t(item.text)}</Text>}
            horizontal={desktop}
          />
        )}
      </Field>

      <Space height={32} />

      <FieldsListener names={["type"]}>
        {({ type: { value: ownerType } }) =>
          ownerType === "HasCapital" ? (
            <>
              <Field name="totalCapitalPercentage">
                {({ value, valid, error, onChange, onBlur }) => (
                  <Input
                    label={t("shareholderForm.shareLabel")}
                    suffix="%"
                    keyboardType="decimal-pad"
                    value={value}
                    successful={valid}
                    error={error}
                    onValueChange={onChange}
                    onBlur={onBlur}
                    inputContainerStyle={desktop ? styles.quarter : styles.half}
                    onSubmitEditing={confirm}
                  />
                )}
              </Field>

              <Box direction="row">
                <Field name="holdingType">
                  {({ value, onChange, error }) => (
                    <>
                      <CheckBox
                        value={value.direct}
                        onValueChange={newValue => onChange({ ...value, direct: newValue })}
                        error={error}
                      >
                        {t("shareholderForm.direct")}
                      </CheckBox>

                      <Space width={32} />

                      <CheckBox
                        value={value.indirect}
                        onValueChange={newValue => onChange({ ...value, indirect: newValue })}
                        error={error}
                      >
                        {t("shareholderForm.indirect")}
                      </CheckBox>
                    </>
                  )}
                </Field>
              </Box>

              <Space height={32} />
            </>
          ) : null
        }
      </FieldsListener>

      {accountCountry === "DEU" ? (
        <>
          <Field name="country">
            {({ value, onChange }) => (
              <LegacyCountryPicker
                label={t("addressPage.countryLabel")}
                value={value}
                items={individualCountriesItems}
                holderType="individual"
                onValueChange={onChange}
              />
            )}
          </Field>

          <FieldsListener names={["country"]}>
            {({ country }) => (
              <AddressInput
                label={t("uboPage.autocompleteLabel")}
                country={country.value}
                inline={desktop}
                manualModeEnabled={manualModeEnabled}
                onManualMode={setManualMode.toggle}
                onSuggestion={onSuggestion}
              />
            )}
          </FieldsListener>

          {manualModeEnabled && (
            <>
              <Field name="address">
                {({ value, error, onChange, onBlur }) => (
                  <Input
                    label={t("addressPage.addressLabel")}
                    value={value}
                    error={error}
                    onValueChange={onChange}
                    onBlur={onBlur}
                  />
                )}
              </Field>

              <Field name="city">
                {({ value, error, onChange, onBlur }) => (
                  <Input
                    label={t("addressPage.cityLabel")}
                    value={value}
                    error={error}
                    onValueChange={onChange}
                    onBlur={onBlur}
                  />
                )}
              </Field>

              <Field name="postalCode">
                {({ value, error, onChange, onBlur }) => (
                  <Input
                    label={t("addressPage.postalCodeLabel")}
                    value={value}
                    error={error}
                    onValueChange={onChange}
                    onBlur={onBlur}
                  />
                )}
              </Field>
            </>
          )}
        </>
      ) : null}

      <FieldsListener names={["country"]}>
        {({ country }) =>
          accountCountry === "DEU" && country.value === "DEU" ? (
            <Field name="taxIdentificationNumber">
              {({ value, error, onChange, onBlur }) => (
                <Input
                  label={t("occupationPage.taxIdentificationNumberPlaceholder")}
                  value={value}
                  onValueChange={onChange}
                  onBlur={onBlur}
                  error={error}
                />
              )}
            </Field>
          ) : null
        }
      </FieldsListener>

      <Fill />

      <Box direction={media({ mobile: "column", desktop: "row" })} justifyContent="spaceBetween">
        <LakeButton
          mode="secondary"
          onPress={onPressCancel}
          style={desktop && styles.desktopButton}
        >
          {t("shareholderForm.cancel")}
        </LakeButton>

        {desktop ? <Space width={8} /> : <Space height={8} />}

        <LakeButton color="partner" onPress={confirm} style={desktop && styles.desktopButton}>
          {t("shareholderForm.confirm")}
        </LakeButton>
      </Box>
    </>
  );
};
