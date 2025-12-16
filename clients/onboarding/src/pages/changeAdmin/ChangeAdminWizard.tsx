import { Box } from "@swan-io/lake/src/components/Box";
import {
  LakeStepper,
  MobileStepTitle,
  TopLevelStep,
} from "@swan-io/lake/src/components/LakeStepper";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { backgroundColor } from "@swan-io/lake/src/constants/design";
import { isNullish } from "@swan-io/lake/src/utils/nullish";
import { useEffect, useMemo } from "react";
import { StyleSheet } from "react-native";
import { match, P } from "ts-pattern";
import { OnboardingHeader } from "../../components/OnboardingHeader";
import { t } from "../../utils/i18n";
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

  const steps = useMemo<WizardStep<ChangeAdminRoute>[]>(() => {
    return [
      {
        id: "ChangeAdminContext1",
        label: t("changeAdmin.step.context"),
        errors: [],
      },
      {
        id: "ChangeAdminContext2",
        label: t("changeAdmin.step.context"),
        errors: [],
      },
      {
        id: "ChangeAdminRequester",
        label: t("changeAdmin.step.requesterInfo"),
        errors: [],
      },
      {
        id: "ChangeAdminNewAdmin",
        label: t("changeAdmin.step.newAdminInfo"),
        errors: [],
      },
      {
        id: "ChangeAdminDocuments",
        label: t("changeAdmin.step.documents"),
        errors: [],
      },
      {
        id: "ChangeAdminConfirm",
        label: t("changeAdmin.step.confirm"),
        errors: [],
      },
    ];
  }, []);

  const stepperSteps = useMemo<TopLevelStep[]>(
    () =>
      steps
        // Remove context steps except the first one
        .filter(
          step => step.id === "ChangeAdminContext1" || !step.id.startsWith("ChangeAdminContext"),
        )
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
            url: Router[step.id]({ requestId: changeAdminRequestId }),
            hasErrors: false,
          };
        }),
    [changeAdminRequestId, steps],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies(route?.name):
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [route?.name]);

  return (
    <Box grow={1}>
      <Box style={styles.sticky}>
        <OnboardingHeader projectName={"projectName"} projectLogo={undefined} />

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
            previousStep="ChangeAdminContext2"
            nextStep="ChangeAdminNewAdmin"
          />
        ))
        .with({ name: "ChangeAdminNewAdmin" }, () => (
          <ChangeAdminNewAdmin
            changeAdminRequestId={changeAdminRequestId}
            previousStep="ChangeAdminRequester"
            nextStep="ChangeAdminDocuments"
          />
        ))
        .with({ name: "ChangeAdminDocuments" }, () => (
          <ChangeAdminDocuments
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
  );
};
