import { Array, AsyncData, Option, Result } from "@swan-io/boxed";
import { ClientError, useQuery } from "@swan-io/graphql-client";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { TransitionView } from "@swan-io/lake/src/components/TransitionView";
import { animations, colors } from "@swan-io/lake/src/constants/design";
import { useDebounce } from "@swan-io/lake/src/hooks/useDebounce";
import { showToast } from "@swan-io/lake/src/state/toasts";
import { noop } from "@swan-io/lake/src/utils/function";
import { isNotNullishOrEmpty } from "@swan-io/lake/src/utils/nullish";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { P, match } from "ts-pattern";
import {
  GetInternationalCreditTransferTransactionDetailsDynamicFormDocument,
  InternationalCreditTransferDisplayLanguage,
  InternationalCreditTransferRouteInput,
} from "../graphql/partner";
import { locale, t } from "../utils/i18n";
import {
  DynamicFormApi,
  DynamicFormField,
  ResultItem,
  TransferInternationalDynamicFormBuilder,
} from "./TransferInternationalDynamicFormBuilder";
import { Amount } from "./TransferInternationalWizardAmount";
import { Beneficiary } from "./TransferInternationalWizardBeneficiary";

export type Details = {
  results: ResultItem[];
};

type Props = {
  initialDetails?: Details;
  amount: Amount;
  beneficiary: Beneficiary;
  loading: boolean;
  onPressPrevious: (errors?: string[]) => void;
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
  const [fields, setFields] = useState<DynamicFormField[]>([]);
  const [results, setResults] = useState(initialDetails?.results ?? []);

  const dynamicFormApiRef = useRef<DynamicFormApi | null>(null);

  const [data] = useQuery(GetInternationalCreditTransferTransactionDetailsDynamicFormDocument, {
    name: beneficiary.name,
    route: beneficiary.route as InternationalCreditTransferRouteInput,
    amountValue: amount.value,
    currency: amount.currency,
    language: locale.language as InternationalCreditTransferDisplayLanguage,
    dynamicFields: results,
    beneficiaryDetails: beneficiary.results,
  });

  useEffect(() => {
    match(data)
      .with(
        AsyncData.P.Done(
          Result.P.Ok({
            internationalCreditTransferTransactionDetailsDynamicForm: P.select(P.nonNullable),
          }),
        ),
        ({ fields }) => setFields(fields),
      )
      .with(AsyncData.P.Done(Result.P.Error(P.select())), error => {
        const messages = Array.filterMap(ClientError.toArray(error), error => {
          return match(error)
            .with(
              {
                extensions: {
                  code: "BeneficiaryValidationError",
                  meta: {
                    fields: P.array({ message: P.select(P.string) }),
                  },
                },
              },
              ([messages]) => Option.fromNullable(messages),
            )
            .otherwise(() => Option.None());
        });

        if (messages.length > 0) {
          onPressPrevious(messages);
        } else {
          showToast({ variant: "error", error, title: t("error.generic") });
        }
      })
      .otherwise(noop);
  }, [data, onPressPrevious]);

  const handleOnResultsChange = useDebounce<ResultItem[]>(value => {
    setResults(value.filter(({ value }) => isNotNullishOrEmpty(value)));
  }, 1000);

  return (
    <View>
      <Tile>
        {data.isLoading() && !fields.length ? (
          <ActivityIndicator color={colors.gray[900]} />
        ) : (
          <TransitionView {...(data.isLoading() && animations.heartbeat)}>
            <TransferInternationalDynamicFormBuilder
              key={fields.map(({ key }) => key).join(":")}
              ref={dynamicFormApiRef}
              fields={fields}
              onChange={handleOnResultsChange}
              results={results}
            />
          </TransitionView>
        )}
      </Tile>

      <Space height={32} />

      <ResponsiveContainer breakpoint={800}>
        {({ small }) => (
          <LakeButtonGroup>
            <LakeButton color="gray" mode="secondary" onPress={() => onPressPrevious()}>
              {t("common.previous")}
            </LakeButton>

            <LakeButton
              color="current"
              disabled={data.isLoading() || loading}
              grow={small}
              onPress={() => {
                const runCallback = () => onSave({ results });

                fields.length === 0
                  ? runCallback()
                  : dynamicFormApiRef.current?.submitDynamicForm(runCallback);
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
