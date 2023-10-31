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
import { useForm } from "react-ux-form";

import { useBoolean } from "@swan-io/lake/src/hooks/useBoolean";
import {
  GetInternationalBeneficiaryDynamicFormsDocument,
  InternationalCreditTransferDisplayLanguage,
} from "../graphql/partner";
import { locale, t } from "../utils/i18n";
import { getInternationalTransferFormRouteLabel } from "../utils/templateTranslations";
import { validateRequired } from "../utils/validations";
import {
  DynamicFormField,
  ResultItem,
  TransferInternationalDynamicFormBuilder,
} from "./TransferInternationalDynamicFormBuilder";
import { Amount } from "./TransferInternationalWizardAmount";

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
  const [route, setRoute] = useState();
  const [refreshing, setRefreshing] = useBoolean(false);
  const [dynamicFields, setDynamicFields] = useState(initialBeneficiary?.results ?? []);

  const ref = useRef();

  const { data } = useUrqlQuery(
    {
      query: GetInternationalBeneficiaryDynamicFormsDocument,
      variables: {
        dynamicFields,
        amountValue: amount.value,
        currency: amount.currency,
        language: locale.language as InternationalCreditTransferDisplayLanguage,
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
    setRefreshing.off();
  }, 1000);

  useEffect(() => {
    const { value } = getFieldState("route");
    if (routes?.length && isNullishOrEmpty(initialBeneficiary?.route) && !value) {
      setFieldValue("route", routes[0].value);
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
                      <TransferInternationalDynamicFormBuilder
                        fields={fields}
                        onChange={onChange}
                        results={value}
                        route={route.value}
                        key={route.value}
                        ref={ref}
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
              onPress={() => ref.current.submitDynamicForm(() => submitForm(onSave))}
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
