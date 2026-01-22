import { Option } from "@swan-io/boxed";
import { useMutation } from "@swan-io/graphql-client";
import { Box } from "@swan-io/lake/src/components/Box";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { RadioGroup } from "@swan-io/lake/src/components/RadioGroup";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { breakpoints, colors, spacings } from "@swan-io/lake/src/constants/design";
import { useBoolean } from "@swan-io/lake/src/hooks/useBoolean";
import { identity } from "@swan-io/lake/src/utils/function";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { BirthdatePicker } from "@swan-io/shared-business/src/components/BirthdatePicker";
import { showToast } from "@swan-io/shared-business/src/state/toasts";
import { translateError } from "@swan-io/shared-business/src/utils/i18n";
import { validateNullableRequired } from "@swan-io/shared-business/src/utils/validation";
import { useForm } from "@swan-io/use-form";
import { useState } from "react";
import { StyleSheet } from "react-native";
import { OnboardingStepContent } from "../../../../onboarding/src/components/OnboardingStepContent";
import { StepTitle } from "../../../../onboarding/src/components/StepTitle";
import {
  CompanyRenewalInfoFragment,
  TypeOfRepresentation,
  UpdateCompanyVerificationRenewalDocument,
} from "../../graphql/partner";
import { t } from "../../utils/i18n";
import { Router } from "../../utils/routes";
import { getRenewalSteps, RenewalStep, renewalSteps } from "../../utils/verificationRenewal";
import { getNextStep } from "./VerificationRenewalCompany";
import { VerificationRenewalFooter } from "./VerificationRenewalFooter";
import { EditableField } from "./VerificationRenewalPersonalInfo";

const styles = StyleSheet.create({
  inputContainer: {
    flex: 1,
    padding: 0,
    margin: 0,
  },
});

type Form = {
  firstName: string;
  lastName: string;
  email: string;
  typeOfRepresentation: TypeOfRepresentation;
};

type Props = {
  verificationRenewalId: string;
  info: CompanyRenewalInfoFragment;
  previousStep: RenewalStep | undefined;
};

export const VerificationRenewalAdministratorInformation = ({
  info,
  verificationRenewalId,
  previousStep,
}: Props) => {
  const [updateCompanyVerificationRenewal, updatingCompanyVerificationRenewal] = useMutation(
    UpdateCompanyVerificationRenewalDocument,
  );

  const [savedValues, setSaveValues] = useState<Form>({
    firstName: info.accountAdmin.firstName,
    lastName: info.accountAdmin.lastName,
    email: info.accountAdmin.email,
    typeOfRepresentation: info.accountAdmin.typeOfRepresentation ?? "LegalRepresentative",
  });

  const { Field, submitForm, setFieldValue } = useForm<{
    birthDate: string | undefined;
    typeOfRepresentation: TypeOfRepresentation | undefined;
  }>({
    birthDate: {
      initialValue: info.accountAdmin.birthInfo.birthDate ?? undefined,
      validate: validateNullableRequired,
    },
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
          const { firstName, lastName, email } = savedValues;
          const { typeOfRepresentation, birthDate } = option.value;

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
            .tapOk(data => {
              const accountHolderType = "Company";
              const steps = getRenewalSteps(data.verificationRenewal, accountHolderType);

              const nextStep =
                getNextStep(renewalSteps.administratorInformation, steps) ?? renewalSteps.finalize;

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
  const [editingBirthdate, setEditingBirthdate] = useBoolean(false);

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
                validate={validateNullableRequired}
                formatValue={identity}
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
                validate={validateNullableRequired}
                formatValue={identity}
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
                validate={validateNullableRequired}
                formatValue={identity}
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

              <Box direction="row">
                <LakeLabel
                  type="view"
                  label={t("verificationRenewal.administratorInformation.birthDate")}
                  style={{ width: "100%" }}
                  render={() => (
                    <Field name="birthDate">
                      {({ value, error, onChange }) =>
                        editingBirthdate ? (
                          <Box direction="row">
                            <BirthdatePicker
                              style={[
                                styles.inputContainer,
                                {
                                  padding: 0,
                                  margin: 0,
                                },
                              ]}
                              label=""
                              value={value}
                              onValueChange={onChange}
                              error={error}
                            />

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
                                  setEditingBirthdate.off();
                                  setFieldValue("birthDate", value);
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
                                  setEditingBirthdate.off();
                                  setFieldValue(
                                    "birthDate",
                                    info.accountAdmin.birthInfo.birthDate ?? undefined,
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
                                {value}
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
                                onPress={setEditingBirthdate.on}
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
