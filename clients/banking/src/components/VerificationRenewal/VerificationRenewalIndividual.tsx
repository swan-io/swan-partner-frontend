import { Box } from "@swan-io/lake/src/components/Box";
import {
  LakeStepper,
  MobileStepTitle,
  TopLevelStep,
} from "@swan-io/lake/src/components/LakeStepper";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { backgroundColor } from "@swan-io/lake/src/constants/design";
import { isNotNullish, isNullish } from "@swan-io/lake/src/utils/nullish";
import { useEffect, useMemo } from "react";
import { StyleSheet } from "react-native";
import { match, P } from "ts-pattern";
import {
  IndividualRenewalInfoFragment,
  SupportingDocumentRenewalFragment,
} from "../../graphql/partner";
import { NotFoundPage } from "../../pages/NotFoundPage";
import { t } from "../../utils/i18n";
import { Router, VerificationRenewalRoute, verificationRenewalRoutes } from "../../utils/routes";
import { ErrorView } from "../ErrorView";
import { VerificationRenewalDocuments } from "./VerificationRenewalDocuments";
import { VerificationRenewalFinalize } from "./VerificationRenewalFinalize";
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

type Props = {
  verificationRenewalId: string;
  info: IndividualRenewalInfoFragment;
  supportingDocumentCollection: SupportingDocumentRenewalFragment | null;
};

export const VerificationRenewalIndividual = ({
  verificationRenewalId,
  info,
  supportingDocumentCollection,
}: Props) => {
  const route = Router.useRoute(verificationRenewalRoutes);

  const isStepperDisplayed =
    !isNullish(route) &&
    route.name !== "VerificationRenewalRoot" &&
    route.name !== "VerificationRenewalFinalize";

  const steps = useMemo<WizardStep<VerificationRenewalRoute>[]>(() => {
    const steps: WizardStep<VerificationRenewalRoute>[] = [];
    steps.push({
      id: "VerificationRenewalPersonalInformation",
      label: t("verificationRenewal.step.personalInfo"),
      errors: [],
    });

    if (isNotNullish(supportingDocumentCollection)) {
      steps.push({
        id: "VerificationRenewalDocuments",
        label: t("verificationRenewal.step.documents"),
        errors: [],
      });
    }
    steps.push({
      id: "VerificationRenewalFinalize",
      label: t("verificationRenewal.step.finalize"),
      errors: [],
    });

    return steps;
  }, [supportingDocumentCollection]);

  const stepperSteps = useMemo<TopLevelStep[]>(
    () =>
      steps.map(step => {
        return {
          id: step.id,
          label: step.label,
          url: Router[step.id]({ verificationRenewalId }),
          hasErrors: step.errors.length > 0,
        };
      }),
    [steps, verificationRenewalId],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies(route?.name):
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [route?.name]);

  return (
    // <ResponsiveContainer breakpoint={breakpoints.medium} style={commonStyles.fill}>
    //   {({ small }) => (
    //     <>
    //       {
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

      {match({ route, supportingDocumentCollection })
        .with({ route: { name: "VerificationRenewalRoot" } }, () => (
          <VerificationRenewalIntro verificationRenewalId={verificationRenewalId} />
        ))
        .with({ route: { name: "VerificationRenewalPersonalInformation" } }, () => (
          <VerificationRenewalPersonalInfo
            info={info}
            verificationRenewalId={verificationRenewalId}
          />
        ))
        .with(
          {
            route: { name: "VerificationRenewalDocuments" },
            supportingDocumentCollection: P.nonNullable,
          },
          ({ supportingDocumentCollection }) => (
            <VerificationRenewalDocuments
              verificationRenewalId={verificationRenewalId}
              supportingDocumentCollection={supportingDocumentCollection}
            />
          ),
        )
        .with({ route: { name: "VerificationRenewalFinalize" } }, () => (
          <VerificationRenewalFinalize />
        ))
        .with(P.nullish, () => <NotFoundPage />)

        .otherwise(() => (
          <ErrorView />
        ))}
    </Box>
    //       }
    //     </>

    //   )}
    // </ResponsiveContainer>
  );
};
