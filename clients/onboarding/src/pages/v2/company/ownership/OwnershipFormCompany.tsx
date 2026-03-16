import { Option } from "@swan-io/boxed";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeTagInput } from "@swan-io/lake/src/components/LakeTagInput";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { noop } from "@swan-io/lake/src/utils/function";
import { trim } from "@swan-io/lake/src/utils/string";
import { companyCountries, CountryCCA3 } from "@swan-io/shared-business/src/constants/countries";
import { validateRequired } from "@swan-io/shared-business/src/utils/validation";
import { useForm } from "@swan-io/use-form";
import { Ref, useImperativeHandle } from "react";
import { View } from "react-native";
import { OnboardingCountryPicker } from "../../../../components/CountryPicker";
import { RelatedCompanyInput } from "../../../../graphql/partner";
import { t } from "../../../../utils/i18n";
import { getRegistrationNumberName } from "../../../../utils/templateTranslations";

export type OnboardingCompanyOwnershipFormCompanyRef = {
  submit: () => void;
};

type Props = {
  initialValues: Partial<RelatedCompanyInput>;
  ref: Ref<OnboardingCompanyOwnershipFormCompanyRef>;
  companyCountry: CountryCCA3;
  onSave: (input: RelatedCompanyInput) => void | Promise<void>;
};

export const OwnershipFormCompany = ({ ref, onSave, companyCountry, initialValues }: Props) => {
  useImperativeHandle(ref, () => {
    return {
      submit: () => {
        submitForm({
          onSuccess: values => {
            Option.allFromDict(values).match({
              Some: onSave,
              None: noop,
            });
          },
        });
      },
    };
  });

  const { Field, submitForm } = useForm({
    entityName: {
      initialValue: initialValues.entityName ?? "",
      sanitize: trim,
      validate: validateRequired,
    },
    registrationCountry: {
      initialValue: (initialValues.registrationCountry as CountryCCA3) ?? companyCountry,
      validate: validateRequired,
    },
    registrationNumber: {
      initialValue: initialValues.registrationNumber ?? "",
      sanitize: trim,
      validate: validateRequired,
    },
    roles: {
      initialValue: initialValues.roles ?? [],
      validate: value => {
        if (value.length === 0) {
          return t("error.invalidField");
        }
      },
    },
  });

  return (
    <View role="form">
      <LakeLabel
        label={t("company.step.ownership.form.companyLabel")}
        render={id => (
          <Field name="entityName">
            {({ value, onBlur, valid, onChange, error, ref }) => (
              <LakeTextInput
                id={id}
                ref={ref}
                value={value}
                error={error}
                valid={valid}
                onBlur={onBlur}
                onChangeText={onChange}
              />
            )}
          </Field>
        )}
      />

      <Field name="registrationCountry">
        {({ value, onChange }) => (
          <OnboardingCountryPicker
            label={t("company.step.organisation.countryLabel")}
            value={value}
            countries={companyCountries}
            holderType="company"
            onValueChange={onChange}
            onlyIconHelp={false}
          />
        )}
      </Field>

      <Field name="registrationNumber">
        {({ value, valid, error, onChange, ref, onBlur }) => (
          <LakeLabel
            label={t("company.step.legal.registrationNumberLabel", {
              registrationNumberLegalName: getRegistrationNumberName(companyCountry, "Company"),
            })}
            render={id => (
              <LakeTextInput
                onBlur={onBlur}
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

      <Field name="roles">
        {({ value, error, onChange }) => (
          <LakeLabel
            label={t("company.step.ownership.form.roleLabel")}
            render={id => (
              <LakeTagInput id={id} onValuesChanged={onChange} values={value} error={error} />
            )}
          />
        )}
      </Field>
    </View>
  );
};
