import { Box } from "@swan-io/lake/src/components/Box";
import { FlowPresentation, FlowStep } from "@swan-io/lake/src/components/FlowPresentation";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { breakpoints } from "@swan-io/lake/src/constants/design";
import { StyleSheet } from "react-native";
import { OnboardingFooter } from "../../components/OnboardingFooter";
import { OnboardingStepContent } from "../../components/OnboardingStepContent";
import { t } from "../../utils/i18n";
import { Router } from "../../utils/routes";

const styles = StyleSheet.create({
  containerMobile: {
    maxWidth: 300,
    margin: "auto",
  },
});

const steps: FlowStep[] = [
  {
    label: t("individual.step.introduction.step1"),
    icon: "mail-regular",
  },
  {
    label: t("individual.step.introduction.step2"),
    icon: "lake-clipboard-bullet",
  },
  {
    label: t("individual.step.introduction.step3"),
    icon: "add-circle-regular",
  },
  {
    label: t("individual.step.introduction.step4"),
    icon: "phone-regular",
  },
];

type Props = {
  onboardingId: string;
};

export const IndividualFlowPresentation = ({ onboardingId }: Props) => {
  const onPressNext = () => {
    Router.push("V2_OnboardingEmail", { onboardingId });
  };

  return (
    <>
      <OnboardingStepContent>
        <ResponsiveContainer breakpoint={breakpoints.medium}>
          {({ small }) => (
            <Box alignItems={small ? "center" : "start"} style={small && styles.containerMobile}>
              <LakeHeading
                level={1}
                variant={small ? "h3" : "h1"}
                align={small ? "center" : "left"}
              >
                {t("individual.step.introduction.title")}
              </LakeHeading>

              <Space height={small ? 8 : 12} />

              <LakeText align={small ? "center" : "left"}>
                {t("individual.step.introduction.description")}
              </LakeText>

              <Space height={small ? 32 : 48} />
              <FlowPresentation mode={small ? "mobile" : "desktop"} steps={steps} />
            </Box>
          )}
        </ResponsiveContainer>
      </OnboardingStepContent>

      <OnboardingFooter onNext={onPressNext} />
    </>
  );
};
