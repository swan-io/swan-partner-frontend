import { Box } from "@swan-io/lake/src/components/Box";
import { Fill } from "@swan-io/lake/src/components/Fill";
import { LakeAlert } from "@swan-io/lake/src/components/LakeAlert";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeSelect } from "@swan-io/lake/src/components/LakeSelect";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { RadioGroup } from "@swan-io/lake/src/components/RadioGroup";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { TransitionView } from "@swan-io/lake/src/components/TransitionView";
import { animations, colors } from "@swan-io/lake/src/constants/design";
import { useDebounce } from "@swan-io/lake/src/hooks/useDebounce";
import { isNotNullishOrEmpty, isNullishOrEmpty } from "@swan-io/lake/src/utils/nullish";
import {
  ReactNode,
  RefObject,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { ActivityIndicator, View } from "react-native";
import { FormConfig, combineValidators, useForm } from "react-ux-form";
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
import { partnerClient } from "../utils/urql";
import { validatePattern, validateRequired } from "../utils/validations";
import { Amount } from "./TransferInternationalWizardAmount";
import { useUrqlQuery } from "@swan-io/lake/src/hooks/useUrqlQuery";

type ResultItem = { key: string; value: string };
type Results = { [key: string]: string };
export type Beneficiary = { name: string; results: Results; route: string };

type Props = {
  initialBeneficiary?: Beneficiary;
  amount: Amount;
  onPressPrevious: () => void;
  onSave: (details: Beneficiary) => void;
};

const getClient = (language: string, amount: Amount) => dynamicFields =>
  partnerClient
    .query(GetInternationalBeneficiaryDynamicFormsDocument, {
      dynamicFields,
      amountValue: amount.value,
      currency: amount.currency,
      language,
    })
    .toPromise()
    .then(
      ({
        data: {
          internationalBeneficiaryDynamicForms: { schemes },
        },
      }) => schemes,
    );

export const TransferInternationalWizardBeneficiary = ({
  initialBeneficiary,
  amount,
  onPressPrevious,
  onSave,
}: Props) => {
  const [schemes, setSchemes] = useState([]);
  const [route, setRoute] = useState();
  const [dynamicFields, setDynamicFields] = useState(initialBeneficiary?.results ?? []);

  const ref = useRef();

  const fetch = useMemo(() => getClient(locale.language.toUpperCase(), amount), [locale, amount]);

  // useEffect(() => {
  //   fetch(dynamicFields)
  //     .then(setSchemes)
  //     .catch(() => setSchemes([]));
  // }, [dynamicFields]);

  const { data } = useUrqlQuery(
    {
      query: GetInternationalBeneficiaryDynamicFormsDocument,
      variables: {
        dynamicFields,
        amountValue: amount.value,
        currency: amount.currency,
        language: locale.language.toUpperCase() as InternationalCreditTransferDisplayLanguage,
      },
    },
    [locale.language, dynamicFields],
  );

  const { Field, submitForm, FieldsListener, setFieldValue, getFieldState } = useForm({
    name: {
      initialValue: initialBeneficiary?.name,
      validate: validateRequired,
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

  const refresh = useDebounce<string[]>(keys => {
    const { value } = getFieldState("results");
    setDynamicFields(
      value?.filter(({ key, value }) => keys.includes(key) && isNotNullishOrEmpty(value)) ?? [],
    );
  }, 1000);

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
                        key={route.value}
                        ref={ref}
                        refresh={refresh}
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
              // onPress={() => ref.current.submitDynamicForm(() => submitForm(onSave))}
              onPress={() => {
                ref.current.validateDynamicForm().then(console.log);
              }}
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
  refresh: (keys: string[]) => void;
  ref?: RefObject<unknown>;
};

const BeneficiaryForm = forwardRef(
  ({ schemes = [], results = [], route, refresh, onChange }: BeneficiaryFormProps, ref) => {
    const fields = useMemo(
      () => schemes.find(({ type }) => type === route)?.fields ?? [],
      [schemes, route],
    );
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

    return fields.length > 0 && isNotNullishOrEmpty(route) ? (
      <BeneficiaryDynamicForm
        fields={fields}
        form={form}
        key={fields.map(item => item.key).join(":")}
        refresh={refresh}
        onChange={onChange}
        ref={ref}
      />
    ) : null;
  },
);

type DynamicFormField = SelectField | TextField | DateField | RadioField;

type BeneficiaryDynamicFormProps = {
  form: FormConfig<any, any>;
  fields: DynamicFormField[];
  refresh: (keys: string[]) => void;
  onChange: (results: ResultItem[]) => void;
  ref?: RefObject<unknown>;
};

const BeneficiaryDynamicForm = forwardRef(
  ({ fields, form, refresh, onChange }: BeneficiaryDynamicFormProps, ref) => {
    const { Field, listenFields, submitForm: submitDynamicForm, validateField } = useForm(form);
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
      listenFields(Object.keys(form), values =>
        onChange(
          Object.entries(values).map(([key, { value }]) => ({
            key,
            value: String(value),
          })),
        ),
      );

      listenFields(dynamicFields, () => refresh(dynamicFields));
    }, [onChange, dynamicFields, listenFields]);

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
                      placeholder={example}
                      onChangeText={onChange}
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
                        onValueChange={onChange}
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
  },
);

type SummaryProps = {
  beneficiary: Beneficiary;
  onPressEdit: () => void;
};

export const TransferInternationamWizardBeneficiarySummary = ({
  beneficiary,
  onPressEdit,
}: SummaryProps) => {
  return (
    <Tile selected={false}>
      <Box direction="row">
        <View>
          <LakeText color={colors.gray[500]} variant="regular">
            {t("transfer.new.internationalTransfer.beneficiary.summary.title")}
          </LakeText>

          <Space height={8} />

          <LakeHeading level={4} variant="h4">
            {beneficiary.name}
          </LakeHeading>
        </View>

        <Fill />

        <LakeButton mode="tertiary" icon="edit-regular" onPress={onPressEdit}>
          {t("common.edit")}
        </LakeButton>
      </Box>
    </Tile>
  );
};
