import { Array, Option } from "@swan-io/boxed";
import { pushUnsafe } from "@swan-io/chicane";
import { Box } from "@swan-io/lake/src/components/Box";
import {
  LakeStepper,
  MobileStepTitle,
  TopLevelStep,
} from "@swan-io/lake/src/components/LakeStepper";
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

export const OnboardingCompanyWizard_OnboardingCompanyAccountHolderInfo = graphql(`
  fragment OnboardingCompanyWizard_OnboardingCompanyAccountHolderInfo on OnboardingCompanyAccountHolderInfo {
    companyType
    residencyAddress {
      country
    }
    individualUltimateBeneficialOwners {
      __typename
    }
    ...OnboardingCompanyBasicInfo_OnboardingCompanyAccountHolderInfo
    ...OnboardingCompanyRegistration_OnboardingCompanyAccountHolderInfo
    ...OnboardingCompanyOrganisation_OnboardingCompanyAccountHolderInfo
    ...OnboardingCompanyOrganisation2_OnboardingCompanyAccountHolderInfo
    ...OnboardingCompanyOwnership_OnboardingCompanyAccountHolderInfo
  }
`);

export const OnboardingCompanyWizard_OnboardingInfo = graphql(`
  fragment OnboardingCompanyWizard_OnboardingInfo on OnboardingInfo {
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
    supportingDocumentCollection {
      id
      requiredSupportingDocumentPurposes {
        name
      }
      statusInfo {
        status
      }
    }
    legalRepresentativeRecommendedIdentificationLevel
    accountCountry
    ...OnboardingCompanyBasicInfo_OnboardingInfo
    ...OnboardingCompanyRegistration_OnboardingInfo
    ...OnboardingCompanyOrganisation1_OnboardingInfo
    ...OnboardingCompanyOwnership_OnboardingInfo
    ...OnboardingCompanyDocuments_OnboardingInfo
  }
`);

type Props = {
  onboardingInfoData: FragmentType<typeof OnboardingCompanyWizard_OnboardingInfo>;
  companyAccountHolderData: FragmentType<
    typeof OnboardingCompanyWizard_OnboardingCompanyAccountHolderInfo
  >;
};

export const OnboardingCompanyWizard = ({
  onboardingInfoData,
  companyAccountHolderData,
}: Props) => {
  const onboardingInfo = getFragmentData(
    OnboardingCompanyWizard_OnboardingInfo,
    onboardingInfoData,
  );
  const accountHolderInfo = getFragmentData(
    OnboardingCompanyWizard_OnboardingCompanyAccountHolderInfo,
    companyAccountHolderData,
  );

  const onboardingId = onboardingInfo.id;

  const route = Router.useRoute(companyOnboardingRoutes);

  const isStepperDisplayed =
    !isNullish(route) && route.name !== "Root" && route.name !== "Presentation";

  const hasOwnershipStep = match(accountHolderInfo)
    .with({ companyType: P.union("Company", "Other") }, () => true)
    .with(
      {
        residencyAddress: { country: "NLD" },
        companyType: P.union("Association", "HomeOwnerAssociation"),
      },
      () => true,
    )
    .with({ individualUltimateBeneficialOwners: [P.nonNullable, ...P.array()] }, () => true)
    .otherwise(() => false);

  const hasDocumentsStep =
    onboardingInfo.supportingDocumentCollection.statusInfo.status === "WaitingForDocument" &&
    onboardingInfo.supportingDocumentCollection.requiredSupportingDocumentPurposes.length > 0;

  const [finalized, setFinalized] = useBoolean(false);

  const validationErrors = match(onboardingInfo.statusInfo)
    .with({ __typename: "OnboardingInvalidStatusInfo" }, ({ errors }) => errors)
    .otherwise(() => []);

  const registrationStepErrors = useMemo(() => {
    return extractServerInvalidFields(validationErrors, field =>
      match(field)
        .returnType<RegistrationFieldName | null>()
        .with("email", () => "email")
        .with("legalRepresentativePersonalAddress.addressLine1", () => "address")
        .with("legalRepresentativePersonalAddress.city", () => "city")
        .with("legalRepresentativePersonalAddress.postalCode", () => "postalCode")
        .with("legalRepresentativePersonalAddress.country", () => "country")
        .otherwise(() => null),
    );
  }, [validationErrors]);

  const organisation1StepErrors = useMemo(() => {
    return extractServerInvalidFields(validationErrors, field =>
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
  }, [validationErrors]);

  const organisation2StepErrors = useMemo(() => {
    return extractServerInvalidFields(validationErrors, field =>
      match(field)
        .returnType<Organisation2FieldName | null>()
        .with("businessActivity", () => "businessActivity")
        .with("businessActivityDescription", () => "businessActivityDescription")
        .with("monthlyPaymentVolume", () => "monthlyPaymentVolume")
        .otherwise(() => null),
    );
  }, [validationErrors]);

  const ownershipStepErrors = useMemo(() => {
    return extractServerInvalidFields(validationErrors, field => {
      if (field.startsWith("individualUltimateBeneficialOwners")) {
        return field;
      }
      return null;
    });
  }, [validationErrors]);

  const steps = useMemo<WizardStep[]>(
    () => [
      {
        id: "Registration",
        url: Router.Registration({ onboardingId }),
        label: t("step.title.registration"),
        errors: registrationStepErrors,
      },
      {
        id: "Organisation1",
        url: Router.Organisation1({ onboardingId }),
        label: t("step.title.organisationPart1"),
        errors: organisation1StepErrors,
      },
      {
        id: "Organisation2",
        url: Router.Organisation2({ onboardingId }),
        label: t("step.title.organisationPart2"),
        errors: organisation2StepErrors,
      },
      ...(hasOwnershipStep
        ? [
            {
              id: "Ownership",
              url: Router.Ownership({ onboardingId }),
              label: t("step.title.ownership"),
              errors: ownershipStepErrors,
            },
          ]
        : []),
      ...(hasDocumentsStep
        ? [
            {
              id: "Documents",
              url: Router.Documents({ onboardingId }),
              label: t("step.title.document"),
              errors: [],
            },
          ]
        : []),
      {
        id: "Finalize",
        url: Router.Finalize({ onboardingId }),
        label: t("step.title.swanApp"),
        errors: [],
      },
    ],
    [
      hasOwnershipStep,
      hasDocumentsStep,
      organisation1StepErrors,
      organisation2StepErrors,
      ownershipStepErrors,
      registrationStepErrors,
      onboardingId,
    ],
  );

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
                  url: step.url,
                  hasErrors: finalized && step.errors.length > 0,
                })),
            };
          }

          return {
            id: step.id,
            label: step.label,
            url: step.url,
            hasErrors: finalized && step.errors.length > 0,
          };
        }),
    [steps, finalized],
  );

  const goToNextStepFrom = (currentStep: CompanyOnboardingRoute) => {
    Array.findIndex(steps, step => step.id === currentStep)
      .flatMap(index => Option.fromNullable(steps[index + 1]))
      .tapSome(step => pushUnsafe(step.url));
  };

  const goToPreviousStepFrom = (currentStep: CompanyOnboardingRoute) => {
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
          <TrackingProvider category="Basic info">
            <OnboardingCompanyBasicInfo
              onboardingId={onboardingId}
              onboardingInfoData={onboardingInfo}
              accountHolderInfoData={accountHolderInfo}
              onSave={() => Router.push("Presentation", { onboardingId })}
            />
          </TrackingProvider>
        ))
        .with({ name: "Presentation" }, () => (
          <TrackingProvider category="Presentation">
            <CompanyFlowPresentation
              hasOwnershipStep={hasOwnershipStep}
              hasDocumentsStep={hasDocumentsStep}
              onPressPrevious={() => Router.push("Root", { onboardingId })}
              onPressNext={() => Router.push("Registration", { onboardingId })}
            />
          </TrackingProvider>
        ))
        .with({ name: "Registration" }, ({ name }) => (
          <TrackingProvider category="Registration">
            <OnboardingCompanyRegistration
              onboardingId={onboardingId}
              onboardingInfoData={onboardingInfo}
              accountHolderInfoData={accountHolderInfo}
              serverValidationErrors={finalized ? registrationStepErrors : []}
              onPressPrevious={() => goToPreviousStepFrom(name)}
              onSave={() => goToNextStepFrom(name)}
            />
          </TrackingProvider>
        ))
        .with({ name: "Organisation1" }, ({ name }) => (
          <TrackingProvider category="Organisation 1">
            <OnboardingCompanyOrganisation1
              onboardingId={onboardingId}
              onboardingInfoData={onboardingInfo}
              accountHolderInfoData={accountHolderInfo}
              serverValidationErrors={finalized ? organisation1StepErrors : []}
              onPressPrevious={() => goToPreviousStepFrom(name)}
              onSave={() => goToNextStepFrom(name)}
            />
          </TrackingProvider>
        ))
        .with({ name: "Organisation2" }, ({ name }) => (
          <TrackingProvider category="Organisation 2">
            <OnboardingCompanyOrganisation2
              onboardingId={onboardingId}
              accountHolderInfoData={accountHolderInfo}
              serverValidationErrors={finalized ? organisation2StepErrors : []}
              onPressPrevious={() => goToPreviousStepFrom(name)}
              onSave={() => goToNextStepFrom(name)}
            />
          </TrackingProvider>
        ))
        .with({ name: "Ownership" }, ({ name }) => (
          <TrackingProvider category="Ownership">
            <OnboardingCompanyOwnership
              onboardingId={onboardingId}
              onboardingInfoData={onboardingInfo}
              accountHolderInfoData={accountHolderInfo}
              onPressPrevious={() => goToPreviousStepFrom(name)}
              onSave={() => goToNextStepFrom(name)}
            />
          </TrackingProvider>
        ))
        .with({ name: "Documents" }, ({ name }) => (
          <TrackingProvider category="Documents">
            <OnboardingCompanyDocuments
              onboardingId={onboardingId}
              onboardingInfoData={onboardingInfo}
              onPressPrevious={() => goToPreviousStepFrom(name)}
              onSave={() => goToNextStepFrom(name)}
            />
          </TrackingProvider>
        ))
        .with({ name: "Finalize" }, ({ name }) => (
          <TrackingProvider category="Finalize">
            <OnboardingCompanyFinalize
              onboardingId={onboardingId}
              legalRepresentativeRecommendedIdentificationLevel={
                onboardingInfo.legalRepresentativeRecommendedIdentificationLevel
              }
              steps={steps}
              alreadySubmitted={finalized}
              onSubmitWithErrors={setFinalized.on}
              onPressPrevious={() => goToPreviousStepFrom(name)}
            />
          </TrackingProvider>
        ))
        .with(P.nullish, () => <NotFoundPage />)
        .exhaustive()}
    </Box>
  );
};