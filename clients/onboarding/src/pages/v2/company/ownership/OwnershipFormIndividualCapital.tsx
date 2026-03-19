import { Option } from "@swan-io/boxed";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { Item, LakeSelect } from "@swan-io/lake/src/components/LakeSelect";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { breakpoints } from "@swan-io/lake/src/constants/design";
import { useFirstMountState } from "@swan-io/lake/src/hooks/useFirstMountState";
import { omit, pick } from "@swan-io/lake/src/utils/object";
import { trim } from "@swan-io/lake/src/utils/string";
import { TaxIdentificationNumberInput } from "@swan-io/shared-business/src/components/TaxIdentificationNumberInput";
import {
  validateIndividualTaxNumber,
  validateNullableRequired,
  validateRequired,
} from "@swan-io/shared-business/src/utils/validation";
import { combineValidators, useForm } from "@swan-io/use-form";
import { Ref, useEffect, useImperativeHandle } from "react";
import { StyleSheet, View } from "react-native";
import { match, P } from "ts-pattern";
import { uboQualificationType } from "../../../../constants/business";
import {
  AccountCountry,
  RegulatoryClassification,
  RelatedIndividualInput,
  UltimateBeneficialOwnerControlType,
  UltimateBeneficialOwnerOwnershipType,
  UltimateBeneficialOwnerQualificationType,
} from "../../../../graphql/partner";
import { t } from "../../../../utils/i18n";
import { getValidationErrorMessage, ServerInvalidFieldCode } from "../../../../utils/validation";

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

export type OnboardingCompanyOwnershipFormIndividualCapitalRef = {
  submit: () => void;
};

type Props = {
  initialValues: RelatedIndividualInput;
  errors: { fieldName: string; code: ServerInvalidFieldCode }[];
  accountCountry: AccountCountry;
  regulatoryClassification?: RegulatoryClassification;
  ref: Ref<OnboardingCompanyOwnershipFormIndividualCapitalRef>;
  onSave: (input: Partial<RelatedIndividualInput>) => void | Promise<void>;
};

const uboQualificationTypeItems: Item<UltimateBeneficialOwnerQualificationType>[] =
  uboQualificationType.map(({ text, value }) => ({
    name: text,
    value,
  }));

const ownershipTypeItems: Item<UltimateBeneficialOwnerOwnershipType>[] = [
  { name: t("company.step.ownership.form.direct"), value: "Direct" },
  { name: t("company.step.ownership.form.indirect"), value: "Indirect" },
  {
    name: t("company.step.ownership.form.directAndIndirect"),
    value: "DirectAndIndirect",
  },
];

const controlTypeItems: Item<UltimateBeneficialOwnerControlType>[] = [
  { name: t("controlType.trust"), value: "ControlViaTrustOrSimilar" },
  { name: t("controlType.board"), value: "RightToAppointOrRemoveBoard" },
  { name: t("controlType.shareholderAgreement"), value: "ShareholderAgreementOrContract" },
  { name: t("controlType.influence"), value: "StrategicOrManagerialInfluence" },
  { name: t("controlType.votinRights"), value: "VotingRights" },
];

export const OwnershipFormIndividualCapital = ({
  ref,
  onSave,
  initialValues,
  errors,
  accountCountry,
  regulatoryClassification,
}: Props) => {
  useImperativeHandle(ref, () => {
    return {
      submit: () => {
        submitForm({
          onSuccess: value => {
            const commonFields = Option.allFromDict(
              omit(value, ["totalPercentage", "type", "controlTypes"]),
            );
            const requiredFieldsForOwner = Option.allFromDict(
              pick(value, ["totalPercentage", "type"]),
            );
            const requiredFieldsForControl = Option.allFromDict(pick(value, ["controlTypes"]));

            if (commonFields.isNone()) {
              return;
            }

            const {
              qualificationType,

              taxIdentificationNumber,
            } = commonFields.get();

            const ultimateBeneficialOwner = match({
              qualificationType,
              requiredFieldsForOwner,
              requiredFieldsForControl,
            })
              .with(
                {
                  qualificationType: "Ownership",
                  requiredFieldsForOwner: Option.P.Some(P.select()),
                },
                ({ totalPercentage, type }) => ({
                  qualificationType,
                  ownership: { totalPercentage: Number(totalPercentage), type },
                }),
              )
              .with(
                {
                  qualificationType: "Control",
                  requiredFieldsForControl: Option.P.Some(P.select()),
                },
                ({ controlTypes }) => ({
                  qualificationType,
                  controlTypes: [controlTypes],
                }),
              )
              .with({ qualificationType: "LegalRepresentative" }, () => ({
                qualificationType,
              }))
              .otherwise(() => undefined);

            if (ultimateBeneficialOwner === undefined) {
              return;
            }

            onSave({
              ultimateBeneficialOwner,
              taxIdentificationNumber,
            });
          },
        });
      },
    };
  });

  const isFirstMount = useFirstMountState();

  const isTaxIdentificationRequired = match({
    accountCountry,
    initialValues,
    regulatoryClassification,
  })
    .with(
      {
        accountCountry: P.not(initialValues.address?.country),
        regulatoryClassification: "NonFinancialPassive",
      },
      () => true,
    )
    .with({ accountCountry: P.union("DEU", "ITA") }, () => true)
    .otherwise(() => false);

  const { Field, submitForm, FieldsListener, setFieldError } = useForm({
    qualificationType: {
      initialValue: initialValues.ultimateBeneficialOwner?.qualificationType ?? "Ownership",
      validate: validateNullableRequired,
    },
    controlTypes: {
      initialValue: initialValues.ultimateBeneficialOwner?.controlTypes?.[0] ?? "VotingRights",
      validate: validateNullableRequired,
    },
    totalPercentage: {
      initialValue:
        initialValues.ultimateBeneficialOwner?.ownership?.totalPercentage?.toString() ?? "",
      sanitize: trim,
      validate: validateRequired,
    },
    type: {
      initialValue: initialValues.ultimateBeneficialOwner?.ownership?.type ?? "Direct",
    },
    taxIdentificationNumber: {
      initialValue: initialValues.taxIdentificationNumber ?? "",
      sanitize: trim,
      validate: isTaxIdentificationRequired
        ? combineValidators(validateRequired, validateIndividualTaxNumber(accountCountry))
        : validateIndividualTaxNumber(accountCountry),
    },
  });

  useEffect(() => {
    if (isFirstMount) {
      errors.forEach(({ fieldName, code }) => {
        const message = getValidationErrorMessage(code);
        match(fieldName)
          .with("ultimateBeneficialOwner.qualificationType", () =>
            setFieldError("qualificationType", message),
          )
          .with("ultimateBeneficialOwner.controlTypes", () =>
            setFieldError("controlTypes", message),
          )
          .with("ultimateBeneficialOwner.ownership.totalPercentage", () =>
            setFieldError("totalPercentage", message),
          )
          .with("ultimateBeneficialOwner.ownership.type", () => setFieldError("type", message))
          .with("taxIdentificationNumber", field => setFieldError(field, message))
          .otherwise(() => null);
      });
    }
  }, [errors, isFirstMount, setFieldError]);

  return (
    <ResponsiveContainer breakpoint={breakpoints.small}>
      {({ large }) => (
        <View role="form" style={[styles.grid, large && styles.gridDesktop]}>
          <LakeLabel
            label={t("company.step.ownership.form.whyUboLabel")}
            style={styles.inputFull}
            render={id => (
              <Field name="qualificationType">
                {({ value, onChange, ref, error }) => (
                  <LakeSelect
                    id={id}
                    ref={ref}
                    items={uboQualificationTypeItems}
                    value={value}
                    onValueChange={onChange}
                    error={error}
                    placeholder={t("common.select")}
                  />
                )}
              </Field>
            )}
          />

          <FieldsListener names={["qualificationType"]}>
            {({ qualificationType }) =>
              match(qualificationType.value)
                .with("LegalRepresentative", () => null)
                .with("Control", () => (
                  <Field name="controlTypes">
                    {({ ref, value, onChange, error }) => (
                      <LakeLabel
                        label={t("company.step.ownership.form.controlTypeLabel")}
                        style={styles.inputFull}
                        render={id => (
                          <LakeSelect
                            id={id}
                            ref={ref}
                            items={controlTypeItems}
                            value={value}
                            onValueChange={onChange}
                            error={error}
                            placeholder={t("common.select")}
                          />
                        )}
                      />
                    )}
                  </Field>
                ))
                .with("Ownership", () => (
                  <>
                    <Field name="totalPercentage">
                      {({ value, valid, onChange, error }) => (
                        <LakeLabel
                          label={t("company.step.ownership.form.capitalLabel")}
                          render={id => (
                            <LakeTextInput
                              error={error}
                              unit="%"
                              inputMode="decimal"
                              aria-valuemin={0}
                              aria-valuemax={100}
                              id={id}
                              value={value}
                              valid={valid}
                              onChangeText={onChange}
                            />
                          )}
                        />
                      )}
                    </Field>

                    <Field name="type">
                      {({ ref, value, onChange, error }) => (
                        <LakeLabel
                          label={t("company.step.ownership.form.capitalTypeLabel")}
                          render={id => (
                            <LakeSelect
                              id={id}
                              ref={ref}
                              items={ownershipTypeItems}
                              value={value}
                              onValueChange={onChange}
                              error={error}
                              placeholder={t("common.select")}
                            />
                          )}
                        />
                      )}
                    </Field>
                  </>
                ))
                .exhaustive()
            }
          </FieldsListener>

          <View style={styles.inputFull}>
            <Field name="taxIdentificationNumber">
              {({ value, valid, error, onChange, onBlur, ref }) => (
                <TaxIdentificationNumberInput
                  ref={ref}
                  value={value}
                  error={error}
                  valid={valid}
                  onChange={onChange}
                  onBlur={onBlur}
                  country={accountCountry}
                  isCompany={false}
                  required={isTaxIdentificationRequired}
                />
              )}
            </Field>
          </View>
        </View>
      )}
    </ResponsiveContainer>
  );
};
