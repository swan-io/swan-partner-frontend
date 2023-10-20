import { Result } from "@swan-io/boxed";
import { LakeAlert } from "@swan-io/lake/src/components/LakeAlert";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeSelect } from "@swan-io/lake/src/components/LakeSelect";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { RadioGroup } from "@swan-io/lake/src/components/RadioGroup";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { colors } from "@swan-io/lake/src/constants/design";
import { useUrqlQuery } from "@swan-io/lake/src/hooks/useUrqlQuery";
import { isNotNullishOrEmpty } from "@swan-io/lake/src/utils/nullish";
import { ReactNode, useEffect, useMemo, useState } from "react";
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
import { validateRequired } from "../utils/validations";
import { Amount } from "./TransferInternationalWizardAmount";

export type Beneficiary = { name: string };

type ResultItem = { key: string; value: string };

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
  const [results, setResults] = useState<{ [key: string]: string }>({});
  const [routes, setRoutes] = useState([]);
  const [route, setRoute] = useState<string | undefined>();
  const { data } = useUrqlQuery(
    {
      query: GetInternationalBeneficiaryDynamicFormsDocument,
      variables: {
        amountValue: amount.value,
        currency: amount.currency,
        dynamicFields: Object.entries(results).map(([key, value]) => ({ key, value })),
        language: locale.language.toUpperCase() as InternationalCreditTransferDisplayLanguage,
      },
    },
    [locale.language, results],
  );

  const { Field } = useForm({
    name: {
      initialValue: initialBeneficiary?.name,
      sanitize: () => {},
      validate: () => "",
    },
    results: {
      initialValue: [],
    },
  });

  // useEffect(
  //   () =>
  //     listenFields(["results"], ({ results: { value } }) => {
  //       setResults(value.filter(({ value }) => isNotNullishOrEmpty(value)));
  //     }),
  //   [listenFields],
  // );

  const schemes = data
    .mapOkToResult(({ internationalBeneficiaryDynamicForms: { schemes } }) => schemes)
    .getWithDefault([]);

  useEffect(() => {
    const r = schemes.map(({ type: value, title: name }) => ({ value, name }));
    if (!routes.length && r.length) {
      setRoutes(r);
      setRoute(r[0].value);
    }
  }, [schemes]);

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

        {data.match({
          NotAsked: () => null,
          Loading: () => <ActivityIndicator color={colors.gray[900]} />,
          Done: result =>
            result.match({
              Error: () => <h1>todo: error </h1>,
              Ok: ({ internationalBeneficiaryDynamicForms: { schemes } }) =>
                isNotNullishOrEmpty(route) ? (
                  <>
                    <RadioGroup items={routes} value={route} onValueChange={setRoute} />
                    <Space height={32} />

                    <Field name="results">
                      {({ onChange, value }) => (
                        <BeneficiaryForm
                          schemes={schemes}
                          onChange={onChange}
                          results={value}
                          setRoute={setRoute}
                          routes={routes}
                          route={route}
                          refresh={(key, value) => {
                            setResults({
                              ...results,
                              [key]: value,
                            });
                          }}
                        />
                      )}
                    </Field>
                  </>
                ) : null,
            }),
        })}
      </Tile>

      <Space height={32} />

      <ResponsiveContainer breakpoint={800}>
        {({ small }) => (
          <LakeButtonGroup>
            <LakeButton color="gray" mode="secondary" onPress={onPressPrevious}>
              {t("common.previous")}
            </LakeButton>

            <LakeButton color="current" onPress={() => onSave(beneficiary)} grow={small}>
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
};

const BeneficiaryForm = ({
  schemes,
  results = [],
  route,
  refresh,
  onChange,
}: BeneficiaryFormProps) => {
  const fields = useMemo(
    () => schemes.find(({ type }) => type === route)?.fields ?? [],
    [schemes, route],
  );

  console.log("[NC] results", results);
  const form = useMemo(
    () =>
      fields.reduce<FormConfig<any, any>>((acc, current) => {
        acc[current.key] = {
          initialValue: results.find(({ key }) => key === current.key)?.value ?? "",
          validate: current.required ? validateRequired : () => "",
        };
        return acc;
      }, {}),
    [fields],
  );

  return (
    <>
      {fields.length > 0 && isNotNullishOrEmpty(route) ? (
        <BeneficiaryDynamicForm
          fields={fields}
          form={form}
          key={route}
          refresh={refresh}
          onChange={onChange}
        />
      ) : null}
    </>
  );
};

type DynamicFormField = SelectField | TextField | DateField | RadioField;

type BeneficiaryDynamicFormProps = {
  form: FormConfig<any, any>;
  fields: DynamicFormField[];
  refresh: (key: string, value: string) => void;
  onChange: (results: ResultItem[]) => void;
};

const BeneficiaryDynamicForm = ({
  fields,
  form,
  refresh,
  onChange,
}: BeneficiaryDynamicFormProps) => {
  const { Field, listenFields } = useForm(form);

  useEffect(
    () =>
      listenFields(Object.keys(form), values =>
        onChange(Object.entries(values).map(([key, { value }]) => ({ key, value: String(value) }))),
      ),
    [fields, onChange, listenFields],
  );

  return (
    fields.length > 0 &&
    fields.map(({ refreshDynamicFieldsOnChange: dynamic, ...field }) => (
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
            // .with({ __typename: "DateField" }, () => <span>DateField not implemented</span>)
            .with({ __typename: "RadioField" }, ({ allowedValues }) => (
              <Field name={field.key}>
                {({ onChange, value }) => (
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
