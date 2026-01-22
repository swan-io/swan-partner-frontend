import { Option } from "@swan-io/boxed";
import { useMutation } from "@swan-io/graphql-client";
import { Box } from "@swan-io/lake/src/components/Box";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeSelect } from "@swan-io/lake/src/components/LakeSelect";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { breakpoints, colors, spacings } from "@swan-io/lake/src/constants/design";
import { useBoolean } from "@swan-io/lake/src/hooks/useBoolean";
import { deriveUnion, identity } from "@swan-io/lake/src/utils/function";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { CountryPicker } from "@swan-io/shared-business/src/components/CountryPicker";
import {
  companyCountries,
  CountryCCA3,
  getCountryName,
} from "@swan-io/shared-business/src/constants/countries";
import { showToast } from "@swan-io/shared-business/src/state/toasts";
import { translateError } from "@swan-io/shared-business/src/utils/i18n";
import { validateRequired } from "@swan-io/shared-business/src/utils/validation";
import { useForm } from "@swan-io/use-form";
import { useState } from "react";
import { StyleSheet } from "react-native";
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
import { getRenewalSteps, RenewalStep, renewalSteps } from "../../utils/verificationRenewal";
import { getNextStep } from "./VerificationRenewalCompany";
import { VerificationRenewalFooter } from "./VerificationRenewalFooter";
import { EditableField } from "./VerificationRenewalPersonalInfo";

const styles = StyleSheet.create({
  field: { width: "100%" },
});

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

  const [editingCountry, setEditingCountry] = useBoolean(false);

  const [savedValues, setSaveValues] = useState<Form>({
    companyName: info.company.name,
    addressLine1: info.company.residencyAddress.addressLine1 ?? "",
    postalCode: info.company.residencyAddress.postalCode ?? "",
    city: info.company.residencyAddress.city ?? "",
    activityDescription: info.company.businessActivityDescription,
    monthlyPaymentVolume: info.company.monthlyPaymentVolume,
  });

  const { Field, setFieldValue, submitForm } = useForm({
    country: {
      initialValue: info.company.residencyAddress.country as CountryCCA3,
    },
  });

  const onPressSubmit = () => {
    submitForm({
      onSuccess: values => {
        const option = Option.allFromDict(values);
        if (option.isSome()) {
          const {
            companyName,
            addressLine1,
            city,
            activityDescription,
            monthlyPaymentVolume,
            postalCode,
          } = savedValues;

          const { country } = option.value;

          updateCompanyVerificationRenewal({
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
        }
      },
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
              <Box direction="row">
                <LakeLabel
                  type="view"
                  label={t("verificationRenewal.country")}
                  style={styles.field}
                  render={() => (
                    <Field name="country">
                      {({ value, onChange }) =>
                        editingCountry ? (
                          <Box direction="row">
                            <Box grow={1}>
                              <Space height={8} />
                              <CountryPicker
                                countries={companyCountries}
                                value={value}
                                onValueChange={onChange}
                              />
                            </Box>

                            <Space width={8} />
                            <Box
                              direction="row"
                              style={{
                                paddingTop: spacings[8],
                              }}
                            >
                              <LakeButton
                                ariaLabel={t("verificationRenewal.ariaLabel.validate")}
                                size="small"
                                color="partner"
                                icon="checkmark-filled"
                                onPress={() => {
                                  setEditingCountry.off();
                                  setFieldValue("country", value);
                                }}
                              />

                              <Space width={8} />
                              <LakeButton
                                mode="secondary"
                                ariaLabel={t("verificationRenewal.ariaLabel.cancel")}
                                size="small"
                                color="partner"
                                icon="dismiss-filled"
                                onPress={() => {
                                  setEditingCountry.off();
                                  setFieldValue(
                                    "country",
                                    info.company.residencyAddress.country as CountryCCA3,
                                  );
                                }}
                              />
                            </Box>
                          </Box>
                        ) : (
                          <Box direction="row">
                            <Box grow={1}>
                              <LakeText
                                color={colors.gray[900]}
                                style={{
                                  height: spacings[40],
                                  width: "100%",
                                }}
                              >
                                {getCountryName(value)}
                              </LakeText>
                            </Box>

                            <Box alignItems="center">
                              <Space height={8} />
                              <LakeButton
                                mode="tertiary"
                                ariaLabel={t("verificationRenewal.ariaLabel.edit")}
                                size="small"
                                color="partner"
                                icon="edit-regular"
                                onPress={setEditingCountry.on}
                              />
                            </Box>
                          </Box>
                        )
                      }
                    </Field>
                  )}
                />
              </Box>

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
