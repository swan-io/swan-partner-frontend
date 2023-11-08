import { LakeAlert } from "@swan-io/lake/src/components/LakeAlert";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeSelect } from "@swan-io/lake/src/components/LakeSelect";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { RadioGroup } from "@swan-io/lake/src/components/RadioGroup";
import { colors } from "@swan-io/lake/src/constants/design";
import { isNotNullishOrEmpty } from "@swan-io/lake/src/utils/nullish";
import { forwardRef, useEffect, useImperativeHandle, useMemo } from "react";
import { Form, FormConfig, combineValidators, useForm } from "react-ux-form";
import { P, isMatching, match } from "ts-pattern";
import {
  DateField,
  InternationalCreditTransferDetailsInput,
  RadioField,
  SelectField,
  TextField,
} from "../graphql/partner";
import { t } from "../utils/i18n";
import { validatePattern, validateRequired } from "../utils/validations";

const isDynamicField = isMatching({
  refreshDynamicFieldsOnChange: true,
});

export type DynamicFormField = SelectField | TextField | DateField | RadioField;

type DynamicForm = Form<Record<string, string>>;

export type DynamicFormApi = {
  submitDynamicForm: DynamicForm["submitForm"];
};

type TransferInternationalDynamicFormBuilderProps = {
  fields: DynamicFormField[];
  results: InternationalCreditTransferDetailsInput[];
  refresh: (keys: string[]) => void;
  onChange: (results: InternationalCreditTransferDetailsInput[]) => void;
};

export const TransferInternationalDynamicFormBuilder = forwardRef<
  DynamicFormApi,
  TransferInternationalDynamicFormBuilderProps
>(({ results = [], refresh, onChange, fields = [] }, forwardedRef) => {
  const form = useMemo(
    () =>
      fields.reduce<FormConfig<Record<string, string>>>((acc, field) => {
        const initialValue = results.find(({ key: current }) => current === field.key)?.value ?? "";

        acc[field.key] = {
          initialValue,
          validate: combineValidators(
            field.required && validateRequired,

            match(field)
              .with({ validationRegex: P.string }, ({ validationRegex, example }) =>
                validatePattern(validationRegex, example ?? undefined),
              )
              .otherwise(() => false),
          ),
        };

        return acc;
      }, {}),
    [fields],
  );

  return (
    fields.length > 0 && (
      <BeneficiaryDynamicForm
        ref={forwardedRef}
        fields={fields}
        form={form}
        key={fields.map(item => item.key).join()}
        refresh={refresh}
        onChange={onChange}
      />
    )
  );
});

type BeneficiaryDynamicFormProps = {
  fields: DynamicFormField[];
  form: FormConfig<Record<string, string>>;
  refresh: (keys: string[]) => void;
  onChange: (results: InternationalCreditTransferDetailsInput[]) => void;
};

const BeneficiaryDynamicForm = forwardRef<DynamicFormApi, BeneficiaryDynamicFormProps>(
  ({ fields, form, refresh, onChange }, forwardedRef) => {
    const { Field, listenFields, submitForm, validateField, getFieldState } = useForm(form);

    const dynamicFields = useMemo(
      () => fields.filter(field => isDynamicField(field)).map(({ key }) => key),
      [fields],
    );

    useImperativeHandle(forwardedRef, () => ({ submitDynamicForm: submitForm }), [submitForm]);

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

    if (fields.length === 0) {
      return null;
    }

    return fields.map((field: DynamicFormField) => (
      <LakeLabel
        key={field.key}
        label={field.name}
        render={id =>
          match(field)
            .with({ __typename: "SelectField" }, ({ key, allowedValues }) => (
              <Field name={key}>
                {({ onChange, value, ref, error }) => (
                  <LakeSelect
                    id={id}
                    ref={ref}
                    error={error}
                    items={allowedValues.map(({ name, key: value }) => ({ name, value }))}
                    value={value}
                    onValueChange={onChange}
                  />
                )}
              </Field>
            ))
            .with({ __typename: "DateField" }, ({ key, example }) => (
              <Field name={key}>
                {({ value, onChange, onBlur, error, valid, ref }) => (
                  <LakeTextInput
                    id={id}
                    ref={ref}
                    value={value}
                    error={error}
                    valid={valid}
                    placeholder={example ?? undefined}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    inputMode="text"
                  />
                )}
              </Field>
            ))
            .with({ __typename: "RadioField" }, ({ key, allowedValues }) => (
              <Field name={key}>
                {({ onChange, value, error }) => (
                  <>
                    <RadioGroup
                      items={allowedValues.map(({ name, key: value }) => ({ name, value }))}
                      value={value}
                      onValueChange={onChange}
                    />

                    <LakeText color={colors.negative[400]}>{error ?? " "}</LakeText>
                  </>
                )}
              </Field>
            ))
            .with({ __typename: "TextField" }, ({ key }) => (
              <Field name={key}>
                {({ value, onChange, onBlur, error, valid, ref }) => (
                  <LakeTextInput
                    id={id}
                    ref={ref}
                    value={value}
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
                title={t("transfer.new.internationalTransfer.beneficiary.form.field.unknown")}
              />
            ))
        }
      />
    ));
  },
);
