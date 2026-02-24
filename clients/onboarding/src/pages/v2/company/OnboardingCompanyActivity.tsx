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
  CompanyHeadcount,
  CompanyOnboardingFragment,
  ForecastYearlyIncome,
  MonthlyPaymentVolume,
  UpdatePublicCompanyAccountHolderOnboardingDocument,
} from "../../../graphql/partner";
import { t } from "../../../utils/i18n";

import { Item, LakeSelect } from "@swan-io/lake/src/components/LakeSelect";
import { LakeTagInput } from "@swan-io/lake/src/components/LakeTagInput";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { useFirstMountState } from "@swan-io/lake/src/hooks/useFirstMountState";
import { noop } from "@swan-io/lake/src/utils/function";
import {
  companyHeadcount,
  forecastYearlyIncome,
  monthlyPaymentVolumes,
} from "@swan-io/shared-business/src/constants/business";
import { showToast } from "@swan-io/shared-business/src/state/toasts";
import {
  validateNullableRequired,
  validateRequired,
} from "@swan-io/shared-business/src/utils/validation";
import { useEffect } from "react";
import { View } from "react-native";
import { match } from "ts-pattern";
import { Router } from "../../../utils/routes";
import { getUpdateOnboardingError } from "../../../utils/templateTranslations";
import {
  badUserInputErrorPattern,
  extractServerValidationFields,
  getValidationErrorMessage,
  isValidUrl,
  ServerInvalidFieldCode,
  validateMaxLength,
} from "../../../utils/validation";

export type ActivityFieldName =
  | "businessActivityDescription"
  | "monthlyPaymentVolume"
  | "headcount"
  | "websites"
  | "forecastYearlyIncome";

type Props = {
  onboarding: NonNullable<CompanyOnboardingFragment>;
  serverValidationErrors?: {
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
  textArea: {
    height: 128,
  },
});

const monthlyPaymentVolumeItems: Item<MonthlyPaymentVolume>[] = monthlyPaymentVolumes.map(
  ({ text, value }) => ({
    name: text,
    value,
  }),
);

const forecastYearlyIncomeItems: Item<ForecastYearlyIncome>[] = forecastYearlyIncome.map(
  ({ text, value }) => ({
    name: text,
    value,
  }),
);

const companyHeadcountItems: Item<CompanyHeadcount>[] = companyHeadcount.map(({ text, value }) => ({
  name: text,
  value,
}));

const CHARACTER_LIMITATION = 1024;

export const OnboardingCompanyActivity = ({ onboarding, serverValidationErrors }: Props) => {
  const [updateCompanyOnboarding, updateResult] = useMutation(
    UpdatePublicCompanyAccountHolderOnboardingDocument,
  );
  const isFirstMount = useFirstMountState();

  const onboardingId = onboarding.id;
  const { company } = onboarding;

  const { Field, setFieldError, submitForm } = useForm({
    businessActivityDescription: {
      initialValue: company?.businessActivityDescription ?? "",
      sanitize: trim,
      validate: combineValidators(validateRequired, validateMaxLength(CHARACTER_LIMITATION)),
    },
    monthlyPaymentVolume: {
      initialValue: company?.monthlyPaymentVolume ?? undefined,
      validate: validateNullableRequired,
    },
    forecastYearlyIncome: {
      initialValue: company?.forecastYearlyIncome ?? undefined,
      validate: validateNullableRequired,
    },
    headcount: {
      initialValue: company?.headcount ?? undefined,
      validate: validateNullableRequired,
    },
    websites: {
      initialValue: company?.websites ?? [],
      validate: value => {
        if (value.length > 0 && value.some(url => !isValidUrl(url))) {
          return t("error.invalidField");
        }
      },
    },
  });

  useEffect(() => {
    if (isFirstMount && serverValidationErrors) {
      serverValidationErrors.forEach(({ fieldName, code }) => {
        const message = getValidationErrorMessage(code);
        setFieldError(fieldName, message);
      });
    }
  }, [serverValidationErrors, isFirstMount, setFieldError]);

  const onPressPrevious = () => {
    Router.push("Organisation", { onboardingId });
  };

  const onPressNext = () => {
    submitForm({
      onSuccess: values => {
        const option = Option.allFromDict(values);
        if (option.isNone()) {
          return;
        }
        const currentValues = option.get();

        updateCompanyOnboarding({
          input: {
            onboardingId,
            company: {
              ...currentValues,
            },
          },
        })
          .mapOk(data => data.updatePublicCompanyAccountHolderOnboarding)
          .mapOkToResult(filterRejectionsToResult)
          .tapOk(() => Router.push("Ownership", { onboardingId }))
          .tapError(error => {
            match(error)
              .with(badUserInputErrorPattern, ({ fields }) => {
                const invalidFields = extractServerValidationFields(fields, path => {
                  return match(path)
                    .with(
                      ["company", "businessActivityDescription"],
                      () => "businessActivityDescription" as const,
                    )
                    .with(["company", "websites"], () => "websites" as const)
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
              <StepTitle isMobile={small}>{t("company.step.activity.title1")}</StepTitle>
              <View style={[styles.grid, large && styles.gridDesktop]}>
                <Field name="businessActivityDescription">
                  {({ value, valid, error, onChange, onBlur, ref }) => (
                    <LakeLabel
                      label={t("company.step.activity.businessActivityLabel")}
                      render={id => (
                        <LakeTextInput
                          id={id}
                          ref={ref}
                          placeholder={t("company.step.activity.businessActivityPlaceholder")}
                          value={value}
                          valid={valid}
                          error={error}
                          style={styles.textArea}
                          multiline={true}
                          maxCharCount={CHARACTER_LIMITATION}
                          onChangeText={onChange}
                          onBlur={onBlur}
                        />
                      )}
                    />
                  )}
                </Field>

                <Field name="websites">
                  {({ value, error, onChange }) => (
                    <LakeLabel
                      label={t("company.step.activity.websiteLabel")}
                      optionalLabel={t("common.optional")}
                      render={id => (
                        <LakeTagInput
                          id={id}
                          validator={isValidUrl}
                          onValuesChanged={onChange}
                          values={value}
                          error={error}
                          help={t("company.step.activity.websiteHelp")}
                        />
                      )}
                    />
                  )}
                </Field>

                <LakeLabel
                  label={t("company.step.activity.headcountLabel")}
                  render={id => (
                    <Field name="headcount">
                      {({ value, onChange, ref, error }) => (
                        <LakeSelect
                          id={id}
                          ref={ref}
                          items={companyHeadcountItems}
                          value={value}
                          onValueChange={onChange}
                          error={error}
                          placeholder={t("form.rangePlaceholder")}
                        />
                      )}
                    </Field>
                  )}
                />
              </View>
            </Tile>

            <Tile style={styles.gap}>
              <StepTitle isMobile={small}>{t("company.step.activity.title2")}</StepTitle>
              <View style={[styles.grid, large && styles.gridDesktop]}>
                <LakeLabel
                  label={t("company.step.activity.monthlyLabel")}
                  render={id => (
                    <Field name="monthlyPaymentVolume">
                      {({ value, onChange, ref, error }) => (
                        <LakeSelect
                          id={id}
                          ref={ref}
                          items={monthlyPaymentVolumeItems}
                          value={value}
                          onValueChange={onChange}
                          error={error}
                          placeholder={t("form.rangePlaceholder")}
                        />
                      )}
                    </Field>
                  )}
                />

                <LakeLabel
                  label={t("company.step.activity.yearlyLabel")}
                  render={id => (
                    <Field name="forecastYearlyIncome">
                      {({ value, onChange, ref, error }) => (
                        <LakeSelect
                          id={id}
                          ref={ref}
                          items={forecastYearlyIncomeItems}
                          value={value}
                          onValueChange={onChange}
                          error={error}
                          placeholder={t("form.rangePlaceholder")}
                        />
                      )}
                    </Field>
                  )}
                />
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
