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
import { CountryCCA3, allCountries } from "@swan-io/shared-business/src/constants/countries";
import { validateRequired } from "@swan-io/shared-business/src/utils/validation";
import { combineValidators, useForm } from "@swan-io/use-form";
import { forwardRef, useImperativeHandle } from "react";
import { StyleSheet, View } from "react-native";
import { P, match } from "ts-pattern";
import { AccountCountry } from "../../../graphql/unauthenticated";
import { t } from "../../../utils/i18n";
import { validateName } from "../../../utils/validation";

const styles = StyleSheet.create({
  inputContainer: {
    flex: 1,
  },
});

type BeneficiaryType = "HasCapital" | "LegalRepresentative" | "Other";

const beneficiaryTypes: RadioGroupItem<BeneficiaryType>[] = [
  { value: "HasCapital", name: t("company.step.owners.beneficiary.ownershipOfCapital") },
  {
    value: "LegalRepresentative",
    name: t("company.step.owners.beneficiary.legalRepresentative"),
  },
  { value: "Other", name: t("company.step.owners.beneficiary.other") },
];

export type FormValues = {
  firstName: string;
  lastName: string;
  birthDate: string | undefined;
  birthCountryCode: CountryCCA3;
  birthCity: string;
  birthCityPostalCode: string;
  type: BeneficiaryType;
  indirect: boolean;
  direct: boolean;
  totalCapitalPercentage: string;
};

export type Input = {
  firstName: string;
  lastName: string;
  birthDate: string | null;
  birthCountryCode: CountryCCA3;
  birthCity: string;
  birthCityPostalCode: string;
  type: BeneficiaryType;
  indirect?: boolean;
  direct?: boolean;
  totalCapitalPercentage?: number;
};

type Props = {
  placekitApiKey: string | undefined;
  accountCountry: AccountCountry;
  companyCountry: CountryCCA3;
  initialValues: Partial<Input>;
  onSave: (input: Input) => void | Promise<void>;
};

export type OnboardingCompanyOwnershipBeneficiaryFormCommonRef = {
  submit: () => void;
};

export const OnboardingCompanyOwnershipBeneficiaryFormCommon = forwardRef<
  OnboardingCompanyOwnershipBeneficiaryFormCommonRef,
  Props
>(({ placekitApiKey, accountCountry, companyCountry, initialValues, onSave }, ref) => {
  const isBirthInfoRequired = match(accountCountry)
    .with("ESP", "FRA", "NLD", "ITA", () => true)
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
    type: {
      initialValue: initialValues.type ?? "HasCapital",
      validate: validateRequired,
    },
    direct: {
      initialValue: initialValues.direct ?? false,
      validate: (value, { getFieldValue }) => {
        if (value === false && getFieldValue("indirect") === false) {
          return t("company.step.owners.beneficiary.directOrIndirect");
        }
      },
    },
    indirect: {
      initialValue: initialValues.indirect ?? false,
      validate: (value, { getFieldValue }) => {
        if (value === false && getFieldValue("direct") === false) {
          return t("company.step.owners.beneficiary.directOrIndirect");
        }
      },
    },
    totalCapitalPercentage: {
      initialValue: initialValues.totalCapitalPercentage?.toString() ?? "",
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
            type,
            direct,
            indirect,
            totalCapitalPercentage,
          }) => {
            const requiredFields = Option.allFromDict({
              firstName,
              lastName,
              birthCountryCode,
              birthCity,
              birthCityPostalCode,
              type,
            });

            const requiredFieldsForCapitalOwners = Option.allFromDict({
              direct,
              indirect,
              totalCapitalPercentage,
            });

            return match({ requiredFields, requiredFieldsForCapitalOwners })
              .with(
                {
                  requiredFields: Option.P.Some({ type: "HasCapital" }),
                  requiredFieldsForCapitalOwners: Option.P.Some(P.any),
                },
                ({ requiredFields, requiredFieldsForCapitalOwners }) => {
                  const { direct, indirect, totalCapitalPercentage } =
                    requiredFieldsForCapitalOwners.get();

                  return onSave({
                    ...requiredFields.get(),
                    birthDate: birthDate.flatMap(Option.fromNullable).toNull(),
                    direct,
                    indirect,
                    totalCapitalPercentage: Number(totalCapitalPercentage),
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
        <View role="form">
          <Box direction={small ? "column" : "row"}>
            <Field name="firstName">
              {({ value, onChange, error }) => (
                <LakeLabel
                  label={t("company.step.owners.beneficiary.firstName")}
                  style={styles.inputContainer}
                  render={id => (
                    <LakeTextInput
                      error={error}
                      placeholder={t("company.step.owners.beneficiary.firstNamePlaceholder")}
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
                  label={t("company.step.owners.beneficiary.lastName")}
                  style={styles.inputContainer}
                  render={id => (
                    <LakeTextInput
                      error={error}
                      placeholder={t("company.step.owners.beneficiary.lastNamePlaceholder")}
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
                  label={t("company.step.owners.beneficiary.birthDate")}
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
                  label={t("company.step.owners.beneficiary.birthCountry")}
                  style={styles.inputContainer}
                  render={id => (
                    <CountryPicker
                      id={id}
                      error={error}
                      value={value}
                      placeholder={t("company.step.owners.beneficiary.birthCountryPlaceholder")}
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
                        label={t("company.step.owners.beneficiary.birthCity")}
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
                                ? t("company.step.owners.beneficiary.fillBirthCountry")
                                : t("company.step.owners.beneficiary.birthCityPlaceholder")
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
                        label={t("company.step.owners.beneficiary.birthPostalCode")}
                        optionalLabel={isBirthInfoRequired ? undefined : t("common.optional")}
                        style={styles.inputContainer}
                        render={id => (
                          <LakeTextInput
                            error={error}
                            placeholder={
                              birthCountryCode.value == null
                                ? t("company.step.owners.beneficiary.fillBirthCountry")
                                : t("company.step.owners.beneficiary.birthPostalCodePlaceholder")
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

          <Field name="type">
            {({ value, onChange }) => (
              <LakeLabel
                label={t("company.step.owners.beneficiary.type")}
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

          <FieldsListener names={["type"]}>
            {({ type }) =>
              type.value === "HasCapital" ? (
                <>
                  <Field name="totalCapitalPercentage">
                    {({ value, onChange, error }) => (
                      <LakeLabel
                        label={t("company.step.owners.beneficiary.totalCapitalPercentage")}
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
                            label={t("company.step.owners.beneficiary.directly")}
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
                            label={t("company.step.owners.beneficiary.indirectly")}
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
      )}
    </ResponsiveContainer>
  );
});
