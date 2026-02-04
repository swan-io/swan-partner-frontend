import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { breakpoints } from "@swan-io/lake/src/constants/design";
import { OnboardingFooter } from "../../../components/OnboardingFooter";
import { StepTitle } from "../../../components/StepTitle";
import { IndividualOnboardingFragment } from "../../../graphql/partner";
import { t } from "../../../utils/i18n";

import { Router } from "../../../utils/routes";

type Props = {
  onboarding: NonNullable<IndividualOnboardingFragment>;
};

export const OnboardingIndividualFinalize = ({ onboarding }: Props) => {
  const onboardingId = onboarding.id;

  const onPressPrevious = () => {
    Router.push("Activity", { onboardingId });
  };

  const onPressNext = () => {};

  return (
    <>
      <ResponsiveContainer breakpoint={breakpoints.medium}>
        {({ small }) => (
          <>
            <Tile>
              <StepTitle isMobile={small}>{t("individual.step.finalize.title")}</StepTitle>
            </Tile>
          </>
        )}
      </ResponsiveContainer>
      <OnboardingFooter
        onNext={onPressNext}
        onPrevious={onPressPrevious}
        justifyContent="start"
        nextLabel="wizard.sendCode"
        // loading={updateResult.isLoading()}
      />
    </>
  );
};
