import { Option } from "@swan-io/boxed";
import { useQuery } from "@swan-io/graphql-client";
import { LakeAlert } from "@swan-io/lake/src/components/LakeAlert";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { RadioGroup } from "@swan-io/lake/src/components/RadioGroup";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { TransitionView } from "@swan-io/lake/src/components/TransitionView";
import { animations, colors } from "@swan-io/lake/src/constants/design";
import { useDebounce } from "@swan-io/lake/src/hooks/useDebounce";
import { isEmpty, isNotEmpty } from "@swan-io/lake/src/utils/nullish";
import { useForm } from "@swan-io/use-form";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { P, match } from "ts-pattern";
import {
  GetInternationalBeneficiaryDynamicFormsDocument,
  InternationalBeneficiaryDetailsInput,
} from "../graphql/partner";
import { useDoneAsyncData } from "../hooks/useDoneAsyncData";
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
  const [route, setRoute] = useState(initialBeneficiary?.route ?? "");
  const [results, setResults] = useState(initialBeneficiary?.results ?? []);

  const dynamicFormApiRef = useRef<DynamicFormApi | null>(null);

  const [reloadingData] = useQuery(GetInternationalBeneficiaryDynamicFormsDocument, {
    dynamicFields: results,
    amountValue: amount.value,
    currency: amount.currency,
    //TODO: Remove English fallback as soon as the backend manages "fi" in the InternationalCreditTransferDisplayLanguage type
    language: locale.language === "fi" ? "en" : locale.language,
  });

  const data = useDoneAsyncData(reloadingData);

  const schemes = data
    .mapOk(data => data.internationalBeneficiaryDynamicForms?.schemes)
    .mapOkToResult(data => Option.fromNullable(data).toResult(undefined));

  const routes = schemes
    .toOption()
    .flatMap(data => data.toOption())
    .map(data =>
      data.map(({ type }) => ({
        value: type,
        name: getInternationalTransferFormRouteLabel(type),
      })),
    )
    .getOr([]);

  const fields: DynamicFormField[] = schemes
    .toOption()
    .flatMap(data => data.toOption())
    .flatMap(data => Option.fromNullable(data.find(({ type }) => type === route)?.fields))
    .getOr([]);

  const firstRoute = routes[0]?.value ?? "";

  useLayoutEffect(() => {
    setRoute(prevRoute => (isEmpty(prevRoute) ? firstRoute : prevRoute));
  }, [firstRoute]);

  const { Field, submitForm } = useForm<{ name: string }>({
    name: { initialValue: initialBeneficiary?.name ?? "", validate: validateRequired },
  });

  const handleOnRouteChange = useCallback((route: string) => {
    setRoute(route);
  }, []);

  const handleOnResultsChange = useDebounce<ResultItem[]>(value => {
    setResults(value.filter(({ value }) => isNotEmpty(value)));
  }, 1000);

  return (
    <View>
      <Tile
        footer={match(errors)
          .with(P.union([], P.nullish), () => null)
          .with([P.select()], error => <LakeAlert anchored={true} variant="error" title={error} />)
          .otherwise(errors => (
            <LakeAlert
              anchored={true}
              variant="error"
              title={t("transfer.new.internationalTransfer.errors.title")}
            >
              {errors.map((message, index) => (
                <LakeText key={`validation-alert-${index}`}>{message}</LakeText>
              ))}
            </LakeAlert>
          ))}
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

        <Space height={8} />

        {data.isLoading() ? (
          <ActivityIndicator color={colors.gray[500]} />
        ) : (
          <TransitionView {...(reloadingData.isLoading() && animations.heartbeat)}>
            <LakeLabel
              label={t("transfer.new.internationalTransfer.beneficiary.route.intro")}
              style={routes.length < 2 && styles.hidden}
              render={() => (
                <>
                  <Space height={8} />
                  <RadioGroup items={routes} value={route} onValueChange={handleOnRouteChange} />
                  <Space height={32} />
                </>
              )}
            />

            {isNotEmpty(route) && fields.length > 0 && (
              <TransferInternationalDynamicFormBuilder
                key={route}
                ref={dynamicFormApiRef}
                fields={fields}
                results={results}
                onChange={handleOnResultsChange}
              />
            )}
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
                  submitForm({
                    onSuccess: values => {
                      Option.allFromDict(values).map(({ name }) =>
                        onSave({ name, route, results }),
                      );
                    },
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
