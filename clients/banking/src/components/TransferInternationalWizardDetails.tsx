import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { TransitionView } from "@swan-io/lake/src/components/TransitionView";
import { animations, colors } from "@swan-io/lake/src/constants/design";
import { useDebounce } from "@swan-io/lake/src/hooks/useDebounce";
import { useUrqlQuery } from "@swan-io/lake/src/hooks/useUrqlQuery";
import { isNotNullishOrEmpty } from "@swan-io/lake/src/utils/nullish";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useForm } from "react-ux-form";

import { useBoolean } from "@swan-io/lake/src/hooks/useBoolean";
import {
  GetInternationalCreditTransferTransactionDetailsDynamicFormDocument,
  InternationalCreditTransferDisplayLanguage,
} from "../graphql/partner";
import { locale, t } from "../utils/i18n";
import {
  ResultItem,
  TransferInternationalDynamicFormBuilder,
} from "./TransferInternationalDynamicFormBuilder";
import { Amount } from "./TransferInternationalWizardAmount";
import { Beneficiary } from "./TransferInternationalWizardBeneficiary";

export type Details = { results: ResultItem[] };

type Props = {
  initialDetails?: Details;
  amount: Amount;
  beneficiary: Beneficiary;
  onPressPrevious: () => void;
  onSave: (details: Beneficiary) => void;
};

export const TransferInternationalWizardDetails = ({
  initialDetails,
  amount,
  beneficiary,
  onPressPrevious,
  onSave,
}: Props) => {
  const [schemes, setSchemes] = useState([]);
  const [refreshing, setRefreshing] = useBoolean(false);
  const [dynamicFields, setDynamicFields] = useState(initialDetails?.results ?? []);

  const ref = useRef();

  const { data } = useUrqlQuery(
    {
      query: GetInternationalCreditTransferTransactionDetailsDynamicFormDocument,
      variables: {
        name: beneficiary.name,
        route: beneficiary.route,
        amountValue: amount.value,
        currency: amount.currency,
        language: locale.language as InternationalCreditTransferDisplayLanguage,
        details: dynamicFields,
      },
    },
    [locale.language, dynamicFields],
  );

  const { Field, submitForm, getFieldState } = useForm<{
    results: ResultItem[];
  }>({
    results: {
      initialValue: initialDetails?.results ?? [],
      validate: () => undefined,
    },
  });

  console.log("[NC] data", data);
  const updatedForm = data.mapOkToResult(form => form).getWithDefault([]);

  useEffect(() => {
    if (!data.isLoading()) {
      setSchemes(updatedForm);
    }
  }, [updatedForm]);

  const refresh = useDebounce<string[]>(keys => {
    const { value } = getFieldState("results");
    setDynamicFields(
      value?.filter(({ key, value }) => keys.includes(key) && isNotNullishOrEmpty(value)) ?? [],
    );
    setRefreshing.off();
  }, 1000);

  return (
    <View>
      <Tile>
        {/* <LakeLabel
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
        /> */}

        {data.isLoading() ? (
          <ActivityIndicator color={colors.gray[900]} />
        ) : (
          <TransitionView {...(data.isLoading() && animations.heartbeat)}>
            <Field name="results">
              {({ onChange, value }) => (
                <TransferInternationalDynamicFormBuilder
                  schemes={schemes}
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
              )}
            </Field>
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
              // onPress={() => ref.current.submitDynamicForm(() => submitForm(onSave))}
              onPress={() => console.log("submit")}
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
