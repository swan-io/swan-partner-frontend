import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { breakpoints } from "@swan-io/lake/src/constants/design";
import { useState } from "react";
import { OnboardingStepContent } from "../../../../onboarding/src/components/OnboardingStepContent";
import { StepTitle } from "../../../../onboarding/src/components/StepTitle";
import { CompanyRenewalInfoFragment } from "../../graphql/partner";
import { t } from "../../utils/i18n";
import { Router } from "../../utils/routes";

type Props = {
  verificationRenewalId: string;
  info: CompanyRenewalInfoFragment;
};

export const VerificationRenewalAdministratorInformation = ({
  info,
  verificationRenewalId,
}: Props) => {
  const [savedValues, setSaveValues] = useState<Form>({
    firstName: info.accountAdmin.firstName,
    lastName: info.accountAdmin.lastName,
    email: info.accountAdmin.email,
    birthday: info.accountAdmin.birthInfo.birthDate ?? "",
    legalRep: info.accountAdmin.residencyAddress.postalCode ?? "",
  });

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

            <Tile></Tile>

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
