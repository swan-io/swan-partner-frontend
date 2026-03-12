import { Option } from "@swan-io/boxed";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { Item, LakeSelect } from "@swan-io/lake/src/components/LakeSelect";
import { Space } from "@swan-io/lake/src/components/Space";
import { noop } from "@swan-io/lake/src/utils/function";
import { validateNullableRequired } from "@swan-io/shared-business/src/utils/validation";
import { useForm } from "@swan-io/use-form";
import { Ref, useImperativeHandle } from "react";
import { View } from "react-native";
import { RadioCardItem, RadioCards } from "../../../../components/RadioCards";
import { RelatedIndividualType } from "../../../../graphql/partner";
import { t } from "../../../../utils/i18n";

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

export const OwnershipFormType = ({ ref, onSave }: Props) => {
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
      initialValue: "individual" as RelatedItem,
      validate: validateNullableRequired,
    },
    type: {
      initialValue: "LegalRepresentative" as RelatedIndividualType,
      validate: validateNullableRequired,
    },
  });

  return (
    <View role="form">
      <Field name="related">
        {({ value, onChange }) => (
          <RadioCards items={relatedItem} value={value} onChange={onChange} />
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
