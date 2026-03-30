import { useQuery } from "@swan-io/graphql-client";
import { Box } from "@swan-io/lake/src/components/Box";
import { Fill } from "@swan-io/lake/src/components/Fill";
import { FlowStep } from "@swan-io/lake/src/components/FlowPresentation";
import { IconName } from "@swan-io/lake/src/components/Icon";
import {
  LakeStepper,
  MobileStepTitle,
  TopLevelStep,
} from "@swan-io/lake/src/components/LakeStepper";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LoadingView } from "@swan-io/lake/src/components/LoadingView";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { SwanLogo } from "@swan-io/lake/src/components/SwanLogo";
import { WithPartnerAccentColor } from "@swan-io/lake/src/components/WithPartnerAccentColor";
import { backgroundColor, invariantColors } from "@swan-io/lake/src/constants/design";
import { isNullish } from "@swan-io/lake/src/utils/nullish";
import { useEffect, useMemo } from "react";
import { StyleSheet } from "react-native";
import { match, P } from "ts-pattern";
import { ErrorView } from "../../components/ErrorView";
import { OnboardingHeader } from "../../components/OnboardingHeader";
import { Redirect } from "../../components/Redirect";
import { AccountAdminChangeDocument } from "../../graphql/partner";
import { locale, t } from "../../utils/i18n";
import { ChangeAdminRoute, changeAdminRoutes, Router } from "../../utils/routes";
import { NotFoundPage } from "../NotFoundPage";
import { ChangeAdminConfirm, isAdminFilled, isRequesterFilled } from "./ChangeAdminConfirm";
import { ChangeAdminContext1 } from "./ChangeAdminContext1";
import { ChangeAdminContext2 } from "./ChangeAdminContext2";
import { ChangeAdminDocuments } from "./ChangeAdminDocuments";
import { ChangeAdminFlowPresentation } from "./ChangeAdminFlowPresentation";
import { ChangeAdminNewAdmin } from "./ChangeAdminNewAdmin";
import { ChangeAdminRequester } from "./ChangeAdminRequester";
import { ChangeAdminStatusScreen } from "./ChangeAdminStatusScreen";

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
  partnership: {
    marginHorizontal: "auto",
    display: "flex",
    flexDirection: "row",
    alignItems: "baseline",
  },
  swanPartnershipLogo: {
    marginLeft: 4,
    height: 9,
  },
});

type Props = {
  changeAdminRequestId: string;
};

export const ChangeAdminWizard = ({ changeAdminRequestId }: Props) => {
  const route = Router.useRoute(changeAdminRoutes);
  const [data, { reload }] = useQuery(AccountAdminChangeDocument, {
    accountAdminChangeId: changeAdminRequestId,
  });

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

  // biome-ignore lint/correctness/useExhaustiveDependencies:
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [route?.name]);

  const templateLanguage = locale.language;

  return data
    .mapOk(data => data.publicAccountAdminChange)
    .match({
      NotAsked: () => null,
      Loading: () => <LoadingView />,
      Done: result =>
        result.match({
          Error: error => <ErrorView error={error} />,
          Ok: data =>
            match(data)
              .with({ __typename: "AccountAdminChange" }, data => (
                <WithPartnerAccentColor
                  color={
                    data.accountHolder.projectInfo.accentColor ?? invariantColors.defaultAccentColor
                  }
                >
                  <Box grow={1}>
                    <Box style={styles.sticky}>
                      <OnboardingHeader
                        projectName={data.accountHolder.projectInfo.name}
                        projectLogo={data.accountHolder.projectInfo.logoUri}
                      />

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

                    {match(route?.name)
                      .with("ChangeAdminRoot", () => (
                        <ChangeAdminFlowPresentation
                          templateLanguage={templateLanguage}
                          projectName={data.accountHolder.projectInfo.name}
                          steps={flowSteps}
                          changeAdminRequestId={changeAdminRequestId}
                          nextStep="ChangeAdminContext1"
                        />
                      ))
                      .with("ChangeAdminContext1", () => (
                        <ChangeAdminContext1
                          accountHolder={data.accountHolder}
                          changeAdminRequestId={changeAdminRequestId}
                          nextStep="ChangeAdminContext2"
                        />
                      ))
                      .with("ChangeAdminContext2", () => (
                        <ChangeAdminContext2
                          initialValues={{
                            isRequesterNewAdmin: data.isRequesterNewAdmin ?? true,
                            reason: data.reason ?? "CurrentAdministratorLeft",
                          }}
                          changeAdminRequestId={changeAdminRequestId}
                          previousStep="ChangeAdminContext1"
                          nextStep="ChangeAdminRequester"
                        />
                      ))
                      .with("ChangeAdminRequester", () => (
                        <ChangeAdminRequester
                          isRequesterNewAdmin={data.isRequesterNewAdmin ?? false}
                          admin={data.admin}
                          initialValues={data.requester}
                          changeAdminRequestId={changeAdminRequestId}
                          previousStep="ChangeAdminContext2"
                          nextStep="ChangeAdminNewAdmin"
                        />
                      ))
                      .with("ChangeAdminNewAdmin", () => (
                        <ChangeAdminNewAdmin
                          initialValues={{
                            ...data.admin,
                            isNewAdminLegalRepresentative: data.isNewAdminLegalRepresentative,
                          }}
                          changeAdminRequestId={changeAdminRequestId}
                          previousStep="ChangeAdminRequester"
                          nextStep="ChangeAdminDocuments"
                        />
                      ))
                      .with("ChangeAdminDocuments", () => (
                        <ChangeAdminDocuments
                          supportingDocumentCollection={data.supportingDocumentCollection}
                          templateLanguage={templateLanguage}
                          changeAdminRequestId={changeAdminRequestId}
                          previousStep="ChangeAdminNewAdmin"
                          nextStep="ChangeAdminConfirm"
                        />
                      ))
                      .with("ChangeAdminConfirm", () =>
                        isRequesterFilled(data.requester) && isAdminFilled(data.admin) ? (
                          <ChangeAdminConfirm
                            requester={data.requester}
                            admin={data.admin}
                            isRequesterNewAdmin={data.isRequesterNewAdmin ?? false}
                            changeAdminRequestId={changeAdminRequestId}
                            previousStep="ChangeAdminDocuments"
                            onSubmitted={reload}
                          />
                        ) : (
                          <Redirect
                            to={Router.ChangeAdminRoot({ requestId: changeAdminRequestId })}
                          />
                        ),
                      )
                      .with(P.nullish, () => <NotFoundPage />)
                      .exhaustive()}

                    <Fill minHeight={24} />
                    <LakeText style={styles.partnership}>
                      {t("wizard.partnership")}
                      <SwanLogo style={styles.swanPartnershipLogo} />
                    </LakeText>
                    <Space height={24} />
                  </Box>
                </WithPartnerAccentColor>
              ))
              .with({ __typename: "NonOngoingAccountAdminChange" }, ({ status }) => {
                // "Ongoing" status should never appear with NonOngoingAccountAdminChange __typename
                // If it does, it's a backend data inconsistency — throw so the ErrorBoundary catches it
                if (status === "Ongoing") {
                  throw new Error(`Unexpected status "Ongoing" for NonOngoingAccountAdminChange`);
                }
                return <ChangeAdminStatusScreen status={status} />;
              })
              .with(P.nullish, () => <NotFoundPage />)
              .exhaustive(),
        }),
    });
};
