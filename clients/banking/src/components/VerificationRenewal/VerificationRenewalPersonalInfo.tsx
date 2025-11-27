import { Option } from "@swan-io/boxed";
import { useMutation } from "@swan-io/graphql-client";
import { Box } from "@swan-io/lake/src/components/Box";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeScrollView } from "@swan-io/lake/src/components/LakeScrollView";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { breakpoints, colors } from "@swan-io/lake/src/constants/design";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { showToast } from "@swan-io/shared-business/src/state/toasts";
import { translateError } from "@swan-io/shared-business/src/utils/i18n";
import { useForm } from "@swan-io/use-form";
import { useState } from "react";
import { match } from "ts-pattern";
import { OnboardingStepContent } from "../../../../onboarding/src/components/OnboardingStepContent";
import { StepTitle } from "../../../../onboarding/src/components/StepTitle";
import {
  EmploymentStatus,
  GetVerificationRenewalQuery,
  MonthlyIncome,
  UpdateCompanyVerificationRenewalDocument,
  UpdateIndividualVerificationRenewalDocument,
} from "../../graphql/partner";
import { t } from "../../utils/i18n";
import { Router } from "../../utils/routes";

type Step = {
  firstName: "View" | "Edit";
  lastName: "View" | "Edit";
  address: "View" | "Edit";
  monthlyIncomes: "View" | "Edit";
  occupation: "View" | "Edit";
};

type Form = {
  firstName: string;
  lastName: string;
  address: {
    addressLine1: string;
    addressLine2: string;
    postalCode: string;
    city: string;
  };
  monthlyIncomes: string;
  occupation: string;
};
type Props = {
  verificationRenewal: NonNullable<GetVerificationRenewalQuery["verificationRenewal"]>;
  projectInfo: NonNullable<GetVerificationRenewalQuery["projectInfo"]>;
};

const translateMonthlyIncome = (monthlyIncome: MonthlyIncome) =>
  match(monthlyIncome)
    .with("Between1500And3000", () => t("verificationRenewal.monthlyIncome.Between1500And3000"))
    .with("Between3000And4500", () => t("verificationRenewal.monthlyIncome.Between3000And4500"))
    .with("Between500And1500", () => t("verificationRenewal.monthlyIncome.Between500And1500"))
    .with("LessThan500", () => t("verificationRenewal.monthlyIncome.LessThan500"))
    .with("MoreThan4500", () => t("verificationRenewal.monthlyIncome.MoreThan4500"))

    .exhaustive();

const translateEmploymentStatus = (employmentStatus: EmploymentStatus) =>
  match(employmentStatus)
    .with("Craftsman", () => t("verificationRenewal.monthlyIncome.Craftsman"))
    .with("Employee", () => t("verificationRenewal.monthlyIncome.Employee"))
    .with("Entrepreneur", () => t("verificationRenewal.monthlyIncome.Entrepreneur"))
    .with("Farmer", () => t("verificationRenewal.monthlyIncome.Farmer"))
    .with("Manager", () => t("verificationRenewal.monthlyIncome.Manager"))
    .with("Practitioner", () => t("verificationRenewal.monthlyIncome.Practitioner"))
    .with("Retiree", () => t("verificationRenewal.monthlyIncome.Retiree"))
    .with("ShopOwner", () => t("verificationRenewal.monthlyIncome.ShopOwner"))
    .with("Student", () => t("verificationRenewal.monthlyIncome.Student"))
    .with("Unemployed", () => t("verificationRenewal.monthlyIncome.Unemployed"))
    .exhaustive();

export const VerificationRenewalPersonalInfo = ({ verificationRenewal, projectInfo }: Props) => {
  const dataToDisplay = match(verificationRenewal.info)
    .with(
      { __typename: "IndividualVerificationRenewalInfo" },
      ({
        accountAdmin: { residencyAddress, monthlyIncome, employmentStatus, firstName, lastName },
      }) => ({
        residencyAddress,
        monthlyIncome,
        employmentStatus,
        firstName,
        lastName,
      }),
    )
    .with(
      { __typename: "CompanyVerificationRenewalInfo" },
      ({ accountAdmin: { birthInfo, email, firstName, lastName } }) => ({
        birthInfo,
        email,
        firstName,
        lastName,
      }),
    )
    .exhaustive();

  const { Field, submitForm } = useForm<Form>({
    firstName: {
      initialValue: dataToDisplay.firstName,
      strategy: "onBlur",
      sanitize: value => value.trim(),
      // validate: combineValidators(validateRequired, validateFirstName),
    },
    lastName: {
      initialValue: dataToDisplay.lastName,
      strategy: "onBlur",
      sanitize: value => value.trim(),
      // validate: combineValidators(validateRequired, validateFirstName),
    },
    address: {
      initialValue: {
        addressLine1: dataToDisplay.residencyAddress.addressLine1,
        addressLine2: dataToDisplay.residencyAddress.addressLine2,
        postalCode: dataToDisplay.residencyAddress.postalCode,
        city: dataToDisplay.residencyAddress.city,
      },
      strategy: "onBlur",
      // sanitize: value => value.trim(),
    },
    monthlyIncomes: {
      initialValue: dataToDisplay.monthlyIncome,
      strategy: "onBlur",
      sanitize: value => value.trim(),
    },
    occupation: {
      initialValue: dataToDisplay.occupation,
      strategy: "onBlur",
      sanitize: value => value.trim(),
    },
  });

  const [updateIndividualVerificationRenewal, updatingIndividualVerificationRenewal] = useMutation(
    UpdateIndividualVerificationRenewalDocument,
  );

  const [updateCompanyVerificationRenewal, updatingCompanyVerificationRenewal] = useMutation(
    UpdateCompanyVerificationRenewalDocument,
  );

  const [step, setStep] = useState<Step>({
    firstName: "View",
    lastName: "View",
    address: "View",
    monthlyIncomes: "View",
    occupation: "View",
  });

  const onPressSubmit = () => {
    submitForm({
      onSuccess: values => {
        const option = Option.allFromDict(values);

        if (option.isSome()) {
          const { firstName, lastName } = option.get();

          return match(verificationRenewal.info)
            .with({ __typename: "IndividualVerificationRenewalInfo" }, () =>
              updateIndividualVerificationRenewal({
                input: {
                  verificationRenewalId: verificationRenewal.id,
                  accountAdmin: {
                    firstName,
                    lastName,
                  },
                },
              })
                .mapOk(data => data.updateIndividualVerificationRenewal)
                .mapOkToResult(data => Option.fromNullable(data).toResult(data))
                .mapOkToResult(filterRejectionsToResult)
                .tapOk(() => {
                  Router.push("VerificationRenewalPersonalInformation", {
                    verificationRenewalId: verificationRenewal.id,
                  });
                  // reload();
                })
                .tapError(error => {
                  showToast({ variant: "error", error, title: translateError(error) });
                }),
            )
            .with({ __typename: "CompanyVerificationRenewalInfo" }, () =>
              updateCompanyVerificationRenewal({
                input: {
                  verificationRenewalId: verificationRenewal.id,
                  accountAdmin: {
                    firstName,
                    lastName,
                  },
                },
              })
                .mapOk(data => data.updateCompanyVerificationRenewal)
                .mapOkToResult(data => Option.fromNullable(data).toResult(data))
                .mapOkToResult(filterRejectionsToResult)
                .tapOk(() => {
                  Router.push("VerificationRenewalPersonalInformation", {
                    verificationRenewalId: verificationRenewal.id,
                  });
                  // reload();
                })
                .tapError(error => {
                  showToast({ variant: "error", error, title: translateError(error) });
                }),
            )
            .exhaustive();
        }
      },
    });
  };

  return (
    <LakeScrollView contentContainerStyle={{ flex: 1 }} style={{ flex: 1, ...commonStyles.fill }}>
      <OnboardingStepContent>
        <ResponsiveContainer breakpoint={breakpoints.medium}>
          {({ small }) => (
            <>
              <StepTitle isMobile={small}>
                {t("verificationRenewal.personalInformation.title")}
              </StepTitle>
              <Space height={4} />
              <LakeText>
                {t("verificationRenewal.personalInformation.subtitle", {
                  companyName: projectInfo.name,
                })}
              </LakeText>
              <Space height={40} />

              {match(verificationRenewal?.info)
                .with(
                  { __typename: "IndividualVerificationRenewalInfo" },
                  ({
                    accountAdmin: {
                      residencyAddress,
                      monthlyIncome,
                      employmentStatus,
                      firstName,
                      lastName,
                    },
                  }) => (
                    <Tile>
                      {step.firstName === "View" ? (
                        <LakeLabel
                          type="view"
                          label={t("verificationRenewal.personalInformation.firstName")}
                          actions={
                            <LakeButton
                              size="small"
                              mode="tertiary"
                              icon="edit-regular"
                              ariaLabel={t("common.edit")}
                              onPress={() => setStep({ ...step, firstName: "Edit" })}
                            />
                          }
                          render={() => <LakeText color={colors.gray[900]}>{firstName}</LakeText>}
                        />
                      ) : (
                        <Field name="firstName">
                          {({ value, onChange, ref }) => (
                            <LakeLabel
                              type="view"
                              label={t("verificationRenewal.personalInformation.firstName")}
                              render={() => (
                                <Box direction="row">
                                  <LakeTextInput value={value} onChangeText={onChange} ref={ref} />
                                  <Space width={8} />
                                  <LakeButton
                                    ariaLabel={t("verificationRenewal.ariaLabel.validate")}
                                    loading={updatingIndividualVerificationRenewal.isLoading()}
                                    size="small"
                                    color="partner"
                                    icon="checkmark-filled"
                                    onPress={onPressSubmit}
                                  />

                                  <Space width={8} />
                                  <LakeButton
                                    mode="secondary"
                                    ariaLabel={t("verificationRenewal.ariaLabel.cancel")}
                                    loading={updatingIndividualVerificationRenewal.isLoading()}
                                    size="small"
                                    color="partner"
                                    icon="dismiss-filled"
                                    onPress={() => {
                                      setStep({ ...step, firstName: "View" });
                                    }}
                                  />
                                </Box>
                              )}
                            />
                          )}
                        </Field>
                      )}

                      <Space height={24} />
                      {step.lastName === "View" ? (
                        <LakeLabel
                          type="view"
                          label={t("verificationRenewal.personalInformation.lastName")}
                          actions={
                            <LakeButton
                              size="small"
                              mode="tertiary"
                              icon="edit-regular"
                              ariaLabel={t("common.edit")}
                              onPress={() => setStep({ ...step, lastName: "Edit" })}
                            />
                          }
                          render={() => <LakeText color={colors.gray[900]}>{lastName}</LakeText>}
                        />
                      ) : (
                        <Field name="lastName">
                          {({ value, onChange, ref }) => (
                            <LakeLabel
                              type="view"
                              label={t("verificationRenewal.personalInformation.lastName")}
                              render={() => (
                                <Box direction="row">
                                  <LakeTextInput value={value} onChangeText={onChange} ref={ref} />
                                  <Space width={8} />
                                  <LakeButton
                                    ariaLabel={t("verificationRenewal.ariaLabel.validate")}
                                    loading={updatingIndividualVerificationRenewal.isLoading()}
                                    size="small"
                                    color="partner"
                                    icon="checkmark-filled"
                                    onPress={onPressSubmit}
                                  />

                                  <Space width={8} />
                                  <LakeButton
                                    mode="secondary"
                                    ariaLabel={t("verificationRenewal.ariaLabel.cancel")}
                                    loading={updatingIndividualVerificationRenewal.isLoading()}
                                    size="small"
                                    color="partner"
                                    icon="dismiss-filled"
                                    onPress={() => setStep({ ...step, lastName: "View" })}
                                  />
                                </Box>
                              )}
                            />
                          )}
                        </Field>
                      )}

                      <Space height={24} />

                      {step.address === "View" ? (
                        <LakeLabel
                          color="current"
                          label={t("verificationRenewal.personalInformation.address")}
                          actions={
                            <LakeButton
                              size="small"
                              mode="tertiary"
                              icon="edit-regular"
                              ariaLabel={t("common.edit")}
                              onPress={() => setStep({ ...step, address: "Edit" })}
                            />
                          }
                          render={() => (
                            <Box>
                              <LakeText color={colors.gray[900]}>
                                {residencyAddress.addressLine1}
                              </LakeText>
                              <LakeText color={colors.gray[900]}>
                                {residencyAddress.addressLine2}
                              </LakeText>
                              <LakeText color={colors.gray[900]}>
                                {`${residencyAddress.postalCode} ${residencyAddress.city}`}
                              </LakeText>
                            </Box>
                          )}
                        />
                      ) : (
                        <Field name="address">
                          {({ value, onChange, ref }) => (
                            <LakeLabel
                              type="view"
                              label={t("verificationRenewal.personalInformation.firstName")}
                              render={() => (
                                <Box direction="row">
                                  <LakeTextInput value={value} onChangeText={onChange} ref={ref} />
                                  <Space width={8} />
                                  <LakeButton
                                    ariaLabel={t("verificationRenewal.ariaLabel.validate")}
                                    loading={updatingIndividualVerificationRenewal.isLoading()}
                                    size="small"
                                    color="partner"
                                    icon="checkmark-filled"
                                    onPress={onPressSubmit}
                                  />

                                  <Space width={8} />
                                  <LakeButton
                                    mode="secondary"
                                    ariaLabel={t("verificationRenewal.ariaLabel.cancel")}
                                    loading={updatingIndividualVerificationRenewal.isLoading()}
                                    size="small"
                                    color="partner"
                                    icon="dismiss-filled"
                                    onPress={() => {
                                      setStep({ ...step, address: "View" });
                                    }}
                                  />
                                </Box>
                              )}
                            />
                          )}
                        </Field>
                      )}

                      <Space height={24} />
                      {step.monthlyIncomes === "View" ? (
                        <LakeLabel
                          color="current"
                          label={t("verificationRenewal.personalInformation.monthlyIncomes")}
                          actions={
                            <LakeButton
                              size="small"
                              mode="tertiary"
                              icon="edit-regular"
                              ariaLabel={t("common.edit")}
                              onPress={() => setStep({ ...step, monthlyIncomes: "Edit" })}
                            />
                          }
                          render={() => (
                            <LakeText color={colors.gray[900]}>
                              {translateMonthlyIncome(monthlyIncome)}
                            </LakeText>
                          )}
                        />
                      ) : (
                        <Field name="monthlyIncomes">
                          {({ value, onChange, ref }) => (
                            <LakeLabel
                              type="view"
                              label={t("verificationRenewal.personalInformation.firstName")}
                              render={() => (
                                <Box direction="row">
                                  <LakeTextInput value={value} onChangeText={onChange} ref={ref} />
                                  <Space width={8} />
                                  <LakeButton
                                    ariaLabel={t("verificationRenewal.ariaLabel.validate")}
                                    loading={updatingIndividualVerificationRenewal.isLoading()}
                                    size="small"
                                    color="partner"
                                    icon="checkmark-filled"
                                    onPress={onPressSubmit}
                                  />

                                  <Space width={8} />
                                  <LakeButton
                                    mode="secondary"
                                    ariaLabel={t("verificationRenewal.ariaLabel.cancel")}
                                    loading={updatingIndividualVerificationRenewal.isLoading()}
                                    size="small"
                                    color="partner"
                                    icon="dismiss-filled"
                                    onPress={() => {
                                      setStep({ ...step, monthlyIncomes: "View" });
                                    }}
                                  />
                                </Box>
                              )}
                            />
                          )}
                        </Field>
                      )}

                      <Space height={24} />
                      {step.occupation === "View" ? (
                        <LakeLabel
                          color="current"
                          label={t("verificationRenewal.personalInformation.occupation")}
                          actions={
                            <LakeButton
                              size="small"
                              mode="tertiary"
                              icon="edit-regular"
                              ariaLabel={t("common.edit")}
                              onPress={() => setStep({ ...step, occupation: "Edit" })}
                            />
                          }
                          render={() => (
                            <LakeText color={colors.gray[900]}>
                              {translateEmploymentStatus(employmentStatus)}
                            </LakeText>
                          )}
                        />
                      ) : (
                        <Field name="occupation">
                          {({ value, onChange, ref }) => (
                            <LakeLabel
                              type="view"
                              label={t("verificationRenewal.personalInformation.occupation")}
                              render={() => (
                                <Box direction="row">
                                  <LakeTextInput value={value} onChangeText={onChange} ref={ref} />
                                  <Space width={8} />
                                  <LakeButton
                                    ariaLabel={t("verificationRenewal.ariaLabel.validate")}
                                    loading={updatingIndividualVerificationRenewal.isLoading()}
                                    size="small"
                                    color="partner"
                                    icon="checkmark-filled"
                                    onPress={onPressSubmit}
                                  />

                                  <Space width={8} />
                                  <LakeButton
                                    mode="secondary"
                                    ariaLabel={t("verificationRenewal.ariaLabel.cancel")}
                                    loading={updatingIndividualVerificationRenewal.isLoading()}
                                    size="small"
                                    color="partner"
                                    icon="dismiss-filled"
                                    onPress={() => {
                                      setStep({ ...step, occupation: "View" });
                                    }}
                                  />
                                </Box>
                              )}
                            />
                          )}
                        </Field>
                      )}
                    </Tile>
                  ),
                )
                .with({ __typename: "CompanyVerificationRenewalInfo" }, () => null)

                .otherwise(() => null)}

              <Space height={40} />

              <LakeButtonGroup>
                <LakeButton
                  mode="secondary"
                  onPress={() =>
                    Router.push("VerificationRenewalRoot", {
                      verificationRenewalId: verificationRenewal.id,
                    })
                  }
                >
                  {t("verificationRenewal.cancel")}
                </LakeButton>

                <LakeButton
                  onPress={() =>
                    Router.push("VerificationRenewalDocuments", {
                      verificationRenewalId: verificationRenewal.id,
                    })
                  }
                  color="current"
                >
                  {t("verificationRenewal.confirm")}
                </LakeButton>
              </LakeButtonGroup>
            </>
          )}
        </ResponsiveContainer>
      </OnboardingStepContent>
    </LakeScrollView>
  );
};
