import { Option } from "@swan-io/boxed";
import { useMutation } from "@swan-io/graphql-client";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { breakpoints } from "@swan-io/lake/src/constants/design";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { CountryCCA3, isCountryCCA3 } from "@swan-io/shared-business/src/constants/countries";
import { showToast } from "@swan-io/shared-business/src/state/toasts";
import { translateError } from "@swan-io/shared-business/src/utils/i18n";
import { match, P } from "ts-pattern";
import { v4 as uuid } from "uuid";
import { OnboardingStepContent } from "../../../../onboarding/src/components/OnboardingStepContent";
import { StepTitle } from "../../../../onboarding/src/components/StepTitle";
import {
  Input,
  REFERENCE_SYMBOL,
  SaveValue,
  validateUbo,
} from "../../../../onboarding/src/pages/company/ownership-beneficiary/OnboardingCompanyOwnershipBeneficiaryForm";
import {
  AccountCountry,
  CompanyRenewalInfoFragment,
  UpdateCompanyVerificationRenewalDocument,
  VerificationRenewalUboFragment,
  VerificationRenewalUltimateBeneficialOwnerInput,
} from "../../graphql/partner";
import { t } from "../../utils/i18n";
import { Router } from "../../utils/routes";

type LocalStateUbo = SaveValue & {
  errors: ReturnType<typeof validateUbo>;
};

// biome-ignore lint/correctness/noUnusedVariables:
const convertFetchUboToInput = (
  fetchedUbo: VerificationRenewalUboFragment,
  accountCountry: AccountCountry,
): LocalStateUbo => {
  const direct =
    fetchedUbo.ownership?.type === "Direct" || fetchedUbo.ownership?.type === "DirectAndIndirect";
  const indirect =
    fetchedUbo.ownership?.type === "Indirect" || fetchedUbo.ownership?.type === "DirectAndIndirect";
  const totalCapitalPercentage = fetchedUbo.ownership?.totalPercentage;

  const ubo = {
    [REFERENCE_SYMBOL]: uuid(),
    type: match(fetchedUbo.qualificationType)
      .returnType<Input["type"]>()
      .with("LegalRepresentative", () => "LegalRepresentative")
      .with("Ownership", () => "HasCapital")
      .with("Control", () => "Other")
      .with(P.nullish, () => "Other")
      .exhaustive(),
    firstName: fetchedUbo.firstName ?? "",
    lastName: fetchedUbo.lastName ?? "",
    birthCountryCode: isCountryCCA3(fetchedUbo.birthInfo?.country)
      ? fetchedUbo.birthInfo.country
      : accountCountry,
    birthCity: fetchedUbo.birthInfo?.city ?? "",
    birthCityPostalCode: fetchedUbo.birthInfo?.postalCode ?? "",
    birthDate: fetchedUbo.birthInfo?.birthDate ?? null,
    direct,
    indirect,
    totalCapitalPercentage: totalCapitalPercentage ?? undefined,
    residencyAddressLine1: fetchedUbo.address?.addressLine1 ?? "",
    residencyAddressCity: fetchedUbo.address?.city ?? "",
    residencyAddressCountry: fetchedUbo.address?.country as CountryCCA3,
    residencyAddressPostalCode: fetchedUbo.address?.postalCode ?? "",
    taxIdentificationNumber: fetchedUbo.taxIdentificationNumber ?? undefined,
  } satisfies Partial<Input>;

  const errors = validateUbo(ubo, accountCountry);

  return {
    ...ubo,
    errors,
  };
};

type Props = {
  info: CompanyRenewalInfoFragment;
  verificationRenewalId: string;
};

export const VerificationRenewalOwnership = ({ info, verificationRenewalId }: Props) => {
  const [updateCompanyVerificationRenewal, updatingCompanyVerificationRenewal] = useMutation(
    UpdateCompanyVerificationRenewalDocument,
  );

  info.company.ultimateBeneficialOwners.map(owner => owner);

  const onPressSubmit = () => {
    const owners: VerificationRenewalUltimateBeneficialOwnerInput[] = [];

    return updateCompanyVerificationRenewal({
      input: {
        verificationRenewalId: verificationRenewalId,
        company: {
          ultimateBeneficialOwners: owners,
        },
      },
    })
      .mapOk(data => data.updateCompanyVerificationRenewal)
      .mapOkToResult(data => Option.fromNullable(data).toResult(data))
      .mapOkToResult(filterRejectionsToResult)
      .tapOk(() => {
        Router.push("VerificationRenewalAdministratorInformation", {
          verificationRenewalId: verificationRenewalId,
        });
      })
      .tapError(error => {
        showToast({ variant: "error", error, title: translateError(error) });
      });
  };

  return (
    <OnboardingStepContent>
      <ResponsiveContainer breakpoint={breakpoints.medium}>
        {({ small }) => (
          <>
            <StepTitle isMobile={small}>
              {t("verificationRenewal.accountHolderInformation.title")}
            </StepTitle>

            <Space height={40} />

            <LakeText>TOTO</LakeText>

            <Space height={40} />
            <LakeButtonGroup>
              <LakeButton
                mode="secondary"
                onPress={() =>
                  Router.push("VerificationRenewalAdministratorInformation", {
                    verificationRenewalId,
                  })
                }
              >
                {t("verificationRenewal.cancel")}
              </LakeButton>

              <LakeButton
                onPress={onPressSubmit}
                color="current"
                loading={updatingCompanyVerificationRenewal.isLoading()}
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
