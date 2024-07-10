import { Array, Dict, Option } from "@swan-io/boxed";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeSelect } from "@swan-io/lake/src/components/LakeSelect";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { RadioGroup } from "@swan-io/lake/src/components/RadioGroup";
import { Space } from "@swan-io/lake/src/components/Space";
import { colors } from "@swan-io/lake/src/constants/design";
import { combineValidators, useForm } from "@swan-io/use-form";
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import { P, match } from "ts-pattern";
import { DateField, RadioField, SelectField, TextField } from "../graphql/partner";
import { validatePattern, validateRequired } from "../utils/validations";

export type DynamicFormField = SelectField | TextField | DateField | RadioField;

export type FormValue = { key: string; value: string };

export type DynamicFormRef = {
  submit: () => void;
};

type Props = {
  fields: DynamicFormField[];
  initialValues: FormValue[];
  refreshing: boolean;
  onRefreshRequest: (values: FormValue[]) => void;
  onSubmit: (values: FormValue[]) => void;
};

export const TransferInternationalDynamicForm = forwardRef<DynamicFormRef, Props>(
  ({ initialValues, onRefreshRequest, refreshing, onSubmit, fields }, forwardedRef) => {
    // keep it in a ref as we only care about the values on mount
    const initialValuesRef = useRef(initialValues);

    const form = useMemo(() => {
      return Dict.fromEntries(
        fields.map(field => [
          field.key,
          {
            initialValue: Array.findMap(initialValuesRef.current, value =>
              value.key === field.key ? Option.Some(value.value) : Option.None(),
            ).getOr(""),
            validate: combineValidators(
              field.required && validateRequired,
              match(field)
                .with({ validationRegex: P.string }, ({ validationRegex, example }) =>
                  validatePattern(validationRegex, example ?? undefined),
                )
                .otherwise(() => false),
            ),
          },
        ]),
      );
    }, [fields]);

    const { Field, submitForm, listenFields } = useForm(form);

    useImperativeHandle(
      forwardedRef,
      () => ({
        submit: () => {
          submitForm({
            onSuccess: formValues => {
              const values = Option.allFromDict(formValues)
                .map(Dict.entries)
                .getOr([])
                .map(([key, value]) => ({
                  key,
                  value,
                }));
              onSubmit(values);
            },
          });
        },
      }),
      [submitForm, onSubmit],
    );

    useEffect(() => {
      const refreshingFields = Array.filterMap(fields, field =>
        match(field)
          .with(
            { __typename: "RadioField", refreshDynamicFieldsOnChange: true },
            { __typename: "SelectField", refreshDynamicFieldsOnChange: true },
            { __typename: "TextField", refreshDynamicFieldsOnChange: true },
            field => Option.Some(field.key),
          )
          .otherwise(() => Option.None()),
      );

      const unsubscribe = listenFields(refreshingFields, fields => {
        onRefreshRequest(Dict.entries(fields).map(([key, { value }]) => ({ key, value })));
      });

      return () => unsubscribe();
    }, [fields, listenFields, onRefreshRequest]);

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
                    readOnly={refreshing}
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
                    readOnly={refreshing}
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
                      disabled={refreshing}
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
                    readOnly={refreshing}
                  />
                )}
              </Field>
            ))
            .exhaustive()
        }
      />
    ));
  },
);
