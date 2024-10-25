import { Option } from "@swan-io/boxed";
import { useMutation } from "@swan-io/graphql-client";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { Item, LakeSelect } from "@swan-io/lake/src/components/LakeSelect";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { breakpoints } from "@swan-io/lake/src/constants/design";
import { useFirstMountState } from "@swan-io/lake/src/hooks/useFirstMountState";
import { noop } from "@swan-io/lake/src/utils/function";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { emptyToUndefined } from "@swan-io/lake/src/utils/nullish";
import { trim } from "@swan-io/lake/src/utils/string";
import {
  businessActivities,
  monthlyPaymentVolumes,
} from "@swan-io/shared-business/src/constants/business";
import { showToast } from "@swan-io/shared-business/src/state/toasts";
import { combineValidators, useForm } from "@swan-io/use-form";
import { useEffect } from "react";
import { StyleSheet } from "react-native";
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
  const [updateOnboarding, updateResult] = useMutation(UpdateCompanyOnboardingDocument);
  const isFirstMount = useFirstMountState();

  const { Field, submitForm, setFieldError } = useForm({
    businessActivity: {
      initialValue: initialBusinessActivity,
      validate: validateRequired,
    },
    businessActivityDescription: {
      initialValue: initialBusinessActivityDescription,
      sanitize: trim,
      validate: combineValidators(validateRequired, validateMaxLength(CHARACTER_LIMITATION)),
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
    submitForm({
      onSuccess: values => {
        const option = Option.allFromDict(values);

        if (option.isNone()) {
          return;
        }

        const currentValues = option.get();

        const { businessActivity, businessActivityDescription, monthlyPaymentVolume } =
          currentValues;

        if (businessActivity === "") {
          return;
        }

        updateOnboarding({
          input: {
            onboardingId,
            businessActivity,
            businessActivityDescription,
            monthlyPaymentVolume,
            language: locale.language,
          },
          language: locale.language,
        })
          .mapOk(data => data.unauthenticatedUpdateCompanyOnboarding)
          .mapOkToResult(filterRejectionsToResult)
          .tapOk(() => Router.push(nextStep, { onboardingId }))
          .tapError(error => {
            match(error)
              .with({ __typename: "ValidationRejection" }, error => {
                const invalidFields = extractServerValidationErrors(error, path =>
                  path[0] === "businessActivityDescription" ? "businessActivityDescription" : null,
                );
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
      <OnboardingStepContent>
        <ResponsiveContainer breakpoint={breakpoints.medium}>
          {({ small }) => (
            <>
              <StepTitle isMobile={small}>{t("company.step.organisation2.title")}</StepTitle>
              <Space height={small ? 24 : 32} />

              <Tile>
                <Field name="businessActivity">
                  {({ value, error, onChange, ref }) => (
                    <LakeLabel
                      label={t("company.step.organisation2.activityLabel")}
                      render={id => (
                        <LakeSelect
                          id={id}
                          placeholder={t("company.step.organisation2.activityPlaceholder")}
                          value={emptyToUndefined(value)}
                          items={businessActivitiesItems}
                          error={error}
                          onValueChange={onChange}
                          ref={ref}
                        />
                      )}
                    />
                  )}
                </Field>

                <Space height={12} />

                <Field name="businessActivityDescription">
                  {({ value, valid, error, onChange, onBlur, ref }) => (
                    <LakeLabel
                      label={t("company.step.organisation2.descriptionLabel")}
                      render={id => (
                        <LakeTextInput
                          id={id}
                          ref={ref}
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
                  {({ value, onChange, ref }) => (
                    <LakeLabel
                      label={t("company.step.organisation2.monthlyPaymentLabel")}
                      render={id => (
                        <LakeSelect
                          id={id}
                          ref={ref}
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

        <OnboardingFooter
          onPrevious={onPressPrevious}
          onNext={onPressNext}
          loading={updateResult.isLoading()}
        />
      </OnboardingStepContent>
    </>
  );
};
