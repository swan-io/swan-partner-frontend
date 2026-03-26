import { Option } from "@swan-io/boxed";
import { LakeAlert } from "@swan-io/lake/src/components/LakeAlert";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeTagInput } from "@swan-io/lake/src/components/LakeTagInput";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { breakpoints } from "@swan-io/lake/src/constants/design";
import { useFirstMountState } from "@swan-io/lake/src/hooks/useFirstMountState";
import { isNotNullishOrEmpty } from "@swan-io/lake/src/utils/nullish";
import { trim } from "@swan-io/lake/src/utils/string";
import { CountryPicker } from "@swan-io/shared-business/src/components/CountryPicker";
import { PlacekitAddressSearchInput } from "@swan-io/shared-business/src/components/PlacekitAddressSearchInput";
import {
  allCountries,
  CountryCCA3,
  isCountryCCA3,
} from "@swan-io/shared-business/src/constants/countries";
import {
  validateNullableRequired,
  validateRequired,
} from "@swan-io/shared-business/src/utils/validation";
import { useForm } from "@swan-io/use-form";
import { Ref, useEffect, useImperativeHandle, useState } from "react";
import { StyleSheet, View } from "react-native";
import { match, P } from "ts-pattern";
import { RelatedIndividualInput } from "../../../../graphql/partner";
import { locale, t } from "../../../../utils/i18n";
import { getValidationErrorMessage, ServerInvalidFieldCode } from "../../../../utils/validation";

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

export type OnboardingCompanyOwnershipFormIndividualAddressRef = {
  submit: () => void;
};

type Props = {
  initialValues: RelatedIndividualInput;
  errors: { fieldName: string; code: ServerInvalidFieldCode }[];
  ref: Ref<OnboardingCompanyOwnershipFormIndividualAddressRef>;
  companyCountry: CountryCCA3;
  isAccountAdmin: boolean;
  mode: "add" | "edit";
  onSave: (input: Partial<RelatedIndividualInput>) => void | Promise<void>;
};

export const OwnershipFormIndividualAddress = ({
  ref,
  onSave,
  companyCountry,
  isAccountAdmin,
  initialValues,
  mode,
  errors,
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
            const currentValues = option.get();
            const { roles, ...input } = currentValues;
            onSave({
              address: {
                ...input,
              },
              ...(initialValues.type !== "UltimateBeneficialOwner" && {
                legalRepresentative: { roles },
              }),
            });
          },
        });
      },
    };
  });

  const isFirstMount = useFirstMountState();

  const isReadOnly = (value: string | null | undefined) =>
    isAccountAdmin && isNotNullishOrEmpty(value);

  const [isAddressFromSuggestion, setIsAddressFromSuggestion] = useState(
    Boolean(
      initialValues?.address?.addressLine1 &&
      initialValues.address.city &&
      initialValues.address.postalCode,
    ),
  );

  const { Field, submitForm, FieldsListener, setFieldValue, setFieldError } = useForm({
    country: {
      initialValue: match([initialValues?.address?.country, companyCountry, mode])
        .returnType<CountryCCA3 | undefined>()
        .with([P.when(isCountryCCA3), P._, P._], ([nationality]) => nationality)
        .with([P._, P._, "edit"], () => undefined)
        .with([P._, P.when(isCountryCCA3), P._], ([_, country]) => country)
        .otherwise(() => "FRA"),
      validate: validateNullableRequired,
    },
    addressLine1: {
      initialValue: initialValues?.address?.addressLine1 ?? "",
      sanitize: trim,
      validate: validateRequired,
    },
    city: {
      initialValue: initialValues?.address?.city ?? "",
      sanitize: trim,
      validate: validateRequired,
    },
    postalCode: {
      initialValue: initialValues?.address?.postalCode ?? "",
      sanitize: trim,
      validate: validateRequired,
    },
    roles: {
      initialValue: initialValues?.legalRepresentative?.roles ?? [],
      validate: value => {
        if (initialValues.type !== "UltimateBeneficialOwner" && value.length === 0) {
          return t("error.invalidField");
        }
      },
    },
  });

  useEffect(() => {
    if (isFirstMount) {
      errors.forEach(({ fieldName, code }) => {
        const message = getValidationErrorMessage(code);
        match(fieldName)
          .with("address.country", () => setFieldError("country", message))
          .with("address.addressLine1", () => setFieldError("addressLine1", message))
          .with("address.city", () => setFieldError("city", message))
          .with("address.postalCode", () => setFieldError("postalCode", message))
          .with("legalRepresentative.roles", () => setFieldError("roles", message))
          .otherwise(() => null);
      });
    }
  }, [errors, isFirstMount, setFieldError]);

  return (
    <ResponsiveContainer breakpoint={breakpoints.small}>
      {({ large }) => (
        <>
          {isAccountAdmin && (
            <>
              <LakeAlert
                variant="info"
                title={t("company.step.ownership.modal.alertAccountAdmin")}
              />
              <Space height={24} />
            </>
          )}
          <View role="form" style={[styles.grid, large && styles.gridDesktop]}>
            <Field name="roles">
              {({ value, error, onChange }) =>
                initialValues.type !== "UltimateBeneficialOwner" ? (
                  <LakeLabel
                    label={t("company.step.ownership.form.roleLabel")}
                    style={styles.inputFull}
                    render={id => (
                      <LakeTagInput
                        id={id}
                        onValuesChanged={onChange}
                        values={value}
                        error={error}
                      />
                    )}
                  />
                ) : null
              }
            </Field>

            <Field name="country">
              {({ value, onChange }) => (
                <LakeLabel
                  label={t("form.label.residenceCountry")}
                  style={styles.inputFull}
                  render={id => (
                    <CountryPicker
                      id={id}
                      value={value}
                      countries={allCountries}
                      onValueChange={onChange}
                      readOnly={isReadOnly(value)}
                    />
                  )}
                />
              )}
            </Field>

            <FieldsListener names={["country"]}>
              {({ country }) => (
                <Field name="addressLine1">
                  {({ value, onChange, error }) => (
                    <LakeLabel
                      style={styles.inputFull}
                      label={t("form.label.residenceAddress")}
                      render={id => (
                        <PlacekitAddressSearchInput
                          id={id}
                          apiKey={__env.CLIENT_PLACEKIT_API_KEY}
                          country={country.value}
                          value={value}
                          onValueChange={value => {
                            onChange(value);
                            if (value === "") {
                              setIsAddressFromSuggestion(false);
                            }
                          }}
                          onSuggestion={suggestion => {
                            setFieldValue("addressLine1", suggestion.completeAddress);
                            setFieldValue("city", suggestion.city);
                            setFieldValue("postalCode", suggestion.postalCode ?? "");
                            setIsAddressFromSuggestion(true);
                          }}
                          language={locale.language}
                          placeholder={t("addressInput.placeholder")}
                          emptyResult={t("common.noResult")}
                          error={error}
                          disabled={isReadOnly(value)}
                        />
                      )}
                    />
                  )}
                </Field>
              )}
            </FieldsListener>

            <Field name="city">
              {({ value, valid, error, onChange, ref }) => (
                <LakeLabel
                  label={t("common.city")}
                  render={id => (
                    <LakeTextInput
                      id={id}
                      ref={ref}
                      value={value}
                      valid={valid}
                      error={error}
                      onChangeText={onChange}
                      readOnly={isAddressFromSuggestion || isReadOnly(value)}
                    />
                  )}
                />
              )}
            </Field>

            <Field name="postalCode">
              {({ value, valid, error, onChange, ref }) => (
                <LakeLabel
                  label={t("common.postalCode")}
                  render={id => (
                    <LakeTextInput
                      id={id}
                      ref={ref}
                      value={value}
                      valid={valid}
                      error={error}
                      onChangeText={onChange}
                      readOnly={isAddressFromSuggestion || isReadOnly(value)}
                    />
                  )}
                />
              )}
            </Field>
          </View>
        </>
      )}
    </ResponsiveContainer>
  );
};
