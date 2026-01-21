import { Option } from "@swan-io/boxed";
import { useMutation } from "@swan-io/graphql-client";
import { LakeSelect } from "@swan-io/lake/src/components/LakeSelect";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { breakpoints } from "@swan-io/lake/src/constants/design";
import { deriveUnion, identity } from "@swan-io/lake/src/utils/function";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { showToast } from "@swan-io/shared-business/src/state/toasts";
import { translateError } from "@swan-io/shared-business/src/utils/i18n";
import { validateRequired } from "@swan-io/shared-business/src/utils/validation";
import { useState } from "react";
import { match } from "ts-pattern";
import { OnboardingStepContent } from "../../../../onboarding/src/components/OnboardingStepContent";
import { StepTitle } from "../../../../onboarding/src/components/StepTitle";
import {
  AccountHolderType,
  CompanyRenewalInfoFragment,
  MonthlyPaymentVolume,
  UpdateCompanyVerificationRenewalDocument,
} from "../../graphql/partner";
import { t } from "../../utils/i18n";
import { Router } from "../../utils/routes";
import {
  getNextStep,
  getRenewalSteps,
  renewalSteps,
  type RenewalStep,
} from "./VerificationRenewalCompany";
import { VerificationRenewalFooter } from "./VerificationRenewalFooter";
import { EditableField } from "./VerificationRenewalPersonalInfo";

const translateMonthlyPaymentVolume = (monthlyPaymentVolume: MonthlyPaymentVolume) =>
  match(monthlyPaymentVolume)
    .with("Between10000And50000", () =>
      t("verificationRenewal.monthlyPaymentVolume.Between10000And50000"),
    )
    .with("Between50000And100000", () =>
      t("verificationRenewal.monthlyPaymentVolume.Between50000And100000"),
    )
    .with("LessThan10000", () => t("verificationRenewal.monthlyPaymentVolume.LessThan10000"))
    .with("MoreThan100000", () => t("verificationRenewal.monthlyPaymentVolume.MoreThan100000"))
    .exhaustive();

const monthlyPaymentVolumeItems = deriveUnion<MonthlyPaymentVolume>({
  Between10000And50000: true,
  Between50000And100000: true,
  LessThan10000: true,
  MoreThan100000: true,
}).array.map(value => ({ name: translateMonthlyPaymentVolume(value), value }));

type Form = {
  companyName: string;
  addressLine1: string;
  postalCode: string;
  city: string;
  country: string;
  activityDescription: string;
  monthlyPaymentVolume: MonthlyPaymentVolume;
};

type Props = {
  accountHolderType: AccountHolderType;
  verificationRenewalId: string;
  info: CompanyRenewalInfoFragment;
  previousStep: RenewalStep | undefined;
};

export const VerificationRenewalAccountHolderInformation = ({
  accountHolderType,
  verificationRenewalId,
  info,
  previousStep,
}: Props) => {
  const [updateCompanyVerificationRenewal, updatingCompanyVerificationRenewal] = useMutation(
    UpdateCompanyVerificationRenewalDocument,
  );

  const [savedValues, setSaveValues] = useState<Form>({
    companyName: info.company.name,
    addressLine1: info.company.residencyAddress.addressLine1 ?? "",
    postalCode: info.company.residencyAddress.postalCode ?? "",
    city: info.company.residencyAddress.city ?? "",
    country: info.company.residencyAddress.country ?? "",
    activityDescription: info.company.businessActivityDescription,
    monthlyPaymentVolume: info.company.monthlyPaymentVolume,
  });

  const onPressSubmit = () => {
    const {
      companyName,
      addressLine1,
      city,
      country,
      activityDescription,
      monthlyPaymentVolume,
      postalCode,
    } = savedValues;

    return updateCompanyVerificationRenewal({
      input: {
        verificationRenewalId: verificationRenewalId,
        company: {
          name: companyName,
          businessActivityDescription: activityDescription,
          monthlyPaymentVolume,
          residencyAddress: {
            addressLine1,
            city,
            postalCode,
            country,
          },
        },
      },
    })
      .mapOk(data => data.updateCompanyVerificationRenewal)
      .mapOkToResult(data => Option.fromNullable(data).toResult(data))
      .mapOkToResult(filterRejectionsToResult)
      .tapOk(data => {
        const steps = getRenewalSteps(data.verificationRenewal, accountHolderType);

        const nextStep =
          getNextStep(renewalSteps.accountHolderInformation, steps) ?? renewalSteps.finalize;

        Router.push(nextStep.id, {
          verificationRenewalId: verificationRenewalId,
        });
      })
      .tapError(error => {
        showToast({ variant: "error", error, title: translateError(error) });
      });
  };

  return (
    <OnboardingStepContent>
      <ResponsiveContainer breakpoint={breakpoints.medium}>
        {({ small }) => (
          <>
            <StepTitle isMobile={small}>
              {t("verificationRenewal.accountHolderInformation.title")}
            </StepTitle>

            <Space height={40} />

            <Tile>
              <EditableField
                label={t("verificationRenewal.companyName")}
                value={savedValues.companyName}
                validate={validateRequired}
                formatValue={identity}
                onChange={value => setSaveValues({ ...savedValues, companyName: value })}
                renderEditing={({ value, error, onChange, onBlur }) => (
                  <LakeTextInput
                    value={value}
                    error={error}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                )}
              />

              <Space height={12} />

              <EditableField
                label={t("verificationRenewal.addressLine1")}
                value={savedValues.addressLine1}
                validate={validateRequired}
                formatValue={identity}
                onChange={value => setSaveValues({ ...savedValues, addressLine1: value })}
                renderEditing={({ value, error, onChange, onBlur }) => (
                  <LakeTextInput
                    value={value}
                    error={error}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                )}
              />

              <Space height={12} />
              <EditableField
                label={t("verificationRenewal.postalCode")}
                value={savedValues.postalCode}
                validate={validateRequired}
                formatValue={identity}
                onChange={value => setSaveValues({ ...savedValues, postalCode: value })}
                renderEditing={({ value, error, onChange, onBlur }) => (
                  <LakeTextInput
                    value={value}
                    error={error}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                )}
              />

              <Space height={12} />

              <EditableField
                label={t("verificationRenewal.city")}
                value={savedValues.city}
                validate={validateRequired}
                formatValue={identity}
                onChange={value => setSaveValues({ ...savedValues, city: value })}
                renderEditing={({ value, error, onChange, onBlur }) => (
                  <LakeTextInput
                    value={value}
                    error={error}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                )}
              />

              <Space height={12} />
              <EditableField
                label={t("verificationRenewal.country")}
                value={savedValues.country}
                validate={validateRequired}
                formatValue={identity}
                onChange={value => setSaveValues({ ...savedValues, city: value })}
                renderEditing={({ value, error, onChange, onBlur }) => (
                  <LakeTextInput
                    value={value}
                    error={error}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                )}
              />

              <Space height={12} />

              <EditableField
                label={t("verificationRenewal.activityDescription")}
                value={savedValues.activityDescription}
                validate={validateRequired}
                formatValue={identity}
                onChange={value => setSaveValues({ ...savedValues, activityDescription: value })}
                renderEditing={({ value, error, onChange, onBlur }) => (
                  <LakeTextInput
                    value={value}
                    error={error}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                )}
              />

              <Space height={12} />

              <EditableField
                label={t("verificationRenewal.monthlyPaymentVolume")}
                value={savedValues.monthlyPaymentVolume}
                formatValue={translateMonthlyPaymentVolume}
                validate={validateRequired}
                onChange={value => setSaveValues({ ...savedValues, monthlyPaymentVolume: value })}
                renderEditing={({ value, onChange }) => (
                  <LakeSelect
                    value={value}
                    items={monthlyPaymentVolumeItems}
                    onValueChange={onChange}
                  />
                )}
              />
            </Tile>

            <Space height={40} />
            <VerificationRenewalFooter
              onPrevious={
                previousStep !== undefined
                  ? () =>
                      Router.push(previousStep?.id, {
                        verificationRenewalId: verificationRenewalId,
                      })
                  : undefined
              }
              onNext={onPressSubmit}
              loading={updatingCompanyVerificationRenewal.isLoading()}
            />
          </>
        )}
      </ResponsiveContainer>
    </OnboardingStepContent>
  );
};
