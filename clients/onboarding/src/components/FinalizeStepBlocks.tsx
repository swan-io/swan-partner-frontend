import { Link } from "@swan-io/chicane";
import { BorderedIcon } from "@swan-io/lake/src/components/BorderedIcon";
import { Box } from "@swan-io/lake/src/components/Box";
import { Fill } from "@swan-io/lake/src/components/Fill";
import { Icon } from "@swan-io/lake/src/components/Icon";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tag } from "@swan-io/lake/src/components/Tag";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { animations, colors, spacings } from "@swan-io/lake/src/constants/design";
import { CSSProperties, Fragment } from "react";
import { StyleSheet } from "react-native";
import { P, match } from "ts-pattern";
import { t } from "../utils/i18n";
import { CompanyOnboardingRoute, IndividualOnboardingRoute, Router } from "../utils/routes";
import { getErrorFieldLabel } from "../utils/templateTranslations";

const inlineStyles = {
  link: {
    display: "block",
    textDecoration: "none",
    width: "100%",
  },
  linkDesktop: {
    display: "block",
    textDecoration: "none",
    width: "100%",
    maxWidth: 600,
  },
} satisfies Record<string, CSSProperties>;

const styles = StyleSheet.create({
  errorDescriptionMobile: {
    maxWidth: 300,
  },
  tilesContainer: {
    width: "100%",
  },
  tile: {
    paddingVertical: spacings[16],
  },
});

type StepRoute = IndividualOnboardingRoute | CompanyOnboardingRoute;

type Props<R extends StepRoute> = {
  onboardingId: string;
  steps: WizardStep<R>[];
  isShaking: boolean;
  isMobile: boolean;
};

export const FinalizeInvalidSteps = <R extends StepRoute>({
  onboardingId,
  steps,
  isShaking,
  isMobile,
}: Props<R>) => {
  return (
    <>
      <Box alignItems="center" style={isShaking && animations.shake.enter}>
        <BorderedIcon name="shield-error-regular" size={100} padding={16} color="negative" />
      </Box>

      <Space height={24} />

      <LakeText align="center" variant="medium" color={colors.negative[500]}>
        {t("step.finalizeError.title")}
      </LakeText>

      <Space height={isMobile ? 4 : 12} />

      <LakeText align="center" style={isMobile ? styles.errorDescriptionMobile : undefined}>
        {t("step.finalizeError.description")}
      </LakeText>

      <Space height={24} />

      <Box alignItems="center" style={[styles.tilesContainer, isShaking && animations.shake.enter]}>
        {steps.map(step =>
          match(step)
            .with({ errors: P.when(errors => errors.length > 0) }, ({ id, label, errors }) => (
              <Fragment key={id}>
                <Link
                  to={Router[id]({ onboardingId })}
                  style={isMobile ? inlineStyles.link : inlineStyles.linkDesktop}
                >
                  <Tile style={styles.tile}>
                    <Box direction="row" alignItems="center">
                      <Box>
                        <LakeText variant="medium" color={colors.gray[900]}>
                          {label}
                        </LakeText>

                        <Space height={4} />

                        {id === "OnboardingOwnership" ? (
                          <LakeText>{t("step.finalizeError.owners")}</LakeText>
                        ) : (
                          errors.map(({ fieldName }) => (
                            <LakeText key={fieldName}>{getErrorFieldLabel(fieldName)}</LakeText>
                          ))
                        )}
                      </Box>

                      <Fill minWidth={12} />

                      {isMobile ? (
                        <Tag icon="warning-regular" iconSize={14} color="negative" />
                      ) : (
                        <Tag color="negative">{t("step.finalizeError.missingInfo")}</Tag>
                      )}

                      <Space width={12} />
                      <Icon name="chevron-right-filled" size={24} color={colors.gray[500]} />
                    </Box>
                  </Tile>
                </Link>

                <Space height={isMobile ? 32 : 24} />
              </Fragment>
            ))
            .otherwise(() => null),
        )}
      </Box>
    </>
  );
};

export const FinalizeBlock = ({ isMobile }: { isMobile: boolean }) => {
  return (
    <>
      <BorderedIcon name="shield-regular" size={100} padding={16} color="partner" />
      <Space height={24} />

      <LakeText align="center" variant="medium" color={colors.gray[900]}>
        {t("step.finalize.title")}
      </LakeText>

      <Space height={isMobile ? 4 : 12} />
      <LakeText align="center">{t("step.finalize.description")}</LakeText>
    </>
  );
};
