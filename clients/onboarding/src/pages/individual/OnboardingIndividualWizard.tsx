import { Array, Option } from "@swan-io/boxed";
import { pushUnsafe } from "@swan-io/chicane";
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
import { OnboardingHeader } from "../../components/OnboardingHeader";
import { FragmentType, getFragmentData, graphql } from "../../gql";
import { WizardStep } from "../../types/WizardStep";
import { t } from "../../utils/i18n";
import { TrackingProvider } from "../../utils/matomo";
import { IndividualOnboardingRoute, Router, individualOnboardingRoutes } from "../../utils/routes";
import { extractServerInvalidFields } from "../../utils/validation";
import { NotFoundPage } from "../NotFoundPage";
import { IndividualFlowPresentation } from "./IndividualFlowPresentation";
import { DetailsFieldName, OnboardingIndividualDetails } from "./OnboardingIndividualDetails";
import { OnboardingIndividualEmail } from "./OnboardingIndividualEmail";
import { OnboardingIndividualFinalize } from "./OnboardingIndividualFinalize";
import { LocationFieldName, OnboardingIndividualLocation } from "./OnboardingIndividualLocation";

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

export const OnboardingIndividualWizard_OnboardingInfo = graphql(`
  fragment OnboardingIndividualWizard_OnboardingInfo on OnboardingInfo {
    id
    statusInfo {
      __typename
      ... on OnboardingInvalidStatusInfo {
        __typename
        errors {
          field
          errors
        }
      }
      ... on OnboardingFinalizedStatusInfo {
        __typename
      }
      ... on OnboardingValidStatusInfo {
        __typename
      }
    }
    projectInfo {
      id
      ...OnboardingHeader_ProjectInfo
    }
    legalRepresentativeRecommendedIdentificationLevel
    ...OnboardingIndividualEmail_OnboardingInfo
    ...OnboardingIndividualLocation_OnboardingInfo
    ...OnboardingIndividualDetails_OnboardingInfo
  }
`);

export const OnboardingIndividualWizard_OnboardingIndividualAccountHolderInfo = graphql(`
  fragment OnboardingIndividualWizard_OnboardingIndividualAccountHolderInfo on OnboardingIndividualAccountHolderInfo {
    ...OnboardingIndividualLocation_OnboardingIndividualAccountHolderInfo
    ...OnboardingIndividualDetails_OnboardingIndividualAccountHolderInfo
  }
`);

type Props = {
  onboardingInfoData: FragmentType<typeof OnboardingIndividualWizard_OnboardingInfo>;
  individualAccountHolderInfoData: FragmentType<
    typeof OnboardingIndividualWizard_OnboardingIndividualAccountHolderInfo
  >;
};

export const OnboardingIndividualWizard = ({
  onboardingInfoData,
  individualAccountHolderInfoData,
}: Props) => {
  const onboardingInfo = getFragmentData(
    OnboardingIndividualWizard_OnboardingInfo,
    onboardingInfoData,
  );

  const accountHolderInfo = getFragmentData(
    OnboardingIndividualWizard_OnboardingIndividualAccountHolderInfo,
    individualAccountHolderInfoData,
  );

  const onboardingId = onboardingInfo.id;

  const route = Router.useRoute(individualOnboardingRoutes);
  const isStepperDisplayed = !isNullish(route) && route.name !== "Root";

  const [finalized, setFinalized] = useBoolean(false);

  const validationErrors = match(onboardingInfo.statusInfo)
    .with({ __typename: "OnboardingInvalidStatusInfo" }, ({ errors }) => errors)
    .otherwise(() => []);

  const emailStepErrors = useMemo(() => {
    return extractServerInvalidFields(validationErrors, field =>
      match(field)
        .returnType<"email" | null>()
        .with("email", () => "email")
        .otherwise(() => null),
    );
  }, [validationErrors]);

  const locationStepErrors = useMemo(() => {
    return extractServerInvalidFields(validationErrors, field =>
      match(field)
        .returnType<LocationFieldName | null>()
        .with("residencyAddress.country", () => "country")
        .with("residencyAddress.city", () => "city")
        .with("residencyAddress.addressLine1", () => "address")
        .with("residencyAddress.postalCode", () => "postalCode")
        .otherwise(() => null),
    );
  }, [validationErrors]);

  const detailsStepErrors = useMemo(() => {
    return extractServerInvalidFields(validationErrors, field =>
      match(field)
        .returnType<DetailsFieldName | null>()
        .with("employmentStatus", () => "employmentStatus")
        .with("monthlyIncome", () => "monthlyIncome")
        .with("taxIdentificationNumber", () => "taxIdentificationNumber")
        .otherwise(() => null),
    );
  }, [validationErrors]);

  const steps = useMemo<WizardStep[]>(
    () => [
      {
        id: "Email",
        url: Router.Email({ onboardingId }),
        label: t("step.title.email"),
        errors: emailStepErrors,
      },
      {
        id: "Location",
        url: Router.Location({ onboardingId }),
        label: t("step.title.address"),
        errors: locationStepErrors,
      },
      {
        id: "Details",
        url: Router.Details({ onboardingId }),
        label: t("step.title.occupation"),
        errors: detailsStepErrors,
      },
      {
        id: "Finalize",
        url: Router.Finalize({ onboardingId }),
        label: t("step.title.swanApp"),
        errors: [],
      },
    ],
    [onboardingId, emailStepErrors, locationStepErrors, detailsStepErrors],
  );

  const stepperSteps = useMemo<Step[]>(
    () =>
      steps.map(step => ({
        id: step.id,
        label: step.label,
        url: step.url,
        hasErrors: finalized && step.errors.length > 0,
      })),
    [steps, finalized],
  );

  const goToNextStepFrom = (currentStep: IndividualOnboardingRoute) => {
    Array.findIndex(steps, step => step.id === currentStep)
      .flatMap(index => Option.fromNullable(steps[index + 1]))
      .tapSome(step => pushUnsafe(step.url));
  };

  const goToPreviousStepFrom = (currentStep: IndividualOnboardingRoute) => {
    Array.findIndex(steps, step => step.id === currentStep)
      .flatMap(index => Option.fromNullable(steps[index - 1]))
      .tapSome(step => pushUnsafe(step.url));
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [route?.name]);

  return (
    <Box grow={1}>
      <Box style={styles.sticky}>
        <OnboardingHeader projectInfoData={onboardingInfo.projectInfo} />

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

      {isStepperDisplayed ? (
        <ResponsiveContainer>
          {({ small }) => <Space height={small ? 24 : 48} />}
        </ResponsiveContainer>
      ) : null}

      {match(route)
        .with({ name: "Root" }, () => (
          <TrackingProvider category="Presentation">
            <IndividualFlowPresentation
              onPressNext={() => Router.push("Email", { onboardingId })}
            />
          </TrackingProvider>
        ))
        .with({ name: "Email" }, ({ name }) => (
          <TrackingProvider category="Email">
            <OnboardingIndividualEmail
              onboardingId={onboardingId}
              onboardingInfoData={onboardingInfo}
              serverValidationErrors={finalized ? emailStepErrors : []}
              onPressPrevious={() => goToPreviousStepFrom(name)}
              onSave={() => goToNextStepFrom(name)}
            />
          </TrackingProvider>
        ))
        .with({ name: "Location" }, ({ name }) => (
          <TrackingProvider category="Location">
            <OnboardingIndividualLocation
              onboardingId={onboardingId}
              onboardingInfoData={onboardingInfo}
              accountHolderInfoData={accountHolderInfo}
              serverValidationErrors={finalized ? locationStepErrors : []}
              onPressPrevious={() => goToPreviousStepFrom(name)}
              onSave={() => goToNextStepFrom(name)}
            />
          </TrackingProvider>
        ))
        .with({ name: "Details" }, ({ name }) => (
          <TrackingProvider category="Details">
            <OnboardingIndividualDetails
              onboardingId={onboardingId}
              onboardingInfoData={onboardingInfo}
              accountHolderInfoData={accountHolderInfo}
              serverValidationErrors={finalized ? detailsStepErrors : []}
              onPressPrevious={() => goToPreviousStepFrom(name)}
              onSave={() => goToNextStepFrom(name)}
            />
          </TrackingProvider>
        ))
        .with({ name: "Finalize" }, () => (
          <TrackingProvider category="Finalize">
            <OnboardingIndividualFinalize
              onboardingId={onboardingId}
              legalRepresentativeRecommendedIdentificationLevel={
                onboardingInfo.legalRepresentativeRecommendedIdentificationLevel
              }
              steps={steps}
              alreadySubmitted={finalized}
              onSubmitWithErrors={setFinalized.on}
            />
          </TrackingProvider>
        ))
        .with(P.nullish, () => <NotFoundPage />)
        .exhaustive()}
    </Box>
  );
};
