import { Array, AsyncData, Option, Result } from "@swan-io/boxed";
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
import { animations, colors } from "@swan-io/lake/src/constants/design";
import { useDebounce } from "@swan-io/lake/src/hooks/useDebounce";
import { isNotEmpty } from "@swan-io/lake/src/utils/nullish";
import { useForm } from "@swan-io/use-form";
import { useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { P, match } from "ts-pattern";
import {
  GetInternationalBeneficiaryDynamicFormsDocument,
  InternationalBeneficiaryDetailsInput,
} from "../graphql/partner";
import { locale, t } from "../utils/i18n";
import { getInternationalTransferFormRouteLabel } from "../utils/templateTranslations";
import { validateRequired } from "../utils/validations";
import { ErrorView } from "./ErrorView";
import {
  DynamicFormApi,
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
  const [route, setRoute] = useState<Option<string>>(() =>
    Option.fromNullable(initialBeneficiary?.route),
  );
  const [results, setResults] = useState(initialBeneficiary?.results ?? []);

  const dynamicFormApiRef = useRef<DynamicFormApi | null>(null);

  const [data, { isLoading, setVariables }] = useQuery(
    GetInternationalBeneficiaryDynamicFormsDocument,
    {
      dynamicFields: initialBeneficiary?.results,
      amountValue: amount.value,
      currency: amount.currency,
      // TODO: Remove English fallback as soon as the backend manages "fi" in the InternationalCreditTransferDisplayLanguage type
      language: locale.language === "fi" ? "en" : locale.language,
    },
  );

  const { Field, submitForm } = useForm<{ name: string }>({
    name: { initialValue: initialBeneficiary?.name ?? "", validate: validateRequired },
  });

  const handleOnResultsChange = useDebounce<ResultItem[]>(value => {
    const nextResults = value.filter(({ value }) => isNotEmpty(value));
    setResults(nextResults);
    setVariables({ dynamicFields: nextResults });
  }, 1000);

  return match(data)
    .with(AsyncData.P.NotAsked, AsyncData.P.Loading, () => (
      <ActivityIndicator color={colors.gray[500]} />
    ))
    .with(AsyncData.P.Done(Result.P.Error(P.select())), error => <ErrorView error={error} />)
    .with(AsyncData.P.Done(Result.P.Ok(P.select())), ({ internationalBeneficiaryDynamicForms }) => {
      if (internationalBeneficiaryDynamicForms == null) {
        return <ErrorView />;
      }

      const schemes = internationalBeneficiaryDynamicForms.schemes;

      const routes = schemes.map(({ type }) => ({
        value: type,
        name: getInternationalTransferFormRouteLabel(type),
      }));

      const firstRoute = routes.at(0);

      if (firstRoute == null) {
        return <ErrorView />;
      }

      const selectedRoute = route.getOr(firstRoute.value);

      const fields = Array.findMap(schemes, scheme =>
        scheme.type === selectedRoute ? Option.Some(scheme.fields) : Option.None(),
      ).getOr([]);

      return (
        <View>
          <Tile
            footer={match(errors)
              .with(P.union([], P.nullish), () => null)
              .with([P.select()], error => (
                <LakeAlert anchored={true} variant="error" title={error} />
              ))
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

            <View {...(isLoading && animations.heartbeat)}>
              <LakeLabel
                label={t("transfer.new.internationalTransfer.beneficiary.route.intro")}
                style={routes.length < 2 && styles.hidden}
                render={() => (
                  <>
                    <Space height={8} />

                    <RadioGroup
                      items={routes}
                      value={selectedRoute}
                      onValueChange={route => setRoute(Option.Some(route))}
                    />

                    <Space height={32} />
                  </>
                )}
              />

              {fields.length > 0 ? (
                <TransferInternationalDynamicFormBuilder
                  key={selectedRoute}
                  ref={dynamicFormApiRef}
                  fields={fields}
                  results={results}
                  onChange={handleOnResultsChange}
                />
              ) : null}
            </View>
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
                        onSuccess: ({ name }) => {
                          name.tapSome(name => onSave({ name, route: selectedRoute, results }));
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
    })
    .exhaustive();
};
