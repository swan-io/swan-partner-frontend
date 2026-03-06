import { Option } from "@swan-io/boxed";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeTagInput } from "@swan-io/lake/src/components/LakeTagInput";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
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
} from "@swan-io/shared-business/src/utils/validation";
import { useForm } from "@swan-io/use-form";
import { Ref, useImperativeHandle } from "react";
import { StyleSheet, View } from "react-native";
import { match, P } from "ts-pattern";
import { RelatedIndividualInput } from "../../../../graphql/partner";
import { t } from "../../../../utils/i18n";

const styles = StyleSheet.create({
  gap: {
    gap: "32px",
  },
  grid: {
    display: "grid",
    gap: "8px",
  },
  gridDesktop: {
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
  onSave: (input: RelatedIndividualInput) => void | Promise<void>;
};

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
            console.log("SUBMIT DETAILS", values);
            const option = Option.allFromDict(values);
            console.log("options", option);
            if (option.isNone()) {
              return;
            }
            const currentValues = option.get();
            const { birthDate, birthCountry, birthCity, birthPostal, roles, ...input } =
              currentValues;
            console.log("currentValues", currentValues);
            onSave({
              type: "LegalRepresentative", //@todo make it dynamic based on step
              birthInfo: {
                birthDate,
                country: birthCountry,
                city: birthCity,
                postalCode: birthPostal,
              },
              legalRepresentative: {
                roles,
              },
              ...input,
            });
          },
        });
      },
    };
  });

  const { Field, submitForm } = useForm({
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
    roles: {
      initialValue: initialValues?.legalRepresentative?.roles ?? [],
      validate: value => {
        if (value.length === 0) {
          return t("error.invalidField");
        }
      },
    },
  });

  return (
    <ResponsiveContainer breakpoint={breakpoints.medium}>
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
            style={styles.inputFull}
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
          <Field name="roles">
            {({ value, error, onChange }) => (
              <LakeLabel
                label={t("company.step.ownership.form.roleLabel")}
                style={styles.inputFull}
                render={id => (
                  <LakeTagInput id={id} onValuesChanged={onChange} values={value} error={error} />
                )}
              />
            )}
          </Field>
        </View>
      )}
    </ResponsiveContainer>
  );
};
