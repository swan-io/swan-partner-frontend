import { Box } from "@swan-io/lake/src/components/Box";
import { LakeStepper, MobileStepTitle, Step } from "@swan-io/lake/src/components/LakeStepper";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { backgroundColor, breakpoints, colors } from "@swan-io/lake/src/constants/design";
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
    maxWidth: 1280,
    paddingHorizontal: 40,
  },
  wrapper: {
    width: "100%",
    maxWidth: 840,
    margin: "auto",
    paddingHorizontal: 8,
    paddingTop: 8,
    flex: 1,
    backgroundColor: colors.partner[50],
    borderWidth: 1,
    borderColor: colors.partner[100],
    borderRadius: 16,
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
  const isStepperDisplayed = !isNullish(route) && route.name !== "Root";

  const onboardingId = onboarding.id;
  const projectName = "TODO";
  const projectLogo = onboarding.projectInfo?.logoUri ?? logoSwan;

  const [finalized] = useBoolean(false);

  const steps = useMemo<WizardStep<IndividualOnboardingRouteV2>[]>(
    () => [
      {
        id: "Details",
        label: t("step.title.email"),
        errors: [],
      },
      {
        id: "Address",
        label: t("step.title.address"),
        errors: [],
      },
      {
        id: "Activity",
        label: t("step.title.occupation"),
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
    <ResponsiveContainer breakpoint={breakpoints.tiny}>
      {({ large, small }) => (
        <Box grow={1}>
          <Box style={styles.sticky}>
            <OnboardingHeader projectName={projectName} projectLogo={projectLogo} />
          </Box>

          <Box style={{ paddingHorizontal: "8px" }}>
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
                    <Space height={32} />
                  </>
                )
              ) : null}

              {match(route)
                .with({ name: "Root" }, () => (
                  <>
                    <h2>Presentation</h2>
                    <OnboardingFooter onNext={() => Router.push("Details", { onboardingId })} />
                  </>
                ))
                .with({ name: "Details" }, () => (
                  <OnboardingIndividualDetails onboarding={onboarding} />
                ))
                .with({ name: "Address" }, () => (
                  <>
                    <h2>Address </h2>
                    <OnboardingFooter
                      onNext={() => Router.push("Activity", { onboardingId })}
                      onPrevious={() => Router.push("Details", { onboardingId })}
                    />
                  </>
                ))
                .with({ name: "Activity" }, () => (
                  <>
                    <h2>Activity </h2>
                    <OnboardingFooter
                      onNext={() => Router.push("Finalize", { onboardingId })}
                      onPrevious={() => Router.push("Address", { onboardingId })}
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
        </Box>
      )}
    </ResponsiveContainer>
  );
};
