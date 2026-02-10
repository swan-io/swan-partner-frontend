import { Option } from "@swan-io/boxed";
import { useMutation } from "@swan-io/graphql-client";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { breakpoints } from "@swan-io/lake/src/constants/design";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { trim } from "@swan-io/lake/src/utils/string";
import { combineValidators, useForm } from "@swan-io/use-form";
import { StyleSheet } from "react-native";
import { OnboardingFooter } from "../../../components/OnboardingFooter";
import { StepTitle } from "../../../components/StepTitle";
import {
  EmploymentStatus,
  IndividualAccountSourceOfFunds,
  IndividualOnboardingFragment,
  MonthlyIncome,
  UpdatePublicIndividualAccountHolderOnboardingDocument,
} from "../../../graphql/partner";
import { t } from "../../../utils/i18n";

import { Item, LakeSelect } from "@swan-io/lake/src/components/LakeSelect";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { RadioGroup } from "@swan-io/lake/src/components/RadioGroup";
import { useFirstMountState } from "@swan-io/lake/src/hooks/useFirstMountState";
import { noop } from "@swan-io/lake/src/utils/function";
import { emptyToUndefined } from "@swan-io/lake/src/utils/nullish";
import { omit } from "@swan-io/lake/src/utils/object";
import { TaxIdentificationNumberInput } from "@swan-io/shared-business/src/components/TaxIdentificationNumberInput";
import { IndividualCountryCCA3 } from "@swan-io/shared-business/src/constants/countries";
import { showToast } from "@swan-io/shared-business/src/state/toasts";
import {
  validateIndividualTaxNumber,
  validateNullableRequired,
  validateRequired,
  validateUsaTaxNumber,
} from "@swan-io/shared-business/src/utils/validation";
import { useEffect } from "react";
import { View } from "react-native";
import { match, P } from "ts-pattern";
import { Router } from "../../../utils/routes";
import { getUpdateOnboardingError } from "../../../utils/templateTranslations";
import {
  extractServerValidationErrors,
  getValidationErrorMessage,
  ServerInvalidFieldCode,
} from "../../../utils/validation";

export type ActivityFieldName =
  | "employmentStatus"
  | "monthlyIncome"
  | "taxIdentificationNumber"
  | "isUnitedStatesPerson";

type Props = {
  onboarding: NonNullable<IndividualOnboardingFragment>;
  serverValidationErrors: {
    fieldName: ActivityFieldName;
    code: ServerInvalidFieldCode;
  }[];
};

const styles = StyleSheet.create({
  gap: {
    gap: "32px",
  },
  grid: {
    display: "grid",
    gap: "8px",
  },
  gridDesktop: {
    gap: "16px 32px",
  },
});

const employmentStatuses: Item<EmploymentStatus>[] = [
  { name: t("employmentStatus.craftsman"), value: "Craftsman" },
  { name: t("employmentStatus.employee"), value: "Employee" },
  { name: t("employmentStatus.entrepreneur"), value: "Entrepreneur" },
  { name: t("employmentStatus.farmer"), value: "Farmer" },
  { name: t("employmentStatus.manager"), value: "Manager" },
  { name: t("employmentStatus.practitioner"), value: "Practitioner" },
  { name: t("employmentStatus.retiree"), value: "Retiree" },
  { name: t("employmentStatus.shopOwner"), value: "ShopOwner" },
  { name: t("employmentStatus.student"), value: "Student" },
  { name: t("employmentStatus.unemployed"), value: "Unemployed" },
];

const monthlyIncomes: Item<MonthlyIncome>[] = [
  { name: t("monthlyIncome.lessThan500"), value: "LessThan500" },
  { name: t("monthlyIncome.between500And1500"), value: "Between500And1500" },
  { name: t("monthlyIncome.between1500And3000"), value: "Between1500And3000" },
  { name: t("monthlyIncome.between3000And4500"), value: "Between3000And4500" },
  { name: t("monthlyIncome.moreThan4500"), value: "MoreThan4500" },
];

const sourcesOfFunds: Item<IndividualAccountSourceOfFunds>[] = [
  { name: t("sourcesOfFunds.businessActivity"), value: "BusinessActivity" },
  { name: t("sourcesOfFunds.capitalGains"), value: "CapitalGains" },
  { name: t("sourcesOfFunds.familyContributions"), value: "FamilyContributions" },
  { name: t("sourcesOfFunds.inheritanceOrGift"), value: "InheritanceOrGift" },
  { name: t("sourcesOfFunds.other"), value: "Other" },
  { name: t("sourcesOfFunds.personalWealth"), value: "PersonalWealth" },
  { name: t("sourcesOfFunds.realEstateIncome"), value: "RealEstateIncome" },
  { name: t("sourcesOfFunds.salary"), value: "Salary" },
  { name: t("sourcesOfFunds.saleOfAssets"), value: "SaleOfAssets" },
  { name: t("sourcesOfFunds.selfEmployment"), value: "SelfEmployment" },
];

export const OnboardingIndividualActivity = ({ onboarding, serverValidationErrors }: Props) => {
  const [updateIndividualOnboarding, updateResult] = useMutation(
    UpdatePublicIndividualAccountHolderOnboardingDocument,
  );
  const isFirstMount = useFirstMountState();

  const onboardingId = onboarding.id;
  const { accountAdmin, accountInfo } = onboarding;

  const addressCountry = accountAdmin?.address?.country;
  const accountCountry = accountInfo?.country;

  const isTaxIdentificationRequired = match({ addressCountry, accountCountry })
    .with({ accountCountry: P.nullish }, () => true)
    .with({ addressCountry: P.not(accountCountry) }, () => true)
    .with({ addressCountry: "DEU" }, () => true)
    .with({ addressCountry: "BEL" }, () => true)
    .with({ addressCountry: "ITA" }, () => true)
    .otherwise(() => false);

  const { Field, FieldsListener, setFieldError, submitForm } = useForm({
    employmentStatus: {
      initialValue: accountAdmin?.employmentStatus ?? undefined,
      validate: validateNullableRequired,
    },
    monthlyIncome: {
      initialValue: accountAdmin?.monthlyIncome ?? undefined,
      validate: validateNullableRequired,
    },
    sourcesOfFunds: {
      initialValue: accountAdmin?.sourcesOfFunds?.[0] ?? undefined,
    },
    isUnitedStatesPerson: {
      initialValue: accountAdmin?.unitedStatesTaxInfo?.isUnitedStatesPerson ?? false,
    },
    taxIdentificationNumber: {
      initialValue: accountAdmin?.taxIdentificationNumber ?? "",
      sanitize: trim,
      validate: isTaxIdentificationRequired
        ? combineValidators(
            validateRequired,
            validateIndividualTaxNumber(addressCountry as IndividualCountryCCA3),
          )
        : undefined,
    },
    unitedStatesTaxIdentificationNumber: {
      initialValue: accountAdmin?.unitedStatesTaxInfo?.unitedStatesTaxIdentificationNumber ?? "",
      sanitize: trim,
      validate: (value, { getFieldValue }) => {
        const isRequired = getFieldValue("isUnitedStatesPerson");
        if (isRequired) {
          return combineValidators(validateRequired, validateUsaTaxNumber)(value);
        }
      },
    },
  });

  useEffect(() => {
    if (isFirstMount) {
      serverValidationErrors.forEach(({ fieldName, code }) => {
        const message = getValidationErrorMessage(code);
        setFieldError(fieldName, message);
      });
    }
  }, [serverValidationErrors, isFirstMount, setFieldError]);

  const onPressPrevious = () => {
    Router.push("Root", { onboardingId });
  };

  const onPressNext = () => {
    submitForm({
      onSuccess: values => {
        const option = Option.allFromDict(omit(values, ["taxIdentificationNumber"]));
        if (option.isNone()) {
          return;
        }
        const currentValues = option.get();
        const {
          isUnitedStatesPerson,
          unitedStatesTaxIdentificationNumber,
          sourcesOfFunds,
          ...input
        } = currentValues;

        const taxIdentificationNumber = values.taxIdentificationNumber
          .flatMap(value => Option.fromNullable(emptyToUndefined(value)))
          .toNull();

        updateIndividualOnboarding({
          input: {
            onboardingId,
            accountAdmin: {
              ...input,
              sourcesOfFunds: sourcesOfFunds != null ? [sourcesOfFunds] : undefined,
              taxIdentificationNumber,
              unitedStatesTaxInfo: {
                isUnitedStatesPerson,
                unitedStatesTaxIdentificationNumber: isUnitedStatesPerson
                  ? unitedStatesTaxIdentificationNumber
                  : undefined,
              },
            },
          },
        })
          .mapOk(data => data.updatePublicIndividualAccountHolderOnboarding)
          .mapOkToResult(filterRejectionsToResult)
          .tapOk(() => Router.push("Finalize", { onboardingId }))
          .tapError(error => {
            match(error)
              .with({ __typename: "ValidationRejection" }, error => {
                const invalidFields = extractServerValidationErrors(error, path => {
                  return match(path)
                    .with(
                      [
                        "accountAdmin",
                        "unitedStatesTaxInfo",
                        "unitedStatesTaxIdentificationNumber",
                      ],
                      () => "unitedStatesTaxIdentificationNumber" as const,
                    )
                    .otherwise(() => null);
                });
                invalidFields.forEach(({ fieldName, code }) => {
                  const message = getValidationErrorMessage(code, currentValues[fieldName]);
                  setFieldError(fieldName, message);
                });
              })
              .otherwise(noop);

            showToast({ variant: "error", error, ...getUpdateOnboardingError(error) });
          });
      },
    });
  };

  return (
    <>
      <ResponsiveContainer breakpoint={breakpoints.medium} style={styles.gap}>
        {({ large, small }) => (
          <>
            <Tile style={styles.gap}>
              <StepTitle isMobile={small}>{t("individual.step.activity.title1")}</StepTitle>
              <View style={[styles.grid, large && styles.gridDesktop]}>
                <LakeLabel
                  label={t("individual.step.activity.status")}
                  render={id => (
                    <Field name="employmentStatus">
                      {({ value, onChange, ref, error }) => (
                        <LakeSelect
                          id={id}
                          ref={ref}
                          items={employmentStatuses}
                          value={value}
                          onValueChange={onChange}
                          error={error}
                          placeholder={t("individual.step.activity.status.placeholder")}
                        />
                      )}
                    </Field>
                  )}
                />

                <LakeLabel
                  label={t("individual.step.activity.monthly")}
                  render={id => (
                    <Field name="monthlyIncome">
                      {({ value, onChange, ref, error }) => (
                        <LakeSelect
                          id={id}
                          ref={ref}
                          items={monthlyIncomes}
                          value={value}
                          onValueChange={onChange}
                          error={error}
                          placeholder={t("individual.step.activity.monthly.placeholder")}
                        />
                      )}
                    </Field>
                  )}
                />

                <LakeLabel
                  label={t("individual.step.activity.source")}
                  render={id => (
                    <Field name="sourcesOfFunds">
                      {({ value, onChange, ref }) => (
                        <LakeSelect
                          id={id}
                          ref={ref}
                          items={sourcesOfFunds}
                          value={value}
                          onValueChange={onChange}
                          placeholder={t("individual.step.activity.source.placeholder")}
                        />
                      )}
                    </Field>
                  )}
                />
              </View>
            </Tile>

            <Tile style={styles.gap}>
              <StepTitle isMobile={small}>{t("individual.step.activity.title2")}</StepTitle>
              <View style={[styles.grid, large && styles.gridDesktop]}>
                {isTaxIdentificationRequired && (
                  <Field name="taxIdentificationNumber">
                    {({ value, valid, error, onChange, onBlur, ref }) => (
                      <TaxIdentificationNumberInput
                        ref={ref}
                        value={value}
                        error={error}
                        valid={valid}
                        onChange={onChange}
                        onBlur={onBlur}
                        country={addressCountry as IndividualCountryCCA3}
                        isCompany={false}
                        required={true}
                      />
                    )}
                  </Field>
                )}

                <LakeLabel
                  label={t("individual.step.activity.usaCitizen")}
                  render={() => (
                    <Field name="isUnitedStatesPerson">
                      {({ value, onChange }) => (
                        <RadioGroup
                          direction="row"
                          items={[
                            {
                              name: t("common.yes"),
                              value: true,
                            },
                            {
                              name: t("common.no"),
                              value: false,
                            },
                          ]}
                          value={value}
                          onValueChange={onChange}
                        />
                      )}
                    </Field>
                  )}
                />

                <FieldsListener names={["isUnitedStatesPerson"]}>
                  {({ isUnitedStatesPerson }) => (
                    <Field name="unitedStatesTaxIdentificationNumber">
                      {({ value, onBlur, onChange, error, ref }) =>
                        isUnitedStatesPerson.value ? (
                          <LakeLabel
                            label={t("individual.step.activity.usaTax")}
                            render={id => (
                              <LakeTextInput
                                id={id}
                                ref={ref}
                                value={value}
                                error={error}
                                onBlur={onBlur}
                                onChangeText={onChange}
                                placeholder={t("individual.step.activity.usaTax.placeholder")}
                                help={t("individual.step.activity.usaTax.help")}
                              />
                            )}
                          />
                        ) : null
                      }
                    </Field>
                  )}
                </FieldsListener>
              </View>
            </Tile>
          </>
        )}
      </ResponsiveContainer>
      <OnboardingFooter
        onNext={onPressNext}
        onPrevious={onPressPrevious}
        justifyContent="start"
        loading={updateResult.isLoading()}
      />
    </>
  );
};
