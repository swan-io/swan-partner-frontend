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
import { showToast } from "@swan-io/shared-business/src/state/toasts";
import { validateIndividualTaxNumber } from "@swan-io/shared-business/src/utils/validation";
import { combineValidators, useForm } from "@swan-io/use-form";
import { FragmentOf, readFragment } from "gql.tada";
import { useEffect } from "react";
import { match } from "ts-pattern";
import { OnboardingFooter } from "../../components/OnboardingFooter";
import { OnboardingStepContent } from "../../components/OnboardingStepContent";
import { StepTitle } from "../../components/StepTitle";
import { EmploymentStatus, MonthlyIncome } from "../../graphql/unauthenticated";
import { UpdateIndividualOnboardingMutation } from "../../mutations/UpdateIndividualOnboardingMutation";
import { graphql } from "../../utils/gql";
import { locale, t } from "../../utils/i18n";
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

export const IndividualDetailsOnboardingInfoFragment = graphql(`
  fragment IndividualDetailsOnboardingInfo on OnboardingInfo {
    accountCountry
  }
`);

export const IndividualDetailsAccountHolderInfoFragment = graphql(`
  fragment IndividualDetailsAccountHolderInfo on OnboardingIndividualAccountHolderInfo {
    employmentStatus
    monthlyIncome
    taxIdentificationNumber
    residencyAddress {
      country
    }
  }
`);

type Props = {
  onboardingId: string;

  onboardingInfoData: FragmentOf<typeof IndividualDetailsOnboardingInfoFragment>;
  accountHolderInfoData: FragmentOf<typeof IndividualDetailsAccountHolderInfoFragment>;

  serverValidationErrors: {
    fieldName: DetailsFieldName;
    code: ServerInvalidFieldCode;
  }[];

  onPressPrevious: () => void;
  onSave: () => void;
};

export const OnboardingIndividualDetails = ({
  onboardingId,

  onboardingInfoData,
  accountHolderInfoData,

  serverValidationErrors,

  onPressPrevious,
  onSave,
}: Props) => {
  const onboardingInfo = readFragment(IndividualDetailsOnboardingInfoFragment, onboardingInfoData);
  const accountHolderInfo = readFragment(
    IndividualDetailsAccountHolderInfoFragment,
    accountHolderInfoData,
  );

  const [updateOnboarding, updateResult] = useMutation(UpdateIndividualOnboardingMutation);

  const isFirstMount = useFirstMountState();

  const canSetTaxIdentification = match({
    accountCountry: onboardingInfo.accountCountry,
    residencyCountry: accountHolderInfo.residencyAddress?.country,
  })
    .with(
      { accountCountry: "DEU", residencyCountry: "DEU" },
      { accountCountry: "ESP", residencyCountry: "ESP" },
      { accountCountry: "ITA", residencyCountry: "ITA" },
      () => true,
    )
    .otherwise(() => false);

  const isTaxIdentificationRequired = match({
    accountCountry: onboardingInfo.accountCountry,
    residencyCountry: accountHolderInfo.residencyAddress?.country,
  })
    .with({ accountCountry: "ITA", country: "ITA" }, () => true)
    .otherwise(() => false);

  const { Field, submitForm, setFieldError } = useForm({
    employmentStatus: {
      initialValue: accountHolderInfo.employmentStatus,
    },
    monthlyIncome: {
      initialValue: accountHolderInfo.monthlyIncome,
    },
    taxIdentificationNumber: {
      initialValue: accountHolderInfo.taxIdentificationNumber ?? "",
      sanitize: trim,
      validate: canSetTaxIdentification
        ? combineValidators(
            isTaxIdentificationRequired && validateRequired,
            onboardingInfo.accountCountry != null &&
              validateIndividualTaxNumber(onboardingInfo.accountCountry),
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
          .tapOk(onSave)
          .tapError(error => {
            showToast({ variant: "error", error, ...getUpdateOnboardingError(error) });
          });
      },
    });
  };

  const accountCountry = onboardingInfo.accountCountry;

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
                  onboardingInfo.accountCountry === "DEU" &&
                  accountHolderInfo.residencyAddress?.country === "DEU" ? (
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

                {canSetTaxIdentification && accountCountry != null ? (
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
                ) : null}
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
