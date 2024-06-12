import { Option } from "@swan-io/boxed";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { emptyToUndefined } from "@swan-io/lake/src/utils/nullish";
import { CountryPicker } from "@swan-io/shared-business/src/components/CountryPicker";
import { PlacekitAddressSearchInput } from "@swan-io/shared-business/src/components/PlacekitAddressSearchInput";
import { CountryCCA3, allCountries } from "@swan-io/shared-business/src/constants/countries";
import { combineValidators, useForm } from "@swan-io/use-form";
import { forwardRef, useCallback, useImperativeHandle } from "react";
import { View } from "react-native";
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
  initialAddress: Omit<Address, "country"> & { country?: CountryCCA3 };
  showButtons?: boolean;
  onSubmit: (address: Address) => void;
  onPressClose?: () => void;
};

export type CardWizardAddressFormRef = { submit: () => void };

export const CardWizardAddressForm = forwardRef<CardWizardAddressFormRef, Props>(
  ({ initialAddress, onPressClose, onSubmit, showButtons = true }: Props, ref) => {
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
        initialValue: initialAddress.country ?? "",
        validate: validateRequired,
      },
    });

    const submit = useCallback(() => {
      submitForm({
        onSuccess: values => {
          const option = Option.allFromDict(values);

          if (option.isSome()) {
            const { addressLine2, state, country, ...rest } = option.get();

            onSubmit({
              ...rest,
              addressLine2: emptyToUndefined(addressLine2),
              state: emptyToUndefined(state),
              country: country as CountryCCA3,
            });
          }
        },
      });
    }, [onSubmit, submitForm]);

    useImperativeHandle(
      ref,
      () => ({
        submit,
      }),
      [submit],
    );

    return (
      <View>
        <LakeLabel
          label={t("cardWizard.address.country")}
          render={id => (
            <Field name="country">
              {({ value, onChange, error, ref }) => (
                <CountryPicker
                  id={id}
                  ref={ref}
                  error={error}
                  value={value === "" ? undefined : (value as CountryCCA3)}
                  placeholder={t("cardWizard.address.countryPlaceholder")}
                  countries={allCountries}
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
                        <PlacekitAddressSearchInput
                          apiKey={__env.CLIENT_PLACEKIT_API_KEY}
                          country={(country.value as CountryCCA3) ?? "FRA"}
                          value={value}
                          onValueChange={onChange}
                          onSuggestion={suggestion => {
                            setFieldValue("addressLine1", suggestion.completeAddress);
                            setFieldValue("city", suggestion.city);
                            setFieldValue("postalCode", suggestion.postalCode ?? "");
                          }}
                          language={locale.language}
                          placeholder={t("addressInput.placeholder")}
                          emptyResultText={t("common.noResults")}
                          error={error}
                          id={id}
                        />
                      )}
                    />
                  )}
                </Field>

                <Field name="addressLine2">
                  {({ value, onChange, error, ref }) => (
                    <LakeLabel
                      label={t("cardWizard.address.line2")}
                      render={id => (
                        <LakeTextInput
                          id={id}
                          ref={ref}
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
                  {({ value, onChange, error, ref }) => (
                    <LakeLabel
                      label={t("cardWizard.address.postalCode")}
                      render={id => (
                        <LakeTextInput
                          id={id}
                          ref={ref}
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
                  {({ value, onChange, error, ref }) => (
                    <LakeLabel
                      label={t("cardWizard.address.state")}
                      render={id => (
                        <LakeTextInput
                          id={id}
                          ref={ref}
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
                  {({ value, onChange, error, ref }) => (
                    <LakeLabel
                      label={t("cardWizard.address.city")}
                      render={id => (
                        <LakeTextInput
                          id={id}
                          ref={ref}
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

        {showButtons ? (
          <LakeButtonGroup>
            <LakeButton mode="secondary" onPress={onPressClose} grow={true}>
              {t("common.cancel")}
            </LakeButton>

            <LakeButton onPress={submit} color="current" grow={true}>
              {t("common.change")}
            </LakeButton>
          </LakeButtonGroup>
        ) : null}
      </View>
    );
  },
);
