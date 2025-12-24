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
  previousStep: ChangeAdminRoute;
};

export const ChangeAdminConfirm = ({ changeAdminRequestId, previousStep }: Props) => {
  const onPressPrevious = () => {
    Router.push(previousStep, { requestId: changeAdminRequestId });
  };

  const onSubmit = () => {
    console.log("Submit change admin request");
  };

  return (
    <OnboardingStepContent>
      <ResponsiveContainer breakpoint={breakpoints.medium}>
        {({ small }) => (
          <>
            <StepTitle isMobile={small}>{t("changeAdmin.step.confirm.title")}</StepTitle>
            <Space height={small ? 8 : 12} />
            <LakeText>{t("changeAdmin.step.confirm.description")}</LakeText>
            <Space height={small ? 24 : 32} />

            <Tile>
              <LakeText>ChangeAdminConfirm</LakeText>
            </Tile>
          </>
        )}
      </ResponsiveContainer>

      <OnboardingFooter onPrevious={onPressPrevious} onNext={onSubmit} loading={false} />
      <PartnershipFooter />
    </OnboardingStepContent>
  );
};
