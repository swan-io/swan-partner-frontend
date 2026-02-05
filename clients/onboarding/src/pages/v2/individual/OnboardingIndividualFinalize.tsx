import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { breakpoints } from "@swan-io/lake/src/constants/design";
import { OnboardingFooter } from "../../../components/OnboardingFooter";
import { StepTitle } from "../../../components/StepTitle";
import { IndividualOnboardingFragment } from "../../../graphql/partner";
import { t } from "../../../utils/i18n";

import { Option } from "@swan-io/boxed";
import { BorderedIcon } from "@swan-io/lake/src/components/BorderedIcon";
import { Box } from "@swan-io/lake/src/components/Box";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { Space } from "@swan-io/lake/src/components/Space";
import { match, P } from "ts-pattern";
import { env } from "../../../utils/env";
import { projectConfiguration } from "../../../utils/projectId";
import { Router } from "../../../utils/routes";

type Props = {
  onboarding: NonNullable<IndividualOnboardingFragment>;
};

export const OnboardingIndividualFinalize = ({ onboarding }: Props) => {
  const onboardingId = onboarding.id;

  const onPressPrevious = () => {
    Router.push("Activity", { onboardingId });
  };

  const onPressNext = () => {
    const queryString = new URLSearchParams();
    queryString.append("identificationLevel", "Auto");
    queryString.append("onboardingId", onboardingId);
    queryString.append("onboardingV2", "true");
    queryString.append("phoneNumber", "%2B33651000000"); // todo encoded user phone number from local storage

    match(projectConfiguration)
      .with(Option.P.Some({ projectId: P.select(), mode: "MultiProject" }), projectId =>
        queryString.append("projectId", projectId),
      )
      .otherwise(() => {});

    window.location.assign(`${env.BANKING_URL}/auth/login?${queryString.toString()}`);
  };

  return (
    <>
      <ResponsiveContainer breakpoint={breakpoints.medium}>
        {({ small }) => (
          <>
            <Tile paddingVertical={48}>
              <Box alignItems="center">
                <BorderedIcon name="lake-phone" size={100} padding={16} color="partner" />
                <Space height={24} />
                <StepTitle isMobile={small}>{t("individual.step.finalize.title")}</StepTitle>
                <LakeText>{t("individual.step.finalize.content")}</LakeText>
              </Box>
            </Tile>
          </>
        )}
      </ResponsiveContainer>
      <OnboardingFooter
        onNext={onPressNext}
        onPrevious={onPressPrevious}
        justifyContent="start"
        nextLabel="wizard.sendCode"
        // loading={updateResult.isLoading()}
      />
    </>
  );
};
