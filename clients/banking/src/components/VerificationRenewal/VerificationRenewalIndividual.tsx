import { Box } from "@swan-io/lake/src/components/Box";
import {
  LakeStepper,
  MobileStepTitle,
  TopLevelStep,
} from "@swan-io/lake/src/components/LakeStepper";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { backgroundColor } from "@swan-io/lake/src/constants/design";
import { isNullish } from "@swan-io/lake/src/utils/nullish";
import { useEffect, useMemo } from "react";
import { StyleSheet } from "react-native";
import { match, P } from "ts-pattern";
import {
  GetVerificationRenewalQuery,
  IndividualRenewalInfoFragment,
  SupportingDocumentRenewalFragment,
} from "../../graphql/partner";
import { NotFoundPage } from "../../pages/NotFoundPage";
import { locale } from "../../utils/i18n";
import { Router, VerificationRenewalRoute, verificationRenewalRoutes } from "../../utils/routes";
import { ErrorView } from "../ErrorView";
import {
  getNextStep,
  getRenewalSteps,
  RenewalStep,
  renewalSteps,
} from "./VerificationRenewalCompany";
import { VerificationRenewalDocuments } from "./VerificationRenewalDocuments";
import {
  VerificationRenewalFinalize,
  VerificationRenewalFinalizeSuccess,
} from "./VerificationRenewalFinalize";
import { VerificationRenewalIntro } from "./VerificationRenewalIntro";
import { VerificationRenewalPersonalInfo } from "./VerificationRenewalPersonalInfo";

const styles = StyleSheet.create({
  stepper: {
    width: "100%",
    maxWidth: 1280,
    paddingHorizontal: 40,
  },
  sticky: {
    position: "sticky",
    top: 0,
    backgroundColor: backgroundColor.default90Transparency,
    backdropFilter: "blur(4px)",
    zIndex: 10,
  },
});

const getCurrentStep = (
  routeName: VerificationRenewalRoute | undefined,
  steps: RenewalStep[],
): RenewalStep | undefined => {
  return steps.find(step => step.id === routeName);
};

const getPreviousStep = (currentStep: RenewalStep, steps: RenewalStep[]) => {
  const index = steps.indexOf(currentStep);
  if (index === -1 || index === 0) {
    return undefined;
  }
  return steps[index - 1];
};

type Props = {
  verificationRenewalId: string;
  info: IndividualRenewalInfoFragment;
  supportingDocumentCollection: SupportingDocumentRenewalFragment | null;
  verificationRenewal: GetVerificationRenewalQuery["verificationRenewal"];
};

export const VerificationRenewalIndividual = ({
  verificationRenewalId,
  info,
  supportingDocumentCollection,
  verificationRenewal,
}: Props) => {
  const route = Router.useRoute(verificationRenewalRoutes);

  const isStepperDisplayed = !isNullish(route) && route.name !== "VerificationRenewalRoot";
  const accountHolderType = "Individual";
  const steps = useMemo(
    () => getRenewalSteps(verificationRenewal, accountHolderType),
    [verificationRenewal],
  );

  const stepperSteps = useMemo<TopLevelStep[]>(
    () =>
      steps.map(step => {
        return {
          id: step.id,
          label: step.label,
          url: Router[step.id]({ verificationRenewalId }),
        };
      }),
    [steps, verificationRenewalId],
  );

  const currentStep = getCurrentStep(route?.name, steps);
  const previousStep = currentStep != null ? getPreviousStep(currentStep, steps) : undefined;

  const isFinalized = steps.length === 0 || steps.length === 1;

  // biome-ignore lint/correctness/useExhaustiveDependencies(route?.name):
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [route?.name]);

  return (
    <Box grow={1}>
      <Box style={styles.sticky}>
        {isStepperDisplayed ? (
          <ResponsiveContainer>
            {({ small }) =>
              small ? (
                <MobileStepTitle activeStepId={route.name} steps={stepperSteps} />
              ) : (
                <Box alignItems="center">
                  <LakeStepper
                    activeStepId={route.name}
                    steps={stepperSteps}
                    style={styles.stepper}
                  />
                </Box>
              )
            }
          </ResponsiveContainer>
        ) : null}
      </Box>

      <Space height={40} />

      {match({ route, isFinalized, supportingDocumentCollection })
        .with({ isFinalized: true }, () => <VerificationRenewalFinalizeSuccess />)
        .with({ route: { name: "VerificationRenewalRoot" } }, () => (
          <VerificationRenewalIntro verificationRenewalId={verificationRenewalId} steps={steps} />
        ))
        .with({ route: { name: "VerificationRenewalPersonalInformation" } }, () => (
          <VerificationRenewalPersonalInfo
            info={info}
            verificationRenewalId={verificationRenewalId}
            previousStep={previousStep}
            accountHolderType={accountHolderType}
          />
        ))
        .with(
          {
            route: { name: "VerificationRenewalDocuments" },
            supportingDocumentCollection: P.nonNullable,
          },
          ({ supportingDocumentCollection }) => {
            const nextStep =
              getNextStep(renewalSteps.renewalDocuments, steps) ?? renewalSteps.finalize;
            return (
              <VerificationRenewalDocuments
                templateLanguage={locale.language}
                previousStep={previousStep}
                nextStep={nextStep}
                verificationRenewalId={verificationRenewalId}
                supportingDocumentCollection={supportingDocumentCollection}
              />
            );
          },
        )
        .with({ route: { name: "VerificationRenewalFinalize" } }, () => (
          <VerificationRenewalFinalize
            verificationRenewalId={verificationRenewalId}
            previousStep={previousStep}
          />
        ))
        .with(P.nullish, () => <NotFoundPage />)

        .otherwise(() => (
          <ErrorView />
        ))}
    </Box>
  );
};
