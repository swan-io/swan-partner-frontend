import { LakeAlert } from "@swan-io/lake/src/components/LakeAlert";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeSelect } from "@swan-io/lake/src/components/LakeSelect";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { RadioGroup } from "@swan-io/lake/src/components/RadioGroup";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { TransitionView } from "@swan-io/lake/src/components/TransitionView";
import { animations, colors } from "@swan-io/lake/src/constants/design";
import { useUrqlQuery } from "@swan-io/lake/src/hooks/useUrqlQuery";
import { isNotNullishOrEmpty, isNullishOrEmpty } from "@swan-io/lake/src/utils/nullish";
import { ReactNode, RefObject, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { FormConfig, useForm } from "react-ux-form";
import { match } from "ts-pattern";
import {
  DateField,
  GetInternationalBeneficiaryDynamicFormsDocument,
  InternationalCreditTransferDisplayLanguage,
  RadioField,
  Scheme,
  SelectField,
  TextField,
} from "../graphql/partner";
import { locale, t } from "../utils/i18n";
import { getInternationalTransferFormRouteLabel } from "../utils/templateTranslations";
import { Amount } from "./TransferInternationalWizardAmount";

type ResultItem = { key: string; value: string };
export type Beneficiary = { name: string; results: ResultItem[]; route: string };

type Props = {
  initialBeneficiary?: Beneficiary;
  amount: Amount;
  onPressPrevious: () => void;
  onSave: (details: Beneficiary) => void;
};

export const TransferInternationalWizardBeneficiary = ({
  initialBeneficiary,
  amount,
  onPressPrevious,
  onSave,
}: Props) => {
  const [schemes, setSchemes] = useState([]);
  const [results, setResults] = useState<ResultItem[]>(initialBeneficiary?.results ?? []);
  const submitDynamicFormRef = useRef();
  const { data } = useUrqlQuery(
    {
      query: GetInternationalBeneficiaryDynamicFormsDocument,
      variables: {
        amountValue: amount.value,
        currency: amount.currency,
        dynamicFields: results.filter(({ value }) => isNotNullishOrEmpty(value)),
        language: locale.language.toUpperCase() as InternationalCreditTransferDisplayLanguage,
      },
    },
    [locale.language, results],
  );

  const { Field, submitForm, FieldsListener, setFieldValue, getFieldState } = useForm({
    name: {
      initialValue: initialBeneficiary?.name,
      validate: () => undefined,
    },
    route: {
      initialValue: initialBeneficiary?.route,
      validate: () => undefined,
    },
    results: {
      initialValue: initialBeneficiary?.results,
      validate: () => undefined,
    },
  });

  const updatedSchemes = data
    .mapOkToResult(({ internationalBeneficiaryDynamicForms: { schemes } }) => schemes)
    .getWithDefault([]);

  useEffect(() => {
    if (!data.isLoading()) {
      setSchemes(updatedSchemes);
    }
  }, [updatedSchemes]);

  const routes = useMemo(
    () =>
      schemes.map(({ type: value }) => ({
        value,
        name: getInternationalTransferFormRouteLabel(value),
      })),
    [schemes],
  );

  useEffect(() => {
    const { value } = getFieldState("route");
    if (routes?.length && isNullishOrEmpty(initialBeneficiary?.route) && !value) {
      setFieldValue("route", routes[0].value);
    }
  }, [routes]);

  return (
    <View>
      <Tile>
        <LakeLabel
          label={t("transfer.new.internationalTransfer.beneficiary.name")}
          render={id => (
            <Field name="name">
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
          )}
        />

        {data.isLoading() && !schemes.length ? (
          <ActivityIndicator color={colors.gray[900]} />
        ) : (
          <TransitionView {...(data.isLoading() && animations.heartbeat)}>
            {routes.length > 1 && (
              <Field name="route">
                {({ onChange, value }) => (
                  <>
                    <RadioGroup items={routes} value={value} onValueChange={onChange} />
                    <Space height={32} />
                  </>
                )}
              </Field>
            )}
            <FieldsListener names={["route"]}>
              {({ route }) => (
                <Field name="results">
                  {({ onChange, value }) =>
                    isNotNullishOrEmpty(route?.value) ? (
                      <BeneficiaryForm
                        schemes={schemes}
                        onChange={onChange}
                        results={value}
                        routes={routes}
                        route={route.value}
                        key={[route.value, JSON.stringify(updatedSchemes)].join("")}
                        submitDynamicFormRef={submitDynamicFormRef}
                        refresh={(key, value) => {
                          setResults(res => {
                            const copy = res.slice();
                            const index = copy.findIndex(({ key: k }) => k === key);

                            if (index >= 0) {
                              copy[index] = { key, value };
                              return copy;
                            }

                            return [...copy, { key, value }];
                          });
                        }}
                      />
                    ) : null
                  }
                </Field>
              )}
            </FieldsListener>
          </TransitionView>
        )}
      </Tile>

      <Space height={32} />

      <ResponsiveContainer breakpoint={800}>
        {({ small }) => (
          <LakeButtonGroup>
            <LakeButton color="gray" mode="secondary" onPress={onPressPrevious}>
              {t("common.previous")}
            </LakeButton>

            <LakeButton
              color="current"
              onPress={() => submitDynamicFormRef?.current?.(() => submitForm(onSave))}
              grow={small}
            >
              {t("common.continue")}
            </LakeButton>
          </LakeButtonGroup>
        )}
      </ResponsiveContainer>
    </View>
  );
};

type BeneficiaryFormProps = {
  schemes: Scheme[];
  results: ResultItem[];
  onChange: (results: ResultItem[]) => void;
  route: string;
  refresh: (key: string, value: string) => void;
  submitDynamicFormRef?: RefObject<unknown>;
};

const BeneficiaryForm = ({
  schemes,
  results = [],
  route,
  refresh,
  onChange,
  submitDynamicFormRef,
}: BeneficiaryFormProps) => {
  const fields = useMemo(
    () => schemes.find(({ type }) => type === route)?.fields ?? [],
    [schemes, route],
  );

  console.log("[NC] route", route);

  const form = useMemo(
    () =>
      fields.reduce<FormConfig<any, any>>(
        (acc, { key, validationRegex: regex, required, example }) => {
          acc[key] = {
            initialValue: results.find(({ key: current }) => current === key)?.value ?? "",
            validate: () => undefined,
            // validate: combineValidators(
            //   required && validateRequired,
            //   isNotNullishOrEmpty(regex) && validatePattern(String(regex), String(example)),
            // ),
          };
          return acc;
        },
        {},
      ),
    [fields],
  );

  return fields.length > 0 && isNotNullishOrEmpty(route) ? (
    <BeneficiaryDynamicForm
      fields={fields}
      form={form}
      key={route}
      refresh={refresh}
      onChange={onChange}
      submitDynamicFormRef={submitDynamicFormRef}
    />
  ) : null;
};

type DynamicFormField = SelectField | TextField | DateField | RadioField;

type BeneficiaryDynamicFormProps = {
  form: FormConfig<any, any>;
  fields: DynamicFormField[];
  refresh: (key: string, value: string) => void;
  onChange: (results: ResultItem[]) => void;
  submitDynamicFormRef?: RefObject<unknown>;
};

const BeneficiaryDynamicForm = ({
  fields,
  form,
  refresh,
  onChange,
  submitDynamicFormRef,
}: BeneficiaryDynamicFormProps) => {
  const { Field, listenFields, submitForm } = useForm(form);

  useEffect(() => {
    submitDynamicFormRef.current = submitForm;
  }, [submitForm]);

  useEffect(
    () =>
      listenFields(Object.keys(form), values =>
        onChange(
          Object.entries(values).map(([key, { value }]) => ({
            key,
            value: String(value),
          })),
        ),
      ),
    [fields, onChange, listenFields],
  );

  return (
    fields.length > 0 &&
    fields.map(({ refreshDynamicFieldsOnChange: dynamic, example, ...field }) => (
      <LakeLabel
        key={field.key}
        label={field.name}
        render={id =>
          match(field)
            .with({ __typename: "SelectField" }, ({ allowedValues }) => (
              <Field name={field.key}>
                {({ onChange, value, ref }) => (
                  <LakeSelect
                    id={id}
                    ref={ref}
                    items={allowedValues.map(({ name, key: value }) => ({ name, value }))}
                    value={String(value)}
                    onValueChange={value => {
                      if (dynamic) {
                        refresh(field.key, value);
                      }
                      onChange(value);
                    }}
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
                    placeholder={example}
                    onChangeText={value => {
                      if (dynamic) {
                        refresh(field.key, value);
                      }
                      onChange(value);
                    }}
                    onBlur={onBlur}
                    inputMode="text"
                  />
                )}
              </Field>
            ))
            .with({ __typename: "RadioField" }, ({ allowedValues }) => (
              <Field name={field.key}>
                {({ onChange, value }) => (
                  <>
                    <RadioGroup
                      items={allowedValues.map(({ name, key: value }) => ({ name, value }))}
                      value={String(value)}
                      onValueChange={value => {
                        if (dynamic) {
                          refresh(field.key, value);
                        }
                        onChange(value);
                      }}
                    />

                    <Space height={24} />
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
                    onChangeText={value => {
                      if (dynamic) {
                        refresh(field.key, value);
                      }
                      onChange(value);
                    }}
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
            )) as ReactNode
        }
      />
    ))
  );
};
