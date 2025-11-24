import { AsyncData, Result } from "@swan-io/boxed";
import { useQuery } from "@swan-io/graphql-client";
import { Box } from "@swan-io/lake/src/components/Box";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { LoadingView } from "@swan-io/lake/src/components/LoadingView";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { breakpoints, colors } from "@swan-io/lake/src/constants/design";
import { match, P } from "ts-pattern";
import { OnboardingStepContent } from "../../../../onboarding/src/components/OnboardingStepContent";
import { StepTitle } from "../../../../onboarding/src/components/StepTitle";
import { GetVerificationRenewalDocument, MonthlyIncome } from "../../graphql/partner";
import { t } from "../../utils/i18n";
import { Router } from "../../utils/routes";
import { ErrorView } from "../ErrorView";

type Props = {
  verificationRenewalId: string;
};

const translateMonthlyIncome = (monthlyIncome: MonthlyIncome) =>
  match(monthlyIncome)
    .with("Between1500And3000", () => t("verificationRenewal.monthlyIncome.Between1500And3000"))
    .with("Between3000And4500", () => t("verificationRenewal.monthlyIncome.Between3000And4500"))
    .with("Between500And1500", () => t("verificationRenewal.monthlyIncome.Between500And1500"))
    .with("LessThan500", () => t("verificationRenewal.monthlyIncome.LessThan500"))
    .with("MoreThan4500", () => t("verificationRenewal.monthlyIncome.MoreThan4500"))

    .exhaustive();

export const VerificationRenewalPersonalInfo = ({ verificationRenewalId }: Props) => {
  const [data] = useQuery(GetVerificationRenewalDocument, {
    id: verificationRenewalId,
  });

  return match(data)
    .with(AsyncData.P.NotAsked, AsyncData.P.Loading, () => <LoadingView />)
    .with(AsyncData.P.Done(Result.P.Error(P.select())), error => <ErrorView error={error} />)
    .with(AsyncData.P.Done(Result.P.Error(P.select())), error => <ErrorView error={error} />)
    .with(AsyncData.P.Done(Result.P.Ok(P.select())), ({ projectInfo, verificationRenewal }) => (
      <OnboardingStepContent>
        <ResponsiveContainer breakpoint={breakpoints.medium}>
          {({ small }) => (
            <>
              <StepTitle isMobile={small}>
                {t("verificationRenewal.personalInformation.title")}
              </StepTitle>
              <Space height={4} />
              <LakeText>
                {t("verificationRenewal.personalInformation.subtitle", {
                  companyName: projectInfo.name,
                })}
              </LakeText>
              <Space height={40} />

              {match(verificationRenewal?.info)
                .with(
                  { __typename: "IndividualVerificationRenewalInfo" },
                  ({
                    accountAdmin: {
                      residencyAddress,
                      monthlyIncome,
                      employmentStatus,
                      firstName,
                      lastName,
                    },
                  }) => (
                    <Tile>
                      <LakeLabel
                        color="current"
                        label={t("verificationRenewal.personalInformation.name")}
                        render={() => (
                          <LakeText color={colors.gray[900]}>{`${firstName} ${lastName}`}</LakeText>
                        )}
                      />

                      <Space height={24} />
                      <LakeLabel
                        color="current"
                        label={t("verificationRenewal.personalInformation.address")}
                        render={() => (
                          <Box>
                            <LakeText color={colors.gray[900]}>
                              {residencyAddress.addressLine1}
                            </LakeText>
                            <LakeText color={colors.gray[900]}>
                              {residencyAddress.addressLine2}
                            </LakeText>
                            <LakeText color={colors.gray[900]}>
                              {`${residencyAddress.postalCode} ${residencyAddress.city}`}
                            </LakeText>
                          </Box>
                        )}
                      />

                      <Space height={24} />
                      <LakeLabel
                        color="current"
                        label={t("verificationRenewal.personalInformation.monthlyIncomes")}
                        render={() => (
                          <LakeText color={colors.gray[900]}>
                            {translateMonthlyIncome(monthlyIncome)}
                          </LakeText>
                        )}
                      />

                      <Space height={24} />
                      <LakeLabel
                        color="current"
                        label={t("verificationRenewal.personalInformation.occupation")}
                        render={() => (
                          <LakeText color={colors.gray[900]}>{employmentStatus}</LakeText>
                        )}
                      />
                    </Tile>
                  ),
                )
                .with({ __typename: "CompanyVerificationRenewalInfo" }, () => null)

                .otherwise(() => null)}

              <Space height={40} />

              <LakeButtonGroup>
                <LakeButton
                  mode="secondary"
                  onPress={() => Router.push("VerificationRenewalRoot", { verificationRenewalId })}
                >
                  {t("verificationRenewal.cancel")}
                </LakeButton>

                <LakeButton
                  onPress={() =>
                    Router.push("VerificationRenewalDocuments", { verificationRenewalId })
                  }
                  color="current"
                >
                  {t("verificationRenewal.confirm")}
                </LakeButton>
              </LakeButtonGroup>
            </>
          )}
        </ResponsiveContainer>
      </OnboardingStepContent>
    ))

    .otherwise(() => <ErrorView />);
};
