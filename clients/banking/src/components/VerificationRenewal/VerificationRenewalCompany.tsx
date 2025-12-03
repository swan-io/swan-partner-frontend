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
  CompanyRenewalInfoFragment,
  SupportingDocumentRenewalFragment,
} from "../../graphql/partner";
import { NotFoundPage } from "../../pages/NotFoundPage";
import { t } from "../../utils/i18n";
import { Router, VerificationRenewalRoute, verificationRenewalRoutes } from "../../utils/routes";
import { ErrorView } from "../ErrorView";
import { VerificationRenewalAccountHolderInformation } from "./VerificationRenewalAccountHolderInformation";
import { VerificationRenewalAdministratorInformation } from "./VerificationRenewalAdministratorInformation";
import { VerificationRenewalDocuments } from "./VerificationRenewalDocuments";
import { VerificationRenewalFinalize } from "./VerificationRenewalFinalize";
import { VerificationRenewalIntro } from "./VerificationRenewalIntro";

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
  info: CompanyRenewalInfoFragment;
  supportingDocumentCollection: SupportingDocumentRenewalFragment | null;
};

export const VerificationRenewalCompany = ({
  info,
  supportingDocumentCollection,
  verificationRenewalId,
}: Props) => {
  const route = Router.useRoute(verificationRenewalRoutes);

  const isStepperDisplayed =
    !isNullish(route) &&
    route.name !== "VerificationRenewalRoot" &&
    route.name !== "VerificationRenewalFinalize";

  const steps = useMemo<WizardStep<VerificationRenewalRoute>[]>(() => {
    const steps: WizardStep<VerificationRenewalRoute>[] = [];
    steps.push({
      id: "VerificationRenewalAccountHolderInformation",
      label: t("verificationRenewal.step.personalInfo"),
      errors: [],
    });
    steps.push({
      id: "VerificationRenewalAdministratorInformation",
      label: t("verificationRenewal.step.personalInfo"),
      errors: [],
    });
    steps.push({
      id: "VerificationRenewalOwnership",
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
          <VerificationRenewalIntro
            verificationRenewalId={verificationRenewalId}
            renewalTypename={info.__typename}
          />
        ))
        .with({ route: { name: "VerificationRenewalAccountHolderInformation" } }, () => (
          <VerificationRenewalAccountHolderInformation
            info={info}
            verificationRenewalId={verificationRenewalId}
          />
        ))
        .with({ route: { name: "VerificationRenewalAdministratorInformation" } }, () => (
          <VerificationRenewalAdministratorInformation
            info={info}
            verificationRenewalId={verificationRenewalId}
          />
        ))
        .with({ route: { name: "VerificationRenewalOwnership" } }, () => (
          <p>VerificationRenewalOwnership</p>
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
  );
};
