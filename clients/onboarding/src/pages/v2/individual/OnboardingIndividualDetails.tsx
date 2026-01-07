import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { breakpoints } from "@swan-io/lake/src/constants/design";
import { OnboardingFooter } from "../../../components/OnboardingFooter";
import { StepTitle } from "../../../components/StepTitle";
import { CompanyOnboardingFragment, IndividualOnboardingFragment } from "../../../graphql/partner";
import { t } from "../../../utils/i18n";
import { Router } from "../../../utils/routes";

type Props = {
  onboardingId: string;
  onboarding: NonNullable<CompanyOnboardingFragment | IndividualOnboardingFragment>; // todo IndividualOnboardingFragment
};

export const OnboardingIndividualDetails = ({ onboardingId, onboarding }: Props) => {
  const onPressPrevious = () => {
    Router.push("Root", { onboardingId });
  };

  const onPressNext = () => {
    Router.push("Address", { onboardingId });
  };

  return (
    <ResponsiveContainer breakpoint={breakpoints.medium}>
      {({ small }) => (
        <>
          <Tile>
            <StepTitle isMobile={small}>{t("individual.step.details.title")}</StepTitle>

            <ul>
              <li>Birth Info: {onboarding.accountAdmin?.birthInfo?.city}</li>
              <li>Email: {onboarding.accountAdmin?.email}</li>
              <li>First Name: {onboarding.accountAdmin?.firstName}</li>
              <li>Last Name: {onboarding.accountAdmin?.lastName}</li>
              <li>Nationality: {onboarding.accountAdmin?.nationality}</li>
              <li>Address: {onboarding.accountAdmin?.address?.addressLine1}</li>
            </ul>
          </Tile>
          <OnboardingFooter onNext={onPressNext} onPrevious={onPressPrevious} />
        </>
      )}
    </ResponsiveContainer>
  );
};
