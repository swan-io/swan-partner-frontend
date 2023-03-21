import { Result } from "@swan-io/boxed";
import { Icon } from "@swan-io/lake/src/components/Icon";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { Item, LakeSelect } from "@swan-io/lake/src/components/LakeSelect";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { LakeTooltip } from "@swan-io/lake/src/components/LakeTooltip";
import { RadioGroup, RadioGroupItem } from "@swan-io/lake/src/components/RadioGroup";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { breakpoints, colors } from "@swan-io/lake/src/constants/design";
import { useFirstMountState } from "@swan-io/lake/src/hooks/useFirstMountState";
import { useUrqlMutation } from "@swan-io/lake/src/hooks/useUrqlMutation";
import { showToast } from "@swan-io/lake/src/state/toasts";
import { emptyToUndefined } from "@swan-io/lake/src/utils/nullish";
import { CountryCCA3 } from "@swan-io/shared-business/src/constants/countries";
import { validateIndividualTaxNumber } from "@swan-io/shared-business/src/utils/validation";
import { useEffect } from "react";
import { hasDefinedKeys, useForm } from "react-ux-form";
import { match } from "ts-pattern";
import { OnboardingFooter } from "../../components/OnboardingFooter";
import { OnboardingStepContent } from "../../components/OnboardingStepContent";
import { StepTitle } from "../../components/StepTitle";
import {
  AccountCountry,
  EmploymentStatus,
  MonthlyIncome,
  UpdateIndividualOnboardingDocument,
} from "../../graphql/unauthenticated";
import { locale, t } from "../../utils/i18n";
import { Router } from "../../utils/routes";
import { getUpdateOnboardingError } from "../../utils/templateTranslations";
import { getValidationErrorMessage, ServerInvalidFieldCode } from "../../utils/validation";

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

const monthlyIncomes: RadioGroupItem<MonthlyIncome>[] = [
  { name: t("monthlyIncome.lessThan500"), value: "LessThan500" },
  { name: t("monthlyIncome.between500And1500"), value: "Between500And1500" },
  { name: t("monthlyIncome.between1500And3000"), value: "Between1500And3000" },
  { name: t("monthlyIncome.between3000And4500"), value: "Between3000And4500" },
  { name: t("monthlyIncome.moreThan4500"), value: "MoreThan4500" },
];

export type DetailsFieldName = "employmentStatus" | "monthlyIncome" | "taxIdentificationNumber";

type Props = {
  initialEmploymentStatus: EmploymentStatus;
  initialMonthlyIncome: MonthlyIncome;
  initialTaxIdentificationNumber: string;
  country: CountryCCA3;
  accountCountry: AccountCountry;
  onboardingId: string;
  serverValidationErrors: {
    fieldName: DetailsFieldName;
    code: ServerInvalidFieldCode;
  }[];
};

export const OnboardingIndividualDetails = ({
  onboardingId,
  initialEmploymentStatus,
  initialMonthlyIncome,
  initialTaxIdentificationNumber,
  country,
  accountCountry,
  serverValidationErrors,
}: Props) => {
  const [updateResult, updateOnboarding] = useUrqlMutation(UpdateIndividualOnboardingDocument);
  const isFirstMount = useFirstMountState();

  const canSetTaxIdentification = accountCountry === "DEU" && country === "DEU";

  const { Field, submitForm, setFieldError } = useForm({
    employmentStatus: {
      initialValue: initialEmploymentStatus,
    },
    monthlyIncome: {
      initialValue: initialMonthlyIncome,
    },
    taxIdentificationNumber: {
      initialValue: initialTaxIdentificationNumber,
      validate: canSetTaxIdentification ? validateIndividualTaxNumber : undefined,
      sanitize: value => value.trim(),
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
    Router.push("OnboardingLocation", { onboardingId });
  };

  const onPressNext = () => {
    submitForm(values => {
      if (!hasDefinedKeys(values, ["employmentStatus", "monthlyIncome"])) {
        return;
      }

      const { employmentStatus, monthlyIncome, taxIdentificationNumber } = values;

      updateOnboarding({
        input: {
          onboardingId,
          employmentStatus,
          monthlyIncome,
          taxIdentificationNumber: emptyToUndefined(taxIdentificationNumber ?? ""),
        },
        language: locale.language,
      })
        .mapResult(({ unauthenticatedUpdateIndividualOnboarding }) =>
          match(unauthenticatedUpdateIndividualOnboarding)
            .with(
              { __typename: "UnauthenticatedUpdateIndividualOnboardingSuccessPayload" },
              value => Result.Ok(value),
            )
            .otherwise(error => Result.Error(error)),
        )
        .tapOk(() => {
          Router.push("OnboardingFinalize", { onboardingId });
        })
        .tapError(error => {
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
              <StepTitle isMobile={small}>{t("individual.step.details.title")}</StepTitle>
              <Space height={small ? 24 : 32} />

              <Tile>
                <Field name="employmentStatus">
                  {({ value, onChange }) => (
                    <LakeLabel
                      label={t("occupationPage.statusLabel")}
                      render={id => (
                        <LakeSelect
                          nativeID={id}
                          items={employmentStatuses}
                          value={value}
                          disabled={updateResult.isLoading()}
                          onValueChange={onChange}
                        />
                      )}
                    />
                  )}
                </Field>

                <Space height={12} />

                <Field name="monthlyIncome">
                  {({ value, onChange }) => (
                    <LakeLabel
                      label={t("occupationPage.incomeLabel")}
                      type="radioGroup"
                      render={() => (
                        <RadioGroup
                          items={monthlyIncomes}
                          value={value}
                          disabled={updateResult.isLoading()}
                          onValueChange={onChange}
                        />
                      )}
                    />
                  )}
                </Field>

                {canSetTaxIdentification && (
                  <>
                    <Space height={12} />

                    <Field name="taxIdentificationNumber">
                      {({ value, onChange, error, valid }) => (
                        <LakeLabel
                          label={t("occupationPage.taxIdentificationNumber")}
                          optionalLabel={t("common.optional")}
                          help={
                            <LakeTooltip
                              content={t("occupationPage.taxIdentificationNumberHelp")}
                              placement="top"
                              width={800}
                            >
                              <Icon
                                name="question-circle-regular"
                                size={16}
                                color={colors.gray[600]}
                              />
                            </LakeTooltip>
                          }
                          render={id => (
                            <LakeTextInput
                              nativeID={id}
                              placeholder={t("occupationPage.taxIdentificationNumberPlaceholder")}
                              value={value}
                              valid={valid}
                              error={error}
                              disabled={updateResult.isLoading()}
                              onChangeText={onChange}
                            />
                          )}
                        />
                      )}
                    </Field>
                  </>
                )}
              </Tile>

              <Space height={small ? 24 : 32} />
              <LakeText align="center">{t("individual.step.details.description")}</LakeText>
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
