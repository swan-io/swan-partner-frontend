import { useQuery } from "@swan-io/graphql-client";
import { BorderedIcon } from "@swan-io/lake/src/components/BorderedIcon";
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
import { backgroundColor, colors } from "@swan-io/lake/src/constants/design";
import { useBoolean } from "@swan-io/lake/src/hooks/useBoolean";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { isNullish } from "@swan-io/lake/src/utils/nullish";
import { useEffect, useMemo } from "react";
import { StyleSheet } from "react-native";
import { match, P } from "ts-pattern";
import { ErrorView } from "../../components/ErrorView";
import { OnboardingHeader } from "../../components/OnboardingHeader";
import { Redirect } from "../../components/Redirect";
import { AccountAdminChangeDocument } from "../../graphql/unauthenticated";
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

const styles = StyleSheet.create({
  successContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
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
  const [submitted, setSubmitted] = useBoolean(false);
  const [data] = useQuery(AccountAdminChangeDocument, {
    accountAdminChangeId: changeAdminRequestId,
  });

  const isStepperDisplayed = !submitted && !isNullish(route) && route.name !== "ChangeAdminRoot";

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
  }, [route?.name, submitted]);

  const templateLanguage = locale.language;

  // TODO get project info from backend once query is available
  const projectInfo = {
    color: "#76B900",
    name: "projectName",
    logoUrl: undefined,
  };

  return data
    .mapOk(data => data.accountAdminChange)
    .mapOkToResult(filterRejectionsToResult)
    .match({
      NotAsked: () => null,
      Loading: () => <LoadingView />,
      Done: result =>
        result.match({
          Error: error =>
            match(error)
              .with({ __typename: "ForbiddenRejection" }, () => <NotFoundPage />)
              .otherwise(error => <ErrorView error={error} />),
          Ok: data => (
            <WithPartnerAccentColor color={projectInfo.color}>
              <Box grow={1}>
                <Box style={styles.sticky}>
                  <OnboardingHeader
                    projectName={projectInfo.name}
                    projectLogo={projectInfo.logoUrl}
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

                {match({ submitted, routeName: route?.name })
                  .with({ submitted: true }, () => (
                    <Box
                      alignItems="center"
                      justifyContent="center"
                      style={styles.successContainer}
                    >
                      <BorderedIcon name={"lake-check"} color="positive" size={70} padding={16} />
                      <Space height={32} />

                      <LakeText variant="semibold" color={colors.gray[900]}>
                        {t("changeAdmin.success.title")}
                      </LakeText>

                      <Space height={12} />

                      <LakeText align="center" color={colors.gray[500]}>
                        {t("changeAdmin.success.description1")}
                      </LakeText>
                      <Space height={12} />
                      <LakeText align="center" color={colors.gray[500]}>
                        {t("changeAdmin.success.description2")}
                      </LakeText>
                    </Box>
                  ))
                  .with({ routeName: "ChangeAdminRoot" }, () => (
                    <ChangeAdminFlowPresentation
                      templateLanguage={templateLanguage}
                      steps={flowSteps}
                      changeAdminRequestId={changeAdminRequestId}
                      nextStep="ChangeAdminContext1"
                    />
                  ))
                  .with({ routeName: "ChangeAdminContext1" }, () => (
                    <ChangeAdminContext1
                      accountHolder={data.accountHolder}
                      changeAdminRequestId={changeAdminRequestId}
                      nextStep="ChangeAdminContext2"
                    />
                  ))
                  .with({ routeName: "ChangeAdminContext2" }, () => (
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
                  .with({ routeName: "ChangeAdminRequester" }, () => (
                    <ChangeAdminRequester
                      initialValues={data.requester}
                      changeAdminRequestId={changeAdminRequestId}
                      previousStep="ChangeAdminContext2"
                      nextStep="ChangeAdminNewAdmin"
                    />
                  ))
                  .with({ routeName: "ChangeAdminNewAdmin" }, () => (
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
                  .with({ routeName: "ChangeAdminDocuments" }, () => (
                    <ChangeAdminDocuments
                      supportingDocumentCollection={data.supportingDocumentCollection}
                      templateLanguage={templateLanguage}
                      changeAdminRequestId={changeAdminRequestId}
                      previousStep="ChangeAdminNewAdmin"
                      nextStep="ChangeAdminConfirm"
                    />
                  ))
                  .with({ routeName: "ChangeAdminConfirm" }, () =>
                    isRequesterFilled(data.requester) && isAdminFilled(data.admin) ? (
                      <ChangeAdminConfirm
                        requester={data.requester}
                        admin={data.admin}
                        changeAdminRequestId={changeAdminRequestId}
                        previousStep="ChangeAdminDocuments"
                        onSubmitted={setSubmitted.on}
                      />
                    ) : (
                      <Redirect to={Router.ChangeAdminRoot({ requestId: changeAdminRequestId })} />
                    ),
                  )
                  .with({ routeName: P.nullish }, () => <NotFoundPage />)
                  .exhaustive()}

                {submitted ? <Space height={24} /> : <Fill minHeight={24} />}
                <LakeText style={styles.partnership}>
                  {t("wizard.partnership")}
                  <SwanLogo style={styles.swanPartnershipLogo} />
                </LakeText>
                <Space height={24} />
              </Box>
            </WithPartnerAccentColor>
          ),
        }),
    });
};
