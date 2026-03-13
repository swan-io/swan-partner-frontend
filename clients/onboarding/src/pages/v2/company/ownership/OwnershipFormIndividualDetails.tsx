import { Option } from "@swan-io/boxed";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { Item, LakeSelect } from "@swan-io/lake/src/components/LakeSelect";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { RadioGroup } from "@swan-io/lake/src/components/RadioGroup";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { breakpoints } from "@swan-io/lake/src/constants/design";
import { trim } from "@swan-io/lake/src/utils/string";
import { BirthdatePicker } from "@swan-io/shared-business/src/components/BirthdatePicker";
import { CountryPicker } from "@swan-io/shared-business/src/components/CountryPicker";
import {
  allCountries,
  CountryCCA3,
  isCountryCCA3,
} from "@swan-io/shared-business/src/constants/countries";
import {
  validateName,
  validateNullableRequired,
  validateRequired,
  validateUsaTaxNumber,
} from "@swan-io/shared-business/src/utils/validation";
import { combineValidators, useForm } from "@swan-io/use-form";
import { Ref, useImperativeHandle } from "react";
import { StyleSheet, View } from "react-native";
import { match, P } from "ts-pattern";
import { gender } from "../../../../constants/business";
import { Gender, RelatedIndividualInput } from "../../../../graphql/partner";
import { t } from "../../../../utils/i18n";

const styles = StyleSheet.create({
  grid: {
    gap: "8px",
  },
  gridDesktop: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px 32px",
  },
  inputFull: {
    gridColumnEnd: "span 2",
  },
});

export type OnboardingCompanyOwnershipFormIndividualDetailsRef = {
  submit: () => void;
};

type Props = {
  initialValues: RelatedIndividualInput;
  ref: Ref<OnboardingCompanyOwnershipFormIndividualDetailsRef>;
  companyCountry: CountryCCA3;
  onSave: (input: Partial<RelatedIndividualInput>) => void | Promise<void>;
};

const genderItems: Item<Gender>[] = gender.map(({ text, value }) => ({
  name: text,
  value,
}));

export const OwnershipFormIndividualDetails = ({
  ref,
  onSave,
  companyCountry,
  initialValues,
}: Props) => {
  useImperativeHandle(ref, () => {
    return {
      submit: () => {
        submitForm({
          onSuccess: values => {
            const option = Option.allFromDict(values);
            if (option.isNone()) {
              return;
            }
            const {
              birthDate,
              birthCountry,
              birthCity,
              birthPostal,
              isUnitedStatesPerson,
              unitedStatesTaxIdentificationNumber,
              ...input
            } = option.get();
            onSave({
              birthInfo: {
                birthDate,
                country: birthCountry,
                city: birthCity,
                postalCode: birthPostal,
              },
              unitedStatesTaxInfo: {
                isUnitedStatesPerson,
                unitedStatesTaxIdentificationNumber: isUnitedStatesPerson
                  ? unitedStatesTaxIdentificationNumber
                  : undefined,
              },
              ...input,
            });
          },
        });
      },
    };
  });

  const { Field, submitForm, FieldsListener } = useForm({
    firstName: {
      initialValue: initialValues?.firstName ?? "",
      sanitize: trim,
      validate: validateName,
    },
    lastName: {
      initialValue: initialValues?.lastName ?? "",
      sanitize: trim,
      validate: validateName,
    },
    nationality: {
      initialValue: match([initialValues?.nationality, companyCountry] as const)
        .returnType<CountryCCA3>()
        .with([P.when(isCountryCCA3), P._], ([nationality]) => nationality)
        .with([P._, P.when(isCountryCCA3)], ([_, country]) => country)
        .otherwise(() => "FRA"),
      validate: validateRequired,
    },
    birthDate: {
      initialValue: initialValues?.birthInfo?.birthDate ?? undefined,
      validate: validateNullableRequired,
    },
    birthCountry: {
      initialValue: match([initialValues?.birthInfo?.country, companyCountry])
        .returnType<CountryCCA3>()
        .with([P.when(isCountryCCA3), P._], ([nationality]) => nationality)
        .with([P._, P.when(isCountryCCA3)], ([_, country]) => country)
        .otherwise(() => "FRA"),
      validate: validateRequired,
    },
    birthCity: {
      initialValue: initialValues?.birthInfo?.city ?? "",
      sanitize: trim,
      validate: validateRequired,
    },
    birthPostal: {
      initialValue: initialValues?.birthInfo?.postalCode ?? "",
      sanitize: trim,
      validate: validateRequired,
    },
    sex: {
      initialValue: initialValues?.sex ?? undefined,
      validate: validateNullableRequired,
    },
    isUnitedStatesPerson: {
      initialValue: initialValues?.unitedStatesTaxInfo?.isUnitedStatesPerson ?? false,
    },
    unitedStatesTaxIdentificationNumber: {
      initialValue: initialValues?.unitedStatesTaxInfo?.unitedStatesTaxIdentificationNumber ?? "",
      sanitize: trim,
      validate: (value, { getFieldValue }) => {
        const isRequired = getFieldValue("isUnitedStatesPerson");
        if (isRequired) {
          return combineValidators(validateRequired, validateUsaTaxNumber)(value);
        }
      },
    },
  });

  return (
    <ResponsiveContainer breakpoint={breakpoints.small}>
      {({ large }) => (
        <View role="form" style={[styles.grid, large && styles.gridDesktop]}>
          <LakeLabel
            label={t("common.fistname")}
            render={id => (
              <Field name="firstName">
                {({ value, onBlur, onChange, error, ref }) => (
                  <LakeTextInput
                    id={id}
                    ref={ref}
                    value={value}
                    error={error}
                    onBlur={onBlur}
                    onChangeText={onChange}
                  />
                )}
              </Field>
            )}
          />
          <LakeLabel
            label={t("common.lastname")}
            render={id => (
              <Field name="lastName">
                {({ value, onBlur, onChange, error, ref }) => (
                  <LakeTextInput
                    id={id}
                    ref={ref}
                    value={value}
                    error={error}
                    onBlur={onBlur}
                    onChangeText={onChange}
                  />
                )}
              </Field>
            )}
          />
          <Field name="birthDate">
            {({ value, onChange, error }) => (
              <BirthdatePicker
                label={t("common.birthdate")}
                value={value}
                onValueChange={onChange}
                error={error}
              />
            )}
          </Field>

          <LakeLabel
            label={t("form.label.birthCountry")}
            render={id => (
              <Field name="birthCountry">
                {({ value, onChange, error, ref }) => (
                  <CountryPicker
                    id={id}
                    ref={ref}
                    countries={allCountries}
                    value={value}
                    error={error}
                    onValueChange={onChange}
                  />
                )}
              </Field>
            )}
          />

          <Field name="birthCity">
            {({ value, valid, error, onChange, ref }) => (
              <LakeLabel
                label={t("form.label.birthCity")}
                render={id => (
                  <LakeTextInput
                    id={id}
                    ref={ref}
                    value={value}
                    valid={valid}
                    error={error}
                    onChangeText={onChange}
                  />
                )}
              />
            )}
          </Field>

          <Field name="birthPostal">
            {({ value, valid, error, onChange, ref }) => (
              <LakeLabel
                label={t("form.label.birthPostal")}
                render={id => (
                  <LakeTextInput
                    id={id}
                    ref={ref}
                    value={value}
                    valid={valid}
                    error={error}
                    onChangeText={onChange}
                  />
                )}
              />
            )}
          </Field>

          <LakeLabel
            label={t("company.step.ownership.form.genderLabel")}
            render={id => (
              <Field name="sex">
                {({ value, onChange, ref, error }) => (
                  <LakeSelect
                    id={id}
                    ref={ref}
                    items={genderItems}
                    value={value}
                    onValueChange={onChange}
                    error={error}
                    placeholder={t("common.select")}
                  />
                )}
              </Field>
            )}
          />

          <LakeLabel
            label={t("common.nationality")}
            render={id => (
              <Field name="nationality">
                {({ value, onChange, error, ref }) => (
                  <CountryPicker
                    id={id}
                    ref={ref}
                    countries={allCountries}
                    value={value}
                    error={error}
                    onValueChange={onChange}
                  />
                )}
              </Field>
            )}
          />
          <LakeLabel
            label={t("form.label.usaCitizenShort")}
            render={() => (
              <Field name="isUnitedStatesPerson">
                {({ value, onChange }) => (
                  <RadioGroup
                    direction="row"
                    items={[
                      {
                        name: t("common.yes"),
                        value: true,
                      },
                      {
                        name: t("common.no"),
                        value: false,
                      },
                    ]}
                    value={value}
                    onValueChange={onChange}
                  />
                )}
              </Field>
            )}
          />

          <FieldsListener names={["isUnitedStatesPerson"]}>
            {({ isUnitedStatesPerson }) => (
              <Field name="unitedStatesTaxIdentificationNumber">
                {({ value, onBlur, onChange, error, ref }) =>
                  isUnitedStatesPerson.value ? (
                    <LakeLabel
                      label={t("form.label.usaTax")}
                      render={id => (
                        <LakeTextInput
                          id={id}
                          ref={ref}
                          value={value}
                          error={error}
                          onBlur={onBlur}
                          onChangeText={onChange}
                          placeholder={t("form.label.usaTax.placeholder")}
                          help={t("form.label.usaTax.help")}
                        />
                      )}
                    />
                  ) : null
                }
              </Field>
            )}
          </FieldsListener>
        </View>
      )}
    </ResponsiveContainer>
  );
};
