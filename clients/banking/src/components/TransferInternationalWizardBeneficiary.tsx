import { AsyncData, Result } from "@swan-io/boxed";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeSelect } from "@swan-io/lake/src/components/LakeSelect";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { RadioGroup } from "@swan-io/lake/src/components/RadioGroup";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { colors } from "@swan-io/lake/src/constants/design";
import { useUrqlQuery } from "@swan-io/lake/src/hooks/useUrqlQuery";
import { isNullishOrEmpty } from "@swan-io/lake/src/utils/nullish";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useForm } from "react-ux-form";
import { P, match } from "ts-pattern";
import {
  Field as DynamicFormField,
  GetInternationalBeneficiaryDynamicFormsDocument,
  InternationalCreditTransferDisplayLanguage,
} from "../graphql/partner";
import { locale, t } from "../utils/i18n";
import { validateRequired } from "../utils/validations";
import { Amount } from "./TransferInternationalWizardAmount";

export type Beneficiary = { name: string };

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
  const { data } = useUrqlQuery(
    {
      query: GetInternationalBeneficiaryDynamicFormsDocument,
      variables: {
        // [NC] FIXME
        dynamicFields: [],
        amountValue: amount.value,
        currency: amount.currency,
        language: locale.language.toUpperCase() as InternationalCreditTransferDisplayLanguage,
      },
    },
    [locale.language],
  );

  const { Field } = useForm({
    name: {
      initialValue: initialBeneficiary?.name,
      sanitize: () => {},
      validate: () => {},
    },
  });

  console.log("[NC] data", data);

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

        {match(data)
          .with(AsyncData.P.NotAsked, () => null)
          .with(
            AsyncData.P.Done(Result.P.Ok(P.select())),
            ({ internationalBeneficiaryDynamicForms: { schemes } }) => {
              if (isNullishOrEmpty(schemes)) {
                return null;
              }

              return <BeneficiaryForm schemes={schemes} />;
            },
          )
          .otherwise(() => (
            <ActivityIndicator color={colors.gray[900]} />
          ))}
      </Tile>

      <Space height={32} />

      <ResponsiveContainer breakpoint={800}>
        {({ small }) => (
          <LakeButtonGroup>
            <LakeButton color="gray" mode="secondary" onPress={onPressPrevious}>
              {t("common.previous")}
            </LakeButton>

            <LakeButton color="current" onPress={() => onSave(beneficiary)} grow={small}>
              {t("common.continue")}
            </LakeButton>
          </LakeButtonGroup>
        )}
      </ResponsiveContainer>
    </View>
  );
};

type BeneficiaryFormProps = {
  schemes: {
    fields: DynamicFormField[];
    remainingFieldsToRefreshCount: number;
    title: string;
    type: string;
  }[];
};

const BeneficiaryForm = ({ schemes }: BeneficiaryFormProps) => {
  const [route, setRoute] = useState<string | undefined>();
  const routes = useMemo<{ value: string; name: string }[]>(
    () => schemes?.map(({ type: value, title: name }) => ({ value, name })) ?? [],
    [schemes],
  );
  const fields = useMemo(() => schemes.find(({ type }) => type === route)?.fields ?? [], [route]);

  const { Field, listenFields } = useForm(
    fields.reduce((acc, current) => {
      acc[current.key] = {
        initialValue: "test",
        validate: current.required ? validateRequired : () => "",
      };
      return acc;
    }, {}),
  );

  useEffect(
    () =>
      listenFields(
        fields.map(({ key }) => key),
        t => console.log("[NC] t", t),
      ),
    [fields, listenFields],
  );

  useEffect(() => {
    if (isNullishOrEmpty(route)) {
      setRoute(routes?.[0]?.value);
    }
  }, [routes]);

  return (
    <>
      <RadioGroup items={routes} value={route} onValueChange={setRoute} />
      <Space height={32} />

      {fields.length &&
        fields.map(({ name, key, ...field }, i) => (
          <LakeLabel
            key={`generated-field-${i}`}
            label={name}
            render={id =>
              match(field)
                // .with({ __typename: "SelectField" }, ({ allowedValues }) => (
                //   <Field name={key}>
                //     {({ onChange, value, ref }) => (
                //       <LakeSelect
                //         id={id}
                //         ref={ref}
                //         items={allowedValues.map(({ name, key: value }) => ({ name, value }))}
                //         value={value}
                //         onValueChange={onChange}
                //       />
                //     )}
                //   </Field>
                // ))
                // .with({ __typename: "DateField" }, () => <span>DateField not implemented</span>)
                // .with({ __typename: "RadioField" }, () => <span>RadioField not implemented</span>)
                .otherwise(() => (
                  <Field name={key}>
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
                ))
            }
          />
        ))}
    </>
  );
};
