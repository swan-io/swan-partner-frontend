import { AsyncData, Option, Result } from "@swan-io/boxed";
import { useQuery } from "@swan-io/graphql-client";
import { Flag } from "@swan-io/lake/src/components/Flag";
import { LakeAlert } from "@swan-io/lake/src/components/LakeAlert";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
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
import { noop } from "@swan-io/lake/src/utils/function";
import { isNotEmpty, isNotNullish, isNotNullishOrEmpty } from "@swan-io/lake/src/utils/nullish";
import { useForm } from "@swan-io/use-form";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { P, match } from "ts-pattern";
import {
  GetInternationalBeneficiaryDynamicFormsDocument,
  InternationalBeneficiaryDetailsInput,
  Scheme,
} from "../graphql/partner";
import { Currency, currencies, currencyFlags, currencyResolver, locale, t } from "../utils/i18n";
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
  amount: Amount;
  errors?: string[];
  initialBeneficiary?: Beneficiary;
  mode: "add" | "continue";
  onCurrencyChange?: (currency: Currency) => void;
  onPressPrevious?: () => void;
  onPressSubmit: (beneficiary: Beneficiary) => void;
};

export const TransferInternationalWizardBeneficiary = ({
  amount,
  errors,
  initialBeneficiary,
  mode,
  onCurrencyChange,
  onPressSubmit,
  onPressPrevious,
}: Props) => {
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [route, setRoute] = useState(initialBeneficiary?.route);
  const [results, setResults] = useState(initialBeneficiary?.results ?? []);

  const dynamicFormApiRef = useRef<DynamicFormApi | null>(null);

  const [data] = useQuery(GetInternationalBeneficiaryDynamicFormsDocument, {
    amountValue: amount.value,
    currency: amount.currency,
    dynamicFields: results,
    // TODO: Remove English fallback as soon as the backend manages "fi" in the InternationalCreditTransferDisplayLanguage type
    language: locale.language === "fi" ? "en" : locale.language,
  });

  const isInitialLoading = data.isLoading() && schemes.length === 0;

  const { Field, submitForm } = useForm<{ name: string }>({
    name: { initialValue: initialBeneficiary?.name ?? "", validate: validateRequired },
  });

  useEffect(() => {
    match(data)
      .with(
        AsyncData.P.Done(
          Result.P.Ok({ internationalBeneficiaryDynamicForms: P.select(P.nonNullable) }),
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

  const handleOnRouteChange = useCallback((route: string) => {
    setRoute(route);
  }, []);

  const handleOnResultsChange = useDebounce<ResultItem[]>(results => {
    setResults(results.filter(({ value }) => isNotEmpty(value)));
  }, 1000);

  const currencyItems = useMemo(() => {
    return currencies.map(value => {
      const name = currencyResolver?.of(value);
      const code = currencyFlags[value];

      return {
        icon: <Flag code={code} />,
        name: isNotNullish(name) ? `${value} (${name})` : value,
        value,
      };
    });
  }, []);

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

        {isNotNullish(onCurrencyChange) && (
          <LakeLabel
            label={t("transfer.new.internationalTransfer.beneficiary.currency")}
            render={id => (
              <LakeSelect
                id={id}
                value={amount.currency}
                items={currencyItems}
                onValueChange={onCurrencyChange}
              />
            )}
          />
        )}

        <Space height={8} />

        {isInitialLoading ? (
          <ActivityIndicator color={colors.gray[500]} />
        ) : (
          <TransitionView {...(data.isLoading() && animations.heartbeat)}>
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

            {isNotNullishOrEmpty(route) && fields.length > 0 && (
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
            {isNotNullish(onPressPrevious) && (
              <LakeButton color="gray" mode="secondary" onPress={onPressPrevious}>
                {t("common.previous")}
              </LakeButton>
            )}

            <LakeButton
              color="current"
              disabled={data.isLoading()}
              grow={small}
              icon={mode === "add" ? "add-circle-filled" : undefined}
              onPress={() => {
                dynamicFormApiRef.current?.submitDynamicForm(() =>
                  submitForm({
                    onSuccess: values => {
                      Option.allFromDict(values).map(details => onPressSubmit(details));
                    },
                  }),
                );
              }}
            >
              {mode === "add" ? t("common.add") : t("common.continue")}
            </LakeButton>
          </LakeButtonGroup>
        )}
      </ResponsiveContainer>
    </View>
  );
};
