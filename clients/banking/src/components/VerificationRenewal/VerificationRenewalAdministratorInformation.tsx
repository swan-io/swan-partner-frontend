import { Option } from "@swan-io/boxed";
import { useMutation } from "@swan-io/graphql-client";
import { Box } from "@swan-io/lake/src/components/Box";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { RadioGroup } from "@swan-io/lake/src/components/RadioGroup";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { breakpoints } from "@swan-io/lake/src/constants/design";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { showToast } from "@swan-io/shared-business/src/state/toasts";
import { translateError } from "@swan-io/shared-business/src/utils/i18n";
import { useForm } from "@swan-io/use-form";
import { useState } from "react";
import { OnboardingStepContent } from "../../../../onboarding/src/components/OnboardingStepContent";
import { StepTitle } from "../../../../onboarding/src/components/StepTitle";
import {
  CompanyRenewalInfoFragment,
  TypeOfRepresentation,
  UpdateCompanyVerificationRenewalDocument,
} from "../../graphql/partner";
import { t } from "../../utils/i18n";
import { Router } from "../../utils/routes";
import { validateNullableRequired, validateRequired } from "../../utils/validations";
import type { RenewalStep } from "./VerificationRenewalCompany";
import { VerificationRenewalFooter } from "./VerificationRenewalFooter";
import { EditableField } from "./VerificationRenewalPersonalInfo";

type Form = {
  firstName: string;
  lastName: string;
  email: string;
  birthDate: string;
  typeOfRepresentation: TypeOfRepresentation;
};

type Props = {
  verificationRenewalId: string;
  info: CompanyRenewalInfoFragment;
  previousStep: RenewalStep | undefined;
  nextStep: RenewalStep;
};

export const VerificationRenewalAdministratorInformation = ({
  info,
  verificationRenewalId,
  previousStep,
  nextStep,
}: Props) => {
  const [updateCompanyVerificationRenewal, updatingCompanyVerificationRenewal] = useMutation(
    UpdateCompanyVerificationRenewalDocument,
  );

  const [savedValues, setSaveValues] = useState<Form>({
    firstName: info.accountAdmin.firstName,
    lastName: info.accountAdmin.lastName,
    email: info.accountAdmin.email,
    birthDate: info.accountAdmin.birthInfo.birthDate ?? "",
    typeOfRepresentation: info.accountAdmin.typeOfRepresentation ?? "LegalRepresentative",
  });

  const { Field, submitForm } = useForm<{
    typeOfRepresentation: TypeOfRepresentation | undefined;
  }>({
    typeOfRepresentation: {
      initialValue: info.accountAdmin.typeOfRepresentation ?? undefined,
      validate: validateNullableRequired,
    },
  });

  const onPressSubmit = () => {
    submitForm({
      onSuccess: values => {
        const option = Option.allFromDict(values);
        if (option.isSome()) {
          const { firstName, lastName, email, birthDate } = savedValues;
          const { typeOfRepresentation } = option.value;

          return updateCompanyVerificationRenewal({
            input: {
              verificationRenewalId: verificationRenewalId,
              accountAdmin: {
                firstName,
                lastName,
                email,
                birthInfo: {
                  birthDate,
                },
                typeOfRepresentation,
              },
            },
          })
            .mapOk(data => data.updateCompanyVerificationRenewal)
            .mapOkToResult(data => Option.fromNullable(data).toResult(data))
            .mapOkToResult(filterRejectionsToResult)
            .tapOk(() => {
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
              {t("verificationRenewal.administratorInformation.title")}
            </StepTitle>

            <Space height={40} />

            <Tile>
              <EditableField
                label={t("verificationRenewal.firstName")}
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
                label={t("verificationRenewal.lastName")}
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
                label={t("verificationRenewal.administratorInformation.email")}
                value={savedValues.email}
                validate={validateRequired}
                onChange={value => setSaveValues({ ...savedValues, email: value })}
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
                label={t("verificationRenewal.administratorInformation.birthDate")}
                value={savedValues.birthDate}
                validate={validateRequired}
                onChange={value => setSaveValues({ ...savedValues, birthDate: value })}
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
                  label={t("verificationRenewal.administratorInformation.typeOfRepresentation")}
                  render={() => (
                    <Field name="typeOfRepresentation">
                      {({ value, error, onChange }) => (
                        <RadioGroup
                          direction="row"
                          value={value}
                          error={error}
                          items={[
                            {
                              name: t("verificationRenewal.typeOfRepresentation.yes"),
                              value: "LegalRepresentative",
                            },
                            {
                              name: t("verificationRenewal.typeOfRepresentation.no"),
                              value: "PowerOfAttorney",
                            },
                          ]}
                          onValueChange={onChange}
                        />
                      )}
                    </Field>
                  )}
                />
              </Box>

              <Space height={12} />
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
