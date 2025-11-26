import { Box } from "@swan-io/lake/src/components/Box";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeLabel } from "@swan-io/lake/src/components/LakeLabel";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { breakpoints, colors } from "@swan-io/lake/src/constants/design";
import { match } from "ts-pattern";
import { OnboardingStepContent } from "../../../../onboarding/src/components/OnboardingStepContent";
import { StepTitle } from "../../../../onboarding/src/components/StepTitle";
import {
  EmploymentStatus,
  GetVerificationRenewalQuery,
  MonthlyIncome,
} from "../../graphql/partner";
import { t } from "../../utils/i18n";
import { Router } from "../../utils/routes";

type Props = {
  verificationRenewal: NonNullable<GetVerificationRenewalQuery["verificationRenewal"]>;
  projectInfo: NonNullable<GetVerificationRenewalQuery["projectInfo"]>;
};

const translateMonthlyIncome = (monthlyIncome: MonthlyIncome) =>
  match(monthlyIncome)
    .with("Between1500And3000", () => t("verificationRenewal.monthlyIncome.Between1500And3000"))
    .with("Between3000And4500", () => t("verificationRenewal.monthlyIncome.Between3000And4500"))
    .with("Between500And1500", () => t("verificationRenewal.monthlyIncome.Between500And1500"))
    .with("LessThan500", () => t("verificationRenewal.monthlyIncome.LessThan500"))
    .with("MoreThan4500", () => t("verificationRenewal.monthlyIncome.MoreThan4500"))

    .exhaustive();

const translateEmploymentStatus = (employmentStatus: EmploymentStatus) =>
  match(employmentStatus)
    .with("Craftsman", () => t("verificationRenewal.monthlyIncome.Craftsman"))
    .with("Employee", () => t("verificationRenewal.monthlyIncome.Employee"))
    .with("Entrepreneur", () => t("verificationRenewal.monthlyIncome.Entrepreneur"))
    .with("Farmer", () => t("verificationRenewal.monthlyIncome.Farmer"))
    .with("Manager", () => t("verificationRenewal.monthlyIncome.Manager"))
    .with("Practitioner", () => t("verificationRenewal.monthlyIncome.Practitioner"))
    .with("Retiree", () => t("verificationRenewal.monthlyIncome.Retiree"))
    .with("ShopOwner", () => t("verificationRenewal.monthlyIncome.ShopOwner"))
    .with("Student", () => t("verificationRenewal.monthlyIncome.Student"))
    .with("Unemployed", () => t("verificationRenewal.monthlyIncome.Unemployed"))
    .exhaustive();

export const VerificationRenewalPersonalInfo = ({ verificationRenewal, projectInfo }: Props) => {
  return (
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
                        <LakeText color={colors.gray[900]}>
                          {translateEmploymentStatus(employmentStatus)}
                        </LakeText>
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
                onPress={() =>
                  Router.push("VerificationRenewalRoot", {
                    verificationRenewalId: verificationRenewal.id,
                  })
                }
              >
                {t("verificationRenewal.cancel")}
              </LakeButton>

              <LakeButton
                onPress={() =>
                  Router.push("VerificationRenewalDocuments", {
                    verificationRenewalId: verificationRenewal.id,
                  })
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
  );
};
