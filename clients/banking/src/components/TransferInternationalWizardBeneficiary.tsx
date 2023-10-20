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
import { isNotNullishOrEmpty, isNullishOrEmpty } from "@swan-io/lake/src/utils/nullish";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useForm } from "react-ux-form";
import { match } from "ts-pattern";
import {
  DateField,
  GetInternationalBeneficiaryDynamicFormsDocument,
  InternationalCreditTransferDisplayLanguage,
  RadioField,
  SelectField,
  TextField,
} from "../graphql/partner";
import { locale, t } from "../utils/i18n";
import { validateRequired } from "../utils/validations";
import { Amount } from "./TransferInternationalWizardAmount";

export type Beneficiary = { name: string };

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
  const [results, setResults] = useState([]);
  const { data } = useUrqlQuery(
    {
      query: GetInternationalBeneficiaryDynamicFormsDocument,
      variables: {
        dynamicFields: results,
        amountValue: amount.value,
        currency: amount.currency,
        language: locale.language.toUpperCase() as InternationalCreditTransferDisplayLanguage,
      },
    },
    [locale.language, results],
  );

  const { Field, listenFields } = useForm({
    name: {
      initialValue: initialBeneficiary?.name,
      sanitize: () => {},
      validate: () => "",
    },
    results: {
      initialValue: [],
    },
  });

  useEffect(
    () =>
      listenFields(["results"], ({ results: { value } }) =>
        setResults(value.filter(({ value }) => isNotNullishOrEmpty(value))),
      ),
    [listenFields],
  );
  data.mapOkToResult(({ internationalBeneficiaryDynamicForms: { schemes } }) => {
    console.log("[NC] a", schemes);
  });

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
              Ok: ({ internationalBeneficiaryDynamicForms: { schemes } }) => {
                return (
                  <Field name="results">
                    {({ onChange, value }) => (
                      <BeneficiaryForm schemes={schemes} onChange={onChange} results={value} />
                    )}
                  </Field>
                );
              },
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

type Result = { key: string; value: string };
type BeneficiaryFormProps = {
  schemes: {
    fields: DynamicFormField[];
    remainingFieldsToRefreshCount: number;
    title: string;
    type: string;
  }[];
  results: Result[];
  onChange: (results: Result[]) => void;
};

const BeneficiaryForm = ({ schemes, results = [], onChange }: BeneficiaryFormProps) => {
  const [route, setRoute] = useState<string | undefined>();
  const routes = useMemo<{ value: string; name: string }[]>(
    () => schemes?.map(({ type: value, title: name }) => ({ value, name })) ?? [],
    [schemes],
  );

  const fields = useMemo(
    () => schemes.find(({ type }) => type === route)?.fields ?? [],
    [schemes, route],
  );

  const form = useMemo(
    () =>
      fields.reduce((acc, current) => {
        acc[current.key] = {
          initialValue: results.find(({ key }) => key === current.key)?.value ?? "",
          validate: current.required ? validateRequired : () => "",
        };
        return acc;
      }, {}),
    [fields],
  );

  useEffect(() => {
    if (isNullishOrEmpty(route)) {
      setRoute(routes?.[0]?.value);
    }
  }, [routes]);

  console.log("[NC] form", form);

  return (
    <>
      <RadioGroup items={routes} value={route} onValueChange={setRoute} />
      <Space height={32} />

      {fields.length > 0 && isNotNullishOrEmpty(route) ? (
        <BeneficiaryDynamicForm fields={fields} form={form} key={route} onChange={onChange} />
      ) : null}
    </>
  );
};

type DynamicFormField = SelectField | TextField | DateField | RadioField;

type BeneficiaryDynamicFormProps = {
  form: {
    initialValue: string;
    validate: () => string;
  }[];
  fields: DynamicFormField[];
  onChange: (results: Result[]) => void;
};

const BeneficiaryDynamicForm = ({ fields, form, onChange }: BeneficiaryDynamicFormProps) => {
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
    fields.map(field => (
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
                    value={value}
                    onValueChange={onChange}
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
                    value={value}
                    onValueChange={onChange}
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
            )) as ReactNode
        }
      />
    ))
  );
};
