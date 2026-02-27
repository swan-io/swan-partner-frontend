import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { breakpoints, colors, radii, texts } from "@swan-io/lake/src/constants/design";
import { Pressable, StyleSheet, View } from "react-native";
import { OnboardingFooter } from "../../../components/OnboardingFooter";
import { StepTitle } from "../../../components/StepTitle";
import { CompanyOnboardingFragment } from "../../../graphql/partner";
import { formatNestedMessage, t } from "../../../utils/i18n";

import { Box } from "@swan-io/lake/src/components/Box";
import { Icon } from "@swan-io/lake/src/components/Icon";
import { LakeButton } from "@swan-io/lake/src/components/LakeButton";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { Separator } from "@swan-io/lake/src/components/Separator";
import { Space } from "@swan-io/lake/src/components/Space";
import { useMemo } from "react";
import { match, P } from "ts-pattern";
import { ownershipText } from "../../../constants/business";
import { Router } from "../../../utils/routes";

export type ActivityFieldName =
  | "businessActivityDescription"
  | "monthlyPaymentVolume"
  | "headcount"
  | "websites"
  | "forecastYearlyIncome";

type Props = {
  onboarding: NonNullable<CompanyOnboardingFragment>;
};

const styles = StyleSheet.create({
  gap: {
    gap: "32px",
  },
  grid: {
    display: "grid",
    gap: "8px",
  },
  gridDesktop: {
    gap: "16px 32px",
  },
  addOwnerButton: {
    padding: 24,
    borderColor: colors.gray[300],
    borderWidth: 1,
    borderRadius: radii[8],
    borderStyle: "dashed",
    flexGrow: 1,
    flexDirection: "row",
    justifyContent: "center",
    gap: "8px",
  },
  textTitle: {
    ...texts.medium,
    color: colors.gray[900],
    marginBottom: 4,
  },
  textSubTitle: {
    ...texts.smallMedium,
    color: colors.gray[900],
  },
});

const ActionMenu = () => (
  <View style={{ width: 64 }}>
    <LakeButton
      size="small"
      mode="tertiary"
      icon="edit-regular"
      color="gray"
      onPress={() => console.log("edit")}
      ariaLabel={t("common.edit")}
    />
    <Space width={4} />
    <LakeButton
      size="small"
      mode="tertiary"
      icon="delete-regular"
      color="negative"
      onPress={() => console.log("delete")}
      ariaLabel={t("common.delete")}
    />
  </View>
);

export const OnboardingCompanyOwnership = ({ onboarding }: Props) => {
  const onboardingId = onboarding.id;
  const { company } = onboarding;

  const relatedCompanyAndIndividual = useMemo(
    () => [...(company?.relatedIndividuals ?? []), ...(company?.relatedCompanies ?? [])],
    [company],
  );

  const onPressPrevious = () => {
    Router.push("Activity", { onboardingId });
  };

  const onPressNext = () => {
    Router.push("Finalize", { onboardingId });
  };

  return (
    <>
      <ResponsiveContainer breakpoint={breakpoints.medium} style={styles.gap}>
        {({ small }) => (
          <>
            <Tile>
              <StepTitle isMobile={small}>{t("company.step.ownersip.title")}</StepTitle>
              <Space height={12} />
              <LakeText>{t("company.step.ownersip.description")}</LakeText>
              <Space height={24} />

              <LakeText>
                {formatNestedMessage("company.step.ownersip.additionalDescription", {
                  bold: text => (
                    <LakeText variant="semibold" color={colors.gray[900]}>
                      {text}
                    </LakeText>
                  ),
                })}
              </LakeText>

              <Space height={24} />

              <Pressable
                role="button"
                style={styles.addOwnerButton}
                onPress={() => console.log("open modal")}
              >
                <Icon name="add-circle-regular" size={24} color={colors.gray[500]} />
                <LakeText>{t("company.step.ownersip.addTitle")}</LakeText>
              </Pressable>

              {relatedCompanyAndIndividual.length > 0 && (
                <>
                  <Space height={32} />

                  <Box direction="row">
                    <LakeText style={{ flexGrow: 2, ...styles.textTitle }}>Name</LakeText>
                    <LakeText style={styles.textTitle}>Role</LakeText>
                    <View style={{ width: 64 }} />
                  </Box>
                  <Space height={32} />

                  {relatedCompanyAndIndividual.map((item, index) => (
                    <View key={index}>
                      {index > 0 && (
                        <>
                          <Separator space={16} />
                          <Space height={8} />
                        </>
                      )}

                      {match(item)
                        .with({ __typename: "CompanyRelatedCompany" }, company => (
                          <Box direction="row">
                            <Box grow={2}>
                              <LakeText style={styles.textTitle}>{company.entityName}</LakeText>
                              <LakeText style={texts.smallRegular}>
                                {company.roles.join(", ")}
                              </LakeText>
                            </Box>
                            <LakeText style={styles.textSubTitle}>
                              {t("company.step.ownersip.company")} •{" "}
                              {t("company.step.ownersip.role.LegalRepresentative")}
                            </LakeText>
                            <ActionMenu />
                          </Box>
                        ))
                        .with(
                          {
                            __typename: P.union(
                              "CompanyLegalRepresentative",
                              "CompanyUltimateBeneficialOwner",
                              "CompanyLegalRepresentativeAndUltimateBeneficialOwner",
                            ),
                          },
                          individual => (
                            <Box direction="row">
                              <Box grow={2}>
                                <LakeText style={styles.textTitle}>
                                  {individual.firstName} {individual.lastName}
                                </LakeText>
                                <LakeText style={texts.smallRegular}>
                                  {match(individual)
                                    .with(
                                      { __typename: "CompanyLegalRepresentative" },
                                      ({ legalRepresentative }) =>
                                        legalRepresentative.roles.join(", "),
                                    )
                                    .with(
                                      { __typename: "CompanyUltimateBeneficialOwner" },
                                      ({ ultimateBeneficialOwner }) =>
                                        ultimateBeneficialOwner?.ownership
                                          ? ownershipText(ultimateBeneficialOwner.ownership)
                                          : "",
                                    )
                                    .with(
                                      {
                                        __typename:
                                          "CompanyLegalRepresentativeAndUltimateBeneficialOwner",
                                      },
                                      ({ legalRepresentative, ultimateBeneficialOwner }) =>
                                        legalRepresentative.roles.join(", ") +
                                        (ultimateBeneficialOwner?.ownership
                                          ? ` • ${ownershipText(ultimateBeneficialOwner.ownership)}`
                                          : ""),
                                    )
                                    .exhaustive()}
                                </LakeText>
                              </Box>
                              <LakeText style={styles.textSubTitle}>
                                {t(`company.step.ownersip.role.${individual.type}`)}
                              </LakeText>
                              <ActionMenu />
                            </Box>
                          ),
                        )
                        .exhaustive()}
                    </View>
                  ))}
                </>
              )}
            </Tile>
          </>
        )}
      </ResponsiveContainer>
      <OnboardingFooter onNext={onPressNext} onPrevious={onPressPrevious} justifyContent="start" />
    </>
  );
};
