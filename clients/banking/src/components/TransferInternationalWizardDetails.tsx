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

import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
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

export type Details = { results: ResultItem[]; externalReference: string };

type Props = {
  initialDetails?: Details;
  amount: Amount;
  beneficiary: Beneficiary;
  loading: boolean;
  onPressPrevious: () => void;
  onSave: (details: Details) => void;
};

export const TransferInternationalWizardDetails = ({
  initialDetails,
  amount,
  beneficiary,
  loading,
  onPressPrevious,
  onSave,
}: Props) => {
  const [fields, setFields] = useState([]);
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
        beneficiaryDetails: beneficiary.results,
        dynamicFields,
      },
    },
    [locale.language, dynamicFields],
  );

  console.log("[NC] data", data);

  const { Field, submitForm, getFieldState } = useForm<{
    results: ResultItem[];
    externalReference: string;
  }>({
    results: {
      initialValue: initialDetails?.results ?? [],
      validate: () => undefined,
    },
    externalReference: {
      initialValue: initialDetails?.externalReference ?? "",
      validate: () => undefined,
    },
  });

  const updatedForm = data
    .mapOkToResult(
      ({ internationalCreditTransferTransactionDetailsDynamicForm }) =>
        internationalCreditTransferTransactionDetailsDynamicForm,
    )
    .getWithDefault([]);

  useEffect(() => {
    if (!data.isLoading()) {
      setFields(updatedForm?.fields);
    }
  }, [updatedForm]);

  console.log("[NC] updatedForm", updatedForm);
  console.log("[NC] fields", fields);

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
        <LakeLabel
          label={t("transfer.new.internationalTransfer.details.form.field.externalReference")}
          render={id => (
            <Field name="externalReference">
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

        {data.isLoading() && !fields.length ? (
          <ActivityIndicator color={colors.gray[900]} />
        ) : (
          <TransitionView {...(data.isLoading() && animations.heartbeat)}>
            <Field name="results">
              {({ onChange, value }) => (
                <TransferInternationalDynamicFormBuilder
                  fields={fields}
                  onChange={onChange}
                  results={value}
                  key={fields?.map(({ key }) => key).join(":")}
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
              disabled={refreshing || data.isLoading() || loading}
              onPress={() =>
                !fields?.length
                  ? submitForm(onSave)
                  : ref.current.submitDynamicForm(() => submitForm(onSave))
              }
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
