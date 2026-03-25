import { Option } from "@swan-io/boxed";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { Item, LakeSelect } from "@swan-io/lake/src/components/LakeSelect";
import { Space } from "@swan-io/lake/src/components/Space";
import { noop } from "@swan-io/lake/src/utils/function";
import { validateNullableRequired } from "@swan-io/shared-business/src/utils/validation";
import { useForm } from "@swan-io/use-form";
import { Ref, useImperativeHandle } from "react";
import { View } from "react-native";
import { match, P } from "ts-pattern";
import { RadioCardItem, RadioCards } from "../../../../components/RadioCards";
import { RelatedIndividualType } from "../../../../graphql/partner";
import { t } from "../../../../utils/i18n";
import { SaveValue } from "./OwnershipFormWizard";

export type OnboardingCompanyOwnershipFormTypeRef = {
  submit: () => void;
};
type RelatedItem = "individual" | "company";

export type Input = {
  related: RelatedItem;
  type: RelatedIndividualType;
};

type Props = {
  ref: Ref<OnboardingCompanyOwnershipFormTypeRef>;
  initialValues?: Partial<SaveValue>;
  onSave: (input: Input) => void | Promise<void>;
};

const relatedIndividualType: Item<RelatedIndividualType>[] = [
  { name: t("relatedIndividual.legal"), value: "LegalRepresentative" },
  { name: t("relatedIndividual.ubo"), value: "UltimateBeneficialOwner" },
  {
    name: t("relatedIndividual.legalAndUbo"),
    value: "LegalRepresentativeAndUltimateBeneficialOwner",
  },
];

const relatedItem: RadioCardItem<RelatedItem>[] = [
  {
    name: t("company.step.ownership.modal.type.individualLabel"),
    description: t("company.step.ownership.modal.type.individualContent"),
    value: "individual",
  },
  {
    name: t("company.step.ownership.modal.type.companyLabel"),
    description: t("company.step.ownership.modal.type.companyContent"),
    value: "company",
  },
];

export const OwnershipFormType = ({ ref, onSave, initialValues }: Props) => {
  const initial = match(initialValues)
    .with({ type: P.string }, ({ type }) => ({
      related: "individual" as RelatedItem,
      type,
      mode: "edit",
    }))
    .otherwise(() => ({
      related: "individual" as RelatedItem,
      type: "LegalRepresentative" as RelatedIndividualType,
      mode: "add",
    }));

  useImperativeHandle(ref, () => {
    return {
      submit: () => {
        submitForm({
          onSuccess: values => {
            Option.allFromDict(values).match({
              Some: onSave,
              None: noop,
            });
          },
        });
      },
    };
  });

  const { Field, FieldsListener, submitForm } = useForm({
    related: {
      initialValue: initial.related,
      validate: validateNullableRequired,
    },
    type: {
      initialValue: initial.type,
      validate: validateNullableRequired,
    },
  });

  return (
    <View role="form">
      <Field name="related">
        {({ value, onChange }) => (
          <RadioCards
            items={relatedItem}
            value={value}
            onChange={onChange}
            disabled={initial.mode === "edit"}
          />
        )}
      </Field>

      <Space height={24} />

      <FieldsListener names={["related"]}>
        {({ related }) => (
          <Field name="type">
            {({ value, onChange, ref, error }) =>
              related.value === "individual" ? (
                <LakeLabel
                  label={t("company.step.ownership.form.typeLabel")}
                  render={id => (
                    <LakeSelect
                      id={id}
                      ref={ref}
                      items={relatedIndividualType}
                      value={value}
                      onValueChange={onChange}
                      error={error}
                      placeholder={t("common.select")}
                    />
                  )}
                />
              ) : null
            }
          </Field>
        )}
      </FieldsListener>
    </View>
  );
};
