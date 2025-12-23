import { Option } from "@swan-io/boxed";
import { Box } from "@swan-io/lake/src/components/Box";
import { IconName } from "@swan-io/lake/src/components/Icon";
import {
  LakeStepper,
  MobileStepTitle,
  TopLevelStep,
} from "@swan-io/lake/src/components/LakeStepper";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { backgroundColor } from "@swan-io/lake/src/constants/design";
import { isNullish } from "@swan-io/lake/src/utils/nullish";
import { CountryCCA3 } from "@swan-io/shared-business/src/constants/countries";
import { useEffect, useMemo } from "react";
import { StyleSheet } from "react-native";
import { match, P } from "ts-pattern";
import {
  AccountCountry,
  CompanyRenewalInfoFragment,
  SupportingDocumentRenewalFragment,
  VerificationRenewalRequirement,
} from "../../graphql/partner";
import { NotFoundPage } from "../../pages/NotFoundPage";
import { t } from "../../utils/i18n";
import { Router, VerificationRenewalRoute, verificationRenewalRoutes } from "../../utils/routes";
import { ErrorView } from "../ErrorView";
import { VerificationRenewalAccountHolderInformation } from "./VerificationRenewalAccountHolderInformation";
import { VerificationRenewalAdministratorInformation } from "./VerificationRenewalAdministratorInformation";
import { VerificationRenewalDocuments } from "./VerificationRenewalDocuments";
import {
  VerificationRenewalFinalize,
  VerificationRenewalFinalizeSuccess,
} from "./VerificationRenewalFinalize";
import { VerificationRenewalIntro } from "./VerificationRenewalIntro";
import { VerificationRenewalOwnership } from "./VerificationRenewalOwnership";

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

export type RenewalStep = {
  id: VerificationRenewalRoute;
  label: string;
  icon: IconName;
};

const getRenewalSteps = (requirements: VerificationRenewalRequirement[] | null): RenewalStep[] => {
  const steps: RenewalStep[] = [];

  requirements?.forEach(requirement =>
    match(requirement)
      .with("AccountHolderDetailsRequired", () =>
        steps.push({
          id: "VerificationRenewalAccountHolderInformation",
          label: t("verificationRenewal.step.accountHolderInfo"),
          icon: "building-regular",
        }),
      )
      .with("LegalRepresentativeDetailsRequired", () =>
        steps.push({
          id: "VerificationRenewalAdministratorInformation",
          label: t("verificationRenewal.step.administratorInfo"),
          icon: "person-regular",
        }),
      )
      // TODO put it back once UBO step development is done
      .with("UboDetailsRequired", () =>
        steps.push({
          id: "VerificationRenewalOwnership",
          label: t("verificationRenewal.step.ownership"),
          icon: "people-add-regular",
        }),
      )
      .with("SupportingDocumentsRequired", () =>
        steps.push({
          id: "VerificationRenewalDocuments",
          label: t("verificationRenewal.step.documents"),
          icon: "document-regular",
        }),
      )
      .otherwise(() => null),
  );
  steps.push({
    id: "VerificationRenewalFinalize",
    label: t("verificationRenewal.step.finalize"),
    icon: "checkmark-filled",
  });

  return steps;
};

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

const getNextStep = (currentStep: RenewalStep, steps: RenewalStep[]) => {
  const index = steps.indexOf(currentStep);
  if (index === -1) {
    return undefined;
  }
  return steps[index + 1];
};

type Props = {
  verificationRenewalId: string;
  verificationRequirements: VerificationRenewalRequirement[] | null;
  info: CompanyRenewalInfoFragment;
  supportingDocumentCollection: SupportingDocumentRenewalFragment | null;
  accountCountry: AccountCountry;
};

export const VerificationRenewalCompany = ({
  info,
  supportingDocumentCollection,
  verificationRenewalId,
  verificationRequirements,
  accountCountry,
}: Props) => {
  const route = Router.useRoute(verificationRenewalRoutes);

  const isStepperDisplayed =
    !isNullish(route) &&
    route.name !== "VerificationRenewalRoot" &&
    route.name !== "VerificationRenewalFinalize";

  const steps = useMemo(
    () => getRenewalSteps(verificationRequirements),
    [verificationRequirements],
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
  const nextStep = currentStep != null ? getNextStep(currentStep, steps) : undefined;

  const isFinalized = steps.length === 0 || steps.length === 1;

  const companyAddress = Option.allFromDict({
    addressLine1: Option.fromNullable(info.company.residencyAddress.addressLine1),
    country: Option.fromNullable(info.company.residencyAddress.country),
    city: Option.fromNullable(info.company.residencyAddress.city),
    postalCode: Option.fromNullable(info.company.residencyAddress.postalCode),
  });

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
        .with({ route: { name: "VerificationRenewalAccountHolderInformation" } }, () => (
          <VerificationRenewalAccountHolderInformation
            info={info}
            verificationRenewalId={verificationRenewalId}
            nextStep={nextStep}
          />
        ))
        .with({ route: { name: "VerificationRenewalAdministratorInformation" } }, () => (
          <VerificationRenewalAdministratorInformation
            info={info}
            verificationRenewalId={verificationRenewalId}
            previousStep={previousStep}
            nextStep={nextStep}
          />
        ))

        .with({ route: { name: "VerificationRenewalOwnership" } }, () =>
          match(companyAddress)
            .with({ value: P.select({ country: P.nonNullable }) }, address => (
              <VerificationRenewalOwnership
                info={info}
                verificationRenewalId={verificationRenewalId}
                accountCountry={accountCountry}
                companyCountry={address.country as CountryCCA3}
              />
            ))
            .otherwise(() => <ErrorView />),
        )
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
          <VerificationRenewalFinalize verificationRenewalId={verificationRenewalId} />
        ))
        .with(P.nullish, () => <NotFoundPage />)

        .otherwise(() => (
          <ErrorView />
        ))}
    </Box>
  );
};
