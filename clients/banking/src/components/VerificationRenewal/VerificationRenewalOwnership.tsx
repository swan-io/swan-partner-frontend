import { Option } from "@swan-io/boxed";
import { useMutation } from "@swan-io/graphql-client";
import { Box } from "@swan-io/lake/src/components/Box";
import { Icon } from "@swan-io/lake/src/components/Icon";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { breakpoints, colors, radii } from "@swan-io/lake/src/constants/design";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { showToast } from "@swan-io/shared-business/src/state/toasts";
import { translateError } from "@swan-io/shared-business/src/utils/i18n";
import { useRef, useState } from "react";
import { Pressable, StyleSheet } from "react-native";
import { OnboardingStepContent } from "../../../../onboarding/src/components/OnboardingStepContent";
import { StepTitle } from "../../../../onboarding/src/components/StepTitle";
// import {
//   Input,
//   REFERENCE_SYMBOL,
//   SaveValue,
//   validateUbo,
// } from "../../../../onboarding/src/pages/company/ownership-beneficiary/OnboardingCompanyOwnershipBeneficiaryForm";
import { LakeModal } from "@swan-io/shared-business/src/components/LakeModal";
import {
  getCCA3forCCA2,
  isCountryCCA2,
  isCountryCCA3,
} from "@swan-io/shared-business/src/constants/countries";
import { match, P } from "ts-pattern";
import {
  AccountCountry,
  CompanyRenewalInfoFragment,
  UpdateCompanyVerificationRenewalDocument,
  VerificationRenewalUboFragment,
  VerificationRenewalUltimateBeneficialOwnerInput,
} from "../../graphql/partner";
import { t } from "../../utils/i18n";
import { Router } from "../../utils/routes";
import {
  REFERENCE_SYMBOL,
  VerificationRenewalOwnershipForm,
} from "./VerificationRenewalOwnershipForm";

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  uboTile: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  addOwnerButton: {
    padding: 18,
    borderColor: colors.gray[300],
    borderWidth: 1,
    borderRadius: radii[8],
    borderStyle: "dashed",
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  additionalDescription: { fontStyle: "italic" },
});

export type RenewalVerificationOwnershipFormStep = "Common" | "Address";

export type RenewalVerificationOwnershipFormRef = {
  cancel: () => void;
  submit: () => void;
};

type PageState =
  | {
      type: "list";
    }
  | {
      type: "deleting";
      reference: string;
      name: string;
    }
  | {
      type: "add";
      step: RenewalVerificationOwnershipFormStep;
    }
  | {
      type: "edit";
      // ubo: SaveValue;
      step: RenewalVerificationOwnershipFormStep;
    };

type Props = {
  info: CompanyRenewalInfoFragment;
  verificationRenewalId: string;
};

type LocalStateUbo = SaveValue & {
  errors: ReturnType<typeof validateUbo>;
};

const convertFetchUboToInput = (
  fetchedUbo: VerificationRenewalUboFragment,
  accountCountry: AccountCountry,
): LocalStateUbo => {
  const { direct, indirect, totalCapitalPercentage } = match(fetchedUbo.info)
    .returnType<
      Partial<
        Pick<
          IndividualUltimateBeneficialOwnerInput,
          "direct" | "indirect" | "totalCapitalPercentage"
        >
      >
    >()
    .with(
      { __typename: "IndividualUltimateBeneficialOwnerTypeHasCapital" },
      ({ direct, indirect, totalCapitalPercentage }) => ({
        direct,
        indirect,
        totalCapitalPercentage,
      }),
    )
    .otherwise(() => ({}));

  const birthCountryCode = isCountryCCA3(fetchedUbo.birthCountryCode)
    ? fetchedUbo.birthCountryCode
    : isCountryCCA2(fetchedUbo.birthCountryCode)
      ? (getCCA3forCCA2(fetchedUbo.birthCountryCode) ?? accountCountry)
      : accountCountry;

  const ubo = {
    [REFERENCE_SYMBOL]: uuid(),
    type: fetchedUbo.info.type,
    firstName: fetchedUbo.firstName ?? "",
    lastName: fetchedUbo.lastName ?? "",
    birthCountryCode,
    birthCity: fetchedUbo.birthCity ?? "",
    birthCityPostalCode: fetchedUbo.birthCityPostalCode ?? "",
    // Slice to remove the time part because the backend sends a DateTime instead of a Date
    // https://linear.app/swan/issue/ECU-2938/ubo-birthdate-is-a-datetime-instead-of-a-date
    birthDate: fetchedUbo.birthDate != null ? fetchedUbo.birthDate.slice(0, 10) : null,
    direct: direct ?? false,
    indirect: indirect ?? false,
    totalCapitalPercentage: totalCapitalPercentage ?? undefined,
    residencyAddressLine1: fetchedUbo.residencyAddress?.addressLine1 ?? "",
    residencyAddressCity: fetchedUbo.residencyAddress?.city ?? "",
    residencyAddressCountry: fetchedUbo.residencyAddress?.country as CountryCCA3,
    residencyAddressPostalCode: fetchedUbo.residencyAddress?.postalCode ?? "",
    taxIdentificationNumber: fetchedUbo.taxIdentificationNumber ?? undefined,
    identityDocumentType: fetchedUbo.identityDocumentDetails?.type ?? undefined,
    identityDocumentNumber: fetchedUbo.identityDocumentDetails?.number ?? undefined,
    identityDocumentIssueDate: fetchedUbo.identityDocumentDetails?.issueDate ?? undefined,
    identityDocumentExpiryDate: fetchedUbo.identityDocumentDetails?.expiryDate ?? undefined,
    identityDocumentIssuingAuthority:
      fetchedUbo.identityDocumentDetails?.issuingAuthority ?? undefined,
  } satisfies Partial<Input>;

  const errors = validateUbo(ubo, accountCountry);

  return {
    ...ubo,
    errors,
  };
};

const isUboInvalid = (ubo: LocalStateUbo) => {
  return Object.values(ubo.errors).some(error => error != null);
};

export const VerificationRenewalOwnership = ({ info, verificationRenewalId }: Props) => {
  const [updateCompanyVerificationRenewal, updatingCompanyVerificationRenewal] = useMutation(
    UpdateCompanyVerificationRenewalDocument,
  );
  const [pageState, setPageState] = useState<PageState>({ type: "list" });

  const openNewUbo = () => {
    setPageState({ type: "add", step: "Common" });
  };
  const beneficiaryFormRef = useRef<RenewalVerificationOwnershipFormRef>(null);

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
            <StepTitle isMobile={small}>{t("verificationRenewal.ownership.title")}</StepTitle>

            <Space height={8} />

            <Box>
              <LakeText style={styles.additionalDescription}>
                {t("verificationRenewal.ownership.subtitle", { companyName: info.company.name })}
              </LakeText>

              <Space height={32} />

              <Pressable role="button" style={styles.addOwnerButton} onPress={openNewUbo}>
                <Icon name="add-circle-regular" size={32} color={colors.gray[500]} />
                <Space height={8} />
                <LakeText>{t("verificationRenewal.ownership.addTile")}</LakeText>
              </Pressable>
            </Box>

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

            <LakeModal
              visible={match(pageState)
                .with({ type: "add" }, { type: "edit" }, () => true)
                .otherwise(() => false)}
              title={match(pageState)
                .with({ step: "Address" }, () => t("verificationRenewal.ownership.fillAddress"))
                .with({ type: "add" }, () => t("verificationRenewal.ownership.addTile"))
                .with({ type: "edit" }, () => t("verificationRenewal.ownership.editTile"))
                .otherwise(() => undefined)}
              maxWidth={850}
            >
              <VerificationRenewalOwnershipForm
                ref={beneficiaryFormRef}
                companyCountry="FRA"
                accountCountry="FRA"
                initialValues={info.company.ultimateBeneficialOwners}
                step={match(pageState)
                  .with({ step: "Address" }, ({ step }) => step)
                  .otherwise(() => "Common" as const)}
              />
              {/* <OnboardingCompanyOwnershipBeneficiaryForm
                ref={beneficiaryFormRef}
                placekitApiKey={__env.CLIENT_PLACEKIT_API_KEY}
                initialValues={match(pageState)
                  .with({ type: "edit" }, ({ ubo }) => ubo)
                  .otherwise(() => undefined)}
                accountCountry={accountCountry}
                companyCountry={country}
                step={match(pageState)
                  .with({ step: "Address" }, ({ step }) => step)
                  .with({ step: "Identity" }, ({ step }) => step)
                  .otherwise(() => "Common" as const)}
                onStepChange={setFormStep}
                onSave={match(pageState)
                  .with({ type: "add" }, () => addUbo)
                  .with({ type: "edit" }, () => updateUbo)
                  .otherwise(() => noop)}
                onClose={resetPageState}
              /> */}

              <Space height={24} />

              <LakeButtonGroup paddingBottom={0}>
                <LakeButton
                  onPress={() => setPageState({ type: "list" })}
                  mode="secondary"
                  grow={true}
                >
                  {match(pageState)
                    .with({ step: P.union("Address") }, () => t("common.back"))
                    .otherwise(() => t("common.cancel"))}
                </LakeButton>

                <LakeButton
                  onPress={() => {}}
                  color="partner"
                  grow={true}
                  // loading={updateResult.isLoading()}
                >
                  {match(pageState)
                    .with({ withAddressPart: true, step: "Common" }, () => t("common.next"))
                    .otherwise(() => t("common.save"))}
                </LakeButton>
              </LakeButtonGroup>
            </LakeModal>
          </>
        )}
      </ResponsiveContainer>
    </OnboardingStepContent>
  );
};
