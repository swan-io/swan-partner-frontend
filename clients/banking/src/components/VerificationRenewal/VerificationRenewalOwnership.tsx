import { Option } from "@swan-io/boxed";
import { useMutation } from "@swan-io/graphql-client";
import { Avatar } from "@swan-io/lake/src/components/Avatar";
import { Box } from "@swan-io/lake/src/components/Box";
import { Fill } from "@swan-io/lake/src/components/Fill";
import { Grid } from "@swan-io/lake/src/components/Grid";
import { Icon } from "@swan-io/lake/src/components/Icon";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tag } from "@swan-io/lake/src/components/Tag";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { animations, breakpoints, colors, radii } from "@swan-io/lake/src/constants/design";
import { useBoolean } from "@swan-io/lake/src/hooks/useBoolean";
import { noop } from "@swan-io/lake/src/utils/function";
import { filterRejectionsToResult } from "@swan-io/lake/src/utils/gql";
import { ConfirmModal } from "@swan-io/shared-business/src/components/ConfirmModal";
import { LakeModal } from "@swan-io/shared-business/src/components/LakeModal";
import {
  CountryCCA3,
  getCCA3forCCA2,
  getCountryName,
  isCountryCCA2,
  isCountryCCA3,
} from "@swan-io/shared-business/src/constants/countries";
import { getCountryUbo } from "@swan-io/shared-business/src/constants/ubos";
import { showToast } from "@swan-io/shared-business/src/state/toasts";
import { translateError } from "@swan-io/shared-business/src/utils/i18n";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet } from "react-native";
import { match, P } from "ts-pattern";
import { v4 as uuid } from "uuid";
import { OnboardingStepContent } from "../../../../onboarding/src/components/OnboardingStepContent";
import { StepTitle } from "../../../../onboarding/src/components/StepTitle";
import {
  AccountCountry,
  CompanyRenewalInfoFragment,
  UltimateBeneficialOwnerOwnershipInput,
  UltimateBeneficialOwnerOwnershipType,
  UpdateCompanyVerificationRenewalDocument,
  VerificationRenewalUboFragment,
  VerificationRenewalUltimateBeneficialOwnerInput,
} from "../../graphql/partner";
import { t, TranslationKey } from "../../utils/i18n";
import { Router } from "../../utils/routes";
import { RenewalStep } from "./VerificationRenewalCompany";
import { VerificationRenewalFooter } from "./VerificationRenewalFooter";
import {
  Input,
  REFERENCE_SYMBOL,
  SaveValue,
  validateUbo,
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
      withAddressPart: boolean;
    }
  | {
      type: "edit";
      ubo: SaveValue;
      step: RenewalVerificationOwnershipFormStep;
      withAddressPart: boolean;
    };

type LocalStateUbo = SaveValue & {
  errors: ReturnType<typeof validateUbo>;
};

const convertFetchUboToInput = (
  fetchedUbo: VerificationRenewalUboFragment,
  accountCountry: AccountCountry,
): LocalStateUbo => {
  const { type, totalPercentage } = match(fetchedUbo.ownership)
    .returnType<
      Partial<{ type: UltimateBeneficialOwnerOwnershipType; totalPercentage: number | undefined }>
    >()
    .with({ __typename: "UltimateBeneficialOwnerOwnership" }, ({ type, totalPercentage }) => ({
      type,
      totalPercentage: totalPercentage ?? undefined,
    }))
    .otherwise(() => ({}));

  const birthCountryCode = isCountryCCA3(fetchedUbo.birthInfo?.country)
    ? fetchedUbo.birthInfo?.country
    : isCountryCCA2(fetchedUbo.birthInfo?.country)
      ? (getCCA3forCCA2(fetchedUbo.birthInfo?.country) ?? accountCountry)
      : accountCountry;

  const ubo = {
    [REFERENCE_SYMBOL]: uuid(),
    firstName: fetchedUbo.firstName ?? "",
    lastName: fetchedUbo.lastName ?? "",
    birthCountryCode,
    birthCity: fetchedUbo.birthInfo?.city ?? "",
    birthCityPostalCode: fetchedUbo.birthInfo?.postalCode ?? "",
    // Slice to remove the time part because the backend sends a DateTime instead of a Date
    // https://linear.app/swan/issue/ECU-2938/ubo-birthdate-is-a-datetime-instead-of-a-date
    birthDate:
      fetchedUbo.birthInfo?.birthDate != null ? fetchedUbo.birthInfo?.birthDate.slice(0, 10) : null,
    qualificationType: fetchedUbo.qualificationType ?? undefined,
    direct: type === "Direct" || type === "DirectAndIndirect",
    indirect: type === "Indirect" || type === "DirectAndIndirect",
    totalPercentage: totalPercentage ?? undefined,
    addressLine1: fetchedUbo.address?.addressLine1 ?? "",
    city: fetchedUbo.address?.city ?? "",
    country: fetchedUbo.address?.country as CountryCCA3,
    postalCode: fetchedUbo.address?.postalCode ?? "",
    taxIdentificationNumber: fetchedUbo.taxIdentificationNumber ?? undefined,
  } satisfies Partial<Input>;

  const errors = validateUbo(ubo, accountCountry);

  return {
    ...ubo,
    errors,
  };
};

const convertLocalUboToMutationInput = ({
  country,
  addressLine1,
  city,
  postalCode,
  direct,
  indirect,
  ...ubo
}: LocalStateUbo): VerificationRenewalUltimateBeneficialOwnerInput => {
  const address = match({
    country,
    addressLine1,
    city,
    postalCode,
  })
    .with(
      {
        country: P.nonNullable,
        addressLine1: P.nonNullable,
        city: P.nonNullable,
        postalCode: P.nonNullable,
      },
      ({ country, addressLine1, city, postalCode }) => ({
        country: country,
        addressLine1: addressLine1,
        city: city,
        postalCode: postalCode,
      }),
    )
    .otherwise(() => undefined);

  const input: VerificationRenewalUltimateBeneficialOwnerInput = {
    address,
    birthInfo: {
      birthDate: ubo.birthDate,
      city: ubo.birthCity,
      country: ubo.birthCountryCode,
      postalCode: ubo.birthCityPostalCode,
    },
    firstName: ubo.firstName,
    lastName: ubo.lastName,
    ownership: match({ direct, indirect })
      .returnType<UltimateBeneficialOwnerOwnershipInput | undefined>()
      .with({ direct: true, indirect: true }, () => ({
        totalPercentage: ubo.totalPercentage,
        type: "DirectAndIndirect",
      }))
      .with({ direct: true }, () => ({
        totalPercentage: ubo.totalPercentage,
        type: "Direct",
      }))
      .with({ indirect: true }, () => ({
        totalPercentage: ubo.totalPercentage,
        type: "Indirect",
      }))
      .otherwise(() => undefined),
    qualificationType: ubo.qualificationType,
    taxIdentificationNumber: ubo.taxIdentificationNumber,
  };
  return input;
};

const isUboInvalid = (ubo: LocalStateUbo) => {
  return Object.values(ubo.errors).some(error => error != null);
};

const formatUboMainInfo = (ubo: SaveValue, companyName: string, country: CountryCCA3) => {
  const key = match(ubo)
    .returnType<TranslationKey>()
    .with({ qualificationType: P.nullish }, () => "verificationRenewal.ownership.type.control")
    .with(
      { qualificationType: "LegalRepresentative" },
      () => "verificationRenewal.ownership.type.legalRepresentative",
    )
    .with({ qualificationType: "Control" }, () => "verificationRenewal.ownership.type.control")
    .with(
      {
        qualificationType: "Ownership",
        direct: true,
        indirect: true,
      },
      () => "verificationRenewal.ownership.type.directAndIndirect",
    )
    .with(
      { qualificationType: "Ownership", direct: true },
      () => "verificationRenewal.ownership.hasCapitalDirectOnly",
    )
    .with(
      { qualificationType: "Ownership", indirect: true },
      () => "verificationRenewal.ownership.hasCapitalIndirectOnly",
    )
    .with(
      { qualificationType: "Ownership" },
      () => "verificationRenewal.ownership.hasCapitalUnfilled",
    )
    .exhaustive();

  return t(key, {
    percentage: ubo.totalPercentage ?? 0,
    name: companyName,
    uboDenomination: getCountryUbo(country).singular,
  });
};

const formatUboBirthAddress = ({
  birthCountryCode,
  birthCity,
  birthCityPostalCode,
}: LocalStateUbo) => {
  const birthCountry = isCountryCCA3(birthCountryCode) ? getCountryName(birthCountryCode) : null;
  return [birthCountry, birthCity, birthCityPostalCode].filter(Boolean).join(", ");
};

type UboTileProps = {
  ubo: LocalStateUbo;
  companyName: string;
  country: CountryCCA3;
  shakeError: boolean;
  onEdit: () => void;
  onDelete: () => void;
};

const UboTile = ({ ubo, companyName, country, shakeError, onEdit, onDelete }: UboTileProps) => {
  return (
    <Tile
      key={ubo[REFERENCE_SYMBOL]}
      style={[styles.uboTile, isUboInvalid(ubo) && shakeError && animations.shake.enter]}
    >
      <ResponsiveContainer breakpoint={400}>
        {({ small }) =>
          small ? (
            <Box>
              <Box direction="row" alignItems="center">
                <Avatar user={ubo} size={32} />

                {isUboInvalid(ubo) && (
                  <>
                    <Space width={12} />
                    <Tag color="negative">{t("verificationRenewal.ownership.missingInfo")}</Tag>
                  </>
                )}

                <Fill minWidth={24} />

                <LakeButton
                  size="small"
                  mode="tertiary"
                  icon="edit-regular"
                  color="gray"
                  onPress={onEdit}
                  ariaLabel={t("common.edit")}
                />

                <Space width={12} />

                <LakeButton
                  size="small"
                  mode="tertiary"
                  icon="delete-regular"
                  color="negative"
                  onPress={onDelete}
                  ariaLabel={t("common.delete")}
                />
              </Box>

              <Space height={12} />

              <Box style={styles.fill}>
                <LakeText variant="medium" color={colors.gray[900]}>
                  {ubo.firstName} {ubo.lastName}
                </LakeText>

                <Space height={4} />
                <LakeText>{formatUboMainInfo(ubo, companyName, country)}</LakeText>
                <Space height={4} />
                <LakeText>{formatUboBirthAddress(ubo)}</LakeText>
              </Box>
            </Box>
          ) : (
            <Box direction="row" alignItems="center">
              <Avatar user={ubo} size={32} />
              <Space width={24} />

              <Box style={styles.fill}>
                <LakeText variant="medium" color={colors.gray[900]}>
                  {ubo.firstName} {ubo.lastName}
                </LakeText>

                <Space height={4} />
                <LakeText>{formatUboMainInfo(ubo, companyName, country)}</LakeText>
                <Space height={4} />
                <LakeText>{formatUboBirthAddress(ubo)}</LakeText>
              </Box>

              {isUboInvalid(ubo) && (
                <>
                  <Space width={12} />
                  <Tag color="negative">{t("verificationRenewal.ownership.missingInfo")}</Tag>
                </>
              )}

              <Space width={24} />

              <LakeButton
                ariaLabel={t("common.edit")}
                size="small"
                mode="tertiary"
                icon="edit-regular"
                color="gray"
                onPress={onEdit}
              />

              <Space width={12} />

              <LakeButton
                ariaLabel={t("common.delete")}
                size="small"
                mode="tertiary"
                icon="delete-regular"
                color="negative"
                onPress={onDelete}
              />
            </Box>
          )
        }
      </ResponsiveContainer>
    </Tile>
  );
};

type Props = {
  info: CompanyRenewalInfoFragment;
  accountCountry: AccountCountry;
  verificationRenewalId: string;
  companyCountry: CountryCCA3;
  previousStep: RenewalStep | undefined;
  nextStep: RenewalStep;
};

export const VerificationRenewalOwnership = ({
  info,
  accountCountry,
  verificationRenewalId,
  companyCountry,
  nextStep,
  previousStep,
}: Props) => {
  const [updateCompanyVerificationRenewal, updatingCompanyVerificationRenewal] = useMutation(
    UpdateCompanyVerificationRenewalDocument,
  );
  const [pageState, setPageState] = useState<PageState>({ type: "list" });
  const [shakeError, setShakeError] = useBoolean(false);

  const currentUbos = useMemo(
    () =>
      info.company.ultimateBeneficialOwners.map(ubo => convertFetchUboToInput(ubo, accountCountry)),
    [accountCountry, info.company.ultimateBeneficialOwners],
  );

  const withAddressPart = match(accountCountry)
    .with("DEU", "ESP", "FRA", "NLD", "ITA", () => true)
    .otherwise(() => false);

  const setFormStep = (step: RenewalVerificationOwnershipFormStep) => {
    setPageState(state => ({
      ...state,
      step,
    }));
  };

  useEffect(() => {
    if (shakeError) {
      const timeout = setTimeout(() => setShakeError.off(), 800);
      return () => {
        clearTimeout(timeout);
      };
    }
  }, [shakeError, setShakeError]);

  const openNewUbo = () => {
    setPageState({ type: "add", step: "Common", withAddressPart });
  };

  const resetPageState = () => {
    setPageState({ type: "list" });
  };

  const addUbo = (newUbo: SaveValue) => {
    // errors is empty because beneficiaries form already validates the ubo
    updateOnboardingUbos([...currentUbos, { ...newUbo, errors: {} }]).tapOk(() => {
      resetPageState();
    });
  };

  const openRemoveUboConfirmation = (ubo: LocalStateUbo) => {
    setPageState({
      type: "deleting",
      reference: ubo[REFERENCE_SYMBOL],
      name: [ubo.firstName, ubo.lastName].filter(Boolean).join(" "),
    });
  };

  const updateUbo = (ubo: SaveValue) => {
    // errors is empty because beneficiaries form already validates the ubo
    updateOnboardingUbos(
      currentUbos.map(item =>
        item[REFERENCE_SYMBOL] === ubo[REFERENCE_SYMBOL] ? { ...ubo, errors: {} } : item,
      ),
    ).tapOk(() => {
      resetPageState();
    });
  };

  const deleteUbo = () => {
    // Should be always true because we only open the modal when the pageState is deleting
    if (pageState.type !== "deleting") {
      return resetPageState();
    }

    updateOnboardingUbos(
      currentUbos.filter(item => item[REFERENCE_SYMBOL] !== pageState.reference),
    ).tapOk(() => {
      resetPageState();
    });
  };

  const beneficiaryFormRef = useRef<RenewalVerificationOwnershipFormRef>(null);

  info.company.ultimateBeneficialOwners.map(owner => owner);

  const updateOnboardingUbos = (nextUbos: LocalStateUbo[]) => {
    const ultimateBeneficialOwners = nextUbos.map(convertLocalUboToMutationInput);

    return updateCompanyVerificationRenewal({
      input: {
        verificationRenewalId: verificationRenewalId,
        company: {
          ultimateBeneficialOwners,
        },
      },
    })
      .mapOk(data => data.updateCompanyVerificationRenewal)
      .mapOkToResult(data => Option.fromNullable(data).toResult(data))
      .mapOkToResult(filterRejectionsToResult)
      .tapOk(() => {
        Router.push("VerificationRenewalOwnership", {
          verificationRenewalId: verificationRenewalId,
        });
      })
      .tapError(error => {
        showToast({ variant: "error", error, title: translateError(error) });
      });
  };

  return (
    <>
      <OnboardingStepContent>
        <ResponsiveContainer breakpoint={breakpoints.medium}>
          {({ small }) => (
            <>
              {currentUbos.length === 0 ? (
                <Box>
                  <StepTitle isMobile={small}>{t("verificationRenewal.ownership.title")}</StepTitle>
                  <Space height={12} />
                  <LakeText>
                    {t("verificationRenewal.ownership.subtitle", {
                      companyName: info.company.name,
                    })}
                  </LakeText>
                  <Space height={24} />

                  <Pressable role="button" style={styles.addOwnerButton} onPress={openNewUbo}>
                    <Icon name="add-circle-regular" size={32} color={colors.gray[500]} />
                    <Space height={8} />
                    <LakeText>{t("verificationRenewal.ownership.addTile")}</LakeText>
                  </Pressable>
                </Box>
              ) : (
                <Box>
                  <StepTitle isMobile={small}>{t("verificationRenewal.ownership.title")}</StepTitle>
                  <Space height={12} />
                  <LakeText>
                    {t("verificationRenewal.ownership.subtitle", {
                      companyName: info.company.name,
                    })}
                  </LakeText>
                  <Space height={24} />

                  <Grid numColumns={small ? 1 : 2} horizontalSpace={32} verticalSpace={32}>
                    <Pressable role="button" style={styles.addOwnerButton} onPress={openNewUbo}>
                      <Icon name="add-circle-regular" size={32} color={colors.gray[500]} />
                      <Space height={8} />
                      <LakeText>{t("verificationRenewal.ownership.addTile")}</LakeText>
                    </Pressable>

                    {currentUbos.map(ubo => (
                      <UboTile
                        key={ubo[REFERENCE_SYMBOL]}
                        ubo={ubo}
                        companyName={info.company.name}
                        country={info.company.residencyAddress.country as CountryCCA3}
                        shakeError={shakeError}
                        onEdit={() =>
                          setPageState({
                            type: "edit",
                            step: "Common",
                            ubo,
                            withAddressPart,
                          })
                        }
                        onDelete={() => openRemoveUboConfirmation(ubo)}
                      />
                    ))}
                  </Grid>
                </Box>
              )}

              <Space height={40} />
              <VerificationRenewalFooter
                onPrevious={
                  previousStep !== undefined
                    ? () =>
                        Router.push(previousStep?.id, {
                          verificationRenewalId: verificationRenewalId,
                        })
                    : undefined
                }
                onNext={() =>
                  Router.push(nextStep.id, {
                    verificationRenewalId: verificationRenewalId,
                  })
                }
                loading={updatingCompanyVerificationRenewal.isLoading()}
              />
            </>
          )}
        </ResponsiveContainer>
      </OnboardingStepContent>

      <ConfirmModal
        visible={pageState.type === "deleting"}
        title={t("verificationRenewal.ownership.deleteModal.title", {
          uboName: pageState.type === "deleting" ? pageState.name : "",
        })}
        icon="delete-regular"
        confirmText={t("verificationRenewal.ownership.deleteModal.confirm")}
        onConfirm={deleteUbo}
        onCancel={resetPageState}
        color="negative"
        loading={updatingCompanyVerificationRenewal.isLoading()}
      />

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
          onClose={resetPageState}
          ref={beneficiaryFormRef}
          companyCountry={companyCountry}
          accountCountry={accountCountry}
          initialValues={match(pageState)
            .with({ type: "edit" }, ({ ubo }) => ubo)
            .otherwise(() => undefined)}
          step={match(pageState)
            .with({ step: "Address" }, ({ step }) => step)
            .otherwise(() => "Common" as const)}
          placekitApiKey={__env.CLIENT_PLACEKIT_API_KEY}
          onStepChange={setFormStep}
          onSave={match(pageState)
            .with({ type: "add" }, () => addUbo)
            .with({ type: "edit" }, () => updateUbo)
            .otherwise(() => noop)}
        />

        <Space height={24} />

        <LakeButtonGroup paddingBottom={0}>
          <LakeButton
            onPress={() => beneficiaryFormRef.current?.cancel()}
            mode="secondary"
            grow={true}
          >
            {match(pageState)
              .with({ step: P.union("Address") }, () => t("common.back"))
              .otherwise(() => t("common.cancel"))}
          </LakeButton>

          <LakeButton
            onPress={() => beneficiaryFormRef.current?.submit()}
            color="partner"
            grow={true}
            loading={updatingCompanyVerificationRenewal.isLoading()}
          >
            {match(pageState)
              .with({ withAddressPart: true, step: "Common" }, () => t("common.next"))
              .with({ withIdentityPart: true, step: "Address" }, () => t("common.next"))
              .otherwise(() => t("common.save"))}
          </LakeButton>
        </LakeButtonGroup>
      </LakeModal>
    </>
  );
};
