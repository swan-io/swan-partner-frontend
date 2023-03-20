import { Box } from "@swan-io/lake/src/components/Box";
import { FlowPresentation, FlowStep } from "@swan-io/lake/src/components/FlowPresentation";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { breakpoints } from "@swan-io/lake/src/constants/design";
import { useMemo } from "react";
import { StyleSheet } from "react-native";
import { OnboardingFooter } from "../../components/OnboardingFooter";
import { OnboardingStepContent } from "../../components/OnboardingStepContent";
import { t } from "../../utils/i18n";
import { CompanyOnboardingRoute, Router } from "../../utils/routes";

const styles = StyleSheet.create({
  containerMobile: {
    maxWidth: 300,
    margin: "auto",
  },
  stepsContainer: {
    width: "100%",
    flexGrow: 1,
    flexShrink: 0,
  },
});

type Props = {
  previousStep: CompanyOnboardingRoute;
  nextStep: CompanyOnboardingRoute;
  onboardingId: string;
  hasOwnershipStep: boolean;
  hasDocumentsStep: boolean;
};

export const CompanyFlowPresentation = ({
  previousStep,
  nextStep,
  onboardingId,
  hasOwnershipStep,
  hasDocumentsStep,
}: Props) => {
  const onPressPrevious = () => {
    Router.push(previousStep, { onboardingId });
  };

  const onPressNext = () => {
    Router.push(nextStep, { onboardingId });
  };

  const steps = useMemo(() => {
    const steps: FlowStep[] = [];

    steps.push(
      {
        label: t("company.step.presentation.step1"),
        icon: "mail-regular",
      },
      {
        label: t("company.step.presentation.step2"),
        icon: "lake-clipboard-bullet",
      },
    );
    if (hasOwnershipStep) {
      steps.push({
        label: t("company.step.presentation.step3"),
        icon: "people-add-regular",
      });
    }
    if (hasDocumentsStep) {
      steps.push({
        label: t("company.step.presentation.step4"),
        icon: "document-regular",
      });
    }
    steps.push({
      label: t("company.step.presentation.step5"),
      icon: "phone-regular",
    });

    return steps;
  }, [hasOwnershipStep, hasDocumentsStep]);

  return (
    <>
      <OnboardingStepContent>
        <ResponsiveContainer breakpoint={breakpoints.medium} style={commonStyles.fill}>
          {({ small }) => (
            <Box
              alignItems={small ? "center" : "start"}
              style={[commonStyles.fill, small && styles.containerMobile]}
            >
              <LakeHeading
                level={1}
                variant={small ? "h3" : "h1"}
                align={small ? "center" : "left"}
              >
                {t("company.step.presentation.title", { count: steps.length })}
              </LakeHeading>

              <Space height={small ? 8 : 12} />

              <LakeText align={small ? "center" : "left"}>
                {t("company.step.presentation.description")}
              </LakeText>

              <Box justifyContent="center" alignItems="center" style={styles.stepsContainer}>
                <Space height={small ? 16 : 24} />
                <FlowPresentation mode={small ? "mobile" : "desktop"} steps={steps} />
                <Space height={small ? 16 : 24} />
              </Box>
            </Box>
          )}
        </ResponsiveContainer>
      </OnboardingStepContent>

      <OnboardingFooter onPrevious={onPressPrevious} onNext={onPressNext} />
    </>
  );
};
