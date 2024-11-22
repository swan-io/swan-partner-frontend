import { Box } from "@swan-io/lake/src/components/Box";
import { LakeStepper, MobileStepTitle, Step } from "@swan-io/lake/src/components/LakeStepper";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { backgroundColor } from "@swan-io/lake/src/constants/design";
import { useBoolean } from "@swan-io/lake/src/hooks/useBoolean";
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
import { GetOnboardingQuery, IndividualAccountHolderFragment } from "../../graphql/unauthenticated";
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
    : (accountCountry ?? individualFallbackCountry);
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

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [route?.name]);

  return (
    <Box grow={1}>
      <Box style={styles.sticky}>
        <OnboardingHeader projectName={projectName} projectLogo={projectLogo} />

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
