import { Array, AsyncData, Option, Result } from "@swan-io/boxed";
import { ClientError, useQuery } from "@swan-io/graphql-client";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LoadingView } from "@swan-io/lake/src/components/LoadingView";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { spacings } from "@swan-io/lake/src/constants/design";
import { noop } from "@swan-io/lake/src/utils/function";
import { isNotEmpty } from "@swan-io/lake/src/utils/nullish";
import { showToast } from "@swan-io/shared-business/src/state/toasts";
import { useCallback, useEffect, useRef } from "react";
import { StyleSheet } from "react-native";
import { P, match } from "ts-pattern";
import {
  GetInternationalCreditTransferTransactionDetailsDynamicFormDocument,
  InternationalCreditTransferDisplayLanguage,
} from "../graphql/partner";
import { locale, t } from "../utils/i18n";
import { InternationalBeneficiary } from "./BeneficiaryInternationalWizardForm";
import { ErrorView } from "./ErrorView";
import {
  DynamicFormRef,
  FormValue,
  TransferInternationalDynamicForm,
} from "./TransferInternationalDynamicForm";
import { Amount } from "./TransferInternationalWizardAmount";

const styles = StyleSheet.create({
  loadingOrError: {
    justifyContent: "flex-start",
    paddingVertical: spacings[48],
  },
});

export type Details = {
  values: FormValue[];
};

type Props = {
  initialDetails?: Details;
  amount: Amount;
  beneficiary: InternationalBeneficiary;
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
  const dynamicFormRef = useRef<DynamicFormRef>(null);

  const [data, { isLoading, setVariables }] = useQuery(
    GetInternationalCreditTransferTransactionDetailsDynamicFormDocument,
    {
      name: beneficiary.name,
      route: beneficiary.route,
      amountValue: amount.value,
      currency: amount.currency,
      language: locale.language as InternationalCreditTransferDisplayLanguage,
      dynamicFields: initialDetails?.values,
      beneficiaryDetails: beneficiary.values,
    },
  );

  useEffect(() => {
    match(data)
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

  const onRefreshRequest = useCallback(
    (values: FormValue[]) => {
      setVariables({ dynamicFields: values.filter(({ value }) => isNotEmpty(value)) });
    },
    [setVariables],
  );

  return match(
    data
      .mapOk(data => data.internationalCreditTransferTransactionDetailsDynamicForm)
      .mapOkToResult(data => Option.fromNullable(data).toResult(undefined)),
  )
    .with(AsyncData.P.NotAsked, AsyncData.P.Loading, () => (
      <LoadingView style={styles.loadingOrError} />
    ))
    .with(AsyncData.P.Done(Result.P.Error(P.select())), error => (
      <ErrorView error={error} style={styles.loadingOrError} />
    ))
    .with(AsyncData.P.Done(Result.P.Ok(P.select())), ({ fields }) => (
      <ResponsiveContainer breakpoint={800}>
        {({ small }) => (
          <>
            <Tile>
              <TransferInternationalDynamicForm
                ref={dynamicFormRef}
                fields={fields}
                onRefreshRequest={onRefreshRequest}
                refreshing={isLoading}
                initialValues={initialDetails?.values ?? []}
                onSubmit={values => {
                  onSave({ values });
                }}
              />
            </Tile>

            <Space height={32} />

            <LakeButtonGroup>
              <LakeButton color="gray" mode="secondary" onPress={() => onPressPrevious()}>
                {t("common.previous")}
              </LakeButton>

              <LakeButton
                color="current"
                disabled={data.isLoading() || loading}
                grow={small}
                onPress={() => {
                  if (dynamicFormRef.current != null) {
                    dynamicFormRef.current.submit();
                  }
                }}
              >
                {t("common.continue")}
              </LakeButton>
            </LakeButtonGroup>
          </>
        )}
      </ResponsiveContainer>
    ))
    .exhaustive();
};
