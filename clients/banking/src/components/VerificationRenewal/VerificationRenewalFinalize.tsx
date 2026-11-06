import { AsyncData, Option, Result } from "@bloodyowl/boxed";
import { useMutation } from "@bloodyowl/graphql-client";
import { BorderedIcon } from "@swan-io/lake/src/components/BorderedIcon";
import { Box } from "@swan-io/lake/src/components/Box";
import { IconName } from "@swan-io/lake/src/components/Icon";
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
import { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { match, P } from "ts-pattern";
import { StepTitle } from "../../../../onboarding/src/components/StepTitle";
import { FinalizeVerificationRenewalDocument } from "../../graphql/partner";
import { t } from "../../utils/i18n";
import { Router } from "../../utils/routes";
import {
  getFinalizeValidationErrors,
  RenewalStep,
  renewalSteps,
} from "../../utils/verificationRenewal";
import { VerificationRenewalFooter } from "./VerificationRenewalFooter";
import { VerificationRenewalStepContent } from "./VerificationRenewalStepContent";

const styles = StyleSheet.create({
  container: {
    height: "100%",
  },
  details: {
    alignSelf: "stretch",
    maxWidth: 560,
    marginHorizontal: "auto",
    width: "100%",
  },
});

type StatusProps = {
  icon: IconName;
  title: string;
  subtitle: string;
  children?: ReactNode;
};

const VerificationRenewalFinalizeStatus = ({ icon, title, subtitle, children }: StatusProps) => (
  <Box direction="column" alignItems="center" justifyContent="center" style={styles.container}>
    <BorderedIcon padding={24} name={icon} size={100} />

    <Space height={32} />
    <LakeHeading variant="h4" level={1} align="center">
      {title}
    </LakeHeading>

    <Space height={16} />
    <LakeText align="center">{subtitle}</LakeText>

    {children != null && (
      <>
        <Space height={24} />
        {children}
      </>
    )}
  </Box>
);

export const VerificationRenewalFinalizeSuccess = () => (
  <VerificationRenewalFinalizeStatus
    icon="lake-check"
    title={t("verificationRenewal.finalize.title")}
    subtitle={t("verificationRenewal.finalize.subtitle")}
  />
);

const ErrorList = ({ items }: { items: string[] }) => (
  <>
    {items.map(item => (
      <LakeText key={item} color={colors.gray[700]}>
        {`• ${item}`}
      </LakeText>
    ))}
  </>
);

type ValidationErrorProps = {
  fields: Parameters<typeof getFinalizeValidationErrors>[0];
  verificationRenewalId: string;
  steps: RenewalStep[];
  previousStep: RenewalStep | undefined;
};

const VerificationRenewalFinalizeValidationError = ({
  fields,
  verificationRenewalId,
  steps,
  previousStep,
}: ValidationErrorProps) => {
  const { beneficialOwners, others } = getFinalizeValidationErrors(fields);
  const hasOwnershipStep = steps.some(step => step.id === renewalSteps.renewalOwnership.id);

  return (
    <VerificationRenewalFinalizeStatus
      icon="lake-warning"
      title={t("verificationRenewal.finalize.validation.title")}
      subtitle={t("verificationRenewal.finalize.validation.subtitle")}
    >
      <View style={styles.details}>
        {match(beneficialOwners)
          .with(Option.P.Some(P.select()), ({ count, fields }) => (
            <Tile>
              <LakeText variant="medium" color={colors.gray[900]}>
                {t("verificationRenewal.finalize.validation.beneficialOwners", { count })}
              </LakeText>

              <Space height={8} />
              <ErrorList items={fields} />

              {hasOwnershipStep && (
                <>
                  <Space height={16} />

                  <LakeButton
                    color="partner"
                    mode="secondary"
                    size="small"
                    icon="edit-regular"
                    onPress={() =>
                      Router.push(renewalSteps.renewalOwnership.id, { verificationRenewalId })
                    }
                  >
                    {t("verificationRenewal.finalize.validation.reviewBeneficialOwners")}
                  </LakeButton>
                </>
              )}
            </Tile>
          ))
          .otherwise(() => null)}

        {others.length > 0 && (
          <>
            {beneficialOwners.isSome() && <Space height={16} />}

            <Tile>
              <ErrorList items={others} />
            </Tile>
          </>
        )}

        {previousStep != null && (beneficialOwners.isNone() || !hasOwnershipStep) && (
          <>
            <Space height={24} />

            <LakeButton
              color="partner"
              onPress={() => Router.push(previousStep.id, { verificationRenewalId })}
            >
              {t("common.back")}
            </LakeButton>
          </>
        )}
      </View>
    </VerificationRenewalFinalizeStatus>
  );
};

type Props = {
  verificationRenewalId: string;
  steps: RenewalStep[];
  previousStep: RenewalStep | undefined;
};

export const VerificationRenewalFinalize = ({
  verificationRenewalId,
  steps,
  previousStep,
}: Props) => {
  const [finalizeVerificationRenewal, finalization] = useMutation(
    FinalizeVerificationRenewalDocument,
  );

  const [checked, setChecked] = useBoolean(false);

  const handleFinalize = () => {
    finalizeVerificationRenewal({
      input: {
        verificationRenewalId,
      },
    });
  };

  const finalizationResult = finalization
    .mapOk(data => data.finalizeVerificationRenewal)
    .mapOkToResult(data => Option.fromNullable(data).toResult(data))
    .mapOkToResult(filterRejectionsToResult);

  return match(finalizationResult)
    .with(AsyncData.P.NotAsked, AsyncData.P.Loading, () => (
      <VerificationRenewalStepContent>
        <ResponsiveContainer breakpoint={breakpoints.medium}>
          {() => (
            <>
              <StepTitle>{t("verificationRenewal.consent.title")}</StepTitle>
              <Space height={8} />
              <LakeText>{t("verificationRenewal.consent.subtitle")}</LakeText>

              <Space height={24} />
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
      </VerificationRenewalStepContent>
    ))
    .with(AsyncData.P.Done(Result.P.Error(P.select())), error =>
      match(error)
        // UBO data incomplete, shouldn't happen as the ownership step checks the same rules
        .with({ __typename: "ValidationRejection" }, ({ fields }) => (
          <VerificationRenewalFinalizeValidationError
            fields={fields}
            verificationRenewalId={verificationRenewalId}
            steps={steps}
            previousStep={previousStep}
          />
        ))
        // already submitted, moved by an analyst, completed or refused
        .with({ __typename: "VerificationRenewalUpdateNotAllowedRejection" }, () => (
          <VerificationRenewalFinalizeStatus
            icon="lake-clock"
            title={t("verificationRenewal.finalize.notAllowed.title")}
            subtitle={t("verificationRenewal.finalize.notAllowed.subtitle")}
          />
        ))
        .with({ __typename: "VerificationRenewalNotFoundRejection" }, () => (
          <VerificationRenewalFinalizeStatus
            icon="lake-denied"
            title={t("verificationRenewal.finalize.notFound.title")}
            subtitle={t("verificationRenewal.finalize.notFound.subtitle")}
          />
        ))
        .with({ __typename: "ForbiddenRejection" }, () => (
          <VerificationRenewalFinalizeStatus
            icon="lake-lock-closed"
            title={t("verificationRenewal.finalize.forbidden.title")}
            subtitle={t("verificationRenewal.finalize.forbidden.subtitle")}
          />
        ))
        // technical error (network, GraphQL), it can be retried
        .otherwise(() => (
          <VerificationRenewalFinalizeStatus
            icon="lake-error"
            title={t("verificationRenewal.finalize.error.title")}
            subtitle={t("verificationRenewal.finalize.error.subtitle")}
          >
            <LakeButton color="partner" onPress={handleFinalize}>
              {t("verificationRenewal.finalize.error.button")}
            </LakeButton>
          </VerificationRenewalFinalizeStatus>
        )),
    )
    .with(AsyncData.P.Done(Result.P.Ok(P._)), () => <VerificationRenewalFinalizeSuccess />)
    .exhaustive();
};
