import { AsyncData, Option, Result } from "@swan-io/boxed";
import { useMutation } from "@swan-io/graphql-client";
import { BorderedIcon } from "@swan-io/lake/src/components/BorderedIcon";
import { Box } from "@swan-io/lake/src/components/Box";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeCheckbox } from "@swan-io/lake/src/components/LakeCheckbox";
import { LakeHeading } from "@swan-io/lake/src/components/LakeHeading";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { breakpoints, colors } from "@swan-io/lake/src/constants/design";
import { useBoolean } from "@swan-io/lake/src/hooks/useBoolean";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { Pressable, StyleSheet } from "react-native";
import { match, P } from "ts-pattern";
import { OnboardingStepContent } from "../../../../onboarding/src/components/OnboardingStepContent";
import { StepTitle } from "../../../../onboarding/src/components/StepTitle";
import { FinalizeVerificationRenewalDocument } from "../../graphql/partner";
import { t } from "../../utils/i18n";
import { Router } from "../../utils/routes";
import { RenewalStep } from "../../utils/verificationRenewal";
import { VerificationRenewalFooter } from "./VerificationRenewalFooter";

const styles = StyleSheet.create({
  container: {
    height: "100%",
  },
});

export const VerificationRenewalFinalizeSuccess = () => {
  return (
    <Box direction="column" alignItems="center" justifyContent="center" style={styles.container}>
      <BorderedIcon padding={24} name="lake-check" size={100} />

      <Space height={32} />
      <LakeHeading variant="h4" level={1}>
        {t("verificationRenewal.finalize.title")}
      </LakeHeading>

      <Space height={16} />
      <LakeText align="center">{t("verificationRenewal.finalize.subtitle")}</LakeText>

      <Space height={16} />
    </Box>
  );
};

type ErrorProps = {
  retry: () => void;
  loading: boolean;
};

const VerificationRenewalFinalizeError = ({ retry, loading }: ErrorProps) => {
  return (
    <Box direction="column" alignItems="center" justifyContent="center" style={styles.container}>
      <BorderedIcon padding={24} name="lake-error" size={100} />

      <Space height={32} />
      <LakeHeading variant="h4" level={1}>
        {t("verificationRenewal.finalize.error.title")}
      </LakeHeading>

      <Space height={16} />
      <LakeText align="center">{t("verificationRenewal.finalize.error.subtitle")}</LakeText>

      <Space height={16} />
      <LakeButton color="partner" loading={loading} onPress={retry}>
        {t("verificationRenewal.finalize.error.button")}
      </LakeButton>
    </Box>
  );
};

type Props = {
  verificationRenewalId: string;
  previousStep: RenewalStep | undefined;
};

export const VerificationRenewalFinalize = ({ verificationRenewalId, previousStep }: Props) => {
  const [finalizeVerificationRenewal, finalization] = useMutation(
    FinalizeVerificationRenewalDocument,
  );

  const [checked, setChecked] = useBoolean(false);

  const handleFinalize = () =>
    finalizeVerificationRenewal({
      input: {
        verificationRenewalId,
      },
    })
      .mapOk(data => data.finalizeVerificationRenewal)
      .mapOkToResult(data => Option.fromNullable(data).toResult(data))
      .mapOkToResult(filterRejectionsToResult);

  return match(finalization)
    .with(AsyncData.P.NotAsked, AsyncData.P.Loading, () => (
      <OnboardingStepContent>
        <ResponsiveContainer breakpoint={breakpoints.medium}>
          {({ small }) => (
            <>
              <StepTitle isMobile={small}>{t("verificationRenewal.consent.title")}</StepTitle>
              <Space height={8} />
              <LakeText>{t("verificationRenewal.consent.subtitle")}</LakeText>

              <Space height={40} />
              <Tile>
                <Pressable onPress={setChecked.toggle} role="checkbox" aria-checked={checked}>
                  <Box direction="row" alignItems="center">
                    <LakeCheckbox value={checked} color="partner" />
                    <Space width={8} />

                    <LakeText variant="regular" color={colors.gray[900]}>
                      {t("verificationRenewal.consent.checkbox")}
                    </LakeText>
                  </Box>
                </Pressable>
              </Tile>

              <VerificationRenewalFooter
                onPrevious={
                  previousStep !== undefined
                    ? () =>
                        Router.push(previousStep?.id, {
                          verificationRenewalId: verificationRenewalId,
                        })
                    : undefined
                }
                onNext={handleFinalize}
                nextDisabled={!checked}
                loading={finalization.isLoading()}
              />
            </>
          )}
        </ResponsiveContainer>
      </OnboardingStepContent>
    ))
    .with(AsyncData.P.Done(Result.P.Error(P._)), () => (
      <VerificationRenewalFinalizeError retry={handleFinalize} loading={finalization.isLoading()} />
    ))
    .with(AsyncData.P.Done(Result.P.Ok(P._)), () => <VerificationRenewalFinalizeSuccess />)
    .exhaustive();
};
