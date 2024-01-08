import { Array, Option } from "@swan-io/boxed";
import { Box } from "@swan-io/lake/src/components/Box";
import {
  LakeStepper,
  MobileStepTitle,
  TopLevelStep,
} from "@swan-io/lake/src/components/LakeStepper";
import { LoadingView } from "@swan-io/lake/src/components/LoadingView";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { backgroundColor, colors } from "@swan-io/lake/src/constants/design";
import { useBoolean } from "@swan-io/lake/src/hooks/useBoolean";
import { useUrqlMutation } from "@swan-io/lake/src/hooks/useUrqlMutation";
import { isNotNullish, isNullish } from "@swan-io/lake/src/utils/nullish";
import {
  Document,
  SupportingDocumentPurpose,
  uploadableDocumentTypes,
} from "@swan-io/shared-business/src/components/SupportingDocument";
import {
  companyFallbackCountry,
  isCompanyCountryCCA3,
} from "@swan-io/shared-business/src/constants/countries";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet } from "react-native";
import { P, match } from "ts-pattern";
import logoSwan from "../../assets/imgs/logo-swan.svg";
import { OnboardingHeader } from "../../components/OnboardingHeader";
import {
  CompanyAccountHolderFragment,
  GetOnboardingQuery,
  SupportingDocumentPurposeEnum,
  UpdateCompanyOnboardingDocument,
} from "../../graphql/unauthenticated";
import { locale, t } from "../../utils/i18n";
import { TrackingProvider } from "../../utils/matomo";
import { CompanyOnboardingRoute, Router, companyOnboardingRoutes } from "../../utils/routes";
import { extractServerInvalidFields } from "../../utils/validation";
import { NotFoundPage } from "../NotFoundPage";
import { CompanyFlowPresentation } from "./CompanyFlowPresentation";
import { OnboardingCompanyBasicInfo } from "./OnboardingCompanyBasicInfo";
import { OnboardingCompanyDocuments } from "./OnboardingCompanyDocuments";
import { OnboardingCompanyFinalize } from "./OnboardingCompanyFinalize";
import {
  OnboardingCompanyOrganisation1,
  Organisation1FieldName,
} from "./OnboardingCompanyOrganisation1";
import {
  OnboardingCompanyOrganisation2,
  Organisation2FieldName,
} from "./OnboardingCompanyOrganisation2";
import { OnboardingCompanyOwnership } from "./OnboardingCompanyOwnership";
import {
  OnboardingCompanyRegistration,
  RegistrationFieldName,
} from "./OnboardingCompanyRegistration";

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
  holder: CompanyAccountHolderFragment;
};

const getNextStep = (
  currentStep: CompanyOnboardingRoute,
  steps: WizardStep<CompanyOnboardingRoute>[],
): CompanyOnboardingRoute => {
  return Array.findIndex(steps, step => step.id === currentStep)
    .flatMap(index => Option.fromNullable(steps[index + 1]))
    .map(step => step.id)
    .getWithDefault(currentStep);
};

const getPreviousStep = (
  currentStep: CompanyOnboardingRoute,
  steps: WizardStep<CompanyOnboardingRoute>[],
): CompanyOnboardingRoute => {
  return Array.findIndex(steps, step => step.id === currentStep)
    .flatMap(index => Option.fromNullable(steps[index - 1]))
    .map(step => step.id)
    .getWithDefault(currentStep);
};

const uploadableDocuments: SupportingDocumentPurposeEnum[] = uploadableDocumentTypes;

export const OnboardingCompanyWizard = ({ onboarding, onboardingId, holder }: Props) => {
  const route = Router.useRoute(companyOnboardingRoutes);

  const isStepperDisplayed =
    !isNullish(route) && route.name !== "Root" && route.name !== "Presentation";

  const projectName = onboarding.projectInfo?.name ?? "";
  const projectLogo = onboarding.projectInfo?.logoUri ?? logoSwan;
  const accountCountry = onboarding.accountCountry ?? "FRA";

  const ubos = useMemo(() => {
    return onboarding.info.__typename === "OnboardingCompanyAccountHolderInfo"
      ? onboarding.info.individualUltimateBeneficialOwners ?? []
      : [];
  }, [onboarding.info]);

  const address = holder.residencyAddress;
  const country = address?.country;
  const companyCountry = isCompanyCountryCCA3(country)
    ? country
    : accountCountry ?? companyFallbackCountry;
  const companyAddressLine1 = address?.addressLine1 ?? "";
  const companyCity = address?.city ?? "";
  const companyPostalCode = address?.postalCode ?? "";

  const legalRepresentativeAddress = holder.legalRepresentativePersonalAddress;
  const legalRepresentativeCountry =
    legalRepresentativeAddress != null && isCompanyCountryCCA3(legalRepresentativeAddress.country)
      ? legalRepresentativeAddress.country
      : accountCountry ?? companyFallbackCountry;
  const legalRepresentativeAddressLine1 = legalRepresentativeAddress?.addressLine1 ?? "";
  const legalRepresentativeCity = legalRepresentativeAddress?.city ?? "";
  const legalRepresentativePostalCode = legalRepresentativeAddress?.postalCode ?? "";

  const typeOfRepresentation = holder.typeOfRepresentation ?? "LegalRepresentative";
  const companyType = holder.companyType ?? "Company";
  const isRegistered = holder.isRegistered;

  const requiredDocuments =
    onboarding?.supportingDocumentCollection.requiredSupportingDocumentPurposes
      .map(d => d.name)
      .filter(name => uploadableDocuments.includes(name)) ?? [];

  const documents: Document[] =
    onboarding?.supportingDocumentCollection.supportingDocuments.filter(isNotNullish).map(doc => ({
      id: doc.id,
      name: match(doc.statusInfo)
        .with(
          { __typename: "SupportingDocumentRefusedStatusInfo" },
          { __typename: "SupportingDocumentUploadedStatusInfo" },
          { __typename: "SupportingDocumentValidatedStatusInfo" },
          ({ filename }) => filename,
        )
        .otherwise(() => t("supportingDocument.noFilename")),
      purpose: doc.supportingDocumentPurpose as SupportingDocumentPurpose,
    })) ?? [];

  const [currentDocuments, setCurrentDocuments] = useState(documents);

  const hasOwnershipStep =
    ["Company", "HomeOwnerAssociation", "Other"].includes(companyType) ||
    match(onboarding.info)
      .with(
        { __typename: "OnboardingCompanyAccountHolderInfo" },
        info => (info.individualUltimateBeneficialOwners ?? []).length > 0,
      )
      .otherwise(() => false);
  const hasDocumentsStep = requiredDocuments.length > 0;

  const [finalized, setFinalized] = useBoolean(false);

  const registrationStepErrors = useMemo(() => {
    return extractServerInvalidFields(onboarding.statusInfo, field =>
      match(field)
        .returnType<RegistrationFieldName | null>()
        .with("email", () => "email")
        .with("legalRepresentativePersonalAddress.addressLine1", () => "address")
        .with("legalRepresentativePersonalAddress.city", () => "city")
        .with("legalRepresentativePersonalAddress.postalCode", () => "postalCode")
        .with("legalRepresentativePersonalAddress.country", () => "country")
        .otherwise(() => null),
    );
  }, [onboarding.statusInfo]);

  const organisation1StepErrors = useMemo(() => {
    return extractServerInvalidFields(onboarding.statusInfo, field =>
      match(field)
        .returnType<Organisation1FieldName | null>()
        .with("name", () => "name")
        .with("registrationNumber", () => "registrationNumber")
        .with("vatNumber", () => "vatNumber")
        .with("taxIdentificationNumber", () => "taxIdentificationNumber")
        .with("residencyAddress.addressLine1", () => "address")
        .with("residencyAddress.city", () => "city")
        .with("residencyAddress.postalCode", () => "postalCode")
        .otherwise(() => null),
    );
  }, [onboarding.statusInfo]);

  const organisation2StepErrors = useMemo(() => {
    return extractServerInvalidFields(onboarding.statusInfo, field =>
      match(field)
        .returnType<Organisation2FieldName | null>()
        .with("businessActivity", () => "businessActivity")
        .with("businessActivityDescription", () => "businessActivityDescription")
        .with("monthlyPaymentVolume", () => "monthlyPaymentVolume")
        .otherwise(() => null),
    );
  }, [onboarding.statusInfo]);

  const ownerStepErrors = useMemo(() => {
    return extractServerInvalidFields(onboarding.statusInfo, field => {
      if (field.startsWith("individualUltimateBeneficialOwners")) {
        return field;
      }
      return null;
    });
  }, [onboarding.statusInfo]);

  const steps = useMemo<WizardStep<CompanyOnboardingRoute>[]>(() => {
    const steps: WizardStep<CompanyOnboardingRoute>[] = [];
    steps.push(
      {
        id: "Registration",
        label: t("step.title.registration"),
        errors: registrationStepErrors,
      },
      {
        id: "Organisation1",
        label: t("step.title.organisationPart1"),
        errors: organisation1StepErrors,
      },
      {
        id: "Organisation2",
        label: t("step.title.organisationPart2"),
        errors: organisation2StepErrors,
      },
    );
    if (hasOwnershipStep) {
      steps.push({
        id: "Ownership",
        label: t("step.title.ownership"),
        errors: ownerStepErrors,
      });
    }
    if (hasDocumentsStep) {
      steps.push({
        id: "Documents",
        label: t("step.title.document"),
        errors: [],
      });
    }
    steps.push({
      id: "Finalize",
      label: t("step.title.swanApp"),
      errors: [],
    });

    return steps;
  }, [
    hasOwnershipStep,
    hasDocumentsStep,
    registrationStepErrors,
    organisation1StepErrors,
    organisation2StepErrors,
    ownerStepErrors,
  ]);

  const stepperSteps = useMemo<TopLevelStep[]>(
    () =>
      steps
        // Remove organisation steps except the first one
        .filter(step => step.id === "Organisation1" || !step.id.startsWith("Organisation"))
        .map(step => {
          // Organisation steps are grouped
          if (step.id === "Organisation1") {
            return {
              label: t("step.title.organisation"),
              children: steps
                .filter(({ id }) => id.startsWith("Organisation"))
                .map(step => ({
                  id: step.id,
                  label: step.label,
                  url: Router[step.id]({ onboardingId }),
                  hasErrors: finalized && step.errors.length > 0,
                })),
            };
          }

          return {
            id: step.id,
            label: step.label,
            url: Router[step.id]({ onboardingId }),
            hasErrors: finalized && step.errors.length > 0,
          };
        }),
    [onboardingId, steps, finalized],
  );

  const [updateResult, updateOnboarding] = useUrqlMutation(UpdateCompanyOnboardingDocument);

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
          <TrackingProvider category="Basic info">
            <OnboardingCompanyBasicInfo
              nextStep="Presentation"
              onboardingId={params.onboardingId}
              initialValues={{
                companyType,
                country: companyCountry,
                typeOfRepresentation,
              }}
            />
          </TrackingProvider>
        ))
        .with({ name: "Presentation" }, ({ params }) => (
          <TrackingProvider category="Presentation">
            <CompanyFlowPresentation
              previousStep="Root"
              nextStep="Registration"
              onboardingId={params.onboardingId}
              hasOwnershipStep={hasOwnershipStep}
              hasDocumentsStep={hasDocumentsStep}
            />
          </TrackingProvider>
        ))
        .with({ name: "Registration" }, ({ params }) => (
          <TrackingProvider category="Registration">
            <OnboardingCompanyRegistration
              previousStep="Presentation"
              nextStep="Organisation1"
              onboardingId={params.onboardingId}
              initialEmail={onboarding.email ?? ""}
              initialAddressLine1={legalRepresentativeAddressLine1}
              initialCity={legalRepresentativeCity}
              initialPostalCode={legalRepresentativePostalCode}
              initialCountry={legalRepresentativeCountry}
              projectName={projectName}
              accountCountry={accountCountry}
              serverValidationErrors={finalized ? registrationStepErrors : []}
              tcuUrl={onboarding.tcuUrl}
              tcuDocumentUri={onboarding.projectInfo?.tcuDocumentUri}
            />
          </TrackingProvider>
        ))
        .with({ name: "Organisation1" }, ({ params }) => (
          <TrackingProvider category="Organisation 1">
            <OnboardingCompanyOrganisation1
              previousStep="Registration"
              nextStep="Organisation2"
              onboardingId={params.onboardingId}
              companyType={companyType}
              initialIsRegistered={isRegistered ?? undefined}
              initialName={holder.name ?? ""}
              initialRegistrationNumber={holder.registrationNumber ?? ""}
              initialVatNumber={holder.vatNumber ?? ""}
              initialTaxIdentificationNumber={holder.taxIdentificationNumber ?? ""}
              initialAddressLine1={companyAddressLine1}
              initialCity={companyCity}
              initialPostalCode={companyPostalCode}
              country={companyCountry}
              accountCountry={accountCountry}
              serverValidationErrors={finalized ? organisation1StepErrors : []}
            />
          </TrackingProvider>
        ))
        .with({ name: "Organisation2" }, ({ params }) => (
          <TrackingProvider category="Organisation 2">
            <OnboardingCompanyOrganisation2
              previousStep="Organisation1"
              nextStep={getNextStep("Organisation2", steps)}
              onboardingId={params.onboardingId}
              initialBusinessActivity={holder.businessActivity ?? ""}
              initialBusinessActivityDescription={holder.businessActivityDescription ?? ""}
              initialMonthlyPaymentVolume={holder.monthlyPaymentVolume ?? "LessThan10000"}
              serverValidationErrors={finalized ? organisation2StepErrors : []}
            />
          </TrackingProvider>
        ))
        .with({ name: "Ownership" }, ({ params }) => (
          <TrackingProvider category="Ownership">
            <OnboardingCompanyOwnership
              previousStep="Organisation2"
              nextStep={getNextStep("Ownership", steps)}
              onboardingId={params.onboardingId}
              accountCountry={accountCountry}
              country={companyCountry}
              companyName={holder.name ?? ""}
              ubos={ubos}
            />
          </TrackingProvider>
        ))
        .with({ name: "Documents" }, ({ params }) => (
          <TrackingProvider category="Documents">
            <OnboardingCompanyDocuments
              previousStep={getPreviousStep("Documents", steps)}
              nextStep="Finalize"
              onboardingId={params.onboardingId}
              documents={currentDocuments}
              onDocumentsChange={setCurrentDocuments}
              requiredDocumentTypes={requiredDocuments}
              supportingDocumentCollectionId={onboarding?.supportingDocumentCollection.id ?? ""}
              onboardingLanguage={onboarding.language ?? "en"}
            />
          </TrackingProvider>
        ))
        .with({ name: "Finalize" }, ({ params }) => (
          <TrackingProvider category="Finalize">
            <OnboardingCompanyFinalize
              previousStep={getPreviousStep("Finalize", steps)}
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
