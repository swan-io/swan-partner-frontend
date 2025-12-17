import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { OnboardingFooter } from "../../components/OnboardingFooter";
import { OnboardingStepContent } from "../../components/OnboardingStepContent";
import { PartnershipFooter } from "../../components/PartnershipFooter";
import { ChangeAdminRoute, Router } from "../../utils/routes";

type Props = {
  changeAdminRequestId: string;
  previousStep: ChangeAdminRoute;
  nextStep: ChangeAdminRoute;
};

export const ChangeAdminDocuments = ({ changeAdminRequestId, previousStep, nextStep }: Props) => {
  const onPressPrevious = () => {
    Router.push(previousStep, { requestId: changeAdminRequestId });
  };

  const onPressNext = () => {
    Router.push(nextStep, { requestId: changeAdminRequestId });
  };

  return (
    <OnboardingStepContent>
      <LakeText>ChangeAdminDocuments</LakeText>

      <OnboardingFooter onPrevious={onPressPrevious} onNext={onPressNext} loading={false} />
      <PartnershipFooter />
    </OnboardingStepContent>
  );
};
