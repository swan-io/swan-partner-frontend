import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { breakpoints } from "@swan-io/lake/src/constants/design";
import { OnboardingFooter } from "../../components/OnboardingFooter";
import { OnboardingStepContent } from "../../components/OnboardingStepContent";
import { PartnershipFooter } from "../../components/PartnershipFooter";
import { StepTitle } from "../../components/StepTitle";
import { t } from "../../utils/i18n";
import { ChangeAdminRoute, Router } from "../../utils/routes";

type Props = {
  changeAdminRequestId: string;
  nextStep: ChangeAdminRoute;
};

export const ChangeAdminContext1 = ({ changeAdminRequestId, nextStep }: Props) => {
  const onPressNext = () => {
    Router.push(nextStep, { requestId: changeAdminRequestId });
  };

  return (
    <OnboardingStepContent>
      <ResponsiveContainer breakpoint={breakpoints.medium}>
        {({ small }) => (
          <>
            <StepTitle isMobile={small}>{t("changeAdmin.step.context1.title")}</StepTitle>
            <Space height={small ? 8 : 12} />
            <LakeText>{t("changeAdmin.step.context1.description")}</LakeText>
            <Space height={small ? 24 : 32} />

            <Tile>
              <LakeText>ChangeAdminContext1</LakeText>
            </Tile>
          </>
        )}
      </ResponsiveContainer>

      <OnboardingFooter
        nextLabel="changeAdmin.step.context1.continue"
        onNext={onPressNext}
        loading={false}
      />
      <PartnershipFooter />
    </OnboardingStepContent>
  );
};
