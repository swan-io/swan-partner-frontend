import { Box } from "@swan-io/lake/src/components/Box";
import { LakeStepper, MobileStepTitle, Step } from "@swan-io/lake/src/components/LakeStepper";
import { LoadingView } from "@swan-io/lake/src/components/LoadingView";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { backgroundColor, colors } from "@swan-io/lake/src/constants/design";
import { useBoolean } from "@swan-io/lake/src/hooks/useBoolean";
import { useUrqlMutation } from "@swan-io/lake/src/hooks/useUrqlMutation";
import { isNullish } from "@swan-io/lake/src/utils/nullish";
import {
  individualFallbackCountry,
  isCountryCCA3,
} from "@swan-io/shared-business/src/constants/countries";
import { useEffect, useMemo } from "react";
import { StyleSheet } from "react-native";
import { P, match } from "ts-pattern";
import logoSwan from "../../assets/imgs/logo-swan.svg";
import { OnboardingHeader } from "../../components/OnboardingHeader";
import {
  GetOnboardingQuery,
  IndividualAccountHolderFragment,
  UpdateIndividualOnboardingDocument,
} from "../../graphql/unauthenticated";
import { locale, t } from "../../utils/i18n";
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
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: backgroundColor.default,
  },
  stepper: {
    width: "100%",
    maxWidth: 1280,
    paddingHorizontal: 40,
  },
});

type Props = {
  onboarding: NonNullable<GetOnboardingQuery["onboardingInfo"]>;
  onboardingId: string;
  holder: IndividualAccountHolderFragment;
};

export const OnboardingIndividualWizard = ({ onboarding, holder, onboardingId }: Props) => {
  const route = Router.useRoute(individualOnboardingRoutes);
  const isStepperDisplayed = !isNullish(route) && route.name !== "Root";

  const projectName = onboarding.projectInfo?.name ?? "";
  const projectLogo = onboarding.projectInfo?.logoUri ?? logoSwan;
  const accountCountry = onboarding.accountCountry ?? "FRA";

  const address = holder.residencyAddress;
  const addressCountry = address?.country;
  const country = isCountryCCA3(addressCountry)
    ? addressCountry
    : accountCountry ?? individualFallbackCountry;
  const addressLine1 = address?.addressLine1 ?? "";
  const city = address?.city ?? "";
  const postalCode = address?.postalCode ?? "";

  const [finalized, setFinalized] = useBoolean(false);

  const emailStepErrors = useMemo(() => {
    return extractServerInvalidFields(onboarding.statusInfo, field =>
      match(field)
        .returnType<"email" | null>()
        .with("email", () => "email")
        .otherwise(() => null),
    );
  }, [onboarding.statusInfo]);

  const locationStepErrors = useMemo(() => {
    return extractServerInvalidFields(onboarding.statusInfo, field =>
      match(field)
        .returnType<LocationFieldName | null>()
        .with("residencyAddress.country", () => "country")
        .with("residencyAddress.city", () => "city")
        .with("residencyAddress.addressLine1", () => "address")
        .with("residencyAddress.postalCode", () => "postalCode")
        .otherwise(() => null),
    );
  }, [onboarding.statusInfo]);

  const detailsStepErrors = useMemo(() => {
    return extractServerInvalidFields(onboarding.statusInfo, field =>
      match(field)
        .returnType<DetailsFieldName | null>()
        .with("employmentStatus", () => "employmentStatus")
        .with("monthlyIncome", () => "monthlyIncome")
        .with("taxIdentificationNumber", () => "taxIdentificationNumber")
        .otherwise(() => null),
    );
  }, [onboarding.statusInfo]);

  const steps = useMemo<WizardStep<IndividualOnboardingRoute>[]>(
    () => [
      {
        id: "Email",
        label: t("step.title.email"),
        errors: emailStepErrors,
      },
      {
        id: "Location",
        label: t("step.title.address"),
        errors: locationStepErrors,
      },
      {
        id: "Details",
        label: t("step.title.occupation"),
        errors: detailsStepErrors,
      },
      {
        id: "Finalize",
        label: t("step.title.swanApp"),
        errors: [],
      },
    ],
    [emailStepErrors, locationStepErrors, detailsStepErrors],
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

  const [updateResult, updateOnboarding] = useUrqlMutation(UpdateIndividualOnboardingDocument);

  useEffect(() => {
    updateOnboarding({
      input: { onboardingId, language: locale.language },
      language: locale.language,
    });
  }, [onboarding.language, onboardingId, updateOnboarding]);

  if (!updateResult.isDone()) {
    return <LoadingView color={colors.gray[400]} />;
  }

  return (
    <Box style={styles.container}>
      <OnboardingHeader projectName={projectName} projectLogo={projectLogo} />
      <Space height={12} />

      {isStepperDisplayed ? (
        <ResponsiveContainer>
          {({ small }) =>
            small ? (
              <>
                <MobileStepTitle activeStepId={route.name} steps={stepperSteps} />
                <Space height={24} />
              </>
            ) : (
              <>
                <Box alignItems="center">
                  <LakeStepper
                    activeStepId={route.name}
                    steps={stepperSteps}
                    style={styles.stepper}
                  />
                </Box>

                <Space height={48} />
              </>
            )
          }
        </ResponsiveContainer>
      ) : null}

      {match(route)
        .with({ name: "Root" }, ({ params }) => (
          <TrackingProvider category="Presentation">
            <IndividualFlowPresentation onboardingId={params.onboardingId} />
          </TrackingProvider>
        ))
        .with({ name: "Email" }, ({ params }) => (
          <TrackingProvider category="Email">
            <OnboardingIndividualEmail
              onboardingId={params.onboardingId}
              initialEmail={onboarding.email ?? ""}
              projectName={onboarding.projectInfo?.name ?? ""}
              accountCountry={accountCountry}
              serverValidationErrors={finalized ? emailStepErrors : []}
              tcuUrl={onboarding.tcuUrl}
              tcuDocumentUri={onboarding.projectInfo?.tcuDocumentUri}
            />
          </TrackingProvider>
        ))
        .with({ name: "Location" }, ({ params }) => (
          <TrackingProvider category="Location">
            <OnboardingIndividualLocation
              onboardingId={params.onboardingId}
              initialCountry={country}
              initialAddressLine1={addressLine1}
              initialCity={city}
              initialPostalCode={postalCode}
              serverValidationErrors={finalized ? locationStepErrors : []}
            />
          </TrackingProvider>
        ))
        .with({ name: "Details" }, ({ params }) => (
          <TrackingProvider category="Details">
            <OnboardingIndividualDetails
              onboardingId={params.onboardingId}
              initialEmploymentStatus={holder.employmentStatus ?? "Employee"}
              initialMonthlyIncome={holder.monthlyIncome ?? "Between1500And3000"}
              initialTaxIdentificationNumber={onboarding.info.taxIdentificationNumber ?? ""}
              country={country}
              accountCountry={accountCountry}
              serverValidationErrors={finalized ? detailsStepErrors : []}
            />
          </TrackingProvider>
        ))
        .with({ name: "Finalize" }, ({ params }) => (
          <TrackingProvider category="Finalize">
            <OnboardingIndividualFinalize
              onboardingId={params.onboardingId}
              legalRepresentativeRecommendedIdentificationLevel={
                onboarding.legalRepresentativeRecommendedIdentificationLevel
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
