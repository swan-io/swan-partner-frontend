import { Option } from "@swan-io/boxed";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeSelect } from "@swan-io/lake/src/components/LakeSelect";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { breakpoints } from "@swan-io/lake/src/constants/design";
import { deriveUnion } from "@swan-io/lake/src/utils/function";
import { InlineDatePicker } from "@swan-io/shared-business/src/components/InlineDatePicker";
import {
  validateNullableRequired,
  validateRequired,
} from "@swan-io/shared-business/src/utils/validation";
import { useForm } from "@swan-io/use-form";
import { Ref, useImperativeHandle } from "react";
import { StyleSheet, View } from "react-native";
import { match, P } from "ts-pattern";
import {
  RelatedIndividualInput,
  UltimateBeneficialOwnerIdentityDocumentInfoInput,
  UltimateBeneficialOwnerIdentityDocumentType,
} from "../../../../graphql/partner";
import { t } from "../../../../utils/i18n";

const styles = StyleSheet.create({
  grid: {
    gap: "8px",
  },
  gridDesktop: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px 32px",
  },
  inputFull: {
    gridColumnEnd: "span 2",
  },
});

export type OnboardingCompanyOwnershipFormIndividualIdentityRef = {
  submit: () => void;
};

type Props = {
  ref: Ref<OnboardingCompanyOwnershipFormIndividualIdentityRef>;
  initialValues: RelatedIndividualInput;
  onSave: (
    input: Partial<UltimateBeneficialOwnerIdentityDocumentInfoInput>,
  ) => void | Promise<void>;
};

const types = deriveUnion<UltimateBeneficialOwnerIdentityDocumentType>({
  IdCard: true,
  Passport: true,
}).array.map(value => ({
  name: match(value)
    .with("IdCard", () => t("company.step.owners.beneficiary.identity.type.IdCard"))
    .with("Passport", () => t("company.step.owners.beneficiary.identity.type.Passport"))
    .exhaustive(),
  value,
}));

export const OwnershipFormIndividualIdentity = ({ ref, onSave, initialValues }: Props) => {
  useImperativeHandle(ref, () => {
    return {
      submit: () => {
        submitForm({
          onSuccess: ({ type, number, issueDate, expiryDate, issuingAuthority }) => {
            const requiredFields = Option.allFromDict({
              type,
              number,
              issueDate,
              expiryDate,
              issuingAuthority,
            }).flatMap(({ type, ...rest }) =>
              Option.fromNullable(type).map(type => ({
                type,
                ...rest,
              })),
            );

            return match(requiredFields)
              .with(Option.P.Some(P.select()), requiredFields => {
                return onSave(requiredFields);
              })
              .otherwise(() => {});
          },
        });
      },
    };
  });

  const { Field, submitForm } = useForm({
    type: {
      initialValue: initialValues.ultimateBeneficialOwner?.identityDocumentInfo?.type ?? undefined,
      validate: validateNullableRequired,
    },
    number: {
      initialValue: initialValues.ultimateBeneficialOwner?.identityDocumentInfo?.number ?? "",
      validate: validateRequired,
    },
    issueDate: {
      initialValue:
        initialValues.ultimateBeneficialOwner?.identityDocumentInfo?.issueDate ?? undefined,
      validate: validateNullableRequired,
    },
    expiryDate: {
      initialValue:
        initialValues.ultimateBeneficialOwner?.identityDocumentInfo?.expiryDate ?? undefined,
      validate: validateNullableRequired,
    },
    issuingAuthority: {
      initialValue:
        initialValues.ultimateBeneficialOwner?.identityDocumentInfo?.issuingAuthority ?? "",
      validate: validateRequired,
    },
  });

  return (
    <ResponsiveContainer breakpoint={breakpoints.small}>
      {({ large }) => (
        <View role="form" style={[styles.grid, large && styles.gridDesktop]}>
          <Field name="type">
            {({ value, error, onChange, ref }) => (
              <LakeLabel
                label={t("company.step.owners.beneficiary.identity.type")}
                render={id => (
                  <LakeSelect
                    id={id}
                    placeholder={t("company.step.organisation2.activityPlaceholder")}
                    value={value}
                    items={types}
                    error={error}
                    onValueChange={onChange}
                    ref={ref}
                  />
                )}
              />
            )}
          </Field>

          <Field name="number">
            {({ value, error, onChange, ref }) => (
              <LakeLabel
                label={t("company.step.owners.beneficiary.identity.number")}
                render={id => (
                  <LakeTextInput
                    id={id}
                    value={value}
                    error={error}
                    onChangeText={onChange}
                    ref={ref}
                  />
                )}
              />
            )}
          </Field>

          <Field name="issuingAuthority">
            {({ value, error, onChange, ref }) => (
              <LakeLabel
                label={t("company.step.owners.beneficiary.identity.issuingAuthority")}
                style={styles.inputFull}
                render={id => (
                  <LakeTextInput
                    id={id}
                    value={value}
                    error={error}
                    onChangeText={onChange}
                    ref={ref}
                  />
                )}
              />
            )}
          </Field>

          <Field name="issueDate">
            {({ value, error, onChange }) => (
              <InlineDatePicker
                label={t("company.step.owners.beneficiary.identity.issueDate")}
                value={value}
                error={error}
                onValueChange={onChange}
                style={styles.inputFull}
              />
            )}
          </Field>

          <Field name="expiryDate">
            {({ value, error, onChange }) => (
              <InlineDatePicker
                label={t("company.step.owners.beneficiary.identity.expiryDate")}
                value={value}
                error={error}
                onValueChange={onChange}
                style={styles.inputFull}
              />
            )}
          </Field>
        </View>
      )}
    </ResponsiveContainer>
  );
};
