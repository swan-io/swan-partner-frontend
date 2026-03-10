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
import { OnboardingHeader } from "../../../components/OnboardingHeader";
import { CompanyOnboardingFragment } from "../../../graphql/partner";
import { t } from "../../../utils/i18n";
import { CompanyOnboardingRouteV2, Router, companyOnboardingRoutesV2 } from "../../../utils/routes";
import { extractServerInvalidFields } from "../../../utils/validation";
import { NotFoundPage } from "../../NotFoundPage";
import { ActivityFieldApiRequired, OnboardingCompanyActivity } from "./OnboardingCompanyActivity";
import { DetailsFieldApiRequired, OnboardingCompanyDetails } from "./OnboardingCompanyDetails";
import { OnboardingCompanyFinalize } from "./OnboardingCompanyFinalize";
import {
  OnboardingCompanyOrganisation,
  OrganisationFieldApiRequired,
} from "./OnboardingCompanyOrganisation";
import { OnboardingCompanyOwnership } from "./OnboardingCompanyOwnership";
import { InitFieldApiRequired, OnboardingCompanyRoot } from "./OnboardingCompanyRoot";

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
  onboarding: NonNullable<CompanyOnboardingFragment>;
};

export const OnboardingCompanyWizard = ({ onboarding }: Props) => {
  const route = Router.useRoute(companyOnboardingRoutesV2);
  const isStepperDisplayed = !isNullish(route) && route.name !== "Root";

  const onboardingId = onboarding.id;
  const projectName = onboarding.projectInfo?.name ?? "";
  const projectLogo = onboarding.projectInfo?.logoUri ?? logoSwan;

  const [finalized, setFinalized] = useBoolean(false);

  const detailsStepErrors = useMemo(() => {
    return extractServerInvalidFields(onboarding.statusInfo, field =>
      match(field)
        .returnType<DetailsFieldApiRequired | null>()
        .with("accountAdmin.email", () => "email")
        .otherwise(() => null),
    );
  }, [onboarding.statusInfo]);

  const organisationStepErrors = useMemo(() => {
    return extractServerInvalidFields(onboarding.statusInfo, field =>
      match(field)
        .returnType<OrganisationFieldApiRequired | null>()
        .with("company.address.addressLine1", () => "address")
        .with("company.address.city", () => "city")
        .with("company.address.postalCode", () => "postalCode")
        .with("company.vatNumber", () => "vatNumber")
        .with("company.taxIdentificationNumber", () => "taxIdentificationNumber")
        .with("company.registrationNumber", () => "registrationNumber")
        .otherwise(() => null),
    );
  }, [onboarding.statusInfo]);

  const activityStepErrors = useMemo(() => {
    return extractServerInvalidFields(onboarding.statusInfo, field =>
      match(field)
        .returnType<ActivityFieldApiRequired | null>()
        .with("company.businessActivity", () => "businessActivity")
        .with("company.businessActivityDescription", () => "businessActivityDescription")
        .with("company.monthlyPaymentVolume", () => "monthlyPaymentVolume")
        .otherwise(() => null),
    );
  }, [onboarding.statusInfo]);

  const initStepErrors = useMemo(() => {
    return extractServerInvalidFields(onboarding.statusInfo, field =>
      match(field)
        .returnType<InitFieldApiRequired | null>()
        .with("company.name", () => "name")
        .with("company.address.country", () => "country")
        .with("company.legalFormCode", () => "legalFormCode")
        .with("accountAdmin.typeOfRepresentation", () => "typeOfRepresentation")
        .otherwise(() => null),
    );
  }, [onboarding.statusInfo]);

  const steps = useMemo<WizardStep<CompanyOnboardingRouteV2>[]>(
    () => [
      {
        id: "Root",
        label: "",
        errors: initStepErrors,
      },
      {
        id: "Details",
        label: t("step.title.about"),
        errors: detailsStepErrors,
      },
      {
        id: "Organisation",
        label: t("step.title.organisation"),
        errors: organisationStepErrors,
      },
      {
        id: "Activity",
        label: t("step.title.activity"),
        errors: activityStepErrors,
      },
      {
        id: "Ownership",
        label: t("step.title.ownership"),
        errors: [],
      },
      {
        id: "Documents",
        label: t("step.title.document"),
        errors: [],
      },
      {
        id: "Finalize",
        label: t("step.title.swanApp"),
        errors: [],
      },
    ],
    [detailsStepErrors, organisationStepErrors, activityStepErrors, initStepErrors],
  );

  const stepperSteps = useMemo<Step[]>(
    () =>
      steps
        .filter(step => step.id !== "Root")
        .map(step => ({
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
              .with({ name: "Root" }, () => (
                <OnboardingCompanyRoot
                  onboarding={onboarding}
                  serverValidationErrors={finalized ? initStepErrors : []}
                />
              ))
              .with({ name: "Details" }, () => (
                <OnboardingCompanyDetails
                  onboarding={onboarding}
                  serverValidationErrors={finalized ? detailsStepErrors : []}
                />
              ))
              .with({ name: "Organisation" }, () => (
                <OnboardingCompanyOrganisation
                  onboarding={onboarding}
                  serverValidationErrors={finalized ? organisationStepErrors : []}
                />
              ))
              .with({ name: "Activity" }, () => (
                <OnboardingCompanyActivity
                  onboarding={onboarding}
                  serverValidationErrors={finalized ? activityStepErrors : []}
                />
              ))
              .with({ name: "Ownership" }, () => (
                <OnboardingCompanyOwnership onboarding={onboarding} />
              ))
              .with({ name: "Documents" }, () => <p>todo document</p>)
              .with({ name: "Finalize" }, () => (
                <OnboardingCompanyFinalize
                  onboarding={onboarding}
                  steps={steps}
                  alreadySubmitted={finalized}
                  onSubmitWithErrors={setFinalized.on}
                />
              ))
              .with(P.nullish, () => <NotFoundPage />)
              .exhaustive()}
          </Box>
        </Box>
      )}
    </ResponsiveContainer>
  );
};
