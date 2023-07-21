import { Option } from "@swan-io/boxed";
import { Box } from "@swan-io/lake/src/components/Box";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { breakpoints } from "@swan-io/lake/src/constants/design";
import { useBoolean } from "@swan-io/lake/src/hooks/useBoolean";
import { isNotNullish } from "@swan-io/lake/src/utils/nullish";
import { isMobile } from "@swan-io/lake/src/utils/userAgent";
import { useEffect } from "react";
import { P, match } from "ts-pattern";
import { FinalizeBlock, FinalizeInvalidSteps } from "../../components/FinalizeStepBlocks";
import { OnboardingFooter } from "../../components/OnboardingFooter";
import { OnboardingStepContent } from "../../components/OnboardingStepContent";
import { IdentificationLevel } from "../../graphql/unauthenticated";
import { openPopup } from "../../states/popup";
import { env } from "../../utils/env";
import { t } from "../../utils/i18n";
import { projectConfiguration } from "../../utils/projectId";
import { IndividualOnboardingRoute, Router } from "../../utils/routes";

type Props = {
  onboardingId: string;
  legalRepresentativeRecommendedIdentificationLevel: IdentificationLevel;
  steps: WizardStep<IndividualOnboardingRoute>[];
  alreadySubmitted: boolean;
  onSubmitWithErrors: () => void;
};

export const OnboardingIndividualFinalize = ({
  onboardingId,
  legalRepresentativeRecommendedIdentificationLevel,
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
    Router.push("OnboardingDetails", { onboardingId });
  };

  const onPressNext = () => {
    if (containsErrors) {
      setShakeError.on();
      onSubmitWithErrors();
      return;
    }

    const queryString = new URLSearchParams();
    queryString.append("identificationLevel", legalRepresentativeRecommendedIdentificationLevel);
    queryString.append("onboardingId", onboardingId);

    match(projectConfiguration)
      .with(Option.P.Some({ projectId: P.select(), mode: "MultiProject" }), projectId =>
        queryString.append("projectId", projectId),
      )
      .otherwise(() => {});

    const url = `${env.BANKING_URL}/auth/login?${queryString.toString()}`;

    if (isMobile) {
      window.location.replace(url);
    } else {
      openPopup({
        url,
        onClose: redirectUrl => {
          if (isNotNullish(redirectUrl)) {
            // We use location.replace to be sure that the auth
            // cookie is correctly written before changing page
            // (history pushState does not seem to offer these guarantees)
            window.location.replace(redirectUrl);
          }
        },
      });
    }
  };

  return (
    <>
      <OnboardingStepContent>
        <ResponsiveContainer breakpoint={breakpoints.medium} style={commonStyles.fill}>
          {({ small }) => (
            <Box alignItems="center" justifyContent="center" style={commonStyles.fillNoShrink}>
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

              <Space height={12} />
            </Box>
          )}
        </ResponsiveContainer>
      </OnboardingStepContent>

      <OnboardingFooter
        nextLabel={t("wizard.finalize")}
        onPrevious={onPressPrevious}
        onNext={onPressNext}
      />
    </>
  );
};
