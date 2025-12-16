import { Box } from "@swan-io/lake/src/components/Box";
import { FlowPresentation, FlowStep } from "@swan-io/lake/src/components/FlowPresentation";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { Link } from "@swan-io/lake/src/components/Link";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { breakpoints } from "@swan-io/lake/src/constants/design";
import { StyleSheet } from "react-native";
import { match } from "ts-pattern";
import { OnboardingFooter } from "../../components/OnboardingFooter";
import { OnboardingStepContent } from "../../components/OnboardingStepContent";
import { PartnershipFooter } from "../../components/PartnershipFooter";
import { formatNestedMessage, locale, t } from "../../utils/i18n";
import { ChangeAdminRoute, Router } from "../../utils/routes";

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
  underline: {
    textDecorationLine: "underline",
  },
});

type Props = {
  changeAdminRequestId: string;
  steps: FlowStep[];
  nextStep: ChangeAdminRoute;
};

export const ChangeAdminFlowPresentation = ({ changeAdminRequestId, steps, nextStep }: Props) => {
  const onPressNext = () => {
    Router.push(nextStep, { requestId: changeAdminRequestId });
  };

  return (
    <OnboardingStepContent>
      <ResponsiveContainer breakpoint={breakpoints.medium} style={commonStyles.fill}>
        {({ small }) => (
          <Box
            alignItems={small ? "center" : "start"}
            style={[commonStyles.fill, small && styles.containerMobile]}
          >
            <LakeHeading level={1} variant={small ? "h3" : "h1"} align={small ? "center" : "left"}>
              {t("changeAdmin.presentation.title", { count: steps.length })}
            </LakeHeading>

            <Space height={small ? 8 : 12} />

            <LakeText align={small ? "center" : "left"}>
              {t("changeAdmin.presentation.description")}
            </LakeText>

            <Box justifyContent="center" alignItems="center" style={styles.stepsContainer}>
              <Space height={small ? 16 : 24} />
              <FlowPresentation mode={small ? "mobile" : "desktop"} steps={steps} />
              <Space height={small ? 16 : 24} />
            </Box>

            <LakeText align={small ? "center" : "left"}>
              {formatNestedMessage("changeAdmin.presentation.expireNotice", {
                bold: text => <LakeText variant="semibold">{text}</LakeText>,
              })}
            </LakeText>

            <Space height={small ? 8 : 12} />

            <LakeText align={small ? "center" : "left"}>
              {formatNestedMessage("changeAdmin.presentation.powerOfAttorneyNotice", {
                link: text => (
                  <LakeText variant="semibold" style={styles.underline}>
                    <Link
                      target="blank"
                      to={`/sworn-statement-template/${match(locale.language)
                        .with("nl", () => "nl")
                        .with("es", () => "es")
                        .with("it", () => "it")
                        .otherwise(() => "en")}.pdf`}
                    >
                      {text}
                    </Link>
                  </LakeText>
                ),
              })}
            </LakeText>
          </Box>
        )}
      </ResponsiveContainer>

      <Space height={24} />

      <OnboardingFooter nextLabel="changeAdmin.presentation.start" onNext={onPressNext} />
      <PartnershipFooter />
    </OnboardingStepContent>
  );
};
