import { Box } from "@swan-io/lake/src/components/Box";
import { FlowStep } from "@swan-io/lake/src/components/FlowPresentation";
import { IconName } from "@swan-io/lake/src/components/Icon";
import {
  LakeStepper,
  MobileStepTitle,
  TopLevelStep,
} from "@swan-io/lake/src/components/LakeStepper";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { WithPartnerAccentColor } from "@swan-io/lake/src/components/WithPartnerAccentColor";
import { backgroundColor } from "@swan-io/lake/src/constants/design";
import { isNullish } from "@swan-io/lake/src/utils/nullish";
import { CountryCCA3 } from "@swan-io/shared-business/src/constants/countries";
import { useEffect, useMemo } from "react";
import { StyleSheet } from "react-native";
import { match, P } from "ts-pattern";
import { OnboardingHeader } from "../../components/OnboardingHeader";
import { locale, t } from "../../utils/i18n";
import { ChangeAdminRoute, changeAdminRoutes, Router } from "../../utils/routes";
import { NotFoundPage } from "../NotFoundPage";
import { ChangeAdminConfirm } from "./ChangeAdminConfirm";
import { ChangeAdminContext1 } from "./ChangeAdminContext1";
import { ChangeAdminContext2 } from "./ChangeAdminContext2";
import { ChangeAdminDocuments } from "./ChangeAdminDocuments";
import { ChangeAdminFlowPresentation } from "./ChangeAdminFlowPresentation";
import { ChangeAdminNewAdmin } from "./ChangeAdminNewAdmin";
import { ChangeAdminRequester } from "./ChangeAdminRequester";

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
  changeAdminRequestId: string;
};

export const ChangeAdminWizard = ({ changeAdminRequestId }: Props) => {
  const route = Router.useRoute(changeAdminRoutes);

  const isStepperDisplayed = !isNullish(route) && route.name !== "ChangeAdminRoot";

  const steps = useMemo<(WizardStep<ChangeAdminRoute> & { icon: IconName })[]>(() => {
    return [
      {
        id: "ChangeAdminContext1",
        label: t("changeAdmin.step.context"),
        icon: "mail-regular",
        errors: [],
      },
      {
        id: "ChangeAdminContext2",
        label: t("changeAdmin.step.context"),
        icon: "mail-regular",
        errors: [],
      },
      {
        id: "ChangeAdminRequester",
        label: t("changeAdmin.step.requesterInfo"),
        icon: "lake-clipboard-bullet",
        errors: [],
      },
      {
        id: "ChangeAdminNewAdmin",
        label: t("changeAdmin.step.newAdminInfo"),
        icon: "lake-clipboard-bullet",
        errors: [],
      },
      {
        id: "ChangeAdminDocuments",
        label: t("changeAdmin.step.documents"),
        icon: "document-regular",
        errors: [],
      },
      {
        id: "ChangeAdminConfirm",
        label: t("changeAdmin.step.confirm"),
        icon: "phone-regular",
        errors: [],
      },
    ];
  }, []);

  const stepperSteps = useMemo<TopLevelStep[]>(
    () =>
      steps
        // Remove ChangeAdminContext2 because it's grouped with ChangeAdminContext1
        .filter(step => step.id !== "ChangeAdminContext2")
        .map(step => {
          // Organisation steps are grouped
          if (step.id === "ChangeAdminContext1") {
            return {
              label: t("changeAdmin.step.context"),
              children: steps
                .filter(({ id }) => id.startsWith("ChangeAdminContext"))
                .map(step => ({
                  id: step.id,
                  label: step.label,
                  url: Router[step.id]({ requestId: changeAdminRequestId }),
                  hasErrors: false,
                })),
            };
          }

          return {
            id: step.id,
            label: step.label,
            icon: step.icon,
            url: Router[step.id]({ requestId: changeAdminRequestId }),
            hasErrors: false,
          };
        }),
    [changeAdminRequestId, steps],
  );

  const flowSteps = useMemo<FlowStep[]>(
    () =>
      steps
        .filter(step => step.id !== "ChangeAdminContext2")
        .map(step => ({
          id: step.id,
          label: step.label,
          icon: step.icon,
        })),
    [steps],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies(route?.name):
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [route?.name]);

  const templateLanguage = locale.language;

  // TODO get project info from backend once query is available
  const projectInfo = {
    color: "#76B900",
    name: "projectName",
    logoUrl: undefined,
  };
  const accountCountry: CountryCCA3 = "FRA";

  return (
    <WithPartnerAccentColor color={projectInfo.color}>
      <Box grow={1}>
        <Box style={styles.sticky}>
          <OnboardingHeader projectName={projectInfo.name} projectLogo={projectInfo.logoUrl} />

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
          .with({ name: "ChangeAdminRoot" }, () => (
            <ChangeAdminFlowPresentation
              templateLanguage={templateLanguage}
              steps={flowSteps}
              changeAdminRequestId={changeAdminRequestId}
              nextStep="ChangeAdminContext1"
            />
          ))
          .with({ name: "ChangeAdminContext1" }, () => (
            <ChangeAdminContext1
              changeAdminRequestId={changeAdminRequestId}
              nextStep="ChangeAdminContext2"
            />
          ))
          .with({ name: "ChangeAdminContext2" }, () => (
            <ChangeAdminContext2
              changeAdminRequestId={changeAdminRequestId}
              previousStep="ChangeAdminContext1"
              nextStep="ChangeAdminRequester"
            />
          ))
          .with({ name: "ChangeAdminRequester" }, () => (
            <ChangeAdminRequester
              changeAdminRequestId={changeAdminRequestId}
              accountCountry={accountCountry}
              previousStep="ChangeAdminContext2"
              nextStep="ChangeAdminNewAdmin"
            />
          ))
          .with({ name: "ChangeAdminNewAdmin" }, () => (
            <ChangeAdminNewAdmin
              changeAdminRequestId={changeAdminRequestId}
              accountCountry={accountCountry}
              previousStep="ChangeAdminRequester"
              nextStep="ChangeAdminDocuments"
            />
          ))
          .with({ name: "ChangeAdminDocuments" }, () => (
            <ChangeAdminDocuments
              templateLanguage={templateLanguage}
              changeAdminRequestId={changeAdminRequestId}
              previousStep="ChangeAdminNewAdmin"
              nextStep="ChangeAdminConfirm"
            />
          ))
          .with({ name: "ChangeAdminConfirm" }, () => (
            <ChangeAdminConfirm
              changeAdminRequestId={changeAdminRequestId}
              previousStep="ChangeAdminDocuments"
            />
          ))
          .with(P.nullish, () => <NotFoundPage />)
          .exhaustive()}
      </Box>
    </WithPartnerAccentColor>
  );
};
