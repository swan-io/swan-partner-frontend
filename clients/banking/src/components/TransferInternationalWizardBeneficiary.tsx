import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { RadioGroup } from "@swan-io/lake/src/components/RadioGroup";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { TransitionView } from "@swan-io/lake/src/components/TransitionView";
import { animations, colors } from "@swan-io/lake/src/constants/design";
import { useDebounce } from "@swan-io/lake/src/hooks/useDebounce";
import { useUrqlQuery } from "@swan-io/lake/src/hooks/useUrqlQuery";
import {
  isNotNullish,
  isNotNullishOrEmpty,
  isNullishOrEmpty,
} from "@swan-io/lake/src/utils/nullish";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { hasDefinedKeys, useForm } from "react-ux-form";

import { AsyncData, Result } from "@swan-io/boxed";
import { LakeAlert } from "@swan-io/lake/src/components/LakeAlert";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { noop } from "@swan-io/lake/src/utils/function";
import { StyleSheet } from "react-native";
import { P, match } from "ts-pattern";
import {
  GetInternationalBeneficiaryDynamicFormsDocument,
  InternationalBeneficiaryDetailsInput,
  Scheme,
} from "../graphql/partner";
import { locale, t } from "../utils/i18n";
import { getInternationalTransferFormRouteLabel } from "../utils/templateTranslations";
import { validateRequired } from "../utils/validations";
import {
  DynamicFormApi,
  DynamicFormField,
  ResultItem,
  TransferInternationalDynamicFormBuilder,
} from "./TransferInternationalDynamicFormBuilder";
import { Amount } from "./TransferInternationalWizardAmount";

const styles = StyleSheet.create({
  hidden: {
    display: "none",
  },
});

export type Beneficiary = {
  name: string;
  route: string;
  results: InternationalBeneficiaryDetailsInput[];
};

type Props = {
  initialBeneficiary?: Beneficiary;
  amount: Amount;
  errors?: string[];
  onPressPrevious: () => void;
  onSave: (details: Beneficiary) => void;
};

export const TransferInternationalWizardBeneficiary = ({
  initialBeneficiary,
  amount,
  errors,
  onPressPrevious,
  onSave,
}: Props) => {
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [route, setRoute] = useState<string | undefined>();
  const [dynamicFields, setDynamicFields] = useState(initialBeneficiary?.results ?? []);

  const dynamicFormApiRef = useRef<DynamicFormApi | null>(null);

  const { data } = useUrqlQuery(
    {
      query: GetInternationalBeneficiaryDynamicFormsDocument,
      variables: {
        dynamicFields,
        amountValue: amount.value,
        currency: amount.currency,
        language: locale.language,
      },
    },
    [locale.language, dynamicFields],
  );

  const { Field, submitForm, FieldsListener, listenFields, setFieldValue, getFieldState } =
    useForm<{
      name: string;
      route: string;
      results: ResultItem[];
    }>({
      name: {
        initialValue: initialBeneficiary?.name ?? "",
        validate: validateRequired,
      },
      route: {
        initialValue: initialBeneficiary?.route ?? "",
        validate: () => undefined,
      },
      results: {
        initialValue: initialBeneficiary?.results ?? [],
        validate: () => undefined,
      },
    });

  useEffect(() => {
    match(data)
      .with(
        AsyncData.P.Done(
          Result.P.Ok({ internationalBeneficiaryDynamicForms: P.select(P.not(P.nullish)) }),
        ),
        ({ schemes }) => setSchemes(schemes),
      )
      .otherwise(noop);
  }, [data]);

  const routes = useMemo(() => {
    return schemes.map(({ type: value }) => ({
      value,
      name: getInternationalTransferFormRouteLabel(value),
    }));
  }, [schemes]);

  const fields = useMemo<DynamicFormField[]>(
    () => (schemes.find(({ type }) => type === route)?.fields ?? []) as DynamicFormField[],
    [schemes, route],
  );

  const refresh = useDebounce<void>(() => {
    const { value } = getFieldState("results");

    setDynamicFields(value?.filter(({ value }) => isNotNullishOrEmpty(value)) ?? []);
  }, 1000);

  useEffect(() => {
    const { value } = getFieldState("route");

    if (value && isNullishOrEmpty(route)) {
      setRoute(value);
    }
    if (routes?.length && isNullishOrEmpty(initialBeneficiary?.route) && !value && routes[0]) {
      setFieldValue("route", routes[0].value);
      setRoute(routes[0].value);
    }
  }, [route, routes, initialBeneficiary?.route, setFieldValue, getFieldState]);

  useEffect(() => {
    const removeRouteListener = listenFields(["route"], ({ route: { value } }) => setRoute(value));
    const removeResultsListener = listenFields(["results"], () => refresh());

    return () => {
      removeRouteListener();
      removeResultsListener();
    };
  }, [listenFields, refresh]);

  return (
    <View>
      <Tile
        footer={
          isNotNullish(errors) && errors.length > 0 ? (
            <LakeAlert
              anchored={true}
              variant="error"
              title={
                errors.length > 1 ? t("transfer.new.internationalTransfer.errors.title") : errors[0]
              }
            >
              {errors.length > 1
                ? errors?.map((message, i) => (
                    <LakeText key={`validation-alert-${i}`}>{message}</LakeText>
                  ))
                : null}
            </LakeAlert>
          ) : null
        }
      >
        <LakeLabel
          label={t("transfer.new.internationalTransfer.beneficiary.name")}
          render={id => (
            <Field name="name">
              {({ value, onChange, onBlur, error, valid, ref }) => (
                <LakeTextInput
                  ref={ref}
                  id={id}
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
            <LakeLabel
              label={t("transfer.new.internationalTransfer.beneficiary.route.intro")}
              style={routes.length < 2 && styles.hidden}
              render={() => (
                <>
                  <Space height={8} />

                  <Field name="route">
                    {({ onChange, value }) => (
                      <>
                        <RadioGroup items={routes} value={value} onValueChange={onChange} />
                        <Space height={32} />
                      </>
                    )}
                  </Field>
                </>
              )}
            />

            <FieldsListener names={["route"]}>
              {({ route }) => (
                <Field name="results">
                  {({ onChange, value }) =>
                    isNotNullishOrEmpty(route?.value) ? (
                      <TransferInternationalDynamicFormBuilder
                        ref={dynamicFormApiRef}
                        fields={fields}
                        onChange={onChange}
                        results={value}
                        key={route.value}
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
              disabled={data.isLoading()}
              grow={small}
              onPress={() => {
                dynamicFormApiRef.current?.submitDynamicForm(() =>
                  submitForm(values => {
                    if (hasDefinedKeys(values, ["name", "route", "results"])) {
                      onSave(values);
                    }
                  }),
                );
              }}
            >
              {t("common.continue")}
            </LakeButton>
          </LakeButtonGroup>
        )}
      </ResponsiveContainer>
    </View>
  );
};
