import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { OnboardingFooter } from "../../components/OnboardingFooter";
import { OnboardingStepContent } from "../../components/OnboardingStepContent";
import { PartnershipFooter } from "../../components/PartnershipFooter";
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
      <LakeText>ChangeAdminContext1</LakeText>

      <OnboardingFooter onNext={onPressNext} loading={false} />
      <PartnershipFooter />
    </OnboardingStepContent>
  );
};
