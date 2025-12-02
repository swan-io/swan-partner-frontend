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
import { deriveUnion, noop } from "@swan-io/lake/src/utils/function";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { showToast } from "@swan-io/shared-business/src/state/toasts";
import { translateError } from "@swan-io/shared-business/src/utils/i18n";
import { useForm, Validator } from "@swan-io/use-form";
import { ReactElement, useCallback, useState } from "react";
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
  onChange: (value: T) => void;
  formatValue?: (value: T) => string;
  validate?: Validator<T>;
  renderEditing: (props: {
    value: T;
    valid: boolean;
    error: string | undefined;
    onChange: (value: T) => void;
    onBlur: () => void;
  }) => ReactElement;
};

const EditableField = <T extends string>({
  label,
  value,
  onChange,
  formatValue,
  validate,
  renderEditing,
}: EditableFieldProps<T>) => {
  const [editing, setEditing] = useBoolean(false);
  const { Field, setFieldValue, submitForm } = useForm({
    fieldName: {
      initialValue: value,
      validate,
      sanitize: value => value.trim() as T,
    },
  });

  const onSubmit = useCallback(() => {
    submitForm({
      onSuccess: ({ fieldName }) => {
        fieldName.match({
          Some: value => {
            onChange(value);
            setEditing.off();
          },
          None: noop,
        });
      },
    });
  }, [submitForm, onChange, setEditing]);

  return (
    <Box direction="row">
      <LakeLabel
        type="view"
        label={label}
        render={() =>
          editing ? (
            <Field name="fieldName">{fieldState => renderEditing(fieldState)}</Field>
          ) : (
            <LakeText color={colors.gray[900]} style={{ height: spacings[40] }}>
              {formatValue ? formatValue(value) : value}
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
            onPress={onSubmit}
          />

          <Space width={8} />
          <LakeButton
            mode="secondary"
            ariaLabel={t("verificationRenewal.ariaLabel.cancel")}
            size="small"
            color="partner"
            icon="dismiss-filled"
            onPress={() => {
              setEditing.off();
              setFieldValue("fieldName", value);
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
                validate={validateRequired}
                onChange={value => setSaveValues({ ...savedValues, firstName: value })}
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
                label={t("verificationRenewal.personalInformation.lastName")}
                value={savedValues.lastName}
                validate={validateRequired}
                onChange={value => setSaveValues({ ...savedValues, lastName: value })}
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
                label={t("verificationRenewal.personalInformation.addressLine1")}
                value={savedValues.addressLine1}
                validate={validateRequired}
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
                label={t("verificationRenewal.personalInformation.addressLine2")}
                value={savedValues.addressLine2}
                validate={validateRequired}
                onChange={value => setSaveValues({ ...savedValues, addressLine2: value })}
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
                label={t("verificationRenewal.personalInformation.postalCode")}
                value={savedValues.postalCode}
                validate={validateRequired}
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
                label={t("verificationRenewal.personalInformation.city")}
                value={savedValues.city}
                validate={validateRequired}
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
                label={t("verificationRenewal.personalInformation.monthlyIncome")}
                value={savedValues.monthlyIncome}
                formatValue={translateMonthlyIncome}
                validate={validateRequired}
                onChange={value => setSaveValues({ ...savedValues, monthlyIncome: value })}
                renderEditing={({ value, onChange }) => (
                  <LakeSelect value={value} items={monthlyIncomeItems} onValueChange={onChange} />
                )}
              />

              <Space height={12} />
              <EditableField
                label={t("verificationRenewal.personalInformation.employmentStatus")}
                value={savedValues.employmentStatus}
                formatValue={translateEmploymentStatus}
                onChange={value => setSaveValues({ ...savedValues, employmentStatus: value })}
                renderEditing={({ value, onChange }) => (
                  <LakeSelect
                    value={value}
                    items={employmentStatusItems}
                    onValueChange={onChange}
                  />
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
