import { Option } from "@swan-io/boxed";
import { useMutation } from "@swan-io/graphql-client";
import { Box } from "@swan-io/lake/src/components/Box";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { RadioGroup } from "@swan-io/lake/src/components/RadioGroup";
import { ReadOnlyFieldList } from "@swan-io/lake/src/components/ReadOnlyFieldList";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { breakpoints, colors } from "@swan-io/lake/src/constants/design";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { BirthdatePicker } from "@swan-io/shared-business/src/components/BirthdatePicker";
import { LakeModal } from "@swan-io/shared-business/src/components/LakeModal";
import { showToast } from "@swan-io/shared-business/src/state/toasts";
import { translateError } from "@swan-io/shared-business/src/utils/i18n";
import {
  validateEmail,
  validateNullableRequired,
  validateRequired,
} from "@swan-io/shared-business/src/utils/validation";
import { useForm } from "@swan-io/use-form";
import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { OnboardingStepContent } from "../../../../onboarding/src/components/OnboardingStepContent";
import { StepTitle } from "../../../../onboarding/src/components/StepTitle";
import {
  AccountHolderType,
  CompanyRenewalInfoFragment,
  GetVerificationRenewalQuery,
  TypeOfRepresentation,
  UpdateCompanyVerificationRenewalDocument,
} from "../../graphql/partner";
import { t } from "../../utils/i18n";
import { Router } from "../../utils/routes";
import { getRenewalSteps, RenewalStep, renewalSteps } from "../../utils/verificationRenewal";
import { getNextStep } from "./VerificationRenewalCompany";
import { VerificationRenewalFooter } from "./VerificationRenewalFooter";

const styles = StyleSheet.create({
  field: { width: "100%" },
  tileContainer: {
    flex: 1,
  },
  birthdateField: {
    padding: 0,
    margin: 0,
  },
});

type Form = {
  firstName: string;
  lastName: string;
  email: string;
  birthDate: string | undefined;
  typeOfRepresentation: TypeOfRepresentation;
};

type Props = {
  verificationRenewalId: string;
  info: CompanyRenewalInfoFragment;
  previousStep: RenewalStep | undefined;
  verificationRenewal: GetVerificationRenewalQuery["verificationRenewal"];
  accountHolderType: AccountHolderType;
};

export const VerificationRenewalAdministratorInformation = ({
  info,
  verificationRenewalId,
  previousStep,
  verificationRenewal,
  accountHolderType,
}: Props) => {
  const [updateCompanyVerificationRenewal, updatingCompanyVerificationRenewal] = useMutation(
    UpdateCompanyVerificationRenewalDocument,
  );

  const { Field, submitForm } = useForm<Form>({
    firstName: {
      initialValue: info.accountAdmin.firstName ?? "",
      validate: validateNullableRequired,
    },
    lastName: {
      initialValue: info.accountAdmin.lastName ?? "",
      validate: validateNullableRequired,
    },
    email: {
      initialValue: info.accountAdmin.email ?? "",
      validate: validateEmail,
    },
    birthDate: {
      initialValue: info.accountAdmin.birthInfo.birthDate ?? "",
      validate: validateNullableRequired,
    },
    typeOfRepresentation: {
      initialValue: info.accountAdmin.typeOfRepresentation ?? "LegalRepresentative",
      validate: validateRequired,
    },
  });

  const onPressSubmit = () => {
    submitForm({
      onSuccess: values => {
        const option = Option.allFromDict(values);
        if (option.isSome()) {
          const { typeOfRepresentation, birthDate, email, firstName, lastName } = option.value;

          return updateCompanyVerificationRenewal({
            input: {
              verificationRenewalId,
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
            .tapOk(() => setEditModalOpen(false))
            .tapError(error => {
              showToast({ variant: "error", error, title: translateError(error) });
            });
        }
      },
    });
  };

  const [editModalOpen, setEditModalOpen] = useState(false);

  const steps = getRenewalSteps(verificationRenewal, accountHolderType);

  const nextStep = useMemo(
    () => getNextStep(renewalSteps.administratorInformation, steps) ?? renewalSteps.finalize,
    [steps],
  );

  return (
    <OnboardingStepContent>
      <ResponsiveContainer breakpoint={breakpoints.medium}>
        {({ small }) => (
          <>
            <Box direction="row" justifyContent="spaceBetween">
              <Box grow={1}>
                <StepTitle isMobile={small}>
                  {t("verificationRenewal.administratorInformation.title")}
                </StepTitle>
              </Box>
              <LakeButton
                mode="tertiary"
                onPress={() => setEditModalOpen(true)}
                icon="edit-regular"
              >
                {t("common.edit")}
              </LakeButton>
            </Box>

            <Space height={40} />

            <Tile>
              <Box direction="column" alignItems="stretch">
                <View style={styles.tileContainer}>
                  <ReadOnlyFieldList>
                    <LakeLabel
                      label={t("verificationRenewal.firstName")}
                      type="view"
                      render={() => (
                        <LakeText color={colors.gray[900]}>{info.accountAdmin.firstName}</LakeText>
                      )}
                    />

                    <LakeLabel
                      label={t("verificationRenewal.lastName")}
                      type="view"
                      render={() => (
                        <LakeText color={colors.gray[900]}>{info.accountAdmin.lastName}</LakeText>
                      )}
                    />

                    <LakeLabel
                      label={t("verificationRenewal.administratorInformation.email")}
                      type="view"
                      render={() => (
                        <LakeText color={colors.gray[900]}>{info.accountAdmin.email}</LakeText>
                      )}
                    />

                    <LakeLabel
                      label={t("verificationRenewal.administratorInformation.birthDate")}
                      type="view"
                      render={() => (
                        <LakeText color={colors.gray[900]}>
                          {info.accountAdmin.birthInfo.birthDate}
                        </LakeText>
                      )}
                    />

                    <LakeLabel
                      label={t("verificationRenewal.administratorInformation.typeOfRepresentation")}
                      type="view"
                      render={() => (
                        <RadioGroup
                          onValueChange={() => {}}
                          disabled={true}
                          direction="row"
                          value={info.accountAdmin.typeOfRepresentation}
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
                        />
                      )}
                    />
                  </ReadOnlyFieldList>
                </View>
              </Box>
            </Tile>

            <VerificationRenewalFooter
              onPrevious={
                previousStep !== undefined
                  ? () =>
                      Router.push(previousStep?.id, {
                        verificationRenewalId: verificationRenewalId,
                      })
                  : undefined
              }
              onNext={() =>
                Router.push(nextStep.id, {
                  verificationRenewalId: verificationRenewalId,
                })
              }
              loading={updatingCompanyVerificationRenewal.isLoading()}
            />

            <LakeModal
              maxWidth={850}
              visible={editModalOpen}
              icon="edit-regular"
              color="partner"
              title={t("verificationRenewal.editModal.title")}
            >
              <Space height={16} />

              <LakeLabel
                type="view"
                label={t("verificationRenewal.firstName")}
                render={() => (
                  <Field name="firstName">
                    {({ value, error, onChange, onBlur }) => (
                      <LakeTextInput
                        value={value}
                        error={error}
                        onChangeText={onChange}
                        onBlur={onBlur}
                      />
                    )}
                  </Field>
                )}
              />

              <LakeLabel
                type="view"
                label={t("verificationRenewal.lastName")}
                render={() => (
                  <Field name="lastName">
                    {({ value, error, onChange, onBlur }) => (
                      <LakeTextInput
                        value={value}
                        error={error}
                        onChangeText={onChange}
                        onBlur={onBlur}
                      />
                    )}
                  </Field>
                )}
              />

              <LakeLabel
                type="view"
                label={t("verificationRenewal.administratorInformation.email")}
                render={() => (
                  <Field name="email">
                    {({ value, error, onChange, onBlur }) => (
                      <LakeTextInput
                        value={value}
                        error={error}
                        onChangeText={onChange}
                        onBlur={onBlur}
                      />
                    )}
                  </Field>
                )}
              />

              <LakeLabel
                type="view"
                label={t("verificationRenewal.administratorInformation.birthDate")}
                render={() => (
                  <Field name="birthDate">
                    {({ value, error, onChange }) => (
                      <BirthdatePicker
                        style={styles.birthdateField}
                        label=""
                        value={value}
                        onValueChange={onChange}
                        error={error}
                      />
                    )}
                  </Field>
                )}
              />

              <LakeLabel
                type="view"
                label={t("verificationRenewal.administratorInformation.typeOfRepresentation")}
                render={() => (
                  <Field name="typeOfRepresentation">
                    {({ value, onChange }) => (
                      <RadioGroup
                        onValueChange={onChange}
                        direction="row"
                        value={value}
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
                      />
                    )}
                  </Field>
                )}
              />

              <LakeButtonGroup paddingBottom={0}>
                <LakeButton grow={true} mode="secondary" onPress={() => setEditModalOpen(false)}>
                  {t("common.cancel")}
                </LakeButton>

                <LakeButton
                  color="partner"
                  mode="primary"
                  grow={true}
                  onPress={onPressSubmit}
                  loading={updatingCompanyVerificationRenewal.isLoading()}
                >
                  {t("common.validate")}
                </LakeButton>
              </LakeButtonGroup>
            </LakeModal>
          </>
        )}
      </ResponsiveContainer>
    </OnboardingStepContent>
  );
};
