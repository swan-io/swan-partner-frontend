import { Option } from "@swan-io/boxed";
import { useMutation } from "@swan-io/graphql-client";
import { Box } from "@swan-io/lake/src/components/Box";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeSelect } from "@swan-io/lake/src/components/LakeSelect";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { breakpoints, colors, spacings } from "@swan-io/lake/src/constants/design";
import { useBoolean } from "@swan-io/lake/src/hooks/useBoolean";
import { deriveUnion } from "@swan-io/lake/src/utils/function";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { showToast } from "@swan-io/shared-business/src/state/toasts";
import { translateError } from "@swan-io/shared-business/src/utils/i18n";
import { useForm } from "@swan-io/use-form";
import { ReactNode, useState } from "react";
import { match } from "ts-pattern";
import { OnboardingStepContent } from "../../../../onboarding/src/components/OnboardingStepContent";
import { StepTitle } from "../../../../onboarding/src/components/StepTitle";
import {
  EmploymentStatus,
  IndividualRenewalInfoFragment,
  MonthlyIncome,
  UpdateIndividualVerificationRenewalDocument,
} from "../../graphql/partner";
import { t } from "../../utils/i18n";
import { Router } from "../../utils/routes";
import { validateRequired } from "../../utils/validations";

type Form = {
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2: string;
  postalCode: string;
  city: string;
  monthlyIncome: MonthlyIncome;
  employmentStatus: EmploymentStatus;
};

type Props = {
  verificationRenewalId: string;
  info: IndividualRenewalInfoFragment;
};

type EditableFieldProps<T> = {
  label: string;
  value: T;
  onSubmitField: () => void;
  onCancel: () => void;
  renderEditing: () => ReactNode;
};

const EditableField = <T extends string>({
  label,
  value,
  onSubmitField,
  onCancel,
  renderEditing,
}: EditableFieldProps<T>) => {
  const [editing, setEditing] = useBoolean(false);

  return (
    <Box direction="row">
      <LakeLabel
        type="view"
        label={label}
        render={() =>
          editing ? (
            renderEditing()
          ) : (
            <LakeText color={colors.gray[900]} style={{ height: spacings[40] }}>
              {value}
            </LakeText>
          )
        }
        style={{ flexGrow: 1, paddingBottom: 0 }}
      />
      <Space width={8} />

      {editing ? (
        <Box direction="row" alignItems="end" style={{ paddingBottom: spacings[24] }}>
          <LakeButton
            ariaLabel={t("verificationRenewal.ariaLabel.validate")}
            size="small"
            color="partner"
            icon="checkmark-filled"
            onPress={() => {
              onSubmitField();
              setEditing.off();
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
              onCancel();
              setEditing.off();
            }}
          />
        </Box>
      ) : (
        <Box alignItems="center" justifyContent="end">
          <LakeButton
            mode="tertiary"
            ariaLabel={t("verificationRenewal.ariaLabel.edit")}
            size="small"
            color="partner"
            icon="edit-regular"
            onPress={setEditing.on}
          />
        </Box>
      )}
    </Box>
  );
};

const translateMonthlyIncome = (monthlyIncome: MonthlyIncome) =>
  match(monthlyIncome)
    .with("Between1500And3000", () => t("verificationRenewal.monthlyIncome.Between1500And3000"))
    .with("Between3000And4500", () => t("verificationRenewal.monthlyIncome.Between3000And4500"))
    .with("Between500And1500", () => t("verificationRenewal.monthlyIncome.Between500And1500"))
    .with("LessThan500", () => t("verificationRenewal.monthlyIncome.LessThan500"))
    .with("MoreThan4500", () => t("verificationRenewal.monthlyIncome.MoreThan4500"))
    .exhaustive();

const monthlyIncomeItems = deriveUnion<MonthlyIncome>({
  Between1500And3000: true,
  Between3000And4500: true,
  Between500And1500: true,
  LessThan500: true,
  MoreThan4500: true,
}).array.map(value => ({ name: translateMonthlyIncome(value), value }));

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

const employmentStatusItems = deriveUnion<EmploymentStatus>({
  Craftsman: true,
  Employee: true,
  Entrepreneur: true,
  Farmer: true,
  Manager: true,
  Practitioner: true,
  Retiree: true,
  ShopOwner: true,
  Student: true,
  Unemployed: true,
}).array.map(value => ({ name: translateEmploymentStatus(value), value }));

export const VerificationRenewalPersonalInfo = ({ verificationRenewalId, info }: Props) => {
  const { Field, submitForm, getFieldValue, setFieldValue } = useForm<Form>({
    firstName: {
      initialValue: info.accountAdmin.firstName,
      sanitize: value => value.trim(),
      validate: validateRequired,
    },
    lastName: {
      initialValue: info.accountAdmin.lastName,
      sanitize: value => value.trim(),
      validate: validateRequired,
    },
    addressLine1: {
      initialValue: info.accountAdmin.residencyAddress.addressLine1 ?? "",
      validate: validateRequired,
      sanitize: value => value.trim(),
    },
    addressLine2: {
      initialValue: info.accountAdmin.residencyAddress.addressLine2 ?? "",
      validate: validateRequired,
      sanitize: value => value.trim(),
    },
    postalCode: {
      initialValue: info.accountAdmin.residencyAddress.postalCode ?? "",
      validate: validateRequired,
      sanitize: value => value.trim(),
    },
    city: {
      initialValue: info.accountAdmin.residencyAddress.city ?? "",
      validate: validateRequired,
      sanitize: value => value.trim(),
    },
    monthlyIncome: {
      initialValue: info.accountAdmin.monthlyIncome,
      validate: validateRequired,
    },
    employmentStatus: {
      initialValue: info.accountAdmin.employmentStatus,
      validate: validateRequired,
    },
  });

  const [updateIndividualVerificationRenewal, updatingIndividualVerificationRenewal] = useMutation(
    UpdateIndividualVerificationRenewalDocument,
  );

  const [savedValues, setSaveValues] = useState<Form>({
    firstName: info.accountAdmin.firstName,
    lastName: info.accountAdmin.lastName,
    addressLine1: info.accountAdmin.residencyAddress.addressLine1 ?? "",
    addressLine2: info.accountAdmin.residencyAddress.addressLine2 ?? "",
    postalCode: info.accountAdmin.residencyAddress.postalCode ?? "",
    city: info.accountAdmin.residencyAddress.city ?? "",
    monthlyIncome: info.accountAdmin.monthlyIncome ?? "",
    employmentStatus: info.accountAdmin.employmentStatus,
  });

  const onPressSubmit = () => {
    submitForm({
      onSuccess: () => {
        const {
          firstName,
          lastName,
          addressLine1,
          addressLine2,
          city,
          monthlyIncome,
          employmentStatus,
          postalCode,
        } = savedValues;

        return match(info)
          .with({ __typename: "IndividualVerificationRenewalInfo" }, () =>
            updateIndividualVerificationRenewal({
              input: {
                verificationRenewalId: verificationRenewalId,
                accountAdmin: {
                  firstName,
                  lastName,
                  employmentStatus,
                  residencyAddress: {
                    addressLine1,
                    addressLine2,
                    postalCode,
                    city,
                  },
                  monthlyIncome,
                },
              },
            })
              .mapOk(data => data.updateIndividualVerificationRenewal)
              .mapOkToResult(data => Option.fromNullable(data).toResult(data))
              .mapOkToResult(filterRejectionsToResult)
              .tapOk(() => {
                Router.push("VerificationRenewalDocuments", {
                  verificationRenewalId: verificationRenewalId,
                });
              })
              .tapError(error => {
                showToast({ variant: "error", error, title: translateError(error) });
              }),
          )
          .exhaustive();
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
                companyName: "TODO",
              })}
            </LakeText>
            <Space height={40} />

            <Tile>
              <EditableField
                label={t("verificationRenewal.personalInformation.firstName")}
                value={savedValues.firstName}
                onCancel={() => {
                  setFieldValue("firstName", savedValues.firstName);
                }}
                onSubmitField={() => {
                  const value = getFieldValue("firstName");
                  setSaveValues({ ...savedValues, firstName: value });
                }}
                renderEditing={() => (
                  <Field name="firstName">
                    {({ value, onChange, onBlur, ref }) => {
                      return (
                        <LakeTextInput
                          ref={ref}
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                        />
                      );
                    }}
                  </Field>
                )}
              />

              <Space height={12} />
              <EditableField
                label={t("verificationRenewal.personalInformation.lastName")}
                value={savedValues.lastName}
                onCancel={() => {
                  setFieldValue("lastName", savedValues.lastName);
                }}
                onSubmitField={() => {
                  const value = getFieldValue("lastName");
                  setSaveValues({ ...savedValues, lastName: value });
                }}
                renderEditing={() => (
                  <Field name="lastName">
                    {({ value, onChange, onBlur, ref }) => {
                      return (
                        <LakeTextInput
                          ref={ref}
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                        />
                      );
                    }}
                  </Field>
                )}
              />

              <Space height={12} />
              <EditableField
                label={t("verificationRenewal.personalInformation.addressLine1")}
                value={savedValues.addressLine1}
                onCancel={() => {
                  setFieldValue("addressLine1", savedValues.addressLine1);
                }}
                onSubmitField={() => {
                  const value = getFieldValue("addressLine1");
                  setSaveValues({ ...savedValues, lastName: value });
                }}
                renderEditing={() => (
                  <Field name="addressLine1">
                    {({ value, onChange, onBlur, ref }) => {
                      return (
                        <LakeTextInput
                          ref={ref}
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                        />
                      );
                    }}
                  </Field>
                )}
              />

              <Space height={12} />
              <EditableField
                label={t("verificationRenewal.personalInformation.addressLine2")}
                value={savedValues.addressLine2}
                onCancel={() => {
                  setFieldValue("addressLine2", savedValues.addressLine2);
                }}
                onSubmitField={() => {
                  const value = getFieldValue("addressLine2");
                  setSaveValues({ ...savedValues, lastName: value });
                }}
                renderEditing={() => (
                  <Field name="addressLine2">
                    {({ value, onChange, onBlur, ref }) => {
                      return (
                        <LakeTextInput
                          ref={ref}
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                        />
                      );
                    }}
                  </Field>
                )}
              />

              <Space height={12} />
              <EditableField
                label={t("verificationRenewal.personalInformation.postalCode")}
                value={savedValues.postalCode}
                onCancel={() => {
                  setFieldValue("postalCode", savedValues.postalCode);
                }}
                onSubmitField={() => {
                  const value = getFieldValue("postalCode");
                  setSaveValues({ ...savedValues, lastName: value });
                }}
                renderEditing={() => (
                  <Field name="postalCode">
                    {({ value, onChange, onBlur, ref }) => {
                      return (
                        <LakeTextInput
                          ref={ref}
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                        />
                      );
                    }}
                  </Field>
                )}
              />

              <Space height={12} />
              <EditableField
                label={t("verificationRenewal.personalInformation.city")}
                value={savedValues.city}
                onCancel={() => {
                  setFieldValue("city", savedValues.city);
                }}
                onSubmitField={() => {
                  const value = getFieldValue("city");
                  setSaveValues({ ...savedValues, lastName: value });
                }}
                renderEditing={() => (
                  <Field name="city">
                    {({ value, onChange, onBlur, ref }) => {
                      return (
                        <LakeTextInput
                          ref={ref}
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                        />
                      );
                    }}
                  </Field>
                )}
              />

              <Space height={12} />
              <EditableField
                label={t("verificationRenewal.personalInformation.monthlyIncome")}
                value={translateMonthlyIncome(savedValues.monthlyIncome)}
                onCancel={() => {
                  setFieldValue("monthlyIncome", savedValues.monthlyIncome);
                }}
                onSubmitField={() => {
                  const value = getFieldValue("monthlyIncome");
                  setSaveValues({ ...savedValues, monthlyIncome: value });
                }}
                renderEditing={() => (
                  <Field name="monthlyIncome">
                    {({ value, onChange, ref }) => {
                      return (
                        <LakeSelect
                          ref={ref}
                          value={value}
                          items={monthlyIncomeItems}
                          onValueChange={onChange}
                        />
                      );
                    }}
                  </Field>
                )}
              />

              <Space height={12} />
              <EditableField
                label={t("verificationRenewal.personalInformation.employmentStatus")}
                value={translateEmploymentStatus(savedValues.employmentStatus)}
                onCancel={() => {
                  setFieldValue("employmentStatus", savedValues.employmentStatus);
                }}
                onSubmitField={() => {
                  const value = getFieldValue("employmentStatus");
                  setSaveValues({ ...savedValues, employmentStatus: value });
                }}
                renderEditing={() => (
                  <Field name="employmentStatus">
                    {({ value, onChange, ref }) => {
                      return (
                        <LakeSelect
                          ref={ref}
                          value={value}
                          items={employmentStatusItems}
                          onValueChange={onChange}
                        />
                      );
                    }}
                  </Field>
                )}
              />
            </Tile>

            <Space height={40} />
            <LakeButtonGroup>
              <LakeButton
                mode="secondary"
                onPress={() =>
                  Router.push("VerificationRenewalRoot", {
                    verificationRenewalId: verificationRenewalId,
                  })
                }
              >
                {t("verificationRenewal.cancel")}
              </LakeButton>

              <LakeButton
                onPress={onPressSubmit}
                color="current"
                loading={updatingIndividualVerificationRenewal.isLoading()}
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
