import { Box } from "@swan-io/lake/src/components/Box";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeSelect } from "@swan-io/lake/src/components/LakeSelect";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { SegmentedControl } from "@swan-io/lake/src/components/SegmentedControl";
import { Space } from "@swan-io/lake/src/components/Space";
import { SwanLogo } from "@swan-io/lake/src/components/SwanLogo";
import { backgroundColor, colors, spacings } from "@swan-io/lake/src/constants/design";
import { useBoolean } from "@swan-io/lake/src/hooks/useBoolean";
import { useResponsive } from "@swan-io/lake/src/hooks/useResponsive";
import { isNullish } from "@swan-io/lake/src/utils/nullish";
import { CountryPicker } from "@swan-io/shared-business/src/components/CountryPicker";
import { GMapAddressSearchInput } from "@swan-io/shared-business/src/components/GMapAddressSearchInput";
import { CountryCCA3, allCountries } from "@swan-io/shared-business/src/constants/countries";
import { useMemo } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { hasDefinedKeys, useForm } from "react-ux-form";
import { formatCurrency } from "../../../banking/src/utils/i18n";
import { env } from "../utils/env";
import { languages, locale, setPreferredLanguage, t } from "../utils/i18n";
import { Router } from "../utils/routes";

const items = [{ id: "sdd", name: "SEPA Direct Debit" }] as const;

const styles = StyleSheet.create({
  container: {
    marginHorizontal: "auto",
    maxWidth: 960,
    width: "100%",
    paddingHorizontal: spacings[24],
    paddingVertical: spacings[32],
  },
  label: {
    flexBasis: "50%",
    flexShrink: 1,
    alignSelf: "stretch",
  },
  segmentedControlDesktop: {
    maxWidth: "50%",
  },
  segmentedControl: {
    maxWidth: "100%",
  },
  swanLogo: {
    display: "inline-flex",
    height: 9,
    width: 45 * (9 / 10),
  },
  buttonItem: { width: "50%" },
  buttonItemDesktop: { width: "15%" },
  selectLanguage: {
    alignItems: "flex-end",
  },
});

type ItemId = (typeof items)[number]["id"];
const merchantName = "Test";

type FormState = {
  paymentMethod: ItemId;
  iban: string;
  country: CountryCCA3;
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  postalCode: string;
  state: string;
};

export const PaymentForm = () => {
  const { desktop } = useResponsive();

  const [manualModeEnabled, setManualMode] = useBoolean(isNullish(env.GOOGLE_MAP_API_KEY));

  const { Field, submitForm, FieldsListener, setFieldValue } = useForm<FormState>({
    paymentMethod: {
      initialValue: items[0].id,
      // validate: validateRequired,
    },
    iban: {
      initialValue: "",
      // validate: combineValidators(validateRequired, validateIban),
      sanitize: value => value.trim(),
    },
    country: {
      initialValue: "FRA",
      // validate: validateRequired,
    },
    firstName: {
      initialValue: "",
      // validate: validateRequired,
      sanitize: value => value.trim(),
    },
    lastName: {
      initialValue: "",
      // validate: validateRequired,
      sanitize: value => value.trim(),
    },
    addressLine1: {
      initialValue: "",
      // validate: validateRequired,
      sanitize: value => value.trim(),
    },
    addressLine2: {
      initialValue: "",
      sanitize: value => value.trim(),
    },
    city: {
      initialValue: "",
      // validate: validateRequired,
      sanitize: value => value.trim(),
    },
    postalCode: {
      initialValue: "",
      // validate: validateRequired,
      sanitize: value => value.trim(),
    },
    state: {
      initialValue: "",
      // validate: validateRequired,
      sanitize: value => value.trim(),
    },
  });

  const onPressSubmit = () => {
    submitForm(values => {
      if (
        hasDefinedKeys(values, [
          "paymentMethod",
          "iban",
          "country",
          "firstName",
          "lastName",
          "addressLine1",
          "city",
          "postalCode",
          "state",
        ])
      ) {
        Router.replace("Success");
        console.log(values);
      }
    });
  };

  const languageOptions = useMemo(() => {
    return languages.map(country => ({
      name: country.native,
      value: country.id,
    }));
  }, []);

  return (
    <ScrollView
      style={{
        backgroundColor: backgroundColor.default,
      }}
      contentContainerStyle={styles.container}
    >
      <Box direction="row" alignItems="center" justifyContent="spaceBetween">
        <Box style={desktop ? styles.buttonItemDesktop : styles.buttonItem}>
          <LakeButton
            ariaLabel={t("common.cancel")}
            icon="dismiss-regular"
            mode="tertiary"
            grow={true}
            onPress={() => {}}
          >
            {t("common.cancel")}
          </LakeButton>
        </Box>

        <Box
          style={[desktop ? styles.buttonItemDesktop : styles.buttonItem, styles.selectLanguage]}
        >
          <LakeSelect
            value={locale.language}
            items={languageOptions}
            hideErrors={true}
            mode="borderless"
            onValueChange={locale => {
              setPreferredLanguage(locale);
            }}
          />
        </Box>
      </Box>

      <Space height={24} />

      {/* Just for tests */}
      <SwanLogo
        color={colors.swan[500]}
        // eslint-disable-next-line react-native/no-inline-styles
        style={{
          alignSelf: "center",
          width: "144px",
        }}
      />

      <Space height={24} />
      <LakeText align="center">Merchant item</LakeText>
      <Space height={12} />

      <LakeHeading variant="h1" level={2} align="center">
        {formatCurrency(Number(10), "EUR")}
      </LakeHeading>

      <Space height={32} />

      <Field name="paymentMethod">
        {({ value, onChange }) => (
          <LakeLabel
            style={desktop ? styles.segmentedControlDesktop : styles.segmentedControl}
            label={t("paymentLink.paymentMethod")}
            render={() => (
              <SegmentedControl
                mode="desktop"
                selected={value}
                items={items}
                onValueChange={onChange}
              />
            )}
          />
        )}
      </Field>

      <Space height={24} />

      <Field name="iban">
        {({ value, valid, error, onChange, onBlur, ref }) => (
          <LakeLabel
            label={t("paymentLink.iban")}
            render={() => (
              <LakeTextInput
                value={value}
                valid={valid}
                error={error}
                onBlur={onBlur}
                onChangeText={onChange}
                ref={ref}
              />
            )}
          />
        )}
      </Field>

      <Field name="country">
        {({ value, error, onChange, ref }) => (
          <LakeLabel
            label={t("paymentLink.country")}
            render={id => (
              <CountryPicker
                id={id}
                countries={allCountries}
                value={value}
                onValueChange={onChange}
                error={error}
                ref={ref}
              />
            )}
          />
        )}
      </Field>

      <Box direction={desktop ? "row" : "column"}>
        <Field name="firstName">
          {({ value, valid, error, onChange, onBlur, ref }) => (
            <LakeLabel
              label={t("paymentLink.firstName")}
              render={() => (
                <LakeTextInput
                  value={value}
                  valid={valid}
                  error={error}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  ref={ref}
                />
              )}
              style={styles.label}
            />
          )}
        </Field>

        <Space width={24} />

        <Field name="lastName">
          {({ value, valid, error, onChange, onBlur, ref }) => (
            <LakeLabel
              style={styles.label}
              label={t("paymentLink.lastName")}
              render={() => (
                <LakeTextInput
                  value={value}
                  valid={valid}
                  error={error}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  ref={ref}
                />
              )}
            />
          )}
        </Field>
      </Box>

      <FieldsListener names={["country"]}>
        {({ country }) => (
          <Field name="addressLine1">
            {({ value, onChange, error }) => (
              <LakeLabel
                label={t("paymentLink.addressLine1")}
                render={id => (
                  <GMapAddressSearchInput
                    emptyResultText={t("common.noResults")}
                    apiKey={__env.CLIENT_GOOGLE_MAPS_API_KEY}
                    shouldDisplaySuggestions={!manualModeEnabled}
                    placeholder={t("paymentLink.addressInput.placeholder")}
                    language={locale.language}
                    id={id}
                    country={country.value}
                    value={value}
                    error={error}
                    onValueChange={onChange}
                    onSuggestion={suggestion => {
                      setFieldValue("addressLine1", suggestion.completeAddress);
                      setFieldValue("city", suggestion.city);
                      setFieldValue("country", suggestion.country as CountryCCA3);
                      setFieldValue("postalCode", suggestion.postalCode);
                      setManualMode.on();
                    }}
                  />
                )}
                actions={
                  !manualModeEnabled && desktop ? (
                    <LakeButton mode="secondary" size="small" onPress={setManualMode.on}>
                      {t("paymentLink.addressInput.button")}
                    </LakeButton>
                  ) : null
                }
              />
            )}
          </Field>
        )}
      </FieldsListener>

      {manualModeEnabled && (
        <Field name="addressLine2">
          {({ value, valid, error, onChange, onBlur, ref }) => (
            <LakeLabel
              label={t("paymentLink.addressLine2")}
              render={() => (
                <LakeTextInput
                  value={value}
                  valid={valid}
                  error={error}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  ref={ref}
                />
              )}
            />
          )}
        </Field>
      )}

      <Field name="city">
        {({ value, valid, error, onChange, onBlur, ref }) => (
          <LakeLabel
            label={t("paymentLink.city")}
            render={() => (
              <LakeTextInput
                value={value}
                valid={valid}
                error={error}
                onChangeText={onChange}
                onBlur={onBlur}
                ref={ref}
              />
            )}
          />
        )}
      </Field>

      <Box direction={desktop ? "row" : "column"}>
        <Field name="postalCode">
          {({ value, valid, error, onChange, onBlur, ref }) => (
            <LakeLabel
              label={t("paymentLink.postcode")}
              render={() => (
                <LakeTextInput
                  value={value}
                  valid={valid}
                  error={error}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  ref={ref}
                />
              )}
              style={styles.label}
            />
          )}
        </Field>

        <Space width={24} />

        <Field name="state">
          {({ value, valid, error, onChange, onBlur, ref }) => (
            <LakeLabel
              style={styles.label}
              label={t("paymentLink.state")}
              render={() => (
                <LakeTextInput
                  value={value}
                  valid={valid}
                  error={error}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  ref={ref}
                />
              )}
            />
          )}
        </Field>
      </Box>

      <Space height={32} />

      <LakeButton color="current" onPress={onPressSubmit}>
        <LakeText color={colors.gray[50]}> {t("button.pay")}</LakeText>
      </LakeButton>

      <Space height={32} />

      <LakeText color={colors.gray[700]} align="center">
        {t("paymentLink.termsAndConditions", { merchantName })}
      </LakeText>

      <Space height={32} />

      <Box direction="row" alignItems="baseline">
        <LakeText>{t("paymentLink.poweredBySwan")}</LakeText>
        <Space width={4} />
        <SwanLogo color={colors.swan[500]} style={styles.swanLogo} />
      </Box>
    </ScrollView>
  );
};
