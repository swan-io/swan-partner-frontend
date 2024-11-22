import { Option } from "@swan-io/boxed";
import { Box } from "@swan-io/lake/src/components/Box";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { breakpoints } from "@swan-io/lake/src/constants/design";
import { useBoolean } from "@swan-io/lake/src/hooks/useBoolean";
import { isDecentMobileDevice } from "@swan-io/lake/src/utils/userAgent";
import { useEffect } from "react";
import { P, match } from "ts-pattern";
import { FinalizeBlock, FinalizeInvalidSteps } from "../../components/FinalizeStepBlocks";
import { OnboardingFooter } from "../../components/OnboardingFooter";
import { OnboardingStepContent } from "../../components/OnboardingStepContent";
import { env } from "../../utils/env";
import { openPopup } from "../../utils/popup";
import { projectConfiguration } from "../../utils/projectId";
import { CompanyOnboardingRoute, Router } from "../../utils/routes";

type Props = {
  previousStep: CompanyOnboardingRoute;
  onboardingId: string;
  steps: WizardStep<CompanyOnboardingRoute>[];
  alreadySubmitted: boolean;
  onSubmitWithErrors: () => void;
};

export const OnboardingCompanyFinalize = ({
  previousStep,
  onboardingId,
  steps,
  alreadySubmitted,
  onSubmitWithErrors,
}: Props) => {
  const containsErrors = steps.some(({ errors }) => errors != null && errors.length > 0);
  const [shakeError, setShakeError] = useBoolean(false);

  useEffect(() => {
    if (shakeError) {
      const timeout = setTimeout(() => setShakeError.off(), 800);
      return () => {
        clearTimeout(timeout);
      };
    }
  }, [shakeError, setShakeError]);

  const onPressPrevious = () => {
    Router.push(previousStep, { onboardingId });
  };

  const onPressNext = () => {
    if (containsErrors) {
      setShakeError.on();
      onSubmitWithErrors();
      return;
    }

    const queryString = new URLSearchParams();
    queryString.append("identificationLevel", "Auto");
    queryString.append("onboardingId", onboardingId);

    match(projectConfiguration)
      .with(Option.P.Some({ projectId: P.select(), mode: "MultiProject" }), projectId =>
        queryString.append("projectId", projectId),
      )
      .otherwise(() => {});

    const url = `${env.BANKING_URL}/auth/login?${queryString.toString()}`;

    if (isDecentMobileDevice) {
      window.location.replace(url);
    } else {
      openPopup(url).onResolve(redirectUrl => {
        if (redirectUrl.isSome()) {
          // We use location.replace to be sure that the auth
          // cookie is correctly written before changing page
          // (history pushState does not seem to offer these guarantees)
          window.location.replace(redirectUrl.get());
        }
      });
    }
  };

  return (
    <OnboardingStepContent>
      <Box justifyContent="center" grow={1}>
        <ResponsiveContainer breakpoint={breakpoints.medium}>
          {({ small }) => (
            <Box alignItems="center" justifyContent="center">
              {containsErrors && alreadySubmitted ? (
                <FinalizeInvalidSteps
                  onboardingId={onboardingId}
                  steps={steps}
                  isShaking={shakeError}
                  isMobile={small}
                />
              ) : (
                <FinalizeBlock isMobile={small} />
              )}
            </Box>
          )}
        </ResponsiveContainer>

        <OnboardingFooter
          nextLabel="wizard.finalize"
          onPrevious={onPressPrevious}
          onNext={onPressNext}
          justifyContent="center"
        />
      </Box>
    </OnboardingStepContent>
  );
};
