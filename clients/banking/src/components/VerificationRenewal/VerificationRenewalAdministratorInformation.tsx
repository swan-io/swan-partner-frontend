import { Option } from "@swan-io/boxed";
import { useMutation } from "@swan-io/graphql-client";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeTextInput } from "@swan-io/lake/src/components/LakeTextInput";
import { RadioGroup } from "@swan-io/lake/src/components/RadioGroup";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { breakpoints } from "@swan-io/lake/src/constants/design";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { showToast } from "@swan-io/shared-business/src/state/toasts";
import { translateError } from "@swan-io/shared-business/src/utils/i18n";
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
import { validateRequired } from "../../utils/validations";
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
};

export const VerificationRenewalAdministratorInformation = ({
  info,
  verificationRenewalId,
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

  const onPressSubmit = () => {
    const { firstName, lastName, email, birthDate, typeOfRepresentation } = savedValues;

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
        Router.push("VerificationRenewalOwnership", {
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
              <EditableField
                label={t("verificationRenewal.administratorInformation.typeOfRepresentation")}
                value={savedValues.typeOfRepresentation}
                validate={validateRequired}
                onChange={value => setSaveValues({ ...savedValues, typeOfRepresentation: value })}
                renderEditing={({ value, error, onChange }) => (
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
              />
              <Space height={12} />
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
                loading={updatingCompanyVerificationRenewal.isLoading()}
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
