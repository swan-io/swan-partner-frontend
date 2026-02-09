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
import { getCountryByCCA3 } from "@swan-io/shared-business/src/constants/countries";
import { useForm } from "@swan-io/use-form";
import { match, P } from "ts-pattern";
import { InputPhoneNumber } from "../../../components/InputPhoneNumber";
import { env } from "../../../utils/env";
import { prefixPhoneNumber } from "../../../utils/phone";
import { projectConfiguration } from "../../../utils/projectId";
import { Router } from "../../../utils/routes";

type Props = {
  onboarding: NonNullable<IndividualOnboardingFragment>;
};

export const OnboardingIndividualFinalize = ({ onboarding }: Props) => {
  const onboardingId = onboarding.id;
  const { accountInfo } = onboarding;

  const { Field, submitForm } = useForm({
    phoneNumber: {
      initialValue: {
        country: getCountryByCCA3(accountInfo?.country ?? "FRA"),
        nationalNumber: "",
      },
      sanitize: ({ country, nationalNumber }) => ({
        country,
        nationalNumber: nationalNumber.trim(),
      }),
      validate: ({ country, nationalNumber }) => {
        if (nationalNumber.trim() === "") {
          return t("error.requiredField");
        }
        const phoneNumber = prefixPhoneNumber(country, nationalNumber);

        if (!phoneNumber.valid) {
          return t("error.invalidPhoneNumber");
        }
      },
    },
  });

  const onPressPrevious = () => {
    Router.push("Activity", { onboardingId });
  };

  const onPressNext = () => {
    submitForm({
      onSuccess: values => {
        const option = Option.allFromDict(values);
        if (option.isNone()) {
          return;
        }

        const queryString = new URLSearchParams();
        queryString.append("identificationLevel", "Auto");
        queryString.append("onboardingId", onboardingId);
        queryString.append("onboardingV2", "true");

        const { phoneNumber } = option.get();
        const maybePhoneNumber = prefixPhoneNumber(phoneNumber.country, phoneNumber.nationalNumber);
        if (maybePhoneNumber.valid) {
          queryString.append("phoneNumber", maybePhoneNumber.e164);
        }

        match(projectConfiguration)
          .with(Option.P.Some({ projectId: P.select(), mode: "MultiProject" }), projectId =>
            queryString.append("projectId", projectId),
          )
          .otherwise(() => {});

        window.location.assign(`${env.BANKING_URL}/auth/login?${queryString.toString()}`);
      },
    });
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

                <Field name="phoneNumber">
                  {({ value, onBlur, onChange, valid, error, ref }) => (
                    <InputPhoneNumber
                      label={""}
                      ref={ref}
                      error={error}
                      value={value}
                      valid={valid}
                      onBlur={onBlur}
                      onValueChange={onChange}
                    />
                  )}
                </Field>
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
      />
    </>
  );
};
