import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { breakpoints, colors } from "@swan-io/lake/src/constants/design";
import { OnboardingStepContent } from "../../../../onboarding/src/components/OnboardingStepContent";
import { StepTitle } from "../../../../onboarding/src/components/StepTitle";
import { t } from "../../utils/i18n";
import { Router } from "../../utils/routes";

type Props = {
  verificationRenewalId: string;
};

export const VerificationRenewalPersonalInfo = ({ verificationRenewalId }: Props) => {
  return (
    <OnboardingStepContent>
      <ResponsiveContainer breakpoint={breakpoints.medium}>
        {({ small }) => (
          <>
            <StepTitle isMobile={small}>
              {t("verificationRenewal.personalInformation.title")}
            </StepTitle>
            <Space height={4} />
            <LakeText>{t("verificationRenewal.personalInformation.subtitle")}</LakeText>
            <Space height={40} />

            <Tile>
              <LakeLabel
                color="current"
                label={t("verificationRenewal.personalInformation.name")}
                render={() => <LakeText color={colors.gray[900]}>{"text"}</LakeText>}
              />

              <Space height={24} />
              <LakeLabel
                color="current"
                label={t("verificationRenewal.personalInformation.address")}
                render={() => <LakeText color={colors.gray[900]}>{"text"}</LakeText>}
              />

              <Space height={24} />
              <LakeLabel
                color="current"
                label={t("verificationRenewal.personalInformation.monthlyIncomes")}
                render={() => <LakeText color={colors.gray[900]}>{"text"}</LakeText>}
              />

              <Space height={24} />
              <LakeLabel
                color="current"
                label={t("verificationRenewal.personalInformation.occupation")}
                render={() => <LakeText color={colors.gray[900]}>{"text"}</LakeText>}
              />
            </Tile>

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
                  Router.push("VerificationRenewalDocuments", { verificationRenewalId })
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
