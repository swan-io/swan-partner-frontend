import { Option } from "@swan-io/boxed";
import { Box } from "@swan-io/lake/src/components/Box";
import { LakeLabelledCheckbox } from "@swan-io/lake/src/components/LakeCheckbox";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { RadioGroup, RadioGroupItem } from "@swan-io/lake/src/components/RadioGroup";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { breakpoints, colors } from "@swan-io/lake/src/constants/design";
import { identity } from "@swan-io/lake/src/utils/function";
import { trim } from "@swan-io/lake/src/utils/string";
import { BirthdatePicker } from "@swan-io/shared-business/src/components/BirthdatePicker";
import { CountryPicker } from "@swan-io/shared-business/src/components/CountryPicker";
import { PlacekitCityInput } from "@swan-io/shared-business/src/components/PlacekitCityInput";
import { allCountries, CountryCCA3 } from "@swan-io/shared-business/src/constants/countries";
import {
  validateName,
  validateNullableRequired,
  validateRequired,
} from "@swan-io/shared-business/src/utils/validation";
import { combineValidators, useForm } from "@swan-io/use-form";
import { Ref, useImperativeHandle } from "react";
import { StyleSheet, View } from "react-native";
import { match, P } from "ts-pattern";
import { AccountCountry, UltimateBeneficialOwnerQualificationType } from "../../graphql/partner";
import { t } from "../../utils/i18n";
const styles = StyleSheet.create({
  inputContainer: {
    flex: 1,
  },
});

type FormValues = {
  firstName: string;
  lastName: string;
  birthDate: string | undefined;
  birthCountryCode: CountryCCA3;
  birthCity: string;
  birthCityPostalCode: string;
  qualificationType: UltimateBeneficialOwnerQualificationType;
  indirect: boolean;
  direct: boolean;
  totalPercentage: string;
};

const beneficiaryTypes: RadioGroupItem<UltimateBeneficialOwnerQualificationType>[] = [
  { value: "Control", name: t("verificationRenewal.ownership.type.control") },
  {
    value: "LegalRepresentative",
    name: t("verificationRenewal.ownership.type.legalRepresentative"),
  },
  { value: "Ownership", name: t("verificationRenewal.ownership.type.ownership") },
];

export type Input = {
  firstName: string;
  lastName: string;
  birthDate: string | null;
  birthCountryCode: CountryCCA3;
  birthCity: string;
  birthCityPostalCode: string;
  qualificationType: UltimateBeneficialOwnerQualificationType | undefined;
  direct?: boolean;
  indirect?: boolean;
  totalPercentage?: number;
};

export type VerificationRenewalOwnershipFormCommonRef = {
  submit: () => void;
};

type Props = {
  ref?: Ref<VerificationRenewalOwnershipFormCommonRef>;
  placekitApiKey: string | undefined;
  accountCountry: AccountCountry;
  companyCountry: CountryCCA3;
  initialValues: Partial<Input>;
  onSave: (input: Input) => void | Promise<void>;
};

export const VerificationRenewalOwnershipFormCommon = ({
  ref,
  placekitApiKey,
  accountCountry,
  companyCountry,
  initialValues,
  onSave,
}: Props) => {
  const isBirthInfoRequired = match(accountCountry)
    .with("ESP", "FRA", "NLD", "ITA", "BEL", () => true)
    .otherwise(() => false);

  const { Field, FieldsListener, setFieldValue, submitForm } = useForm<FormValues>({
    firstName: {
      initialValue: initialValues.firstName ?? "",
      sanitize: trim,
      validate: combineValidators(validateRequired, validateName),
    },
    lastName: {
      initialValue: initialValues.lastName ?? "",
      sanitize: trim,
      validate: combineValidators(validateRequired, validateName),
    },
    birthDate: {
      initialValue: initialValues.birthDate ?? undefined,
      validate: isBirthInfoRequired ? validateNullableRequired : undefined,
    },
    birthCountryCode: {
      initialValue: initialValues.birthCountryCode ?? companyCountry,
      validate: validateRequired,
    },
    birthCity: {
      initialValue: initialValues.birthCity ?? "",
      sanitize: trim,
      validate: isBirthInfoRequired ? validateRequired : undefined,
    },
    birthCityPostalCode: {
      initialValue: initialValues.birthCityPostalCode ?? "",
      sanitize: trim,
      validate: isBirthInfoRequired ? validateRequired : undefined,
    },
    qualificationType: {
      initialValue: initialValues.qualificationType ?? "Ownership",
      validate: validateRequired,
    },
    direct: {
      initialValue: initialValues.direct ?? false,
      validate: (value, { getFieldValue }) => {
        if (value === false && getFieldValue("indirect") === false) {
          return " ";
        }
      },
    },
    indirect: {
      initialValue: initialValues.indirect ?? false,
      validate: (value, { getFieldValue }) => {
        if (value === false && getFieldValue("direct") === false) {
          return " ";
        }
      },
    },
    totalPercentage: {
      initialValue: initialValues.totalPercentage?.toString() ?? "",
      sanitize: trim,
      validate: validateRequired,
    },
  });

  useImperativeHandle(ref, () => {
    return {
      submit: () => {
        submitForm({
          onSuccess: ({
            firstName,
            lastName,
            birthDate,
            birthCountryCode,
            birthCity,
            birthCityPostalCode,
            qualificationType,
            direct,
            indirect,
            totalPercentage,
          }) => {
            const requiredFields = Option.allFromDict({
              firstName,
              lastName,
              birthCountryCode,
              birthCity,
              birthCityPostalCode,
              qualificationType,
            });

            const requiredFieldsForCapitalOwners = Option.allFromDict({
              indirect,
              direct,
              totalPercentage,
            });

            return match({ requiredFields, requiredFieldsForCapitalOwners })
              .with(
                {
                  requiredFields: Option.P.Some({ qualificationType: "Ownership" }),
                  requiredFieldsForCapitalOwners: Option.P.Some(P.any),
                },
                ({ requiredFields, requiredFieldsForCapitalOwners }) => {
                  const { direct, indirect, totalPercentage } =
                    requiredFieldsForCapitalOwners.get();

                  return onSave({
                    ...requiredFields.get(),
                    birthDate: birthDate.flatMap(Option.fromNullable).toNull(),
                    direct,
                    indirect,
                    totalPercentage: Number(totalPercentage),
                  });
                },
              )
              .with({ requiredFields: Option.P.Some(P.any) }, ({ requiredFields }) => {
                return onSave({
                  ...requiredFields.get(),
                  birthDate: birthDate.flatMap(Option.fromNullable).toNull(),
                });
              })
              .otherwise(() => {});
          },
        });
      },
    };
  });

  return (
    <ResponsiveContainer breakpoint={breakpoints.tiny}>
      {({ small }) => (
        <>
          <View role="form">
            <Box direction={small ? "column" : "row"}>
              <Field name="firstName">
                {({ value, onChange, error }) => (
                  <LakeLabel
                    label={t("verificationRenewal.ownership.firstName")}
                    style={styles.inputContainer}
                    render={id => (
                      <LakeTextInput
                        error={error}
                        placeholder={t("verificationRenewal.ownership.firstName.placeholder")}
                        id={id}
                        value={value}
                        onChangeText={onChange}
                      />
                    )}
                  />
                )}
              </Field>

              <Space width={12} />

              <Field name="lastName">
                {({ value, onChange, error }) => (
                  <LakeLabel
                    label={t("verificationRenewal.ownership.lastName")}
                    style={styles.inputContainer}
                    render={id => (
                      <LakeTextInput
                        error={error}
                        placeholder={t("verificationRenewal.ownership.lastName.placeholder")}
                        id={id}
                        value={value}
                        onChangeText={onChange}
                      />
                    )}
                  />
                )}
              </Field>
            </Box>

            <Box direction={small ? "column" : "row"}>
              <Field name="birthDate">
                {({ value, onChange, error }) => (
                  <BirthdatePicker
                    style={styles.inputContainer}
                    label={t("verificationRenewal.ownership.birthDate")}
                    value={value}
                    onValueChange={onChange}
                    error={error}
                  />
                )}
              </Field>

              <Space width={12} />

              <Field name="birthCountryCode">
                {({ value, onChange, error }) => (
                  <LakeLabel
                    label={t("verificationRenewal.ownership.birthCountry")}
                    style={styles.inputContainer}
                    render={id => (
                      <CountryPicker
                        id={id}
                        error={error}
                        value={value}
                        placeholder={t("verificationRenewal.ownership.birthCountry.placeholder")}
                        countries={allCountries}
                        onValueChange={onChange}
                      />
                    )}
                  />
                )}
              </Field>
            </Box>

            <Box direction={small ? "column" : "row"}>
              <FieldsListener names={["birthCountryCode"]}>
                {({ birthCountryCode }) => (
                  <>
                    <Field name="birthCity">
                      {({ value, onChange, error }) => (
                        <LakeLabel
                          label={t("verificationRenewal.ownership.birthCity")}
                          optionalLabel={isBirthInfoRequired ? undefined : t("common.optional")}
                          style={styles.inputContainer}
                          render={id => (
                            <PlacekitCityInput
                              id={id}
                              apiKey={placekitApiKey}
                              error={error}
                              country={birthCountryCode.value}
                              value={value ?? ""}
                              onValueChange={onChange}
                              placeholder={
                                birthCountryCode.value == null
                                  ? t("verificationRenewal.ownership.fillBirthCountry")
                                  : t("verificationRenewal.ownership.birthCityPlaceholder")
                              }
                              onSuggestion={place => {
                                onChange(place.city);
                                if (place.postalCode != null) {
                                  setFieldValue("birthCityPostalCode", place.postalCode);
                                }
                              }}
                              onLoadError={identity}
                            />
                          )}
                        />
                      )}
                    </Field>

                    <Space width={12} />

                    <Field name="birthCityPostalCode">
                      {({ value, onChange, error }) => (
                        <LakeLabel
                          label={t("verificationRenewal.ownership.birthPostalCode")}
                          optionalLabel={isBirthInfoRequired ? undefined : t("common.optional")}
                          style={styles.inputContainer}
                          render={id => (
                            <LakeTextInput
                              error={error}
                              placeholder={
                                birthCountryCode.value == null
                                  ? t("verificationRenewal.ownership.fillBirthCountry")
                                  : t("verificationRenewal.ownership.birthPostalCode.placeholder")
                              }
                              id={id}
                              disabled={birthCountryCode.value === undefined}
                              value={value}
                              onChangeText={onChange}
                            />
                          )}
                        />
                      )}
                    </Field>
                  </>
                )}
              </FieldsListener>
            </Box>

            <Field name="qualificationType">
              {({ value, onChange }) => (
                <LakeLabel
                  label={t("verificationRenewal.ownership.type")}
                  type="radioGroup"
                  render={() => (
                    <RadioGroup
                      direction="row"
                      value={value}
                      onValueChange={onChange}
                      items={beneficiaryTypes}
                    />
                  )}
                />
              )}
            </Field>

            <FieldsListener names={["qualificationType"]}>
              {({ qualificationType }) =>
                qualificationType.value === "Ownership" ? (
                  <>
                    <Field name="totalPercentage">
                      {({ value, onChange, error }) => (
                        <LakeLabel
                          label={t("verificationRenewal.ownership.totalCapitalPercentage")}
                          render={id => (
                            <LakeTextInput
                              error={error}
                              unit="%"
                              inputMode="decimal"
                              aria-valuemin={0}
                              aria-valuemax={100}
                              id={id}
                              value={value}
                              onChangeText={onChange}
                            />
                          )}
                        />
                      )}
                    </Field>

                    <Space height={12} />

                    <View>
                      <Box direction="row" alignItems="center">
                        <Field name="direct">
                          {({ value, error, onChange }) => (
                            <LakeLabelledCheckbox
                              value={value}
                              onValueChange={onChange}
                              label={t("verificationRenewal.ownership.directly")}
                              isError={error != null}
                            />
                          )}
                        </Field>

                        <Space width={24} />

                        <Field name="indirect">
                          {({ value, error, onChange }) => (
                            <LakeLabelledCheckbox
                              value={value}
                              onValueChange={onChange}
                              label={t("verificationRenewal.ownership.indirectly")}
                              isError={error != null}
                            />
                          )}
                        </Field>
                      </Box>

                      <Space height={4} />

                      <FieldsListener names={["direct", "indirect"]}>
                        {({ direct, indirect }) => (
                          <LakeText color={colors.negative[400]}>
                            {direct.error ?? indirect.error ?? " "}
                          </LakeText>
                        )}
                      </FieldsListener>
                    </View>
                  </>
                ) : null
              }
            </FieldsListener>
          </View>

          <Space height={12} />
        </>
      )}
    </ResponsiveContainer>
  );
};
