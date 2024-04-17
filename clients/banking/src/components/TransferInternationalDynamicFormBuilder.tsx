import { LakeAlert } from "@swan-io/lake/src/components/LakeAlert";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeSelect } from "@swan-io/lake/src/components/LakeSelect";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { RadioGroup } from "@swan-io/lake/src/components/RadioGroup";
import { Space } from "@swan-io/lake/src/components/Space";
import { colors } from "@swan-io/lake/src/constants/design";
import { isNotNullishOrEmpty } from "@swan-io/lake/src/utils/nullish";
import { Form, FormConfig, combineValidators, useForm } from "@swan-io/use-form";
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import { P, match } from "ts-pattern";
import {
  DateField,
  InternationalBeneficiaryDetailsInput,
  InternationalCreditTransferDetailsInput,
  RadioField,
  SelectField,
  TextField,
} from "../graphql/partner";
import { t } from "../utils/i18n";
import { validatePattern, validateRequired } from "../utils/validations";

export type DynamicFormField = SelectField | TextField | DateField | RadioField;

export type ResultItem =
  | InternationalBeneficiaryDetailsInput
  | InternationalCreditTransferDetailsInput;

type DynamicForm = Form<Record<string, string>>;

export type DynamicFormApi = {
  submitDynamicForm: (onSuccess: () => void) => void;
};

type TransferInternationalDynamicFormBuilderProps = {
  fields: DynamicFormField[];
  results: ResultItem[];
  onChange: (results: ResultItem[]) => void;
};

export const TransferInternationalDynamicFormBuilder = forwardRef<
  DynamicFormApi,
  TransferInternationalDynamicFormBuilderProps
>(({ results = [], onChange, fields = [] }, forwardedRef) => {
  const resultsRef = useRef<ResultItem[]>();
  resultsRef.current = results;

  const form = useMemo(
    () =>
      fields.reduce<FormConfig<Record<string, string>>>((acc, field) => {
        const initialValue =
          resultsRef.current?.find(({ key: current }) => current === field.key)?.value ?? "";

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
      <DynamicForm
        ref={forwardedRef}
        fields={fields}
        form={form}
        key={fields.map(item => item.key).join()}
        onChange={onChange}
      />
    )
  );
});

type DynamicFormProps = {
  fields: DynamicFormField[];
  form: FormConfig<Record<string, string>>;
  onChange: (results: ResultItem[]) => void;
};

const DynamicForm = forwardRef<DynamicFormApi, DynamicFormProps>(
  ({ fields, form, onChange }, forwardedRef) => {
    const { Field, listenFields, submitForm, validateField, getFieldValue } = useForm(form);

    useImperativeHandle(
      forwardedRef,
      () => ({
        submitDynamicForm: onSuccess => {
          submitForm({ onSuccess });
        },
      }),
      [submitForm],
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
      });
    }, [form, onChange, listenFields]);

    useEffect(() => {
      void Promise.all(
        fields.map(async ({ key }) => {
          const value = getFieldValue(key);

          if (isNotNullishOrEmpty(value)) {
            await validateField(key);
          }
        }),
      );
    }, [form, fields, getFieldValue, validateField]);

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
                    placeholder={example?.toUpperCase() ?? undefined}
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
                    <Space height={4} />

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
