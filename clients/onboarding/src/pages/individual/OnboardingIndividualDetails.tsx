import { Option } from "@swan-io/boxed";
import { useMutation } from "@swan-io/graphql-client";
import { LakeAlert } from "@swan-io/lake/src/components/LakeAlert";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { Item, LakeSelect } from "@swan-io/lake/src/components/LakeSelect";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { RadioGroup, RadioGroupItem } from "@swan-io/lake/src/components/RadioGroup";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { breakpoints } from "@swan-io/lake/src/constants/design";
import { useFirstMountState } from "@swan-io/lake/src/hooks/useFirstMountState";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { emptyToUndefined } from "@swan-io/lake/src/utils/nullish";
import { pick } from "@swan-io/lake/src/utils/object";
import { trim } from "@swan-io/lake/src/utils/string";
import { TaxIdentificationNumberInput } from "@swan-io/shared-business/src/components/TaxIdentificationNumberInput";
import { CountryCCA3 } from "@swan-io/shared-business/src/constants/countries";
import { showToast } from "@swan-io/shared-business/src/state/toasts";
import { validateIndividualTaxNumber } from "@swan-io/shared-business/src/utils/validation";
import { combineValidators, useForm } from "@swan-io/use-form";
import { useEffect } from "react";
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
import {
  ServerInvalidFieldCode,
  getValidationErrorMessage,
  validateRequired,
} from "../../utils/validation";

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
  const [updateOnboarding, updateResult] = useMutation(UpdateIndividualOnboardingDocument);
  const isFirstMount = useFirstMountState();

  const canSetTaxIdentification =
    (accountCountry === "DEU" && country === "DEU") ||
    (accountCountry === "ESP" && country === "ESP") ||
    (accountCountry === "ITA" && country === "ITA");

  const isTaxIdentificationRequired = match({ accountCountry, country })
    .with({ accountCountry: "ITA", country: "ITA" }, () => true)
    .otherwise(() => false);

  const { Field, submitForm, setFieldError } = useForm({
    employmentStatus: {
      initialValue: initialEmploymentStatus,
    },
    monthlyIncome: {
      initialValue: initialMonthlyIncome,
    },
    taxIdentificationNumber: {
      initialValue: initialTaxIdentificationNumber,
      sanitize: trim,
      validate: canSetTaxIdentification
        ? combineValidators(
            isTaxIdentificationRequired && validateRequired,
            validateIndividualTaxNumber(accountCountry),
          )
        : undefined,
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
    Router.push("Location", { onboardingId });
  };

  const onPressNext = () => {
    submitForm({
      onSuccess: values => {
        const option = Option.allFromDict(pick(values, ["employmentStatus", "monthlyIncome"]));

        if (option.isNone()) {
          return;
        }

        const { employmentStatus, monthlyIncome } = option.get();

        const taxIdentificationNumber = values.taxIdentificationNumber
          .flatMap(value => Option.fromNullable(emptyToUndefined(value)))
          .toUndefined();

        updateOnboarding({
          input: {
            onboardingId,
            employmentStatus,
            monthlyIncome,
            taxIdentificationNumber,
            language: locale.language,
          },
          language: locale.language,
        })
          .mapOk(data => data.unauthenticatedUpdateIndividualOnboarding)
          .mapOkToResult(filterRejectionsToResult)
          .tapOk(() => Router.push("Finalize", { onboardingId }))
          .tapError(error => {
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
              <StepTitle isMobile={small}>{t("individual.step.details.title")}</StepTitle>
              <Space height={small ? 24 : 32} />

              <Tile
                footer={
                  accountCountry === "DEU" && country === "DEU" ? (
                    <LakeAlert
                      variant="info"
                      anchored={true}
                      title={t("taxIdentificationNumber.germanInfo")}
                    />
                  ) : undefined
                }
              >
                <Field name="employmentStatus">
                  {({ value, onChange, ref }) => (
                    <LakeLabel
                      label={t("occupationPage.statusLabel")}
                      render={id => (
                        <LakeSelect
                          id={id}
                          ref={ref}
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
                    <Space height={32} />

                    <Field name="taxIdentificationNumber">
                      {({ value, valid, error, onChange, onBlur, ref }) => (
                        <TaxIdentificationNumberInput
                          ref={ref}
                          value={value}
                          error={error}
                          valid={valid}
                          onChange={onChange}
                          onBlur={onBlur}
                          accountCountry={accountCountry}
                          isCompany={false}
                          required={isTaxIdentificationRequired}
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

        <OnboardingFooter
          onPrevious={onPressPrevious}
          onNext={onPressNext}
          loading={updateResult.isLoading()}
        />
      </OnboardingStepContent>
    </>
  );
};
