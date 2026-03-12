import { Option } from "@swan-io/boxed";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { Item, LakeSelect } from "@swan-io/lake/src/components/LakeSelect";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { RadioGroup } from "@swan-io/lake/src/components/RadioGroup";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { breakpoints } from "@swan-io/lake/src/constants/design";
import { trim } from "@swan-io/lake/src/utils/string";
import { TaxIdentificationNumberInput } from "@swan-io/shared-business/src/components/TaxIdentificationNumberInput";
import {
  validateCompanyTaxNumber,
  validateNullableRequired,
  validateRequired,
  validateUsaTaxNumber,
} from "@swan-io/shared-business/src/utils/validation";
import { combineValidators, useForm } from "@swan-io/use-form";
import { Ref, useImperativeHandle } from "react";
import { StyleSheet, View } from "react-native";
import { uboQualificationType } from "../../../../constants/business";
import {
  RelatedIndividualInput,
  UltimateBeneficialOwnerOwnershipType,
  UltimateBeneficialOwnerQualificationType,
} from "../../../../graphql/partner";
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

export type OnboardingCompanyOwnershipFormIndividualCapitalRef = {
  submit: () => void;
};

type Props = {
  initialValues: RelatedIndividualInput;
  ref: Ref<OnboardingCompanyOwnershipFormIndividualCapitalRef>;
  onSave: (input: Partial<RelatedIndividualInput>) => void | Promise<void>;
};

const uboQualificationTypeItems: Item<UltimateBeneficialOwnerQualificationType>[] =
  uboQualificationType.map(({ text, value }) => ({
    name: text,
    value,
  }));

const ownershipTypeItems: Item<UltimateBeneficialOwnerOwnershipType>[] = [
  { name: t("company.step.ownership.form.direct"), value: "Direct" },
  { name: t("company.step.ownership.form.indirect"), value: "Indirect" },
  {
    name: t("company.step.ownership.form.directAndIndirect"),
    value: "DirectAndIndirect",
  },
];

export const OwnershipFormIndividualCapital = ({ ref, onSave, initialValues }: Props) => {
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
            const {
              isUnitedStatesPerson,
              unitedStatesTaxIdentificationNumber,
              qualificationType,
              totalPercentage,
              type,
              ...input
            } = currentValues;
            onSave({
              unitedStatesTaxInfo: {
                isUnitedStatesPerson,
                unitedStatesTaxIdentificationNumber: isUnitedStatesPerson
                  ? unitedStatesTaxIdentificationNumber
                  : undefined,
              },
              ultimateBeneficialOwner: {
                qualificationType,
                ...(qualificationType === "Ownership" && {
                  ownership: { totalPercentage: Number(totalPercentage), type },
                }),
              },
              ...input,
            });
          },
        });
      },
    };
  });

  const isTaxIdentificationRequired = false; // @todo add rules

  const { Field, submitForm, FieldsListener } = useForm({
    qualificationType: {
      initialValue: initialValues.ultimateBeneficialOwner?.qualificationType ?? "Ownership",
      validate: validateNullableRequired,
    },
    totalPercentage: {
      initialValue:
        initialValues.ultimateBeneficialOwner?.ownership?.totalPercentage?.toString() ?? "",
      sanitize: trim,
      validate: validateRequired,
    },
    type: {
      initialValue: initialValues.ultimateBeneficialOwner?.ownership?.type ?? "Direct",
    },
    taxIdentificationNumber: {
      initialValue: initialValues.taxIdentificationNumber ?? "",
      sanitize: trim,
      validate: isTaxIdentificationRequired
        ? combineValidators(validateRequired, validateCompanyTaxNumber("FRA")) // @todo make it dynamique
        : undefined,
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
            label={t("company.step.ownership.form.whyUboLabel")}
            style={styles.inputFull}
            render={id => (
              <Field name="qualificationType">
                {({ value, onChange, ref, error }) => (
                  <LakeSelect
                    id={id}
                    ref={ref}
                    items={uboQualificationTypeItems}
                    value={value}
                    onValueChange={onChange}
                    error={error}
                    placeholder={t("common.select")}
                  />
                )}
              </Field>
            )}
          />

          <Field name="totalPercentage">
            {({ value, onChange, error }) => (
              <LakeLabel
                label={t("company.step.ownership.form.capitalLabel")}
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

          <Field name="type">
            {({ ref, value, onChange, error }) => (
              <LakeLabel
                label={t("company.step.ownership.form.capitalTypeLabel")}
                render={id => (
                  <LakeSelect
                    id={id}
                    ref={ref}
                    items={ownershipTypeItems}
                    value={value}
                    onValueChange={onChange}
                    error={error}
                    placeholder={t("common.select")}
                  />
                )}
              />
            )}
          </Field>

          <View style={styles.inputFull}>
            <Field name="taxIdentificationNumber">
              {({ value, valid, error, onChange, onBlur, ref }) => (
                <TaxIdentificationNumberInput
                  ref={ref}
                  value={value}
                  error={error}
                  valid={valid}
                  onChange={onChange}
                  onBlur={onBlur}
                  country={"FRA"} // @todo make it dynamique
                  isCompany={true}
                  required={isTaxIdentificationRequired}
                />
              )}
            </Field>
          </View>

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
