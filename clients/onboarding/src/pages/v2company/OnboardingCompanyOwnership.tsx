import { Result } from "@swan-io/boxed";
import { Avatar } from "@swan-io/lake/src/components/Avatar";
import { BorderedIcon } from "@swan-io/lake/src/components/BorderedIcon";
import { Box } from "@swan-io/lake/src/components/Box";
import { Grid } from "@swan-io/lake/src/components/Grid";
import { Icon } from "@swan-io/lake/src/components/Icon";
import { LakeButton, LakeButtonGroup } from "@swan-io/lake/src/components/LakeButton";
import { LakeModal } from "@swan-io/lake/src/components/LakeModal";
import { LakeText } from "@swan-io/lake/src/components/LakeText";
import { Link } from "@swan-io/lake/src/components/Link";
import { LoadingView } from "@swan-io/lake/src/components/LoadingView";
import { Pressable } from "@swan-io/lake/src/components/Pressable";
import { ResponsiveContainer } from "@swan-io/lake/src/components/ResponsiveContainer";
import { Space } from "@swan-io/lake/src/components/Space";
import { Tag } from "@swan-io/lake/src/components/Tag";
import { Tile } from "@swan-io/lake/src/components/Tile";
import { animations, breakpoints, colors, radii } from "@swan-io/lake/src/constants/design";
import { useBoolean } from "@swan-io/lake/src/hooks/useBoolean";
import { useUrqlMutation } from "@swan-io/lake/src/hooks/useUrqlMutation";
import { showToast } from "@swan-io/lake/src/state/toasts";
import { noop } from "@swan-io/lake/src/utils/function";
import { isNotNullish } from "@swan-io/lake/src/utils/nullish";
import {
  BeneficiaryForm,
  BeneficiaryFormRef,
  BeneficiaryFormStep,
  EditorState as BeneficiaryFormState,
  validateUbo,
} from "@swan-io/shared-business/src/components/BeneficiaryForm";
import {
  CountryCCA3,
  getCountryNameByCCA3,
  isCountryCCA3,
} from "@swan-io/shared-business/src/constants/countries";
import { getCountryUbo } from "@swan-io/shared-business/src/constants/ubos";
import { useEffect, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import { match, P } from "ts-pattern";
import { v4 as uuid } from "uuid";
import { ConfirmModal } from "../../components/ConfirmModal";
import { OnboardingFooter } from "../../components/OnboardingFooter";
import { OnboardingStepContent } from "../../components/OnboardingStepContent";
import { StepTitle } from "../../components/StepTitle";
import {
  AccountCountry,
  IndividualUltimateBeneficialOwnerInput,
  OnboardingDataFragment,
  UboFragment,
  UpdateCompanyOnboardingDocument,
} from "../../graphql/unauthenticated";
import { locale, t, TranslationKey } from "../../utils/i18n";
import { logFrontendError } from "../../utils/logger";
import { CompanyOnboardingRoute, Router } from "../../utils/routes";
import { getUpdateOnboardingError } from "../../utils/templateTranslations";

const styles = StyleSheet.create({
  noUboContainer: {
    maxWidth: 530,
    marginHorizontal: "auto",
  },
  link: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    textDecorationLine: "underline",
    color: colors.current[500],
  },
  button: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  uboInfo: {
    flex: 1,
  },
  uboTile: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  addAnotherButton: {
    padding: 18,
    alignItems: "center",
    borderColor: colors.gray[300],
    borderWidth: 1,
    borderRadius: radii[8],
    borderStyle: "dashed",
  },
});

type PageState =
  | {
      type: "list";
    }
  | {
      type: "add";
      step: BeneficiaryFormStep;
      withAddressPart: boolean;
    }
  | {
      type: "edit";
      ubo: BeneficiaryFormState;
      step: BeneficiaryFormStep;
      withAddressPart: boolean;
    };

type Props = {
  previousStep: CompanyOnboardingRoute;
  nextStep: CompanyOnboardingRoute;
  onboardingId: string;
  accountCountry: AccountCountry;
  country: CountryCCA3;
  companyName: string;
  initialUbos: UboFragment[];
  isPrefetchingUbos: boolean;
  onSuccess: (
    mutationResponse: OnboardingDataFragment,
    ubos: IndividualUltimateBeneficialOwnerInput[],
  ) => void;
};

type LocalStateUbo = BeneficiaryFormState & {
  errors: ReturnType<typeof validateUbo>;
};

const convertFetchUboToInput = (
  fetchedUbo: UboFragment,
  accountCountry: AccountCountry,
): LocalStateUbo => {
  const { direct, indirect, totalCapitalPercentage } = match<
    UboFragment["info"],
    Partial<
      Pick<IndividualUltimateBeneficialOwnerInput, "direct" | "indirect" | "totalCapitalPercentage">
    >
  >(fetchedUbo.info)
    .with(
      { __typename: "IndividualUltimateBeneficialOwnerTypeHasCapital" },
      ({ direct, indirect, totalCapitalPercentage }) => ({
        direct,
        indirect,
        totalCapitalPercentage,
      }),
    )
    .otherwise(() => ({}));

  const ubo = {
    reference: uuid(),
    type: fetchedUbo.info.type,
    firstName: fetchedUbo.firstName ?? "",
    lastName: fetchedUbo.lastName ?? "",
    birthCountryCode: isCountryCCA3(fetchedUbo.birthCountryCode)
      ? fetchedUbo.birthCountryCode
      : accountCountry,
    birthCity: fetchedUbo.birthCity ?? "",
    birthCityPostalCode: fetchedUbo.birthCityPostalCode ?? "",
    // Slice to remove the time part because the backend sends a DateTime instead of a Date
    // https://linear.app/swan/issue/ECU-2938/ubo-birthdate-is-a-datetime-instead-of-a-date
    birthDate: fetchedUbo.birthDate != null ? fetchedUbo.birthDate.slice(0, 10) : "",
    direct: direct ?? false,
    indirect: indirect ?? false,
    totalCapitalPercentage: totalCapitalPercentage ?? undefined,
    residencyAddressLine1: fetchedUbo.residencyAddress?.addressLine1,
    residencyAddressCity: fetchedUbo.residencyAddress?.city,
    residencyAddressCountry: fetchedUbo.residencyAddress?.country,
    residencyAddressPostalCode: fetchedUbo.residencyAddress?.postalCode,
    taxIdentificationNumber: fetchedUbo.taxIdentificationNumber ?? undefined,
  } satisfies BeneficiaryFormState;

  const errors = validateUbo(ubo, accountCountry);

  return {
    ...ubo,
    errors,
  };
};

const isUboInvalid = (ubo: LocalStateUbo) => {
  return Object.values(ubo.errors).some(error => error != null);
};

const formatUboMainInfo = (
  ubo: BeneficiaryFormState,
  companyName: string,
  country: CountryCCA3,
) => {
  const key = match<BeneficiaryFormState, TranslationKey>(ubo)
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
  const birthCountry = isCountryCCA3(birthCountryCode)
    ? getCountryNameByCCA3(birthCountryCode)
    : null;
  return [birthCountry, birthCity, birthCityPostalCode].filter(Boolean).join(", ");
};

const getUboInitials = (ubo: LocalStateUbo) => {
  return [ubo.firstName, ubo.lastName]
    .map(name => name?.at(0))
    .filter(Boolean)
    .join("");
};

export const OnboardingCompanyOwnership = ({
  previousStep,
  nextStep,
  onboardingId,
  accountCountry,
  country,
  companyName,
  initialUbos,
  isPrefetchingUbos,
  onSuccess,
}: Props) => {
  const previousIsPrefetching = useRef(isPrefetchingUbos);
  const [updateResult, updateOnboarding] = useUrqlMutation(UpdateCompanyOnboardingDocument);
  const [ubos, setUbos] = useState<LocalStateUbo[]>(() =>
    initialUbos.map(ubo => convertFetchUboToInput(ubo, accountCountry)),
  );
  const [pageState, setPageState] = useState<PageState>({ type: "list" });
  const [shakeError, setShakeError] = useBoolean(false);
  const [showConfirmNoUboModal, setShowConfirmNoUboModal] = useBoolean(false);
  const beneficiaryFormRef = useRef<BeneficiaryFormRef>();

  const withAddressPart = accountCountry === "DEU";

  useEffect(() => {
    if (shakeError) {
      const timeout = setTimeout(() => setShakeError.off(), 800);
      return () => {
        clearTimeout(timeout);
      };
    }
  }, [shakeError, setShakeError]);

  useEffect(() => {
    // if component is rendered while prefetching, we have to set the initial ubos once prefetch is completed
    if (previousIsPrefetching.current && !isPrefetchingUbos) {
      setUbos(initialUbos.map(ubo => convertFetchUboToInput(ubo, accountCountry)));
      previousIsPrefetching.current = false;
    }
  }, [initialUbos, isPrefetchingUbos, accountCountry]);

  const openNewUbo = () => {
    setPageState({ type: "add", step: "common", withAddressPart });
  };

  const closeUboModal = () => {
    setPageState({ type: "list" });
  };

  const setFormStep = (step: BeneficiaryFormStep) => {
    setPageState(state => ({
      ...state,
      step,
    }));
  };

  const addUbo = (newUbo: BeneficiaryFormState) => {
    // errors is empty because beneficiaries form already validates the ubo
    setUbos(ubos => [...ubos, { ...newUbo, errors: {} }]);
    setPageState({ type: "list" });
  };

  const updateUbo = (ubo: BeneficiaryFormState) => {
    // errors is empty because beneficiaries form already validates the ubo
    setUbos(ubos => ubos.map(u => (u.reference === ubo.reference ? { ...ubo, errors: {} } : u)));
    setPageState({ type: "list" });
  };

  const removeUbo = (ubo: LocalStateUbo) => {
    setUbos(ubos => ubos.filter(u => u.reference !== ubo.reference));
  };

  const onPressPrevious = () => {
    Router.push(previousStep, { onboardingId });
  };

  const submitUbos = () => {
    // if there are some ubos with errors, we don't submit
    if (ubos.filter(isUboInvalid).length > 0) {
      setShakeError.on();
      return;
    }

    const individualUltimateBeneficialOwners = ubos.map(
      ({
        reference,
        residencyAddressCountry,
        residencyAddressLine1,
        residencyAddressCity,
        residencyAddressPostalCode,
        errors,
        ...ubo
      }) => {
        const residencyAddress = [
          residencyAddressCountry,
          residencyAddressLine1,
          residencyAddressCity,
          residencyAddressPostalCode,
        ].every(isNotNullish)
          ? {
              country: residencyAddressCountry as string,
              addressLine1: residencyAddressLine1 as string,
              city: residencyAddressCity as string,
              postalCode: residencyAddressPostalCode as string,
            }
          : undefined;

        return {
          ...ubo,
          residencyAddress,
        };
      },
    );
    updateOnboarding({
      input: {
        onboardingId,
        individualUltimateBeneficialOwners,
      },
      language: locale.language,
    })
      .mapResult(({ unauthenticatedUpdateCompanyOnboarding }) =>
        match(unauthenticatedUpdateCompanyOnboarding)
          .with({ __typename: "UnauthenticatedUpdateCompanyOnboardingSuccessPayload" }, value =>
            Result.Ok(value),
          )
          .otherwise(error => Result.Error(error)),
      )
      .tapOk(({ onboarding }) => {
        onSuccess(onboarding, individualUltimateBeneficialOwners);
        Router.push(nextStep, { onboardingId });
      })
      .tapError(error => {
        const errorMessage = getUpdateOnboardingError(error);
        showToast({
          variant: "error",
          title: errorMessage.title,
          description: errorMessage.description,
        });
      });
  };

  const onPressNext = () => {
    if (ubos.length === 0) {
      setShowConfirmNoUboModal.on();
    } else {
      submitUbos();
    }
  };

  if (isPrefetchingUbos) {
    return <LoadingView color={colors.current[500]} />;
  }

  return (
    <>
      <OnboardingStepContent>
        <ResponsiveContainer breakpoint={breakpoints.medium}>
          {({ small }) =>
            ubos.length === 0 ? (
              <Box alignItems="center" style={styles.noUboContainer}>
                <BorderedIcon name="person-add-regular" color="current" size={100} padding={16} />
                <Space height={24} />

                <LakeText variant="medium" color={colors.gray[900]}>
                  {t("company.step.owners.title")}
                </LakeText>

                <Space height={12} />

                <LakeText align="center">
                  {t("company.step.owners.description", { companyName })}
                </LakeText>

                <Space height={12} />

                <Link to="" target="blank" style={styles.link}>
                  <LakeText color={colors.current[500]}>{t("common.learnMore")}</LakeText>
                  <Space width={4} />
                  <Icon name="open-filled" size={16} />
                </Link>

                <Space height={24} />

                <LakeButton
                  size={small ? "small" : "large"}
                  icon="add-circle-filled"
                  color="current"
                  onPress={openNewUbo}
                >
                  {t("common.add")}
                </LakeButton>
              </Box>
            ) : (
              <Box>
                <StepTitle isMobile={small}>{t("company.step.owners.title")}</StepTitle>
                <Space height={8} />
                <LakeText>{t("company.step.owners.description", { companyName })}</LakeText>
                <Space height={32} />

                <Grid numColumns={small ? 1 : 2} horizontalSpace={32} verticalSpace={32}>
                  <Pressable style={styles.addAnotherButton} onPress={openNewUbo}>
                    <Icon name="add-circle-regular" size={32} color={colors.gray[500]} />
                    <Space height={8} />
                    <LakeText>{t("company.step.owners.addAnother")}</LakeText>
                  </Pressable>

                  {ubos.map(ubo => (
                    <Tile
                      key={ubo.reference}
                      style={[
                        styles.uboTile,
                        isUboInvalid(ubo) && shakeError && animations.shake.enter,
                      ]}
                    >
                      <Box direction="row" alignItems="center">
                        <Avatar initials={getUboInitials(ubo)} size={32} />
                        <Space width={24} />

                        <Box style={styles.uboInfo}>
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

                        <Space width={12} />

                        <Pressable
                          style={styles.button}
                          onPress={() =>
                            setPageState({ type: "edit", step: "common", ubo, withAddressPart })
                          }
                        >
                          <Icon name="edit-regular" size={24} color={colors.gray[600]} />
                        </Pressable>

                        <Space width={12} />

                        <Pressable style={styles.button} onPress={() => removeUbo(ubo)}>
                          <Icon name="delete-regular" size={24} color={colors.negative[500]} />
                        </Pressable>
                      </Box>
                    </Tile>
                  ))}
                </Grid>
              </Box>
            )
          }
        </ResponsiveContainer>
      </OnboardingStepContent>

      <OnboardingFooter
        onPrevious={onPressPrevious}
        onNext={onPressNext}
        loading={updateResult.isLoading()}
      />

      <ConfirmModal
        visible={showConfirmNoUboModal}
        title={t("company.step.owners.confirmModal.title")}
        icon="person-regular"
        loading={updateResult.isLoading()}
        confirmText={t("company.step.owners.confirmModal.confirm")}
        onConfirm={submitUbos}
        onCancel={setShowConfirmNoUboModal.off}
      />

      <LakeModal
        visible={match(pageState)
          .with({ type: "add" }, { type: "edit" }, () => true)
          .otherwise(() => false)}
        title={match(pageState)
          .with({ step: "address" }, () => t("company.step.owners.fillAddress"))
          .with({ type: "add" }, () => t("company.step.owners.addTitle"))
          .with({ type: "edit" }, () => t("company.step.owners.editTitle"))
          .otherwise(() => undefined)}
        maxWidth={850}
      >
        <BeneficiaryForm
          ref={beneficiaryFormRef}
          initialState={match(pageState)
            .with({ type: "edit" }, ({ ubo }) => ubo)
            .otherwise(() => undefined)}
          accountCountry={accountCountry}
          step={match(pageState)
            .with({ step: "address" }, ({ step }) => step)
            .otherwise(() => "common" as const)}
          onStepChange={setFormStep}
          onSave={match(pageState)
            .with({ type: "add" }, () => addUbo)
            .with({ type: "edit" }, () => updateUbo)
            .otherwise(() => noop)}
          onClose={closeUboModal}
          onCityLoadError={logFrontendError}
        />

        <Space height={24} />

        <LakeButtonGroup paddingBottom={0}>
          <LakeButton
            onPress={() => beneficiaryFormRef.current?.cancel()}
            mode="secondary"
            grow={true}
          >
            {match(pageState)
              .with({ step: "address" }, () => t("common.back"))
              .otherwise(() => t("common.cancel"))}
          </LakeButton>

          <LakeButton
            onPress={() => beneficiaryFormRef.current?.submit()}
            color="partner"
            icon={match(pageState)
              .with(
                { type: "add", withAddressPart: false, step: "common" },
                () => "add-circle-filled" as const,
              )
              .with(
                { type: "edit", withAddressPart: false, step: "common" },
                () => "edit-filled" as const,
              )
              .with({ type: "add", step: "address" }, () => "add-circle-filled" as const)
              .with({ type: "edit", step: "address" }, () => "edit-filled" as const)
              .otherwise(() => undefined)}
            grow={true}
          >
            {match(pageState)
              .with({ withAddressPart: true, step: "common" }, () => t("common.next"))
              .with({ type: "add" }, () => t("common.add"))
              .with({ type: "edit" }, () => t("common.edit"))
              .otherwise(() => undefined)}
          </LakeButton>
        </LakeButtonGroup>
      </LakeModal>
    </>
  );
};
