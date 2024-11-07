import { useMutation } from "@swan-io/graphql-client";
import { Avatar } from "@swan-io/lake/src/components/Avatar";
import { Box } from "@swan-io/lake/src/components/Box";
import { Fill } from "@swan-io/lake/src/components/Fill";
import { Grid } from "@swan-io/lake/src/components/Grid";
import { Icon } from "@swan-io/lake/src/components/Icon";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeLabelledCheckbox } from "@swan-io/lake/src/components/LakeCheckbox";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { Pressable } from "@swan-io/lake/src/components/Pressable";
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
import { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import { P, match } from "ts-pattern";
import { v4 as uuid } from "uuid";
import { OnboardingFooter } from "../../components/OnboardingFooter";
import { OnboardingStepContent } from "../../components/OnboardingStepContent";
import { StepTitle } from "../../components/StepTitle";
import {
  AccountCountry,
  IndividualUltimateBeneficialOwnerInput,
  UboFragment,
  UpdateCompanyOnboardingDocument,
} from "../../graphql/unauthenticated";
import { TranslationKey, locale, t } from "../../utils/i18n";
import { CompanyOnboardingRoute, Router } from "../../utils/routes";
import { getUpdateOnboardingError } from "../../utils/templateTranslations";
import {
  BeneficiaryFormStep,
  Input,
  OnboardingCompanyOwnershipBeneficiaryForm,
  OnboardingCompanyOwnershipBeneficiaryFormRef,
  REFERENCE_SYMBOL,
  SaveValue,
  validateUbo,
} from "./ownership-beneficiary/OnboardingCompanyOwnershipBeneficiaryForm";

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
      step: BeneficiaryFormStep;
      withAddressPart: boolean;
      withIdentityPart: boolean;
    }
  | {
      type: "edit";
      ubo: SaveValue;
      step: BeneficiaryFormStep;
      withAddressPart: boolean;
      withIdentityPart: boolean;
    };

type Props = {
  previousStep: CompanyOnboardingRoute;
  nextStep: CompanyOnboardingRoute;
  onboardingId: string;
  accountCountry: AccountCountry;
  country: CountryCCA3;
  companyName: string;
  ubos: UboFragment[];
};

type LocalStateUbo = SaveValue & {
  errors: ReturnType<typeof validateUbo>;
};

const convertFetchUboToInput = (
  fetchedUbo: UboFragment,
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

const formatUboMainInfo = (ubo: SaveValue, companyName: string, country: CountryCCA3) => {
  const key = match(ubo)
    .returnType<TranslationKey>()
    .with({ type: P.nullish }, () => "ownersPage.other")
    .with({ type: "LegalRepresentative" }, () => "ownersPage.legalRepresentative")
    .with({ type: "Other" }, () => "ownersPage.other")
    .with(
      {
        type: "HasCapital",
        direct: true,
        indirect: true,
      },
      () => "ownersPage.hasCapitalDirectAndIndirect",
    )
    .with({ type: "HasCapital", direct: true }, () => "ownersPage.hasCapitalDirectOnly")
    .with({ type: "HasCapital", indirect: true }, () => "ownersPage.hasCapitalIndirectOnly")
    .with({ type: "HasCapital" }, () => "ownersPage.hasCapitalUnfilled")
    .exhaustive();

  return t(key, {
    percentage: ubo.totalCapitalPercentage ?? 0,
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
                    <Tag color="negative">{t("company.step.owners.missingInfo")}</Tag>
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
                  <Tag color="negative">{t("company.step.owners.missingInfo")}</Tag>
                </>
              )}

              <Space width={24} />

              <LakeButton
                ariaLabel={t("company.step.owners.editButton")}
                size="small"
                mode="tertiary"
                icon="edit-regular"
                color="gray"
                onPress={onEdit}
              />

              <Space width={12} />

              <LakeButton
                ariaLabel={t("company.step.owners.deleteButton")}
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

export const OnboardingCompanyOwnership = ({
  previousStep,
  nextStep,
  onboardingId,
  accountCountry,
  country,
  companyName,
  ubos,
}: Props) => {
  const [updateOnboarding, updateResult] = useMutation(UpdateCompanyOnboardingDocument);

  const currentUbos = useMemo(
    () => ubos.map(ubo => convertFetchUboToInput(ubo, accountCountry)),
    [accountCountry, ubos],
  );

  const [noUbosConfirmed, setNoUbosConfirmed] = useState(false);
  const [pageState, setPageState] = useState<PageState>({ type: "list" });
  const [shakeError, setShakeError] = useBoolean(false);
  const [showConfirmNoUboModal, setShowConfirmNoUboModal] = useBoolean(false);
  const beneficiaryFormRef = useRef<OnboardingCompanyOwnershipBeneficiaryFormRef>(null);

  const withAddressPart = match(accountCountry)
    .with("DEU", "ESP", "FRA", "NLD", "ITA", () => true)
    .otherwise(() => false);

  const withIdentityPart = match(accountCountry)
    .with("ITA", () => true)
    .otherwise(() => false);

  useEffect(() => {
    if (shakeError) {
      const timeout = setTimeout(() => setShakeError.off(), 800);
      return () => {
        clearTimeout(timeout);
      };
    }
  }, [shakeError, setShakeError]);

  const openNewUbo = () => {
    setPageState({ type: "add", step: "Common", withAddressPart, withIdentityPart });
  };

  const resetPageState = () => {
    setPageState({ type: "list" });
  };

  const setFormStep = (step: BeneficiaryFormStep) => {
    setPageState(state => ({
      ...state,
      step,
    }));
  };

  const addUbo = (newUbo: SaveValue) => {
    // errors is empty because beneficiaries form already validates the ubo
    updateOnboardingUbos([...currentUbos, { ...newUbo, errors: {} }]).tap(() => {
      resetPageState();
    });
  };

  const updateUbo = (ubo: SaveValue) => {
    // errors is empty because beneficiaries form already validates the ubo
    updateOnboardingUbos(
      currentUbos.map(item =>
        item[REFERENCE_SYMBOL] === ubo[REFERENCE_SYMBOL] ? { ...ubo, errors: {} } : item,
      ),
    ).tap(() => {
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

  const deleteUbo = () => {
    // Should be always true because we only open the modal when the pageState is deleting
    if (pageState.type !== "deleting") {
      return resetPageState();
    }

    updateOnboardingUbos(
      currentUbos.filter(item => item[REFERENCE_SYMBOL] !== pageState.reference),
    ).tap(() => {
      resetPageState();
    });
  };

  const onPressPrevious = () => {
    Router.push(previousStep, { onboardingId });
  };

  const updateOnboardingUbos = (nextUbos: LocalStateUbo[]) => {
    const individualUltimateBeneficialOwners = nextUbos.map(
      ({
        residencyAddressCountry,
        residencyAddressLine1,
        residencyAddressCity,
        residencyAddressPostalCode,
        identityDocumentType,
        identityDocumentNumber,
        identityDocumentIssueDate,
        identityDocumentExpiryDate,
        identityDocumentIssuingAuthority,
        errors,
        ...ubo
      }) => {
        const residencyAddress = match({
          residencyAddressCountry,
          residencyAddressLine1,
          residencyAddressCity,
          residencyAddressPostalCode,
        })
          .with(
            {
              residencyAddressCountry: P.nonNullable,
              residencyAddressLine1: P.nonNullable,
              residencyAddressCity: P.nonNullable,
              residencyAddressPostalCode: P.nonNullable,
            },
            ({
              residencyAddressCountry,
              residencyAddressLine1,
              residencyAddressCity,
              residencyAddressPostalCode,
            }) => ({
              country: residencyAddressCountry,
              addressLine1: residencyAddressLine1,
              city: residencyAddressCity,
              postalCode: residencyAddressPostalCode,
            }),
          )
          .otherwise(() => undefined);

        const identityDocumentDetails = match({
          identityDocumentType,
          identityDocumentNumber,
          identityDocumentIssueDate,
          identityDocumentExpiryDate,
          identityDocumentIssuingAuthority,
        })
          .with(
            {
              identityDocumentType: P.nonNullable,
              identityDocumentNumber: P.nonNullable,
              identityDocumentIssueDate: P.nonNullable,
              identityDocumentExpiryDate: P.nonNullable,
              identityDocumentIssuingAuthority: P.nonNullable,
            },
            ({
              identityDocumentType,
              identityDocumentNumber,
              identityDocumentIssueDate,
              identityDocumentExpiryDate,
              identityDocumentIssuingAuthority,
            }) => ({
              type: identityDocumentType,
              number: identityDocumentNumber,
              issueDate: identityDocumentIssueDate,
              expiryDate: identityDocumentExpiryDate,
              issuingAuthority: identityDocumentIssuingAuthority,
            }),
          )
          .otherwise(() => undefined);

        return {
          ...ubo,
          residencyAddress,
          identityDocumentDetails,
        };
      },
    );

    return updateOnboarding({
      input: {
        onboardingId,
        individualUltimateBeneficialOwners,
      },
      language: locale.language,
    })
      .mapOk(data => data.unauthenticatedUpdateCompanyOnboarding)
      .mapOkToResult(filterRejectionsToResult)
      .tapError(error => {
        showToast({ variant: "error", error, ...getUpdateOnboardingError(error) });
      });
  };

  const submitStep = () => {
    // if there are some ubos with errors, we don't submit
    if (currentUbos.filter(isUboInvalid).length > 0) {
      return setShakeError.on();
    }

    updateOnboardingUbos(currentUbos).tapOk(() => {
      Router.push(nextStep, { onboardingId });
    });
  };

  const onPressNext = () => {
    if (currentUbos.length === 0) {
      setShowConfirmNoUboModal.on();
      return;
    }
    submitStep();
  };

  return (
    <>
      <OnboardingStepContent>
        <ResponsiveContainer breakpoint={breakpoints.medium}>
          {({ small }) =>
            currentUbos.length === 0 ? (
              <Box>
                <StepTitle isMobile={small}>{t("company.step.owners.title")}</StepTitle>
                <Space height={12} />
                <LakeText>{t("company.step.owners.description", { companyName })}</LakeText>
                <Space height={24} />

                <LakeText style={styles.additionalDescription}>
                  {t("company.step.owners.additionalDescription")}
                </LakeText>

                <Space height={24} />

                <Pressable role="button" style={styles.addOwnerButton} onPress={openNewUbo}>
                  <Icon name="add-circle-regular" size={32} color={colors.gray[500]} />
                  <Space height={8} />
                  <LakeText>{t("company.step.owners.addTitle")}</LakeText>
                </Pressable>
              </Box>
            ) : (
              <Box>
                <StepTitle isMobile={small}>{t("company.step.owners.title")}</StepTitle>
                <Space height={12} />
                <LakeText>{t("company.step.owners.description", { companyName })}</LakeText>
                <Space height={24} />

                <LakeText style={styles.additionalDescription}>
                  {t("company.step.owners.additionalDescription")}
                </LakeText>

                <Space height={24} />

                <Grid numColumns={small ? 1 : 2} horizontalSpace={32} verticalSpace={32}>
                  <Pressable role="button" style={styles.addOwnerButton} onPress={openNewUbo}>
                    <Icon name="add-circle-regular" size={32} color={colors.gray[500]} />
                    <Space height={8} />
                    <LakeText>{t("company.step.owners.addAnother")}</LakeText>
                  </Pressable>

                  {currentUbos.map(ubo => (
                    <UboTile
                      key={ubo[REFERENCE_SYMBOL]}
                      ubo={ubo}
                      companyName={companyName}
                      country={country}
                      shakeError={shakeError}
                      onEdit={() =>
                        setPageState({
                          type: "edit",
                          step: "Common",
                          ubo,
                          withAddressPart,
                          withIdentityPart,
                        })
                      }
                      onDelete={() => openRemoveUboConfirmation(ubo)}
                    />
                  ))}
                </Grid>
              </Box>
            )
          }
        </ResponsiveContainer>

        <OnboardingFooter
          onPrevious={onPressPrevious}
          onNext={onPressNext}
          loading={updateResult.isLoading() && !showConfirmNoUboModal}
        />
      </OnboardingStepContent>

      <LakeModal
        visible={showConfirmNoUboModal}
        title={t("company.step.owners.confirmModal.title")}
        icon="warning-regular"
        color="partner"
      >
        <LakeText>{t("company.step.owners.confirmModal.description")}</LakeText>
        <Space height={16} />

        <LakeLabelledCheckbox
          value={noUbosConfirmed}
          onValueChange={setNoUbosConfirmed}
          label={t("company.step.owners.confirmModal.checkbox")}
        />

        <Space height={40} />

        <Box direction="row">
          <LakeButton
            mode="secondary"
            style={styles.fill}
            onPress={() => {
              setShowConfirmNoUboModal.off();
              setNoUbosConfirmed(false);
              openNewUbo();
            }}
          >
            {t("company.step.owners.confirmModal.add")}
          </LakeButton>

          <Space width={24} />

          <LakeButton
            color="partner"
            style={styles.fill}
            loading={updateResult.isLoading()}
            onPress={submitStep}
            disabled={!noUbosConfirmed}
          >
            {t("company.step.owners.confirmModal.next")}
          </LakeButton>
        </Box>
      </LakeModal>

      <ConfirmModal
        visible={pageState.type === "deleting"}
        title={t("company.step.owners.deleteModal.title", {
          uboName: pageState.type === "deleting" ? pageState.name : "",
        })}
        icon="delete-regular"
        confirmText={t("company.step.owners.deleteModal.confirm")}
        onConfirm={deleteUbo}
        onCancel={resetPageState}
        color="negative"
        loading={updateResult.isLoading()}
      />

      <LakeModal
        visible={match(pageState)
          .with({ type: "add" }, { type: "edit" }, () => true)
          .otherwise(() => false)}
        title={match(pageState)
          .with({ step: "Identity" }, () => t("company.step.owners.fillIdentityDocument"))
          .with({ step: "Address" }, () => t("company.step.owners.fillAddress"))
          .with({ type: "add" }, () => t("company.step.owners.addTitle"))
          .with({ type: "edit" }, () => t("company.step.owners.editTitle"))
          .otherwise(() => undefined)}
        maxWidth={850}
      >
        <OnboardingCompanyOwnershipBeneficiaryForm
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
        />

        <Space height={24} />

        <LakeButtonGroup paddingBottom={0}>
          <LakeButton
            onPress={() => beneficiaryFormRef.current?.cancel()}
            mode="secondary"
            grow={true}
          >
            {match(pageState)
              .with({ step: P.union("Address", "Identity") }, () => t("common.back"))
              .otherwise(() => t("common.cancel"))}
          </LakeButton>

          <LakeButton
            onPress={() => beneficiaryFormRef.current?.submit()}
            color="partner"
            grow={true}
            loading={updateResult.isLoading()}
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
