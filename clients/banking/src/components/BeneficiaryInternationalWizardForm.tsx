import { Array, AsyncData, Option, Result } from "@swan-io/boxed";
import { useQuery } from "@swan-io/graphql-client";
import { Box } from "@swan-io/lake/src/components/Box";
import { LakeAlert } from "@swan-io/lake/src/components/LakeAlert";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeLabelledCheckbox } from "@swan-io/lake/src/components/LakeCheckbox";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeSelect } from "@swan-io/lake/src/components/LakeSelect";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { RadioGroup } from "@swan-io/lake/src/components/RadioGroup";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { colors } from "@swan-io/lake/src/constants/design";
import { isNotEmpty, isNotNullish } from "@swan-io/lake/src/utils/nullish";
import { Flag } from "@swan-io/shared-business/src/components/Flag";
import { useForm } from "@swan-io/use-form";
import { useCallback, useMemo, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { P, match } from "ts-pattern";
import {
  GetInternationalBeneficiaryDynamicFormsDocument,
  InternationalBeneficiaryDetailsInput,
  InternationalCreditTransferRouteInput,
} from "../graphql/partner";
import { Currency, currencies, currencyFlags, currencyResolver, locale, t } from "../utils/i18n";
import { getInternationalTransferFormRouteLabel } from "../utils/templateTranslations";
import { validateRequired } from "../utils/validations";
import { ErrorView } from "./ErrorView";
import {
  DynamicFormRef,
  FormValue,
  TransferInternationalDynamicForm,
} from "./TransferInternationalDynamicForm";
import { Amount } from "./TransferInternationalWizardAmount";

const DEFAULT_AMOUNT: Amount = {
  value: "1000",
  currency: "USD",
};

const styles = StyleSheet.create({
  hidden: {
    display: "none",
  },
});

export type InternationalBeneficiary = (
  | { kind: "new"; save: boolean }
  | { kind: "saved"; id: string }
) & {
  name: string;
  currency: Currency;
  route: InternationalCreditTransferRouteInput;
  values: InternationalBeneficiaryDetailsInput[];
};

type Props = {
  mode: "add" | "continue";
  amount?: Amount;
  submitting?: boolean;
  errors?: string[];
  onPressSubmit: (beneficiary: InternationalBeneficiary) => void;
  onPressPrevious?: () => void;
  // Enforce prefill with new beneficiary data only
  initialBeneficiary?: Extract<InternationalBeneficiary, { kind: "new" }>;
  saveCheckboxVisible: boolean;
};

export const BeneficiaryInternationalWizardForm = ({
  mode,
  amount = DEFAULT_AMOUNT,
  errors,
  submitting = false,
  initialBeneficiary,
  saveCheckboxVisible,
  onPressSubmit,
  onPressPrevious,
}: Props) => {
  const [saveBeneficiary, setSaveBeneficiary] = useState(
    saveCheckboxVisible && initialBeneficiary?.kind === "new" && initialBeneficiary.save,
  );

  const [route, setRoute] = useState<Option<InternationalCreditTransferRouteInput>>(() =>
    Option.fromNullable(initialBeneficiary?.route),
  );

  const dynamicFormRef = useRef<DynamicFormRef>(null);
  const [currency, setCurrency] = useState(DEFAULT_AMOUNT.currency);

  const [data, { isLoading, setVariables }] = useQuery(
    GetInternationalBeneficiaryDynamicFormsDocument,
    {
      dynamicFields: initialBeneficiary?.values,
      amountValue: amount.value,
      currency: amount.currency,
      // TODO: Remove English fallback as soon as the backend manages "fi" in the InternationalCreditTransferDisplayLanguage type
      language: locale.language === "fi" ? "en" : locale.language,
    },
  );

  const { Field, submitForm } = useForm<{ name: string }>({
    name: {
      initialValue: initialBeneficiary?.name ?? "",
      validate: validateRequired,
    },
  });

  const currencyItems = useMemo(() => {
    return currencies.map(value => {
      const name = currencyResolver?.of(value);
      const code = currencyFlags[value];

      return {
        icon: <Flag code={code} width={18} />,
        name: isNotNullish(name) ? `${value} (${name})` : value,
        value,
      };
    });
  }, []);

  const onRefreshRequest = useCallback(
    (values: FormValue[]) => {
      setVariables({ dynamicFields: values.filter(({ value }) => isNotEmpty(value)) });
    },
    [setVariables],
  );

  const handleOnCurrencyChange = useCallback(
    (currency: Currency) => {
      setCurrency(currency);
      setRoute(Option.None()); // reset route state

      setVariables({
        currency,
        amountValue: match(currency)
          .with("IDR", "VND", () => "50000")
          .otherwise(() => "1000"),
      });
    },
    [setVariables],
  );

  return match(
    data
      .mapOk(data => data.internationalBeneficiaryDynamicForms)
      .mapOkToResult(data => Option.fromNullable(data).toResult(undefined)),
  )
    .with(AsyncData.P.NotAsked, AsyncData.P.Loading, () => (
      <Box grow={1} justifyContent="center">
        <ActivityIndicator color={colors.gray[500]} />
      </Box>
    ))
    .with(AsyncData.P.Done(Result.P.Error(P.select())), error => <ErrorView error={error} />)
    .with(AsyncData.P.Done(Result.P.Ok(P.select())), ({ schemes }) => {
      const routes = schemes.map(({ type }) => ({
        value: type,
        name: getInternationalTransferFormRouteLabel(type),
      }));

      const firstRoute = routes[0];

      if (firstRoute == null) {
        return <ErrorView />;
      }

      const selectedRoute = route.getOr(firstRoute.value);

      const fields = Array.find(schemes, scheme => scheme.type === selectedRoute)
        .map(scheme => scheme.fields)
        .getOr([]);

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

            {/* If initial amount is not specified, we show currency select in the form */}
            {amount === DEFAULT_AMOUNT && (
              <LakeLabel
                label={t("transfer.new.internationalTransfer.beneficiary.currency")}
                render={id => (
                  <LakeSelect
                    id={id}
                    items={currencyItems}
                    value={currency}
                    onValueChange={handleOnCurrencyChange}
                  />
                )}
              />
            )}

            <Space height={8} />

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

            <TransferInternationalDynamicForm
              ref={dynamicFormRef}
              fields={fields}
              initialValues={initialBeneficiary?.values ?? []}
              onRefreshRequest={onRefreshRequest}
              refreshing={isLoading}
              onSubmit={values => {
                submitForm({
                  onSuccess: ({ name }) => {
                    name.tapSome(name =>
                      onPressSubmit({
                        kind: "new",
                        save: saveBeneficiary,
                        name,
                        currency,
                        route: selectedRoute,
                        values,
                      }),
                    );
                  },
                });
              }}
            />

            {saveCheckboxVisible && (
              <>
                <Space height={4} />

                <LakeLabelledCheckbox
                  label={t("transfer.new.beneficiary.save")}
                  value={saveBeneficiary}
                  onValueChange={setSaveBeneficiary}
                />
              </>
            )}
          </Tile>

          <Space height={32} />

          <ResponsiveContainer breakpoint={800}>
            {({ small }) => (
              <LakeButtonGroup>
                {isNotNullish(onPressPrevious) && (
                  <LakeButton
                    mode="secondary"
                    color="gray"
                    onPress={onPressPrevious}
                    grow={small}
                    disabled={submitting}
                  >
                    {t("common.previous")}
                  </LakeButton>
                )}

                <LakeButton
                  color="current"
                  disabled={data.isLoading()}
                  grow={small}
                  loading={submitting}
                  icon={mode === "add" ? "add-circle-filled" : undefined}
                  onPress={() => {
                    if (dynamicFormRef.current != null) {
                      dynamicFormRef.current.submit();
                    }
                  }}
                >
                  {mode === "add" ? t("common.add") : t("common.continue")}
                </LakeButton>
              </LakeButtonGroup>
            )}
          </ResponsiveContainer>
        </View>
      );
    })
    .exhaustive();
};
