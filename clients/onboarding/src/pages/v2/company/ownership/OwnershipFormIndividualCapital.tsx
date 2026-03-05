import { Option } from "@swan-io/boxed";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { RadioGroup } from "@swan-io/lake/src/components/RadioGroup";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { breakpoints } from "@swan-io/lake/src/constants/design";
import { trim } from "@swan-io/lake/src/utils/string";
import {
  validateRequired,
  validateUsaTaxNumber,
} from "@swan-io/shared-business/src/utils/validation";
import { combineValidators, useForm } from "@swan-io/use-form";
import { Ref, useImperativeHandle } from "react";
import { StyleSheet, View } from "react-native";
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
    // gridTemplateColumns: "1fr 1fr",
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

export const OwnershipFormIndividualCapital = ({ ref, onSave, initialValues }: Props) => {
  useImperativeHandle(ref, () => {
    return {
      submit: () => {
        submitForm({
          onSuccess: values => {
            console.log("SUBMIT CAPITAL", values);
            const option = Option.allFromDict(values);
            console.log("options", option);
            if (option.isNone()) {
              return;
            }
            const currentValues = option.get();
            const { isUnitedStatesPerson, unitedStatesTaxIdentificationNumber } = currentValues;
            console.log("currentValues", currentValues);
            onSave({
              unitedStatesTaxInfo: {
                isUnitedStatesPerson,
                unitedStatesTaxIdentificationNumber: isUnitedStatesPerson
                  ? unitedStatesTaxIdentificationNumber
                  : undefined,
              },
            });
          },
        });
      },
    };
  });

  const { Field, submitForm, FieldsListener } = useForm({
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
    <ResponsiveContainer breakpoint={breakpoints.medium}>
      {({ large }) => (
        <View role="form" style={[styles.grid, large && styles.gridDesktop]}>
          <LakeLabel
            label={t("form.label.usaCitizen")}
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
