import { Option } from "@swan-io/boxed";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeSelect } from "@swan-io/lake/src/components/LakeSelect";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { deriveUnion } from "@swan-io/lake/src/utils/function";
import { InlineDatePicker } from "@swan-io/shared-business/src/components/InlineDatePicker";
import { validateNullableRequired } from "@swan-io/shared-business/src/utils/validation";
import { useForm } from "@swan-io/use-form";
import { forwardRef, useImperativeHandle } from "react";
import { View } from "react-native";
import { P, match } from "ts-pattern";
import { UboIdentityDocumentType } from "../../../graphql/unauthenticated";
import { t } from "../../../utils/i18n";
import { validateRequired } from "../../../utils/validation";

export type FormValues = {
  identityDocumentType: UboIdentityDocumentType | undefined;
  identityDocumentNumber: string;
  identityDocumentIssueDate: string | undefined;
  identityDocumentExpiryDate: string | undefined;
  identityDocumentIssuingAuthority: string;
};

export type Input = {
  identityDocumentType?: UboIdentityDocumentType;
  identityDocumentNumber?: string;
  identityDocumentIssueDate?: string;
  identityDocumentExpiryDate?: string;
  identityDocumentIssuingAuthority?: string;
};

type Props = {
  initialValues: Partial<Input>;
  onSave: (input: Input) => void | Promise<void>;
};

export type OnboardingCompanyOwnershipBeneficiaryFormIdentityRef = {
  getInput: () => Input;
  submit: () => void;
};

const types = deriveUnion<UboIdentityDocumentType>({
  IdCard: true,
  Passport: true,
}).array.map(value => ({
  name: match(value)
    .with("IdCard", () => t("company.step.owners.beneficiary.identity.type.IdCard"))
    .with("Passport", () => t("company.step.owners.beneficiary.identity.type.Passport"))
    .exhaustive(),
  value,
}));

export const OnboardingCompanyOwnershipBeneficiaryFormIdentity = forwardRef<
  OnboardingCompanyOwnershipBeneficiaryFormIdentityRef,
  Props
>(({ initialValues, onSave }, ref) => {
  const { Field, getFieldValue, submitForm } = useForm<FormValues>({
    identityDocumentType: {
      initialValue: initialValues.identityDocumentType,
      validate: validateNullableRequired,
    },
    identityDocumentNumber: {
      initialValue: initialValues.identityDocumentNumber ?? "",
      validate: validateRequired,
    },
    identityDocumentIssueDate: {
      initialValue: initialValues.identityDocumentIssueDate,
      validate: validateNullableRequired,
    },
    identityDocumentExpiryDate: {
      initialValue: initialValues.identityDocumentExpiryDate,
      validate: validateNullableRequired,
    },
    identityDocumentIssuingAuthority: {
      initialValue: initialValues.identityDocumentIssuingAuthority ?? "",
      validate: validateRequired,
    },
  });

  useImperativeHandle(ref, () => {
    return {
      getInput: () => ({
        identityDocumentType: getFieldValue("identityDocumentType"),
        identityDocumentNumber: getFieldValue("identityDocumentNumber"),
        identityDocumentIssueDate: getFieldValue("identityDocumentIssueDate"),
        identityDocumentExpiryDate: getFieldValue("identityDocumentExpiryDate"),
        identityDocumentIssuingAuthority: getFieldValue("identityDocumentIssuingAuthority"),
      }),
      submit: () => {
        submitForm({
          onSuccess: ({
            identityDocumentType,
            identityDocumentNumber,
            identityDocumentIssueDate,
            identityDocumentExpiryDate,
            identityDocumentIssuingAuthority,
          }) => {
            const requiredFields = Option.allFromDict({
              identityDocumentType,
              identityDocumentNumber,
              identityDocumentIssueDate,
              identityDocumentExpiryDate,
              identityDocumentIssuingAuthority,
            }).flatMap(({ identityDocumentType, ...rest }) =>
              Option.fromNullable(identityDocumentType).map(identityDocumentType => ({
                identityDocumentType,
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

  return (
    <View role="form">
      <Field name="identityDocumentType">
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

      <Field name="identityDocumentNumber">
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

      <Field name="identityDocumentIssueDate">
        {({ value, error, onChange }) => (
          <InlineDatePicker
            label={t("company.step.owners.beneficiary.identity.issueDate")}
            value={value}
            error={error}
            onValueChange={onChange}
          />
        )}
      </Field>

      <Field name="identityDocumentExpiryDate">
        {({ value, error, onChange }) => (
          <InlineDatePicker
            label={t("company.step.owners.beneficiary.identity.expiryDate")}
            value={value}
            error={error}
            onValueChange={onChange}
          />
        )}
      </Field>

      <Field name="identityDocumentIssuingAuthority">
        {({ value, error, onChange, ref }) => (
          <LakeLabel
            label={t("company.step.owners.beneficiary.identity.issuingAuthority")}
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
    </View>
  );
});
