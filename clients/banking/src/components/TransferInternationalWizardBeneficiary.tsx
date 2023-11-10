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
import { isNotNullishOrEmpty, isNullishOrEmpty } from "@swan-io/lake/src/utils/nullish";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { hasDefinedKeys, useForm } from "react-ux-form";

import { AsyncData, Result } from "@swan-io/boxed";
import { useBoolean } from "@swan-io/lake/src/hooks/useBoolean";
import { noop } from "@swan-io/lake/src/utils/function";
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

export type Beneficiary = {
  name: string;
  route: string;
  results: InternationalBeneficiaryDetailsInput[];
};

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
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [route, setRoute] = useState<string | undefined>();
  const [refreshing, setRefreshing] = useBoolean(false);
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

  const refresh = useDebounce<string[]>(keys => {
    const { value } = getFieldState("results");

    setDynamicFields(
      value?.filter(({ key, value }) => keys.includes(key) && isNotNullishOrEmpty(value)) ?? [],
    );

    setRefreshing.off();
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
  }, [routes]);

  useEffect(() => {
    listenFields(["route"], ({ route: { value } }) => setRoute(value));
  }, [listenFields]);

  const fields = useMemo<DynamicFormField[]>(
    () => (schemes.find(({ type }) => type === route)?.fields ?? []) as DynamicFormField[],
    [schemes, route],
  );

  return (
    <View>
      <Tile>
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
                      <TransferInternationalDynamicFormBuilder
                        ref={dynamicFormApiRef}
                        fields={fields}
                        onChange={onChange}
                        results={value}
                        key={route.value}
                        refresh={fields => {
                          setRefreshing.on();
                          refresh(fields);
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
              disabled={refreshing || data.isLoading()}
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
