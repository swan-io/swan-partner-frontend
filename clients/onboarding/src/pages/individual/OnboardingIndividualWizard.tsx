import { Array, Option } from "@swan-io/boxed";
import { pushUnsafe } from "@swan-io/chicane";
import { Box } from "@swan-io/lake/src/components/Box";
import { LakeStepper, MobileStepTitle, Step } from "@swan-io/lake/src/components/LakeStepper";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { backgroundColor } from "@swan-io/lake/src/constants/design";
import { useBoolean } from "@swan-io/lake/src/hooks/useBoolean";
import { isNullish } from "@swan-io/lake/src/utils/nullish";
import { FragmentOf, readFragment } from "gql.tada";
import { useEffect, useMemo } from "react";
import { StyleSheet } from "react-native";
import { P, match } from "ts-pattern";
import { OnboardingHeader, OnboardingHeaderFragment } from "../../components/OnboardingHeader";
import { OnboardingStatusInfoFragment } from "../../fragments/OnboardingStatusInfoFragment";
import { WizardStep } from "../../types/WizardStep";
import { graphql } from "../../utils/gql";
import { t } from "../../utils/i18n";
import { TrackingProvider } from "../../utils/matomo";
import { IndividualOnboardingRoute, Router, individualOnboardingRoutes } from "../../utils/routes";
import { extractServerInvalidFields } from "../../utils/validation";
import { NotFoundPage } from "../NotFoundPage";
import { IndividualFlowPresentation } from "./IndividualFlowPresentation";
import {
  DetailsFieldName,
  IndividualDetailsAccountHolderInfoFragment,
  IndividualDetailsOnboardingInfoFragment,
  OnboardingIndividualDetails,
} from "./OnboardingIndividualDetails";
import {
  IndividualEmailOnboardingInfoFragment,
  OnboardingIndividualEmail,
} from "./OnboardingIndividualEmail";
import { OnboardingIndividualFinalize } from "./OnboardingIndividualFinalize";
import {
  IndividualLocationAccountHolderInfoFragment,
  IndividualLocationOnboardingInfoFragment,
  LocationFieldName,
  OnboardingIndividualLocation,
} from "./OnboardingIndividualLocation";

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

export const IndividualOnboardingInfoFragment = graphql(
  `
    fragment IndividualOnboardingInfo on OnboardingInfo {
      id
      statusInfo {
        ...OnboardingStatusInfo
      }
      projectInfo {
        id
        ...OnboardingHeader
      }
      legalRepresentativeRecommendedIdentificationLevel
      ...IndividualEmailOnboardingInfo
      ...IndividualLocationOnboardingInfo
      ...IndividualDetailsOnboardingInfo
    }
  `,
  [
    OnboardingHeaderFragment,
    OnboardingStatusInfoFragment,
    IndividualEmailOnboardingInfoFragment,
    IndividualLocationOnboardingInfoFragment,
    IndividualDetailsOnboardingInfoFragment,
  ],
);

export const IndividualAccountHolderInfoFragment = graphql(
  `
    fragment IndividualAccountHolderInfo on OnboardingIndividualAccountHolderInfo {
      ...IndividualLocationAccountHolderInfo
      ...IndividualDetailsAccountHolderInfo
    }
  `,
  [IndividualLocationAccountHolderInfoFragment, IndividualDetailsAccountHolderInfoFragment],
);

type Props = {
  onboardingInfoData: FragmentOf<typeof IndividualOnboardingInfoFragment>;
  individualAccountHolderInfoData: FragmentOf<typeof IndividualAccountHolderInfoFragment>;
};

export const OnboardingIndividualWizard = ({
  onboardingInfoData,
  individualAccountHolderInfoData,
}: Props) => {
  const onboardingInfo = readFragment(IndividualOnboardingInfoFragment, onboardingInfoData);
  const accountHolderInfo = readFragment(
    IndividualAccountHolderInfoFragment,
    individualAccountHolderInfoData,
  );

  const onboardingId = onboardingInfo.id;

  const route = Router.useRoute(individualOnboardingRoutes);
  const isStepperDisplayed = !isNullish(route) && route.name !== "Root";

  const [finalized, setFinalized] = useBoolean(false);

  const statusInfo = readFragment(OnboardingStatusInfoFragment, onboardingInfo.statusInfo);

  const emailStepErrors = useMemo(() => {
    return extractServerInvalidFields(statusInfo, field =>
      match(field)
        .returnType<"email" | null>()
        .with("email", () => "email")
        .otherwise(() => null),
    );
  }, [statusInfo]);

  const locationStepErrors = useMemo(() => {
    return extractServerInvalidFields(statusInfo, field =>
      match(field)
        .returnType<LocationFieldName | null>()
        .with("residencyAddress.country", () => "country")
        .with("residencyAddress.city", () => "city")
        .with("residencyAddress.addressLine1", () => "address")
        .with("residencyAddress.postalCode", () => "postalCode")
        .otherwise(() => null),
    );
  }, [statusInfo]);

  const detailsStepErrors = useMemo(() => {
    return extractServerInvalidFields(statusInfo, field =>
      match(field)
        .returnType<DetailsFieldName | null>()
        .with("employmentStatus", () => "employmentStatus")
        .with("monthlyIncome", () => "monthlyIncome")
        .with("taxIdentificationNumber", () => "taxIdentificationNumber")
        .otherwise(() => null),
    );
  }, [statusInfo]);

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
