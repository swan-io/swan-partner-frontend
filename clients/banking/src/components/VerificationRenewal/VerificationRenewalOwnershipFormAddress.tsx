import { Option } from "@swan-io/boxed";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { Space } from "@swan-io/lake/src/components/Space";
import { trim } from "@swan-io/lake/src/utils/string";
import { CountryPicker } from "@swan-io/shared-business/src/components/CountryPicker";
import {
  AddressDetail,
  PlacekitAddressSearchInput,
} from "@swan-io/shared-business/src/components/PlacekitAddressSearchInput";
import { TaxIdentificationNumberInput } from "@swan-io/shared-business/src/components/TaxIdentificationNumberInput";
import {
  CountryCCA3,
  allCountries,
  isCountryCCA3,
} from "@swan-io/shared-business/src/constants/countries";
import {
  validateIndividualTaxNumber,
  validateRequired,
} from "@swan-io/shared-business/src/utils/validation";
import { combineValidators, useForm } from "@swan-io/use-form";
import { Ref, useCallback, useImperativeHandle } from "react";
import { View } from "react-native";
import { P, match } from "ts-pattern";
import { AccountCountry } from "../../graphql/partner";
import { locale, t } from "../../utils/i18n";

export type FormValues = {
  addressLine1: string;
  city: string;
  postalCode: string;
  country: CountryCCA3;
  taxIdentificationNumber: string;
};

export type Input = {
  addressLine1?: string;
  city?: string;
  postalCode?: string;
  country: CountryCCA3;
  taxIdentificationNumber?: string;
};

export type VerificationRenewalOwnershipFormAddressRef = {
  getInput: () => Input;
  submit: () => void;
};

type Props = {
  ref?: Ref<VerificationRenewalOwnershipFormAddressRef>;
  placekitApiKey: string | undefined;
  accountCountry: AccountCountry;
  companyCountry: CountryCCA3;
  initialValues: Partial<Input>;
  onSave: (input: Input) => void | Promise<void>;
};

export const VerificationRenewalOwnershipFormAddress = ({
  ref,
  placekitApiKey,
  accountCountry,
  companyCountry,
  initialValues,
  onSave,
}: Props) => {
  const { Field, FieldsListener, getFieldValue, setFieldValue, submitForm } = useForm<FormValues>({
    addressLine1: {
      initialValue: initialValues.addressLine1 ?? "",
      sanitize: trim,
      validate: validateRequired,
    },
    city: {
      initialValue: initialValues.city ?? "",
      sanitize: trim,
      validate: validateRequired,
    },
    postalCode: {
      initialValue: initialValues.postalCode ?? "",
      sanitize: trim,
      validate: validateRequired,
    },
    country: {
      initialValue: isCountryCCA3(initialValues.country) ? initialValues.country : companyCountry,
      validate: validateRequired,
    },
    taxIdentificationNumber: {
      initialValue: initialValues.taxIdentificationNumber ?? "",
      sanitize: trim,
      validate: (value, { getFieldValue }) => {
        const beneficiaryCountry = getFieldValue("country");

        if (
          (accountCountry === "DEU" && beneficiaryCountry === "DEU") ||
          (accountCountry === "ITA" && beneficiaryCountry === "ITA")
        ) {
          return combineValidators(
            validateRequired,
            validateIndividualTaxNumber(accountCountry),
          )(value);
        }

        return validateIndividualTaxNumber(accountCountry)(value);
      },
    },
  });

  useImperativeHandle(ref, () => {
    return {
      getInput: () => ({
        addressLine1: getFieldValue("addressLine1"),
        city: getFieldValue("city"),
        postalCode: getFieldValue("postalCode"),
        country: getFieldValue("country"),
        taxIdentificationNumber: getFieldValue("taxIdentificationNumber"),
      }),
      submit: () => {
        submitForm({
          onSuccess: ({ addressLine1, city, postalCode, country, taxIdentificationNumber }) => {
            const requiredFields = Option.allFromDict({
              country,
              ...match(accountCountry)
                .with("DEU", "ESP", "BEL", () => ({
                  addressLine1,
                  city,
                  postalCode,
                }))
                .otherwise(() => ({})),
            });

            return match(requiredFields)
              .with(Option.P.Some(P.select()), requiredFields => {
                return onSave({
                  addressLine1: addressLine1.toUndefined(),
                  city: city.toUndefined(),
                  postalCode: postalCode.toUndefined(),
                  ...requiredFields,
                  taxIdentificationNumber: taxIdentificationNumber.toUndefined(),
                });
              })
              .otherwise(() => {});
          },
        });
      },
    };
  });

  const onSuggestion = useCallback(
    (place: AddressDetail) => {
      setFieldValue("addressLine1", place.completeAddress);
      setFieldValue("city", place.city);
      if (place.postalCode != null) {
        setFieldValue("postalCode", place.postalCode);
      }
    },
    [setFieldValue],
  );

  return (
    <View role="form">
      <Field name="country">
        {({ value, onChange }) => (
          <LakeLabel
            label={t("verificationRenewal.ownership.country")}
            render={id => (
              <CountryPicker
                id={id}
                value={value}
                countries={allCountries}
                onValueChange={onChange}
              />
            )}
          />
        )}
      </Field>

      <Space height={12} />

      <FieldsListener names={["country"]}>
        {({ country }) => (
          <>
            <Field name="addressLine1">
              {({ ref, value, onChange, error }) => (
                <LakeLabel
                  label={t("verificationRenewal.ownership.residencyAddress")}
                  render={id => (
                    <PlacekitAddressSearchInput
                      inputRef={ref}
                      apiKey={placekitApiKey}
                      emptyResultText={t("common.noResults")}
                      placeholder={t("verificationRenewal.ownership.residencyAddressPlaceholder")}
                      language={locale.language}
                      id={id}
                      country={country.value ?? accountCountry}
                      value={value}
                      error={error}
                      onValueChange={onChange}
                      onSuggestion={onSuggestion}
                    />
                  )}
                />
              )}
            </Field>

            <Space height={12} />

            <Field name="city">
              {({ ref, value, valid, error, onChange }) => (
                <LakeLabel
                  label={t("verificationRenewal.ownership.residencyAddressCity")}
                  render={id => (
                    <LakeTextInput
                      ref={ref}
                      id={id}
                      value={value}
                      valid={valid}
                      error={error}
                      onChangeText={onChange}
                    />
                  )}
                />
              )}
            </Field>

            <Space height={12} />

            <Field name="postalCode">
              {({ ref, value, valid, error, onChange }) => (
                <LakeLabel
                  label={t("verificationRenewal.ownership.residencyAddressPostalCode")}
                  render={id => (
                    <LakeTextInput
                      ref={ref}
                      id={id}
                      value={value}
                      valid={valid}
                      error={error}
                      onChangeText={onChange}
                    />
                  )}
                />
              )}
            </Field>

            {match({ accountCountry, residencyAddressCountry: country.value })
              .with(
                { accountCountry: "DEU", residencyAddressCountry: "DEU" },
                { accountCountry: "ESP" },
                { accountCountry: "ITA" },
                { accountCountry: "BEL" },
                () => (
                  <>
                    <Space height={12} />

                    <Field name="taxIdentificationNumber">
                      {({ value, error, valid, onChange, onBlur }) => (
                        <TaxIdentificationNumberInput
                          onBlur={onBlur}
                          value={value ?? ""}
                          error={error}
                          valid={valid}
                          onChange={onChange}
                          country={accountCountry}
                          isCompany={false}
                          // is mandatory for German accounts with UBO living in Germany, same for Italy
                          required={
                            (accountCountry === "DEU" && country.value === "DEU") ||
                            (accountCountry === "ITA" && country.value === "ITA")
                          }
                        />
                      )}
                    </Field>
                  </>
                ),
              )
              .otherwise(() => null)}
          </>
        )}
      </FieldsListener>
    </View>
  );
};
