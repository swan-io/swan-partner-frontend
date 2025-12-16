import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { OnboardingFooter } from "../../components/OnboardingFooter";
import { OnboardingStepContent } from "../../components/OnboardingStepContent";
import { PartnershipFooter } from "../../components/PartnershipFooter";
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
      <LakeText>ChangeAdminConfirm</LakeText>

      <OnboardingFooter onPrevious={onPressPrevious} onNext={onSubmit} loading={false} />
      <PartnershipFooter />
    </OnboardingStepContent>
  );
};
