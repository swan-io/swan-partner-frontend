import { Result } from "@swan-io/boxed";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { Item, LakeSelect } from "@swan-io/lake/src/components/LakeSelect";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { breakpoints } from "@swan-io/lake/src/constants/design";
import { useFirstMountState } from "@swan-io/lake/src/hooks/useFirstMountState";
import { useUrqlMutation } from "@swan-io/lake/src/hooks/useUrqlMutation";
import { showToast } from "@swan-io/lake/src/state/toasts";
import { noop } from "@swan-io/lake/src/utils/function";
import { emptyToUndefined } from "@swan-io/lake/src/utils/nullish";
import {
  businessActivities,
  monthlyPaymentVolumes,
} from "@swan-io/shared-business/src/constants/business";
import { useEffect } from "react";
import { StyleSheet } from "react-native";
import { combineValidators, hasDefinedKeys, useForm } from "react-ux-form";
import { match } from "ts-pattern";
import { OnboardingFooter } from "../../components/OnboardingFooter";
import { OnboardingStepContent } from "../../components/OnboardingStepContent";
import { StepTitle } from "../../components/StepTitle";
import {
  BusinessActivity,
  MonthlyPaymentVolume,
  UpdateCompanyOnboardingDocument,
} from "../../graphql/unauthenticated";
import { locale, t } from "../../utils/i18n";
import { CompanyOnboardingRoute, Router } from "../../utils/routes";
import { getUpdateOnboardingError } from "../../utils/templateTranslations";
import {
  ServerInvalidFieldCode,
  extractServerValidationErrors,
  getValidationErrorMessage,
  validateMaxLength,
  validateRequired,
} from "../../utils/validation";

const styles = StyleSheet.create({
  textArea: {
    height: 128,
  },
});

export type Organisation2FieldName =
  | "businessActivity"
  | "businessActivityDescription"
  | "monthlyPaymentVolume";

type Props = {
  previousStep: CompanyOnboardingRoute;
  nextStep: CompanyOnboardingRoute;
  onboardingId: string;
  initialBusinessActivity: BusinessActivity | "";
  initialBusinessActivityDescription: string;
  initialMonthlyPaymentVolume: MonthlyPaymentVolume;
  serverValidationErrors: {
    fieldName: Organisation2FieldName;
    code: ServerInvalidFieldCode;
  }[];
};

const businessActivitiesItems: Item<BusinessActivity>[] = businessActivities.map(
  ({ text, value }) => ({
    name: text,
    value,
  }),
);

const monthlyPaymentVolumeItems: Item<MonthlyPaymentVolume>[] = monthlyPaymentVolumes.map(
  ({ text, value }) => ({
    name: text,
    value,
  }),
);

const CHARACTER_LIMITATION = 500;

export const OnboardingCompanyOrganisation2 = ({
  previousStep,
  nextStep,
  onboardingId,
  initialBusinessActivity,
  initialBusinessActivityDescription,
  initialMonthlyPaymentVolume,
  serverValidationErrors,
}: Props) => {
  const [updateResult, updateOnboarding] = useUrqlMutation(UpdateCompanyOnboardingDocument);
  const isFirstMount = useFirstMountState();

  const { Field, submitForm, setFieldError } = useForm({
    businessActivity: {
      initialValue: initialBusinessActivity,
      validate: validateRequired,
    },
    businessActivityDescription: {
      initialValue: initialBusinessActivityDescription,
      validate: combineValidators(validateRequired, validateMaxLength(CHARACTER_LIMITATION)),
      sanitize: value => value.trim(),
    },
    monthlyPaymentVolume: {
      initialValue: initialMonthlyPaymentVolume,
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
    Router.push(previousStep, { onboardingId });
  };

  const onPressNext = () => {
    submitForm(values => {
      if (
        !hasDefinedKeys(values, [
          "businessActivity",
          "businessActivityDescription",
          "monthlyPaymentVolume",
        ]) ||
        values.businessActivity === ""
      ) {
        return;
      }

      const { businessActivity, businessActivityDescription, monthlyPaymentVolume } = values;

      updateOnboarding({
        input: {
          onboardingId,
          businessActivity,
          businessActivityDescription,
          monthlyPaymentVolume,
        },
        language: locale.language,
      })
        .mapOkToResult(({ unauthenticatedUpdateCompanyOnboarding }) =>
          match(unauthenticatedUpdateCompanyOnboarding)
            .with({ __typename: "UnauthenticatedUpdateCompanyOnboardingSuccessPayload" }, value =>
              Result.Ok(value),
            )
            .otherwise(error => Result.Error(error)),
        )
        .tapOk(() => {
          Router.push(nextStep, { onboardingId });
        })
        .tapError(error => {
          match(error)
            .with({ __typename: "ValidationRejection" }, error => {
              const invalidFields = extractServerValidationErrors(error, path =>
                path[0] === "businessActivityDescription" ? "businessActivityDescription" : null,
              );
              invalidFields.forEach(({ fieldName, code }) => {
                const message = getValidationErrorMessage(code, values[fieldName]);
                setFieldError(fieldName, message);
              });
            })
            .otherwise(noop);

          const errorMessage = getUpdateOnboardingError(error);
          showToast({
            variant: "error",
            title: errorMessage.title,
            description: errorMessage.description,
          });
        });
    });
  };

  return (
    <>
      <OnboardingStepContent>
        <ResponsiveContainer breakpoint={breakpoints.medium}>
          {({ small }) => (
            <>
              <StepTitle isMobile={small}>{t("company.step.organisation2.title")}</StepTitle>
              <Space height={small ? 24 : 32} />

              <Tile>
                <Field name="businessActivity">
                  {({ value, error, onChange }) => (
                    <LakeLabel
                      label={t("company.step.organisation2.activityLabel")}
                      render={() => (
                        <LakeSelect
                          placeholder={t("company.step.organisation2.activityPlaceholder")}
                          value={emptyToUndefined(value)}
                          items={businessActivitiesItems}
                          error={error}
                          onValueChange={onChange}
                        />
                      )}
                    />
                  )}
                </Field>

                <Space height={12} />

                <Field name="businessActivityDescription">
                  {({ value, valid, error, onChange, onBlur }) => (
                    <LakeLabel
                      label={t("company.step.organisation2.descriptionLabel")}
                      render={id => (
                        <LakeTextInput
                          id={id}
                          placeholder={t("company.step.organisation2.descriptionPlaceholder")}
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

                <Space height={12} />

                <Field name="monthlyPaymentVolume">
                  {({ value, onChange }) => (
                    <LakeLabel
                      label={t("company.step.organisation2.monthlyPaymentLabel")}
                      render={() => (
                        <LakeSelect
                          value={value}
                          items={monthlyPaymentVolumeItems}
                          onValueChange={onChange}
                        />
                      )}
                    />
                  )}
                </Field>
              </Tile>
            </>
          )}
        </ResponsiveContainer>
      </OnboardingStepContent>

      <OnboardingFooter
        onPrevious={onPressPrevious}
        onNext={onPressNext}
        loading={updateResult.isLoading()}
      />
    </>
  );
};
