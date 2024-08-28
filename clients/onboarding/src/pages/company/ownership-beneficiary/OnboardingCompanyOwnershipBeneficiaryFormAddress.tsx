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
import { forwardRef, useCallback, useImperativeHandle } from "react";
import { View } from "react-native";
import { P, match } from "ts-pattern";
import { AccountCountry } from "../../../graphql/unauthenticated";
import { locale, t } from "../../../utils/i18n";

export type FormValues = {
  residencyAddressLine1: string;
  residencyAddressCity: string;
  residencyAddressPostalCode: string;
  residencyAddressCountry: CountryCCA3;
  taxIdentificationNumber: string;
};

export type Input = {
  residencyAddressLine1?: string;
  residencyAddressCity?: string;
  residencyAddressPostalCode?: string;
  residencyAddressCountry: CountryCCA3;
  taxIdentificationNumber?: string;
};

type Props = {
  placekitApiKey: string | undefined;
  accountCountry: AccountCountry;
  companyCountry: CountryCCA3;
  initialValues: Partial<Input>;
  onSave: (input: Input) => void | Promise<void>;
};

export type OnboardingCompanyOwnershipBeneficiaryFormAddressRef = {
  getInput: () => Input;
  submit: () => void;
};

export const OnboardingCompanyOwnershipBeneficiaryFormAddress = forwardRef<
  OnboardingCompanyOwnershipBeneficiaryFormAddressRef,
  Props
>(({ placekitApiKey, accountCountry, companyCountry, initialValues, onSave }, ref) => {
  const { Field, FieldsListener, getFieldValue, setFieldValue, submitForm } = useForm<FormValues>({
    residencyAddressLine1: {
      initialValue: initialValues.residencyAddressLine1 ?? "",
      sanitize: trim,
      validate: validateRequired,
    },
    residencyAddressCity: {
      initialValue: initialValues.residencyAddressCity ?? "",
      sanitize: trim,
      validate: validateRequired,
    },
    residencyAddressPostalCode: {
      initialValue: initialValues.residencyAddressPostalCode ?? "",
      sanitize: trim,
      validate: validateRequired,
    },
    residencyAddressCountry: {
      initialValue: isCountryCCA3(initialValues.residencyAddressCountry)
        ? initialValues.residencyAddressCountry
        : companyCountry,
      validate: validateRequired,
    },
    taxIdentificationNumber: {
      initialValue: initialValues.taxIdentificationNumber ?? "",
      sanitize: trim,
      validate: (value, { getFieldValue }) => {
        const beneficiaryCountry = getFieldValue("residencyAddressCountry");

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
        residencyAddressLine1: getFieldValue("residencyAddressLine1"),
        residencyAddressCity: getFieldValue("residencyAddressCity"),
        residencyAddressPostalCode: getFieldValue("residencyAddressPostalCode"),
        residencyAddressCountry: getFieldValue("residencyAddressCountry"),
        taxIdentificationNumber: getFieldValue("taxIdentificationNumber"),
      }),
      submit: () => {
        submitForm({
          onSuccess: ({
            residencyAddressLine1,
            residencyAddressCity,
            residencyAddressPostalCode,
            residencyAddressCountry,
            taxIdentificationNumber,
          }) => {
            const requiredFields = Option.allFromDict({
              residencyAddressCountry,
              ...match(accountCountry)
                .with("DEU", "ESP", () => ({
                  residencyAddressLine1,
                  residencyAddressCity,
                  residencyAddressPostalCode,
                }))
                .otherwise(() => ({})),
            });

            return match(requiredFields)
              .with(Option.P.Some(P.select()), requiredFields => {
                return onSave({
                  residencyAddressLine1: residencyAddressLine1.toUndefined(),
                  residencyAddressCity: residencyAddressCity.toUndefined(),
                  residencyAddressPostalCode: residencyAddressPostalCode.toUndefined(),
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
      setFieldValue("residencyAddressLine1", place.completeAddress);
      setFieldValue("residencyAddressCity", place.city);
      if (place.postalCode != null) {
        setFieldValue("residencyAddressPostalCode", place.postalCode);
      }
    },
    [setFieldValue],
  );

  return (
    <View role="form">
      <Field name="residencyAddressCountry">
        {({ value, onChange }) => (
          <LakeLabel
            label={t("company.step.owners.beneficiary.country")}
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

      <FieldsListener names={["residencyAddressCountry"]}>
        {({ residencyAddressCountry }) => (
          <>
            <Field name="residencyAddressLine1">
              {({ ref, value, onChange, error }) => (
                <LakeLabel
                  label={t("company.step.owners.beneficiary.residencyAddress")}
                  render={id => (
                    <PlacekitAddressSearchInput
                      inputRef={ref}
                      apiKey={placekitApiKey}
                      emptyResultText={t("common.noResult")}
                      placeholder={t("company.step.owners.beneficiary.residencyAddressPlaceholder")}
                      language={locale.language}
                      id={id}
                      country={residencyAddressCountry.value ?? accountCountry}
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

            <Field name="residencyAddressCity">
              {({ ref, value, valid, error, onChange }) => (
                <LakeLabel
                  label={t("company.step.owners.beneficiary.residencyAddressCity")}
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

            <Field name="residencyAddressPostalCode">
              {({ ref, value, valid, error, onChange }) => (
                <LakeLabel
                  label={t("company.step.owners.beneficiary.residencyAddressPostalCode")}
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

            {match({ accountCountry, residencyAddressCountry: residencyAddressCountry.value })
              .with(
                { accountCountry: "DEU", residencyAddressCountry: "DEU" },
                { accountCountry: "ESP" },
                { accountCountry: "ITA" },
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
                          accountCountry={accountCountry}
                          isCompany={false}
                          // is mandatory for German accounts with UBO living in Germany, same for Italy
                          required={
                            (accountCountry === "DEU" && residencyAddressCountry.value === "DEU") ||
                            (accountCountry === "ITA" && residencyAddressCountry.value === "ITA")
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
});
