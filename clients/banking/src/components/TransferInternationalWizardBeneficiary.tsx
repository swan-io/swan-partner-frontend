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
import { colors } from "@swan-io/lake/src/constants/design";
import { isNotEmpty } from "@swan-io/lake/src/utils/nullish";
import { useForm } from "@swan-io/use-form";
import { useCallback, useRef, useState } from "react";
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
import { DynamicForm, DynamicFormRef, FormValue } from "./TransferInternationalDynamicFormBuilder";
import { Amount } from "./TransferInternationalWizardAmount";

const styles = StyleSheet.create({
  hidden: {
    display: "none",
  },
});

export type Beneficiary = {
  name: string;
  route: string;
  values: InternationalBeneficiaryDetailsInput[];
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

  const dynamicFormRef = useRef<DynamicFormRef>(null);

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
    name: { initialValue: initialBeneficiary?.name ?? "", validate: validateRequired },
  });

  const onRefreshRequest = useCallback(
    (values: FormValue[]) => {
      setVariables({ dynamicFields: values.filter(({ value }) => isNotEmpty(value)) });
    },
    [setVariables],
  );

  return match(
    data
      .mapOk(data => data.internationalBeneficiaryDynamicForms)
      .mapOkToResult(data => Option.fromNullable(data).toResult(undefined)),
  )
    .with(AsyncData.P.NotAsked, AsyncData.P.Loading, () => (
      <ActivityIndicator color={colors.gray[500]} />
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

            <DynamicForm
              key={route.toUndefined()}
              ref={dynamicFormRef}
              fields={fields}
              initialValues={initialBeneficiary?.values ?? []}
              onRefreshRequest={onRefreshRequest}
              refreshing={isLoading}
              onSubmit={values => {
                submitForm({
                  onSuccess: ({ name }) => {
                    name.tapSome(name => onSave({ name, route: selectedRoute, values }));
                  },
                });
              }}
            />
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
                    if (dynamicFormRef.current != null) {
                      dynamicFormRef.current.submit();
                    }
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
