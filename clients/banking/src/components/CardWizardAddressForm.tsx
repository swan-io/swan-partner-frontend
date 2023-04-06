import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { emptyToUndefined } from "@swan-io/lake/src/utils/nullish";
import { CountryPicker } from "@swan-io/shared-business/src/components/CountryPicker";
import { GMapAddressSearchInput } from "@swan-io/shared-business/src/components/GMapAddressSearchInput";
import { CountryCCA3, countries } from "@swan-io/shared-business/src/constants/countries";
import { View } from "react-native";
import { combineValidators, hasDefinedKeys, useForm } from "react-ux-form";
import { locale, t } from "../utils/i18n";
import { validateAddressLine, validateRequired } from "../utils/validations";

export type Address = {
  addressLine1: string;
  addressLine2?: string;
  postalCode: string;
  city: string;
  state?: string;
  country: CountryCCA3;
};

type Props = {
  initialAddress: Address;
  onSubmit: (address: Address) => void;
  onPressClose: () => void;
};

export const CardWizardAddressForm = ({ initialAddress, onPressClose, onSubmit }: Props) => {
  const { Field, FieldsListener, setFieldValue, submitForm } = useForm({
    addressLine1: {
      initialValue: initialAddress.addressLine1,
      validate: combineValidators(validateRequired, validateAddressLine),
    },
    addressLine2: {
      initialValue: initialAddress.addressLine2 ?? "",
    },
    postalCode: {
      initialValue: initialAddress.postalCode,
      validate: validateRequired,
    },
    city: {
      initialValue: initialAddress.city,
      validate: validateRequired,
    },
    state: {
      initialValue: initialAddress.state ?? "",
    },
    country: {
      initialValue: initialAddress.country,
      validate: validateRequired,
    },
  });

  const submit = () => {
    submitForm(values => {
      if (
        hasDefinedKeys(values, [
          "addressLine1",
          "addressLine2",
          "postalCode",
          "city",
          "state",
          "country",
        ])
      ) {
        const { addressLine2, state, ...rest } = values;

        onSubmit({
          ...rest,
          addressLine2: emptyToUndefined(addressLine2),
          state: emptyToUndefined(state),
        });
      }
    });
  };

  return (
    <View>
      <LakeLabel
        label={t("cardWizard.address.country")}
        render={id => (
          <Field name="country">
            {({ value, onChange, error }) => (
              <CountryPicker
                id={id}
                error={error}
                value={value}
                placeholder={t("cardWizard.address.countryPlaceholder")}
                items={countries}
                onValueChange={onChange}
              />
            )}
          </Field>
        )}
      />

      <FieldsListener names={["country"]}>
        {({ country }) => {
          return (
            <>
              <Field name="addressLine1">
                {({ value, onChange, error }) => (
                  <LakeLabel
                    label={t("cardWizard.address.line1")}
                    render={id => (
                      <GMapAddressSearchInput
                        emptyResultText={t("common.noResults")}
                        apiKey={__env.CLIENT_GOOGLE_MAPS_API_KEY}
                        placeholder={t("addressInput.placeholder")}
                        language={locale.language}
                        id={id}
                        error={error}
                        country={country.value}
                        value={value}
                        onValueChange={onChange}
                        onSuggestion={suggestion => {
                          setFieldValue("addressLine1", suggestion.completeAddress);
                          setFieldValue("city", suggestion.city);
                          setFieldValue("country", suggestion.country as CountryCCA3);
                          setFieldValue("postalCode", suggestion.postalCode);
                        }}
                      />
                    )}
                  />
                )}
              </Field>

              <Field name="addressLine2">
                {({ value, onChange, error }) => (
                  <LakeLabel
                    label={t("cardWizard.address.line2")}
                    render={id => (
                      <LakeTextInput
                        id={id}
                        error={error}
                        placeholder={t("cardWizard.address.line2Placeholder")}
                        value={value}
                        onChangeText={onChange}
                      />
                    )}
                  />
                )}
              </Field>

              <Field name="postalCode">
                {({ value, onChange, error }) => (
                  <LakeLabel
                    label={t("cardWizard.address.postalCode")}
                    render={id => (
                      <LakeTextInput
                        id={id}
                        error={error}
                        placeholder={t("cardWizard.address.postalCodePlaceholder")}
                        value={value}
                        onChangeText={onChange}
                      />
                    )}
                  />
                )}
              </Field>

              <Field name="state">
                {({ value, onChange, error }) => (
                  <LakeLabel
                    label={t("cardWizard.address.state")}
                    render={id => (
                      <LakeTextInput
                        id={id}
                        error={error}
                        placeholder={t("cardWizard.address.statePlaceholder")}
                        value={value}
                        onChangeText={onChange}
                      />
                    )}
                  />
                )}
              </Field>

              <Field name="city">
                {({ value, onChange, error }) => (
                  <LakeLabel
                    label={t("cardWizard.address.city")}
                    render={id => (
                      <LakeTextInput
                        id={id}
                        error={error}
                        placeholder={t("cardWizard.address.cityPlaceholder")}
                        value={value}
                        onChangeText={onChange}
                      />
                    )}
                  />
                )}
              </Field>
            </>
          );
        }}
      </FieldsListener>

      <LakeButtonGroup>
        <LakeButton mode="secondary" onPress={onPressClose} grow={true}>
          {t("common.cancel")}
        </LakeButton>

        <LakeButton onPress={submit} color="current" grow={true}>
          {t("common.change")}
        </LakeButton>
      </LakeButtonGroup>
    </View>
  );
};
