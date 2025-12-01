import { Option } from "@swan-io/boxed";
import { useMutation } from "@swan-io/graphql-client";
import { Box } from "@swan-io/lake/src/components/Box";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { breakpoints, colors } from "@swan-io/lake/src/constants/design";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { showToast } from "@swan-io/shared-business/src/state/toasts";
import { translateError } from "@swan-io/shared-business/src/utils/i18n";
import { useForm } from "@swan-io/use-form";
import { useState } from "react";
import { TextInput } from "react-native";
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
  firstName: { state: "View" | "Edit"; value: string };
  lastName: { state: "View" | "Edit"; value: string };
  addressLine1: { state: "View" | "Edit"; value: string };
  addressLine2: { state: "View" | "Edit"; value: string };
  postalCode: { state: "View" | "Edit"; value: string };
  city: { state: "View" | "Edit"; value: string };
  monthlyIncomes: { state: "View" | "Edit"; value: string };
  occupation: { state: "View" | "Edit"; value: string };
};

type Form = {
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2: string;
  postalCode: string;
  city: string;
  monthlyIncomes: string;
  occupation: string;
};
type Props = {
  verificationRenewal: NonNullable<GetVerificationRenewalQuery["verificationRenewal"]>;
  projectInfo: NonNullable<GetVerificationRenewalQuery["projectInfo"]>;
};

type FieldViewProps = {
  label: string;
  onPress: () => void;
  text: string;
};
const FieldView = ({ label, onPress, text }: FieldViewProps) => (
  <LakeLabel
    type="view"
    label={label}
    actions={
      <LakeButton
        size="small"
        mode="tertiary"
        icon="edit-regular"
        ariaLabel={t("common.edit")}
        onPress={onPress}
      />
    }
    render={() => <LakeText color={colors.gray[900]}>{text}</LakeText>}
  />
);

type FieldEditProps = {
  value: string;
  onChange: (value: string) => void;
  ref: React.Ref<TextInput>;
  onPressValidate: () => void;
  onPressCancel: () => void;
};

const FieldEdit = ({ value, onChange, ref, onPressValidate, onPressCancel }: FieldEditProps) => (
  <LakeLabel
    type="view"
    label={t("verificationRenewal.personalInformation.firstName")}
    render={() => (
      <Box direction="row">
        <LakeTextInput value={value} onChangeText={onChange} ref={ref} />
        <Space width={8} />
        <LakeButton
          ariaLabel={t("verificationRenewal.ariaLabel.validate")}
          // loading={updatingIndividualVerificationRenewal.isLoading()}
          size="small"
          color="partner"
          icon="checkmark-filled"
          onPress={onPressValidate}
        />

        <Space width={8} />
        <LakeButton
          mode="secondary"
          ariaLabel={t("verificationRenewal.ariaLabel.cancel")}
          // loading={updatingIndividualVerificationRenewal.isLoading()}
          size="small"
          color="partner"
          icon="dismiss-filled"
          onPress={onPressCancel}
        />
      </Box>
    )}
  />
);

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
    addressLine1: {
      initialValue: dataToDisplay.residencyAddress.addressLine1,
      strategy: "onBlur",
      // sanitize: value => value.trim(),
    },
    addressLine2: {
      initialValue: dataToDisplay.residencyAddress.addressLine2,
      strategy: "onBlur",
      // sanitize: value => value.trim(),
    },
    postalCode: {
      initialValue: dataToDisplay.residencyAddress.postalCode,
      strategy: "onBlur",
      // sanitize: value => value.trim(),
    },
    city: {
      initialValue: dataToDisplay.residencyAddress.city,
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
    firstName: { state: "View", value: dataToDisplay.firstName },
    lastName: { state: "View", value: dataToDisplay.lastName },
    addressLine1: { state: "View", value: dataToDisplay.addressLine1 },
    addressLine2: { state: "View", value: dataToDisplay.addressLine2 },
    postalCode: { state: "View", value: dataToDisplay.postalCode },
    city: { state: "View", value: dataToDisplay.city },
    monthlyIncomes: { state: "View", value: dataToDisplay.monthlyIncomes },
    occupation: { state: "View", value: dataToDisplay.occupation },
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
                    {step.firstName.state === "View" ? (
                      <FieldView
                        label={t("verificationRenewal.personalInformation.firstName")}
                        onPress={() =>
                          setStep({
                            ...step,
                            firstName: { state: "Edit", value: step.firstName.value },
                          })
                        }
                        text={step.firstName.value}
                      />
                    ) : (
                      <Field name="firstName">
                        {({ value, onChange, ref }) => {
                          console.log(value);

                          return (
                            <FieldEdit
                              onChange={onChange}
                              onPressCancel={() => {
                                setStep({ ...step, firstName: { state: "View", value } });
                              }}
                              onPressValidate={() =>
                                setStep({ ...step, firstName: { state: "View", value } })
                              }
                              ref={ref}
                              value={value}
                            />
                          );
                        }}
                      </Field>
                    )}

                    <Space height={24} />
                    {step.lastName.state === "View" ? (
                      <FieldView
                        label={t("verificationRenewal.personalInformation.lastName")}
                        onPress={() =>
                          setStep({
                            ...step,
                            lastName: { state: "Edit", value: step.lastName.value },
                          })
                        }
                        text={lastName}
                      />
                    ) : (
                      <Field name="lastName">
                        {({ value, onChange, ref }) => (
                          <FieldEdit
                            onChange={onChange}
                            onPressCancel={() => {
                              setStep({ ...step, lastName: { state: "View", value } });
                            }}
                            onPressValidate={() =>
                              setStep({ ...step, lastName: { state: "View", value } })
                            }
                            ref={ref}
                            value={value}
                          />
                        )}
                      </Field>
                    )}

                    <Space height={24} />

                    {step.addressLine1.state === "View" ? (
                      <FieldView
                        label={t("verificationRenewal.personalInformation.addressLine1")}
                        onPress={() =>
                          setStep({
                            ...step,
                            addressLine1: { state: "Edit", value: step.addressLine1.value },
                          })
                        }
                        text={residencyAddress.addressLine1 ?? ""}
                      />
                    ) : (
                      <Field name="addressLine1">
                        {({ value, onChange, ref }) => (
                          <FieldEdit
                            onChange={onChange}
                            onPressCancel={() => {
                              setStep({ ...step, addressLine1: { state: "View", value } });
                            }}
                            onPressValidate={() =>
                              setStep({ ...step, addressLine1: { state: "View", value } })
                            }
                            ref={ref}
                            value={value}
                          />
                        )}
                      </Field>
                    )}

                    {step.addressLine2.state === "View" ? (
                      <FieldView
                        label={t("verificationRenewal.personalInformation.addressLine2")}
                        onPress={() =>
                          setStep({
                            ...step,
                            addressLine2: { state: "Edit", value: step.addressLine2.value },
                          })
                        }
                        text={residencyAddress.addressLine2 ?? ""}
                      />
                    ) : (
                      <Field name="addressLine2">
                        {({ value, onChange, ref }) => (
                          <FieldEdit
                            onChange={onChange}
                            onPressCancel={() => {
                              setStep({ ...step, addressLine2: { state: "View", value } });
                            }}
                            onPressValidate={() =>
                              setStep({ ...step, addressLine2: { state: "View", value } })
                            }
                            ref={ref}
                            value={value}
                          />
                        )}
                      </Field>
                    )}

                    {step.postalCode.state === "View" ? (
                      <FieldView
                        label={t("verificationRenewal.personalInformation.postalCode")}
                        onPress={() =>
                          setStep({
                            ...step,
                            addressLine2: { state: "Edit", value: step.postalCode.value },
                          })
                        }
                        text={residencyAddress.postalCode ?? ""}
                      />
                    ) : (
                      <Field name="postalCode">
                        {({ value, onChange, ref }) => (
                          <FieldEdit
                            onChange={onChange}
                            onPressCancel={() => {
                              setStep({ ...step, postalCode: { state: "View", value } });
                            }}
                            onPressValidate={() =>
                              setStep({ ...step, postalCode: { state: "View", value } })
                            }
                            ref={ref}
                            value={value}
                          />
                        )}
                      </Field>
                    )}

                    {step.city.state === "View" ? (
                      <FieldView
                        label={t("verificationRenewal.personalInformation.city")}
                        onPress={() =>
                          setStep({
                            ...step,
                            addressLine2: { state: "Edit", value: step.city.value },
                          })
                        }
                        text={residencyAddress.addressLine2 ?? ""}
                      />
                    ) : (
                      <Field name="city">
                        {({ value, onChange, ref }) => (
                          <FieldEdit
                            onChange={onChange}
                            onPressCancel={() => {
                              setStep({ ...step, city: { state: "View", value } });
                            }}
                            onPressValidate={() =>
                              setStep({ ...step, city: { state: "View", value } })
                            }
                            ref={ref}
                            value={value}
                          />
                        )}
                      </Field>
                    )}

                    <Space height={24} />
                    {step.monthlyIncomes.state === "View" ? (
                      <FieldView
                        label={t("verificationRenewal.personalInformation.monthlyIncomes")}
                        onPress={() =>
                          setStep({
                            ...step,
                            monthlyIncomes: { state: "Edit", value: step.monthlyIncomes.value },
                          })
                        }
                        text={translateMonthlyIncome(monthlyIncome)}
                      />
                    ) : (
                      <Field name="monthlyIncomes">
                        {({ value, onChange, ref }) => (
                          <FieldEdit
                            onChange={onChange}
                            onPressCancel={() => {
                              setStep({ ...step, monthlyIncomes: { state: "View", value } });
                            }}
                            onPressValidate={() =>
                              setStep({ ...step, monthlyIncomes: { state: "View", value } })
                            }
                            ref={ref}
                            value={value}
                          />
                        )}
                      </Field>
                    )}

                    <Space height={24} />
                    {step.occupation.state === "View" ? (
                      <FieldView
                        label={t("verificationRenewal.personalInformation.occupation")}
                        onPress={() =>
                          setStep({
                            ...step,
                            occupation: { state: "Edit", value: step.occupation.value },
                          })
                        }
                        text={translateEmploymentStatus(employmentStatus)}
                      />
                    ) : (
                      <Field name="occupation">
                        {({ value, onChange, ref }) => (
                          <FieldEdit
                            onChange={onChange}
                            onPressCancel={() => {
                              setStep({ ...step, occupation: { state: "View", value } });
                            }}
                            onPressValidate={() =>
                              setStep({ ...step, occupation: { state: "View", value } })
                            }
                            ref={ref}
                            value={value}
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
  );
};
