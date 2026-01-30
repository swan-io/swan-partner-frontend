import { Box } from "@swan-io/lake/src/components/Box";
import { LakeStepper, MobileStepTitle, Step } from "@swan-io/lake/src/components/LakeStepper";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { backgroundColor } from "@swan-io/lake/src/constants/design";
import { useBoolean } from "@swan-io/lake/src/hooks/useBoolean";
import { isNullish } from "@swan-io/lake/src/utils/nullish";
import { useEffect, useMemo } from "react";
import { StyleSheet } from "react-native";
import { P, match } from "ts-pattern";
import logoSwan from "../../../assets/imgs/logo-swan.svg";
import { OnboardingFooter } from "../../../components/OnboardingFooter";
import { OnboardingHeader } from "../../../components/OnboardingHeader";
import { IndividualOnboardingFragment } from "../../../graphql/partner";
import { t } from "../../../utils/i18n";
import {
  IndividualOnboardingRouteV2,
  Router,
  individualOnboardingRoutesV2,
} from "../../../utils/routes";
import { NotFoundPage } from "../../NotFoundPage";
import { OnboardingIndividualDetails } from "./OnboardingIndividualDetails";

const styles = StyleSheet.create({
  stepper: {
    width: "100%",
  },
  wrapper: {
    width: "100%",
    maxWidth: 992,
    margin: "auto",
    paddingHorizontal: 8,
    paddingTop: 8,
    flex: 1,
  },
  wrapperDesktop: {
    paddingHorizontal: 40,
    paddingTop: 40,
  },
  sticky: {
    position: "sticky",
    top: 0,
    backgroundColor: backgroundColor.default90Transparency,
    backdropFilter: "blur(4px)",
    zIndex: 10,
  },
});

type Props = {
  onboarding: NonNullable<IndividualOnboardingFragment>;
};

export const OnboardingIndividualWizard = ({ onboarding }: Props) => {
  const route = Router.useRoute(individualOnboardingRoutesV2);
  const isStepperDisplayed = !isNullish(route);

  const onboardingId = onboarding.id;
  const projectName = "TODO";
  const projectLogo = onboarding.projectInfo?.logoUri ?? logoSwan;

  const [finalized] = useBoolean(false);

  const steps = useMemo<WizardStep<IndividualOnboardingRouteV2>[]>(
    () => [
      {
        id: "Root",
        label: t("step.title.about"),
        errors: [],
      },
      {
        id: "Activity",
        label: t("step.title.employment"),
        errors: [],
      },
      {
        id: "Finalize",
        label: t("step.title.swanApp"),
        errors: [],
      },
    ],
    [],
  );

  const stepperSteps = useMemo<Step[]>(
    () =>
      steps.map(step => ({
        id: step.id,
        label: step.label,
        url: Router[step.id]({ onboardingId }),
        hasErrors: finalized && step.errors.length > 0,
      })),
    [onboardingId, steps, finalized],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies(route?.name):
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [route?.name]);

  return (
    <ResponsiveContainer>
      {({ large, small }) => (
        <Box>
          <Box style={styles.sticky}>
            <OnboardingHeader projectName={projectName} projectLogo={projectLogo} />
          </Box>

          <Box style={[styles.wrapper, large && styles.wrapperDesktop]}>
            {isStepperDisplayed ? (
              small ? (
                <MobileStepTitle activeStepId={route.name} steps={stepperSteps} />
              ) : (
                <>
                  <Box alignItems="center">
                    <LakeStepper
                      activeStepId={route.name}
                      steps={stepperSteps}
                      style={styles.stepper}
                    />
                  </Box>
                </>
              )
            ) : null}

            <Space height={32} />

            {match(route)
              .with({ name: "Root" }, () => <OnboardingIndividualDetails onboarding={onboarding} />)
              .with({ name: "Activity" }, () => (
                <>
                  <h2>Activity </h2>
                  <OnboardingFooter
                    onNext={() => Router.push("Finalize", { onboardingId })}
                    onPrevious={() => Router.push("Root", { onboardingId })}
                  />
                </>
              ))
              .with({ name: "Finalize" }, () => (
                <>
                  <h2>Finalize </h2>
                </>
              ))
              .with(P.nullish, () => <NotFoundPage />)
              .exhaustive()}
          </Box>
        </Box>
      )}
    </ResponsiveContainer>
  );
};
