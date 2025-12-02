import { Box } from "@swan-io/lake/src/components/Box";
import { FlowPresentation, FlowStep } from "@swan-io/lake/src/components/FlowPresentation";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { commonStyles } from "@swan-io/lake/src/constants/commonStyles";
import { breakpoints, colors } from "@swan-io/lake/src/constants/design";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { match } from "ts-pattern";
import { t } from "../../utils/i18n";
import { Router } from "../../utils/routes";
import { VerificationRenewalFooter } from "./VerificationRenewalFooter";

const desktopIconSize = 100;
const borderHeight = 2;
const desktopPadding = 50;

const mobileNumberSize = 24;
const mobileBorderWidth = 2;

const styles = StyleSheet.create({
  content: {
    width: "100%",
    maxWidth: 1280,
    margin: "auto",
    paddingHorizontal: 24,
    flex: 1,
  },
  contentDesktop: {
    paddingHorizontal: 40,
  },
  containerMobile: {
    maxWidth: 300,
    margin: "auto",
  },
  stepsContainer: {
    width: "100%",
    flexGrow: 1,
    flexShrink: 0,
  },
  container: {
    width: "100%",
  },
  textContainer: {
    width: desktopIconSize + desktopPadding,
  },
  lastTextContainer: {
    width: desktopIconSize,
  },
  desktopBarContainer: {
    flex: 1,
    paddingRight: 40,
    height: desktopIconSize,
  },
  desktopBar: {
    width: "100%",
    height: borderHeight,
    borderRadius: borderHeight / 2,
    backgroundColor: colors.gray[100],
  },

  mobileNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderColor: colors.current[100],
    borderWidth: 1,
    backgroundColor: colors.current[50],
  },
  mobileNumberActive: {
    borderColor: colors.current[500],
  },
  mobileNumberText: {
    position: "relative",
  },
  mobileBarContainer: {
    width: mobileNumberSize,
    paddingVertical: 4,
  },
  mobileBar: {
    width: mobileBorderWidth,
    height: 12,
    borderRadius: mobileBorderWidth / 2,
    backgroundColor: colors.gray[100],
  },
  completeMobileBar: {
    backgroundColor: colors.current[500],
  },
});

type Props = {
  verificationRenewalId: string;
  renewalTypename: "CompanyVerificationRenewalInfo" | "IndividualVerificationRenewalInfo";
};

export const VerificationRenewalIntro = ({ verificationRenewalId, renewalTypename }: Props) => {
  const steps = useMemo(() => {
    const steps: FlowStep[] = [];
    match(renewalTypename)
      .with("IndividualVerificationRenewalInfo", () =>
        steps.push(
          {
            label: t("verificationRenewal.intro.individual.step1"),
            icon: "person-regular",
          },
          {
            label: t("verificationRenewal.intro.individual.step2"),
            icon: "document-regular",
          },
          {
            label: t("verificationRenewal.intro.individual.step3"),
            icon: "checkmark-filled",
          },
        ),
      )
      .with("CompanyVerificationRenewalInfo", () =>
        steps.push(
          {
            label: t("verificationRenewal.intro.company.step1"),
            icon: "building-multiple-regular",
          },
          {
            label: t("verificationRenewal.intro.company.step2"),
            icon: "person-regular",
          },
          {
            label: t("verificationRenewal.intro.company.step3"),
            icon: "people-add-regular",
          },
          {
            label: t("verificationRenewal.intro.company.step4"),
            icon: "document-regular",
          },
          {
            label: t("verificationRenewal.intro.company.step5"),
            icon: "checkmark-filled",
          },
        ),
      )
      .exhaustive();

    return steps;
  }, [renewalTypename]);

  return (
    <ResponsiveContainer style={commonStyles.fill}>
      {({ large }) => (
        <View style={[styles.content, large && styles.contentDesktop]}>
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
                  {t("verificationRenewal.title")}
                </LakeHeading>
                <Space height={small ? 8 : 12} />
                <LakeText align={small ? "center" : "left"}>
                  {t("verificationRenewal.subtitle")}
                </LakeText>
                <Box style={styles.stepsContainer}>
                  <Space height={small ? 16 : 24} />

                  <Box justifyContent="center" alignItems="center" style={styles.stepsContainer}>
                    <Space height={small ? 16 : 24} />

                    <FlowPresentation mode={small ? "mobile" : "desktop"} steps={steps} />
                    <Space height={small ? 16 : 24} />
                  </Box>
                  <VerificationRenewalFooter
                    onNext={() =>
                      match(renewalTypename)
                        .with("IndividualVerificationRenewalInfo", () =>
                          Router.push("VerificationRenewalPersonalInformation", {
                            verificationRenewalId,
                          }),
                        )
                        .with("CompanyVerificationRenewalInfo", () =>
                          Router.push("VerificationRenewalAccountHolderInformation", {
                            verificationRenewalId,
                          }),
                        )
                        .exhaustive()
                    }
                  />
                  <Space height={small ? 16 : 24} />
                </Box>
              </Box>
            )}
          </ResponsiveContainer>
        </View>
      )}
    </ResponsiveContainer>
  );
};
