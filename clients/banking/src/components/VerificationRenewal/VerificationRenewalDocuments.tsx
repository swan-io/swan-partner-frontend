import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { breakpoints } from "@swan-io/lake/src/constants/design";
import { OnboardingStepContent } from "../../../../onboarding/src/components/OnboardingStepContent";
import { StepTitle } from "../../../../onboarding/src/components/StepTitle";
import { t } from "../../utils/i18n";
import { Router } from "../../utils/routes";

type Props = {
  verificationRenewalId: string;
};

export const VerificationRenewalDocuments = ({ verificationRenewalId }: Props) => {
  return (
    <OnboardingStepContent>
      <ResponsiveContainer breakpoint={breakpoints.medium}>
        {({ small }) => (
          <>
            <StepTitle isMobile={small}>{t("verificationRenewal.documents.title")}</StepTitle>
            <Space height={4} />
            <LakeText>{t("verificationRenewal.documents.subtitle")}</LakeText>
            <Space height={40} />

            {/* <SupportingDocumentCollection /> */}

            <Space height={40} />

            <LakeButtonGroup>
              <LakeButton
                mode="secondary"
                onPress={() => Router.push("VerificationRenewalRoot", { verificationRenewalId })}
              >
                {t("verificationRenewal.cancel")}
              </LakeButton>

              <LakeButton
                onPress={() =>
                  Router.push("VerificationRenewalFinalize", { verificationRenewalId })
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
