import { LakeAlert } from "@swan-io/lake/src/components/LakeAlert";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeSelect } from "@swan-io/lake/src/components/LakeSelect";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { RadioGroup } from "@swan-io/lake/src/components/RadioGroup";
import { colors } from "@swan-io/lake/src/constants/design";
import { isNotNullishOrEmpty } from "@swan-io/lake/src/utils/nullish";
import { ReactNode, RefObject, forwardRef, useEffect, useImperativeHandle, useMemo } from "react";
import { FormConfig, combineValidators, useForm } from "react-ux-form";
import { P, match } from "ts-pattern";
import { DateField, RadioField, SelectField, TextField } from "../graphql/partner";
import { t } from "../utils/i18n";
import { validatePattern, validateRequired } from "../utils/validations";

export type DynamicFormField = SelectField & TextField & DateField & RadioField;

export type ResultItem = { [key: string]: string };
type TransferInternationalDynamicFormBuilder = {
  results: ResultItem[];
  onChange: (results: ResultItem[]) => void;
  refresh: (keys: string[]) => void;
  ref?: RefObject<unknown>;
  fields: DynamicFormField[];
};

export const TransferInternationalDynamicFormBuilder = forwardRef(
  ({ results = [], refresh, onChange, fields = [] }: TransferInternationalDynamicFormBuilder, ref) => {
   
    const form = useMemo(
      () =>
        fields.reduce<FormConfig<any, any>>(
          (acc, { key, validationRegex: regex, required, example }) => {
            acc[key] = {
              initialValue: results.find(({ key: current }) => current === key)?.value ?? "",
              validate: combineValidators(
                required && validateRequired,
                isNotNullishOrEmpty(regex) && validatePattern(String(regex), String(example)),
              ),
            };
            return acc;
          },
          {},
        ),
      [fields],
    );

    return fields.length > 0 ? (
      <BeneficiaryDynamicForm
        fields={fields}
        form={form}
        key={fields.map(item => item.key).join()}
        refresh={refresh}
        onChange={onChange}
        ref={ref}
      />
    ) : null;
  },
);

type BeneficiaryDynamicFormProps = {
  form: FormConfig<any, any>;
  fields: DynamicFormField[];
  refresh: (keys: string[]) => void;
  onChange: (results: ResultItem[]) => void;
  ref?: RefObject<unknown>;
};

const BeneficiaryDynamicForm = forwardRef(
  ({ fields, form, refresh, onChange }: BeneficiaryDynamicFormProps, ref) => {
    const {
      Field,
      listenFields,
      submitForm: submitDynamicForm,
      validateField,
      getFieldState,
    } = useForm(form);
    
    const dynamicFields = useMemo(
      () =>
        fields
          .filter(({ refreshDynamicFieldsOnChange }) => refreshDynamicFieldsOnChange)
          .map(({ key }) => key),
      [fields],
    );

    useImperativeHandle(
      ref,
      () => ({
        submitDynamicForm,
        validateDynamicForm: () => Promise.all(fields.map(({ key }) => validateField(key))),
      }),
      [submitDynamicForm, validateField, fields],
    );

    useEffect(() => {
      const keys = Object.keys(form);
      listenFields(keys, values => {
        onChange(
          Object.entries(values).map(([key, { value }]) => ({
            key,
            value: String(value),
          })),
        );
        refresh(keys);
      });
    }, [onChange, dynamicFields, listenFields]);

    useEffect(() => {
      fields.map(async ({ key }) => {
        const { value } = getFieldState(key);
        if (isNotNullishOrEmpty(value)) {
          await validateField(key);
        }
      });
    }, [form]);

    return (
      fields.length > 0 &&
      fields.map((field: DynamicFormField) =>
        match(field)
          .with(
            { __typename: P.union("SelectField", "DateField", "RadioField", "TextField") },
            () => (
              <LakeLabel
                key={field.key}
                label={field.name}
                render={id =>
                  match(field)
                    .with({ __typename: "SelectField" }, ({ allowedValues }) => (
                      <Field name={field.key}>
                        {({ onChange, value, ref, error }) => (
                          <LakeSelect
                            id={id}
                            ref={ref}
                            error={error}
                            items={allowedValues.map(({ name, key: value }) => ({ name, value }))}
                            value={String(value)}
                            onValueChange={onChange}
                          />
                        )}
                      </Field>
                    ))
                    .with({ __typename: "DateField" }, () => (
                      <Field name={field.key}>
                        {({ value, onChange, onBlur, error, valid, ref }) => (
                          <LakeTextInput
                            id={id}
                            ref={ref}
                            value={String(value)}
                            error={error}
                            valid={valid}
                            placeholder={field.example}
                            onChangeText={onChange}
                            onBlur={onBlur}
                            inputMode="text"
                          />
                        )}
                      </Field>
                    ))
                    .with({ __typename: "RadioField" }, ({ allowedValues }) => (
                      <Field name={field.key}>
                        {({ onChange, value, error }) => (
                          <>
                            <RadioGroup
                              items={allowedValues.map(({ name, key: value }) => ({ name, value }))}
                              value={String(value)}
                              onValueChange={onChange}
                            />

                            <LakeText color={colors.negative[400]}>{error ?? " "}</LakeText>
                          </>
                        )}
                      </Field>
                    ))
                    .with({ __typename: "TextField" }, () => (
                      <Field name={field.key}>
                        {({ value, onChange, onBlur, error, valid, ref }) => (
                          <LakeTextInput
                            id={id}
                            ref={ref}
                            value={String(value)}
                            error={error}
                            valid={valid}
                            onChangeText={onChange}
                            onBlur={onBlur}
                            inputMode="text"
                          />
                        )}
                      </Field>
                    ))
                    .otherwise(() => (
                      <LakeAlert
                        variant="error"
                        title={t(
                          "transfer.new.internationalTransfer.beneficiary.form.field.unknown",
                        )}
                      />
                    )) as ReactNode
                }
              />
            ),
          )
          .otherwise(() => null),
      )
    );
  },
);
